# API Reference

This document describes every public function, module, and interface in the codebase. It is the authoritative reference for what exists and how to call it.

---

## `src/types.ts`

Core TypeScript types shared across all layers.

### `SendFn`
```ts
type SendFn = (msg: string) => Promise<void>
```
The reply function injected from `main.ts`. Never called inside handlers directly — only called in `executeCommand`.

### `HandlerResult`
```ts
interface HandlerResult {
  status: 'ok' | 'error'
  message: string
}
```
Return type of every command handler function (except `simple.ts` handlers which return `string`).

### `ParseResult`
```ts
interface ParseResult {
  command: string
  action: string
  params?: Record<string, unknown>
  error?: string
}
```
Output of `parseInput()`. If `error` is set the pipeline short-circuits.

### `ParserCommandDef`
```ts
interface ParserCommandDef {
  key: string
  subcommands?: Record<string, ParserCommandDef>
  parse: CommandParser
  defaultConfig?: Record<string, unknown>
}
```
Shape of every parser command registration.

### `ParserContext`
```ts
interface ParserContext {
  locale: Locale
  subcommand?: string
  user?: string
}
```
Passed into `parse()` functions. Used to access locale responses (e.g. default task names, error strings).

### `MessageContext`
```ts
interface MessageContext {
  language: string
  locale: Locale
  from: string           // full serialized sender number (chatId)
  chatId: string         // full serialized chat id
  isGroup: boolean
  groupName?: string
  timestamp: Date
  senderName: string
  senderPushName?: string
  senderNumber: string   // bare digits
  senderIsBusiness: boolean
  senderLanguage?: string
  botNumber: string
  botName: string
  botPlatform: string
}
```

### `CommandEntry`
```ts
interface CommandEntry {
  triggers: string[]
  subcommandTriggers?: Record<string, string[]>
  name?: string
  desc?: string
  trigger?: string
  emoji?: string
  featureName?: string
  featureDesc?: string
  helpLines?: string[]
}
```
Single source of truth for a command in a locale file. See `src/i18n/builders.ts`.

### `CommandDef`
```ts
interface CommandDef {
  name: string
  desc: string
  trigger?: string
  emoji?: string
  featureName?: string
  featureDesc?: string
  subcommands?: string[]   // usage lines for help output
}
```
Derived from `CommandEntry` by `buildDisplayCommands`.

### `CommandKey`
```ts
type CommandKey = 'help' | 'message' | 'status' | 'ping' | 'pomodoro' | 'language' | 'reminder' | 'note' | 'journal'
```

### `EMOJI_KEYWORDS`
```ts
const EMOJI_KEYWORDS: string[] = ['👍', '🔥', '💪', '🙌', '👏', '🎉', '✨', '⭐', '❤️', '🫡']
```
Exact emoji strings checked by the NLP fallback.

### Row types
```ts
interface PomodoroRow  { id, number, task, duration_minutes, started_at, due_at, completed }
interface ReminderRow  { id, number, text, recurrence_type, recurrence_value, remind_at, sent, created_at }
interface NoteRow      { id, number, text, created_at, done, done_at }
interface JournalRow   { id, number, text, created_at }
interface JournalStats { totalEntries, totalWords, daysWritten, currentStreak, longestStreak }
```

---

## `src/i18n/index.ts`

### `getLocale(lang: string): Locale`
Returns the `Locale` for the given ISO 639-1 code. Falls back to `en` if the code is not found.

### `availableLocales: string[]`
Array of registered locale codes: `['en', 'es', 'pt']`.

### `buildCommandsList(locale: Locale): string`
Builds a compact one-line-per-command list used in `remiAbout`. Format: `  › *trigger* — desc`.

### `buildFeaturesList(locale: Locale): string`
Builds the emoji features section used in `whatCanYouDo`. Only includes commands with an `emoji`. Format: `emoji *featureName* — featureDesc`.

---

## `src/i18n/builders.ts`

### `buildCommandList(defs: Record<string, CommandEntry>)`
Derives `locale.commandList` from a `CommandEntry` map.
Output: `Record<string, { list: string[], subcommands?: Record<string, { list: string[] }> }>`.

### `buildDisplayCommands(defs: Record<string, CommandEntry>): Record<string, CommandDef>`
Derives `locale.commands` from a `CommandEntry` map. Entries without a `name` (e.g. `hello`, `bye`, `remi`) are excluded from the output.

---

## `src/parser/index.ts`

### `parseInput(input: string, locale: Locale): ParseResult | { error: string }`

The main parse function. Flow:
1. Lowercases, trims, splits into tokens
2. Matches first token against `locale.commandList`
3. Optionally matches second token against subcommand aliases
4. Calls the matched `ParserCommandDef.parse(tokens, context)`
5. If no alias match: runs NLP keyword checks
6. Returns `{ command, action, params? }` or `{ error }`

---

## `src/parser/command/index.ts`

### `commands`
```ts
const commands = {
  help, status, ping, message, hello, bye, pomodoro,
  language, reminder, note, journal, remi
}
```
Map of command key → `ParserCommandDef`. Used by `parseInput` to look up the parser after resolving the command key.

---

## `src/parser/command/simple.ts`

All return a fixed `ParseResult` with no params.

| Export | Returns |
|---|---|
| `helpCommand` | `{ command: 'help', action: 'show' }` |
| `statusCommand` | `{ command: 'status', action: 'check' }` |
| `pingCommand` | `{ command: 'ping', action: 'pong' }` |
| `messageCommand` | `{ command: 'message', action: 'motivate' }` |
| `helloCommand` | `{ command: 'hello', action: 'greet' }` |
| `byeCommand` | `{ command: 'bye', action: 'farewell' }` |
| `remiCommand` | `{ command: 'remi', action: 'about' }` |

---

## `src/parser/command/pomodoro.ts`

### `pomodoroCommand: ParserCommandDef`
- `parse(tokens, ctx)` — same as subcommand `start`
- `subcommands.start.parse(tokens, ctx)` → `{ command: 'pomodoro', action: 'start', params: { minutes: number, name: string } }`
- `subcommands.status.parse()` → `{ command: 'pomodoro', action: 'status' }`
- `subcommands.cancel.parse()` → `{ command: 'pomodoro', action: 'cancel' }`
- `subcommands.help.parse()` → `{ command: 'pomodoro', action: 'help' }`

`params.minutes` defaults to `25`. `params.name` defaults to `locale.responses.pomodoroDefaultTask`.

---

## `src/parser/command/language.ts`

### `languageCommand: ParserCommandDef`
- `parse(tokens)` — same as subcommand `set`; if no tokens returns `help` action
- `subcommands.set.parse(tokens)` → `{ command: 'language', action: 'set', params: { language: string } }`
- `subcommands.help.parse()` → `{ command: 'language', action: 'help' }`

---

## `src/parser/command/reminder.ts`

### `reminderCommand: ParserCommandDef`
- `parse(tokens)` — if empty: `list`; else: `create`
  - `create` → `params: { input: string }` (full remainder joined)
- `subcommands.list.parse()` → `{ command: 'reminder', action: 'list' }`
- `subcommands.help.parse()` → `{ command: 'reminder', action: 'help' }`
- `subcommands.delete.parse(tokens)` → `params: { pos: number | null }`
- `subcommands.edit.parse(tokens, ctx)` → `params: { pos: number, content: string }` or `{ error }` if invalid
- `subcommands.interval.parse(tokens, ctx)` → `params: { value: string, text: string }` (minutes interval)
- `subcommands.weekly.parse(tokens, ctx)` → `params: { value: string, text: string }` (`value` format: `dow HH:MM`, where 0=Mon...6=Sun)
- `subcommands.monthly.parse(tokens, ctx)` → `params: { value: string, text: string }` (`value` format: `day HH:MM`, where day=1...31)
- `subcommands.weekdays.parse(tokens, ctx)` → `params: { value: string, text: string }` (`value` format: `HH:MM`)
- `subcommands.weekends.parse(tokens, ctx)` → `params: { value: string, text: string }` (`value` format: `HH:MM`)

---

## `src/parser/command/note.ts`

### `noteCommand: ParserCommandDef`
- `parse(tokens)` — if empty: `help`; else: `create`
  - `create` → `params: { text: string }`
- `subcommands.list.parse()` → `{ command: 'note', action: 'list' }`
- `subcommands.help.parse()` → `{ command: 'note', action: 'help' }`
- `subcommands.done.parse(tokens)` → `params: { pos: number }`
- `subcommands.undone.parse(tokens)` → `params: { pos: number }`
- `subcommands.delete.parse(tokens)` → `params: { pos: number }`

---

## `src/parser/command/journal.ts`

### `journalCommand: ParserCommandDef`
- `parse(tokens)` — if empty: `help`; else: `create`
  - `create` → `params: { text: string }`
- `subcommands.list.parse()` → `{ command: 'journal', action: 'list' }`
- `subcommands.help.parse()` → `{ command: 'journal', action: 'help' }`
- `subcommands.random.parse()` → `{ command: 'journal', action: 'random' }`
- `subcommands.date.parse(tokens)` → `params: { dateStr: string | null }`
- `subcommands.stats.parse()` → `{ command: 'journal', action: 'stats' }`
- `subcommands.delete.parse(tokens)` → `params: { pos: number }`

---

## `src/command/index.ts`

### `executeCommand(parseResult, ctx, send): Promise<void>`
Routes a `ParseResult` to the matching handler and calls `send(result.message)`. The only place `send()` is called for commands.

---

## `src/command/simple.ts`

All accept `ctx: MessageContext` and return `string`.

| Function | Description |
|---|---|
| `helpHandler(ctx)` | Lists all commands with descriptions and subcommand usage lines |
| `statusHandler(ctx)` | Shows sender info and bot info |
| `pingHandler(ctx)` | Returns `locale.responses.ping` |
| `messageHandler(ctx)` | Random motivational message from `locale.motivationalMessages` |
| `helloHandler(ctx)` | Time-of-day greeting (morning/afternoon/evening/night) |
| `byeHandler(ctx)` | Random farewell from `locale.responses.farewells` |
| `remiHandler(ctx)` | Full self-introduction using `locale.responses.remiAbout` + `buildCommandsList` |

---

## `src/command/nlp.ts`

### `nlpHandler(action: string, ctx: MessageContext): HandlerResult`

| action | Response |
|---|---|
| `'thanks'` | `pickRandom(locale.responses.thanks)` |
| `'howAreYou'` | `pickRandom(locale.responses.howAreYou)` |
| `'emojiReaction'` | `pickRandom(locale.responses.emojiReactions)` |
| `'whoAreYou'` | `pickRandom(locale.responses.whoAreYou)` |
| `'whatCanYouDo'` | `locale.responses.whatCanYouDo(buildFeaturesList(locale))` |
| `'laugh'` | `pickRandom(locale.responses.laughResponses)` |
| `'compliment'` | `pickRandom(locale.responses.complimentResponses)` |
| `'sorry'` | `pickRandom(locale.responses.sorryResponses)` |
| _default_ | `locale.responses.unknown` with `status: 'error'` |

---

## `src/command/pomodoro.ts`

### `startPomodoroHandler(name: string | null, minutes: number | null, ctx): HandlerResult`
- If active pomodoro exists and both params are null: returns status of active session
- If active pomodoro exists and params provided: calls `db.updatePomodoro` and returns updated message
- Otherwise: calls `db.startPomodoro` and returns started message + random `pomodoroStart` phrase

### `pomodoroStatusHandler(ctx): HandlerResult`
Returns active pomodoro info or `pomodoroNoActive` error.

### `cancelPomodoroHandler(ctx): HandlerResult`
Cancels active pomodoro via `db.cancelPomodoro`. Returns `pomodoroCancelled` or `pomodoroNoActive` error.

### `pomodoroHelpHandler(ctx): HandlerResult`
Returns formatted subcommand list from `ctx.locale.commands.pomodoro.subcommands`.

---

## `src/command/language.ts`

### `setLanguageHandler(language: string, ctx): HandlerResult`
Validates language code against `availableLocales`. If valid: calls `db.setLanguage` and returns `langChanged`. If invalid: returns `langInvalid` error.

### `helpLanguageHandler(ctx): HandlerResult`
Returns `locale.responses.languageHelp`.

---

## `src/command/reminder.ts`

### `createReminderHandler(input: string, ctx): HandlerResult`
Parses `input` using `src/time.ts` to extract time and text. Creates reminder via `db.createReminder`. Returns formatted confirmation or `reminderInvalidTime` error.

### `listRemindersHandler(ctx): HandlerResult`
Returns numbered list from `db.getPendingReminders` or `reminderEmpty`. Recurring reminders are shown with a `🔄` marker and recurrence description.

### `helpReminderHandler(ctx): HandlerResult`
Returns formatted subcommand list from `ctx.locale.commands.reminder.subcommands`.

### `deleteReminderHandler(pos: number, ctx): HandlerResult`
Looks up reminder at 1-based position, deletes via `db.deleteReminder`. Returns `reminderDeleted` or `reminderNotFound`.

### `editReminderHandler(pos: number, content: string, ctx): HandlerResult`
Looks up reminder at 1-based position, parses `content` for optional new time and/or new text, updates via `db.updateReminder`. Returns `reminderEdited` or error.

### `createRecurringReminderHandler(type: string, value: string, text: string, ctx): HandlerResult`
Computes first occurrence using `computeNextOccurrence`, persists via `db.createRecurringReminder`, and returns localized recurring confirmation.

---

## `src/command/note.ts`

### `createNoteHandler(text: string, ctx): HandlerResult`
Inserts note via `db.createNote`. Returns `noteAdded`.

### `listNotesHandler(ctx): HandlerResult`
Returns all notes (pending first, then done) from `db.getNotes`. Format: numbered list with `⏳` / `✅` status.

### `helpNoteHandler(ctx): HandlerResult`
Returns formatted subcommand list from `ctx.locale.commands.note.subcommands`.

### `markNoteDoneHandler(pos: number, ctx): HandlerResult`
Marks note at 1-based position as done via `db.markNoteDone`.

### `markNoteUndoneHandler(pos: number, ctx): HandlerResult`
Marks note at 1-based position as undone via `db.markNoteUndone`.

### `deleteNoteHandler(pos: number, ctx): HandlerResult`
Deletes note at 1-based position via `db.deleteNote`.

---

## `src/command/journal.ts`

### `createJournalHandler(text: string, ctx): HandlerResult`
Inserts entry via `db.createJournalEntry`. Returns `journalAdded` with a preview of the text.

### `listJournalHandler(ctx): HandlerResult`
Returns last 5 entries from `db.getJournalEntries`. Returns `journalEmpty` if none.

### `helpJournalHandler(ctx): HandlerResult`
Returns formatted subcommand list from `locale.commands.journal.subcommands`.

### `randomJournalHandler(ctx): HandlerResult`
Returns a random entry from `db.getRandomJournalEntry`. Returns `journalEmpty` if none.

### `dateJournalHandler(dateStr: string | null, ctx): HandlerResult`
Looks up entry for the given `YYYY-MM-DD` date (or today if null) via `db.getJournalEntryByDate`.

### `statsJournalHandler(ctx): HandlerResult`
Returns computed stats from `db.getJournalStats`: total entries, words, days written, current streak, longest streak.

### `deleteJournalHandler(pos: number, ctx): HandlerResult`
Deletes entry at 1-based position via `db.deleteJournalEntry`.

---

## `src/db.ts`

All functions use `better-sqlite3` (synchronous). The DB file is `reminders.db` in the project root.

### Settings
| Function | Signature | Description |
|---|---|---|
| `getLanguage` | `(number: string): string \| null` | Get persisted language for a number |
| `setLanguage` | `(number: string, lang: string): void` | Upsert language setting |

### Pomodoros
| Function | Signature | Description |
|---|---|---|
| `startPomodoro` | `(chatId, task, minutes): void` | Insert new active pomodoro |
| `getActivePomodoro` | `(chatId): PomodoroRow \| null` | Get the active (uncompleted) session |
| `getDuePomodoros` | `(): PomodoroRow[]` | Get all sessions past their due_at time |
| `cancelPomodoro` | `(chatId): boolean` | Mark active session as completed; returns true if one was found |
| `updatePomodoro` | `(chatId, task, minutes): void` | Update task and reset due_at of active session |
| `completePomodoro` | `(id): void` | Mark a specific session as completed (used by scheduler) |

### Reminders
| Function | Signature | Description |
|---|---|---|
| `createReminder` | `(chatId, text, due: Date): number` | Insert reminder; returns row id |
| `createRecurringReminder` | `(chatId, text, recurrenceType, recurrenceValue, firstDue: Date): number` | Insert recurring reminder; returns row id |
| `getPendingReminders` | `(chatId): ReminderRow[]` | Get all unsent reminders ordered by time |
| `getDueReminders` | `(): ReminderRow[]` | Get all unsent reminders past their remind_at time |
| `deleteReminder` | `(id, chatId): boolean` | Delete a specific unsent reminder |
| `updateReminder` | `(id, chatId, { text?, due? }): boolean` | Partial update of text and/or time |
| `markReminderSent` | `(id): void` | Mark reminder as sent (used by scheduler) |
| `advanceRecurringReminder` | `(id, nextDue: Date): void` | Move recurring reminder to next due time and keep it active |

### Notes
| Function | Signature | Description |
|---|---|---|
| `createNote` | `(chatId, text): number` | Insert note; returns row id |
| `getNotes` | `(chatId): NoteRow[]` | All notes ordered: pending first, then done |
| `getNotesByStatus` | `(chatId, done: boolean): NoteRow[]` | Notes filtered by done status |
| `markNoteDone` | `(id, chatId): boolean` | Mark note done |
| `markNoteUndone` | `(id, chatId): boolean` | Mark note undone |
| `deleteNote` | `(id, chatId): boolean` | Delete note |

### Journal
| Function | Signature | Description |
|---|---|---|
| `createJournalEntry` | `(chatId, text): number` | Insert entry; returns row id |
| `getJournalEntries` | `(chatId, limit?): JournalRow[]` | Most recent entries (default: 5) |
| `getJournalEntryByDate` | `(chatId, date: string): JournalRow \| null` | Entry for a specific YYYY-MM-DD |
| `getRandomJournalEntry` | `(chatId): JournalRow \| null` | Random entry |
| `getJournalStats` | `(chatId): JournalStats` | Computed stats (counts, streaks) |
| `deleteJournalEntry` | `(id, chatId): boolean` | Delete entry |

---

## `src/scheduler.ts`

### `startScheduler(sendTo: (chatId: string, msg: string) => Promise<void>): void`
Starts a `node-cron` job running every minute. Checks for due reminders and pomodoros and fires `sendTo`.

For reminders: one-off reminders are marked sent; recurring reminders are advanced to their next occurrence via `computeNextOccurrence` + `db.advanceRecurringReminder`.

---

## `src/handleCommand.ts`

### `handleCommand(text: string, send: SendFn, ctx: MessageContext): Promise<void>`
Orchestrator for a single incoming message:
1. Calls `parseInput(text, locale)`
2. If `error`: calls `send(locale.responses.unknown)` and returns
3. Logs the parsed result
4. Calls `executeCommand(parseResult, ctx, send)`

---

## `src/config.ts`

Env var exports loaded from `.env.local` then `.env`:

| Export | Env var | Default | Description |
|---|---|---|---|
| `MY_NUMBER` | `MY_NUMBER` | `''` | Restrict to this sender number (empty = no restriction) |
| `MY_NUMBER_LID` | `MY_NUMBER_LID` | `''` | Secondary LID format of the number (for dual-number accounts) |
| `MY_GROUP` | `MY_GROUP` | `''` | Restrict to this group chat ID (empty = no restriction) |
| `SESSION_PATH` | — | `.wwebjs_auth` | Path where WhatsApp session is persisted |
| `LANG` | `DEFAULT_LOCALE` | `'en'` | Default locale when user has no setting |

---

## `src/helper.ts`

### `pickRandom<T>(arr: T[]): T`
Returns a random element from an array.

### `getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night'`
Maps a 24h hour to a time-of-day label used to select greeting variants.
- `morning`: 5–11
- `afternoon`: 12–17
- `evening`: 18–20
- `night`: 21–4
