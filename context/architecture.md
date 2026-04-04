# Architecture – Complete Reference

## Pipeline

```
WhatsApp message
        │
        ▼
  ┌─────────────────────────────────────────────────┐
  │  main.ts                                        │
  │  1. db.getLanguage(from) → language             │
  │  2. getLocale(language)  → locale               │
  │  3. Build MessageContext { locale, language, …} │
  │  4. handleCommand(text, send, ctx)              │
  └─────────────────┬───────────────────────────────┘
                    │
                    ▼
  ┌─────────────────────────────────────────────────┐
  │  handleCommand.ts                               │
  │  parseInput(text, ctx.locale) → ParseResult     │
  │  if error → send(locale.responses.unknown)      │
  │  else     → executeCommand(parseResult, ctx, send) │
  └─────────────────┬───────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  ┌───────────────┐    ┌──────────────────────────────────┐
  │ parser/       │    │ command/index.ts                 │
  │ index.ts      │    │ executeCommand(result, ctx, send) │
  │               │    │                                  │
  │ Locale alias  │    │ switch(command)                  │
  │ resolution    │    │   → handler(ctx) → HandlerResult │
  │               │    │   → await send(result.message)   │
  └───────────────┘    └──────────────────────────────────┘
```

---

## Layer responsibilities

### Layer 1 — Transport (`main.ts`)
- Manages WhatsApp client lifecycle
- Resolves `language` from DB once per message
- Resolves `locale` from `getLocale(language)` once per message
- Builds `MessageContext` — the single context object passed everywhere
- Calls `handleCommand`

### Layer 2 — Coordination (`handleCommand.ts`, `command/index.ts`)
- `handleCommand`: calls parser, handles top-level errors, delegates to `executeCommand`
- `executeCommand`: routes `ParseResult` to the correct handler, calls `send` with result

### Layer 3 — Parser (`parser/index.ts`, `parser/command/`)
- Stateless: no DB, no side effects
- Receives `locale: Locale` (already resolved — never calls `getLocale`)
- Tokenizes input, resolves command/subcommand aliases, delegates to `CommandDef.parse`
- Returns `ParseResult { command, action, params }` or `{ error }`

### Layer 4 — Handlers (`command/*.ts`)
- Synchronous pure functions
- Receive `ctx: MessageContext` (includes `locale`)
- Perform DB operations and format responses
- Return `HandlerResult { status: 'ok' | 'error', message: string }`
- **Never** call `send()` directly

---

## Key types

```ts
// src/types.ts

// Pre-built by main.ts, passed to every handler
interface MessageContext {
  locale: Locale;         // pre-resolved — no getLocale() needed downstream
  language: string;
  from: string;
  chatId: string;
  isGroup: boolean;
  senderName: string;
  senderPushName?: string;
  senderNumber: string;
  timestamp: Date;
  botNumber: string;
  botName: string;
  botPlatform: string;
  // ...
}

// All handlers return this
interface HandlerResult {
  status: 'ok' | 'error';
  message: string;
}

type SendFn = (msg: string) => Promise<void>;
```

```ts
// src/parser/command/definitiions.ts

type CommandParser = (tokens: string[], ctx: ParserContext) => ParseResult;

interface CommandDef {
  key: string;
  subcommands?: Record<string, CommandDef>;
  parse: CommandParser;
}

interface ParserContext {
  locale: Locale;
}

interface ParseResult {
  command: string;
  action: string;
  params?: Record<string, unknown>;
  error?: string;
}
```

---

## Two separate `command` directories

| Directory | Purpose |
|-----------|---------|
| `src/parser/command/` | **Parser layer** — `CommandDef` objects (parse logic only, no DB) |
| `src/command/` | **Handler layer** — business logic, DB access, returns `HandlerResult` |

These are intentionally separate. The parser resolves *what the user wants*. The handlers *do the work*.

---

## i18n flow

```
main.ts  →  db.getLanguage(from)  →  getLocale(lang)  →  ctx.locale
                                                               │
                                        ┌──────────────────────┤
                                        ▼                      ▼
                               parser/index.ts          command/*.ts
                               (alias resolution)       (response strings)
```

- `locale.commandList` — alias tables for the parser
- `locale.commands` — display metadata (name, desc, subcommands string list)
- `locale.responses` — all user-facing strings and template functions

---

## File map

```
src/
├── main.ts                       Transport: WhatsApp client, builds MessageContext
├── handleCommand.ts              Coordination: parse → dispatch → send
├── types.ts                      Shared types: MessageContext, HandlerResult, SendFn, Locale, …
├── db.ts                         All SQLite access (better-sqlite3, synchronous)
├── scheduler.ts                  Fires completion messages for pomodoros/reminders
├── logger.ts                     Structured logging (pino)
├── helper.ts                     Utilities: pickRandom, getTimeOfDay, …
├── config.ts                     Env config: LANG, MY_NUMBER, SESSION_PATH, …
├── time.ts                       Date/time parsing and formatting
│
├── i18n/
│   ├── en.ts                     English locale (commandList + commands + responses)
│   ├── es.ts                     Spanish locale
│   ├── pt.ts                     Portuguese locale
│   └── index.ts                  getLocale(lang), buildCommandsList, buildFeaturesList
│
├── parser/
│   ├── index.ts                  parseInput(input, locale) → ParseResult
│   └── command/
│       ├── definitiions.ts       Types: CommandDef, ParseResult, ParserContext
│       ├── index.ts              Command registry (canonical key → CommandDef)
│       ├── simple.ts             help, status, ping, message, hello, bye, language parse logic
│       ├── pomodoro.ts           Pomodoro parse logic
│       ├── reminder.ts           Reminder parse logic
│       ├── note.ts               Note parse logic
│       └── journal.ts            Journal parse logic
│
└── command/
    ├── index.ts                  executeCommand: routes ParseResult → handler → send
    ├── simple.ts                 Simple command handlers → HandlerResult
    ├── language.ts               Language command handler → HandlerResult
    ├── pomodoro.ts               Pomodoro handlers → HandlerResult
    ├── reminder.ts               Reminder handlers → HandlerResult
    ├── note.ts                   Note handlers → HandlerResult
    └── journal.ts                Journal handlers → HandlerResult
```

---

## Adding a new command — checklist

### Step 1 — Register the trigger words in every locale file

Add a `commandList` entry in each `src/i18n/{lang}.ts`:

```ts
// src/i18n/en.ts  (repeat for es.ts and pt.ts with locale-appropriate aliases)
commandList: {
  // …existing entries…
  mycommand: {
    list: ['mycommand', 'mc'],          // words that trigger this command
    subcommands: {
      list:   { list: ['list', 'ls'] },
      delete: { list: ['delete', 'del', 'rm'] },
      help:   { list: ['help', '?'] },
    },
  },
}
```

`commandList` is used **only** by the parser for alias resolution. Display strings (name, description) live in `locale.commands`.

### Step 2 — Create the parser

Create `src/parser/command/{name}.ts` implementing `ParserCommandDef`:

```ts
import type { CommandDef, ParseResult, ParserContext } from './definitiions';

export const mycommandCommand: CommandDef = {
  key: 'mycommand',
  parse(tokens: string[], ctx: ParserContext): ParseResult {
    const { locale } = ctx;
    const sub = locale.commandList.mycommand?.subcommands;

    // Match subcommand aliases
    if (sub?.list?.list.some(a => tokens[0] === a)) {
      return { command: 'mycommand', action: 'list' };
    }
    if (sub?.delete?.list.some(a => tokens[0] === a)) {
      const pos = parseInt(tokens[1], 10);
      return { command: 'mycommand', action: 'delete', params: { pos } };
    }
    if (sub?.help?.list.some(a => tokens[0] === a)) {
      return { command: 'mycommand', action: 'help' };
    }

    // Default: create
    return { command: 'mycommand', action: 'create', params: { text: tokens.join(' ') } };
  },
};
```

### Step 3 — Register the parser

Add to `src/parser/command/index.ts`:

```ts
import { mycommandCommand } from './mycommand';

export const commands: Record<string, CommandDef> = {
  // …existing entries…
  mycommand: mycommandCommand,
};
```

### Step 4 — Create the handler

Create `src/command/{name}.ts` with pure functions returning `HandlerResult`:

```ts
import type { MessageContext, HandlerResult } from '../types';
import { db } from '../db';

export function listMyCommandHandler(ctx: MessageContext): HandlerResult {
  // … DB query, format response …
  return { status: 'ok', message: '…' };
}

export function createMyCommandHandler(text: string, ctx: MessageContext): HandlerResult {
  // … DB insert, format response …
  return { status: 'ok', message: '…' };
}
```

### Step 5 — Wire into the executor

Add a `case` in `src/command/index.ts`:

```ts
import { listMyCommandHandler, createMyCommandHandler } from './mycommand';

// inside executeCommand switch:
case 'mycommand':
  if (result.action === 'list') {
    handlerResult = listMyCommandHandler(ctx);
  } else if (result.action === 'create') {
    handlerResult = createMyCommandHandler(result.params?.text as string, ctx);
  }
  break;
```

### Summary

| Step | File(s) | What to do |
|------|---------|------------|
| 1 | `src/i18n/en.ts`, `es.ts`, `pt.ts` | Add `commandList.{name}` with trigger words and subcommand aliases |
| 2 | `src/parser/command/{name}.ts` | Implement `CommandDef.parse()` — pure alias resolution |
| 3 | `src/parser/command/index.ts` | Add entry to `commands` registry |
| 4 | `src/command/{name}.ts` | Implement handler functions returning `HandlerResult` |
| 5 | `src/command/index.ts` | Add `case` in `executeCommand` switch |

---

## Invariants to maintain

- `locale` is resolved **once** in `main.ts`. Nowhere else calls `getLocale()`.
- Handlers are **synchronous** and return `HandlerResult`. They do not `await send()`.
- The parser layer has **zero DB imports**.
- `send()` is only called in `executeCommand`.
