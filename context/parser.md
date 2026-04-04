# Parser – Architecture & Context

## Overview

`src/parser/index.ts` is the **single entry point** for all command resolution. It receives the raw message string and the already-resolved `Locale` (provided by `handleCommand`), and returns a structured `ParseResult` or an error object.

The parser is **stateless** — no DB access, no side effects, no locale resolution.

---

## Function signature

```ts
function parseInput(input: string, locale: Locale): ParseResult | { error: string }
```

| Argument | Description |
|----------|-------------|
| `input`  | Raw WhatsApp message body (any casing) |
| `locale` | Pre-resolved `Locale` object — passed in from `handleCommand`, which gets it from `MessageContext`. **No `getLocale()` call inside this function.** |

---

## Resolution pipeline

```
input string
  │
  ├─ 1. Normalize: lowercase + trim + split on whitespace → tokens[]
  │
  ├─ 2. Alias resolution (token[0])
  │      locale.commandList[key].list  →  commandKey (canonical)
  │
  ├─ 3. Subcommand resolution (token[1], optional)
  │      locale.commandList[commandKey].subcommands[key].list  →  subcommandKey
  │
  ├─ 4a. Subcommand found
  │       commands[commandKey].subcommands[subcommandKey].parse(restTokens[2:], ctx)
  │
  ├─ 4b. Second token is NOT a subcommand alias
  │       commands[commandKey].parse(restTokens[1:], ctx)
  │
  └─ 4c. No second token
          commands[commandKey].parse([], ctx)
```

---

## Token slicing per case

| Scenario | `parse()` receives |
|---|---|
| `pomodoro` (alone) | `[]` |
| `pomodoro 25 Study` (no subcommand match) | `["25", "study"]` |
| `pomodoro start 25 Study` (subcommand matched) | `["25", "study"]` |
| `pomodoro status` | `[]` |

The parser always strips the matched command token (index 0) and, when a subcommand is matched, the subcommand token (index 1) as well. The `CommandDef.parse` function only ever sees the "payload" tokens.

---

## Alias resolution: two data sources, one purpose

Aliases live in the **locale**, not in the command definition. This is intentional — it decouples i18n strings from parser logic.

```
locale.commandList                         commands (src/parser/command/index.ts)
─────────────────────────────              ──────────────────────────────────────
pomodoro:                                  pomodoro: CommandDef {
  list: ["pomodoro","pomo","timer"]    →     key: "pomodoro"
  subcommands:                               parse: pomodoroStartParser
    start:                                   subcommands: {
      list: ["start","begin","go"]     →       start: { parse: ... }
    status:                                    status: { parse: ... }
      list: ["status","check","current"]       cancel: { parse: ... }
    ...                                      }
                                           }
```

The parser resolves `"pomo"` → canonical key `"pomodoro"`, then looks up `commands["pomodoro"]`.

> **Note:** `src/parser/command/` contains the parser-layer `CommandDef` registry (parse logic only).
> `src/command/` contains the handler-layer (DB + locale → `HandlerResult`). These are separate directories.

---

## NLP fallback (step 5)

When no `commandList` alias matches `tokens[0]`, the parser checks `locale.responses` keyword arrays in priority order:

| Check | Match method | `action` returned |
|-------|-------------|-------------------|
| `thanksKeywords` | `lower.includes(k)` | `thanks` |
| `howAreYouKeywords` | `lower.includes(k)` | `howAreYou` |
| `emojiKeywords` | `trimmed === k` (exact) | `emojiReaction` |
| `whoAreYouKeywords` | `lower.includes(k)` | `whoAreYou` |
| `whatCanYouDoKeywords` | `lower.includes(k)` | `whatCanYouDo` |
| `laughKeywords` | `lower === k \|\| trimmed === k` | `laugh` |
| `complimentKeywords` | `lower.includes(k)` | `compliment` |
| `sorryKeywords` | `lower.includes(k)` | `sorry` |
| (nothing matched) | — | `{ error: 'Unknown command' }` |

NLP matches return `{ command: 'nlp', action: '<type>' }` and are routed to `nlpHandler` in `src/command/nlp.ts`.

---

## Key types

```ts
// src/parser/command/definitiions.ts

type CommandParser = (tokens: string[], context: ParserContext) => ParseResult;

interface CommandDef {
  key: string;
  subcommands?: Record<string, CommandDef>;
  parse: CommandParser;
}

interface ParserContext {
  locale: Locale;       // passed in directly, already resolved upstream
  subcommand?: string;  // optional: not currently set by the parser
  user?: string;        // optional: not currently set by the parser
}

interface ParseResult {
  command: string;                       // canonical key, e.g. "pomodoro"
  action: string;                        // e.g. "start" | "status" | "cancel"
  params?: Record<string, unknown>;      // e.g. { minutes: 25, name: "Study" }
  error?: string;
}
```

---

## Return shape

On success:
```ts
{ command: "pomodoro", action: "start", params: { minutes: 25, name: "Deep work" } }
```

On error:
```ts
{ error: "Unknown command" }
{ error: "Empty" }
{ error: <string from CommandDef.parse> }
```

`handleCommand` checks `error` before using `command`/`action`/`params`.

---

## Edge cases and current behavior

| Input | Result |
|---|---|
| `""` (empty after trim) | `{ error: "Empty" }` – **Note:** `"".trim().split(/\s+/)` returns `[""]` (length 1), so this guard currently never triggers. |
| Unknown command word | Runs NLP fallback; if still no match → `{ error: "Unknown command" }` |
| Known command, unknown second token | Falls through to `command.parse(restTokens, ctx)` — the second token is passed as part of the payload, not discarded |
| `locale.commandList[key]` has no `subcommands` property | Correctly skips subcommand resolution (`command.subcommands && secondToken` is false) |

---

## What the parser does NOT do

- Does **not** validate semantic correctness of params (e.g., `minutes > 0`). That belongs in the handler.
- Does **not** check whether a pomodoro is already active. That is a DB concern in the handler.
- Does **not** set `ParserContext.subcommand` or `ParserContext.user` — those fields exist in the type but are currently unused.

---

## Registered commands

```
help • status • ping • message • hello • bye • remi • language
pomodoro • reminder • note • journal
```

All registered in `src/parser/command/index.ts`.

---

## Files

| File | Role |
|---|---|
| `src/parser/index.ts` | Entry point: tokenize → alias resolve → NLP fallback → `ParseResult` |
| `src/parser/command/definitiions.ts` | Types: `CommandDef`, `ParseResult`, `ParserContext`, `CommandParser` |
| `src/parser/command/index.ts` | Registry: maps canonical key → `CommandDef` |
| `src/parser/command/simple.ts` | Parse logic for hello, bye, help, status, ping, message, language |
| `src/parser/command/pomodoro.ts` | Pomodoro parse logic |
| `src/parser/command/reminder.ts` | Reminder parse logic |
| `src/parser/command/note.ts` | Note parse logic |
| `src/parser/command/journal.ts` | Journal parse logic |
| `src/i18n/{lang}.ts` | Alias tables: `commandList[key].list` and `.subcommands[key].list` + NLP keywords |
| `src/i18n/index.ts` | `getLocale(lang)` — locale lookup with `en` fallback |
| `src/handleCommand.ts` | Calls `parseInput(text, ctx.locale)` then `executeCommand` |
