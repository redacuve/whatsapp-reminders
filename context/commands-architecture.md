# Commands Architecture — Current Reference

This document describes the **current** refactored command architecture. Every command follows the same two-layer pattern: a stateless **parser** that resolves locale aliases into a `ParseResult`, and a **handler** that executes business logic and returns a `HandlerResult`.

---

## Registered commands

| Key | Trigger words (EN) | Subcommands |
|-----|--------------------|-------------|
| `help` | help, ? | — |
| `status` | status | — |
| `ping` | ping | — |
| `message` | msg, message | — |
| `hello` | hello, hi, hey, good morning | — |
| `bye` | bye, goodbye, cya | — |
| `language` | language, lang | — |
| `pomodoro` | pomodoro, pomo | start, cancel, status, help |
| `reminder` | remind, reminder | list, delete, edit, interval, weekly, monthly, weekdays, weekends, help |
| `note` | note | list, done, undone, delete, help |
| `journal` | journal | list, random, date, stats, delete, help |

Trigger words for each language are defined in `src/i18n/{lang}.ts → commandList`.

---

## The `commandList` structure

Each locale file exports a `commandList` object that maps every command key to its locale-specific trigger words and subcommand aliases. The parser uses this table exclusively — it never hard-codes strings.

```ts
// Example from src/i18n/en.ts
commandList: {
  reminder: {
    list: ['remind', 'reminder'],         // words that start this command
    subcommands: {
      list:      { list: ['list'] },
      delete:    { list: ['delete', 'del'] },
      edit:      { list: ['edit'] },
      interval:  { list: ['interval', 'every'] },
      weekly:    { list: ['weekly'] },
      monthly:   { list: ['monthly'] },
      weekdays:  { list: ['weekdays', 'workdays'] },
      weekends:  { list: ['weekends'] },
      help:      { list: ['help'] },
    },
  },
  note: {
    list: ['note'],
    subcommands: {
      list:   { list: ['list', 'ls'] },
      done:   { list: ['done', 'check', 'complete'] },
      undone: { list: ['undone', 'uncheck', 'pending'] },
      delete: { list: ['delete', 'del', 'rm'] },
      help:   { list: ['help', '?'] },
    },
  },
}
```

Each language defines equivalent aliases in its own vocabulary (e.g. Spanish `recordar/recordatorio`, Portuguese `lembrar/lembrete`).

---

## Parser layer (`src/parser/command/`)

Each file exports a `CommandDef` object with a `parse(tokens, ctx)` function. The parser is **stateless** — no DB access, no side effects.

**How alias resolution works:**

1. `parser/index.ts` receives `(input, locale)`.
2. It lowercases and tokenizes the input.
3. It iterates `locale.commandList` to find a command whose `list` contains the first token.
4. It calls `commandDef.parse(remainingTokens, { locale })`.
5. Inside `parse`, each subcommand's `list` is checked against `tokens[0]`.
6. Returns `ParseResult { command, action, params? }`.

```ts
// Simplified parse logic in src/parser/command/reminder.ts
export const reminderCommand: CommandDef = {
  key: 'reminder',
  parse(tokens, { locale }) {
    if (tokens.length === 0)
      return { command: 'reminder', action: 'list' };
    // default (non-subcommand) → create one-off reminder input
    return { command: 'reminder', action: 'create', params: { input: tokens.join(' ') } };
  },
};

// Subcommands are matched in parser/index.ts from locale aliases and then routed
// to reminder subcommand parsers: list/help/delete/edit/interval/weekly/monthly/weekdays/weekends.
```

---

## Handler layer (`src/command/`)

Each file contains pure functions that accept parsed params + `MessageContext` and return `HandlerResult { status, message }`. They perform all DB work here.

```ts
// src/command/reminder.ts (simplified)
export function createReminderHandler(input: string, ctx: MessageContext): HandlerResult {
  const parsed = parseReminderTime(input, ctx.locale.vagueHours, ctx.locale.tomorrowKeywords);
  if (!parsed) return { status: 'error', message: ctx.locale.responses.reminderInvalidTime };
  db.createReminder(ctx.from, parsed.text, parsed.due);
  return { status: 'ok', message: ctx.locale.responses.reminderAdded(parsed.text, formatReminderTime(parsed.due, ctx.locale.dayLabels)) };
}

// Recurring reminders are handled by createRecurringReminderHandler(type, value, text, ctx)
// and persisted with recurrence_type/recurrence_value for scheduler rescheduling.
```

Handlers **never** call `send()` — that is done exclusively by `executeCommand` in `src/command/index.ts`.

---

## i18n contract

The `Locale` type has three sections:

| Section | Used by | Purpose |
|---------|---------|---------|
| `commandList` | Parser | Alias resolution (trigger words + subcommand aliases) |
| `commands` | `helper.ts` / help handler | Display metadata (name, description, subcommand names shown to user) |
| `responses` | Handlers | All user-facing strings and template functions |

This separation ensures the parser never needs to know about display strings and handlers never need to know about trigger words.

---

## Invariants

- `locale` is resolved **once** in `main.ts`. No other layer calls `getLocale()`.
- The parser has **zero DB imports**.
- Handlers are **synchronous** and return `HandlerResult`. They never call `send()`.
- `send()` is only called in `executeCommand` in `src/command/index.ts`.