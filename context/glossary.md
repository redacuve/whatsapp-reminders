# Glossary

Canonical names for every concept in Remi. Use these exact terms in code, comments, and documentation.

---

## Core concepts

| Term | Definition |
|---|---|
| **Bot** / **Remi** | The WhatsApp bot process running as a Node.js server |
| **User** | The person sending messages to Remi. Identified by their full WhatsApp number (`chatId`) |
| **chatId** | The canonical user identifier — the sender's full serialised WhatsApp number, e.g. `5215512345678@c.us`. Used as the DB key for all tables |
| **MessageContext** | The typed object passed to every command handler containing the resolved locale, sender details, bot details, and message metadata. Defined in `src/types.ts` |
| **SendFn** | `(msg: string) => Promise<void>` — the function used to reply to a message. Injected into `executeCommand` from `main.ts` |

---

## Pipeline stages

| Term | Definition |
|---|---|
| **Input** | The raw text body of a WhatsApp message |
| **Token** | A whitespace-separated word from the lowercased input. The first token resolves the command; the second optionally resolves the subcommand |
| **Parse** / **Parsing** | The process of mapping raw input text to a `ParseResult` (`{ command, action, params? }`). Handled by `src/parser/index.ts` |
| **ParseResult** | `{ command: string, action: string, params?: Record<string, unknown>, error?: string }` — the output of the parser |
| **Execute** / **Handler dispatch** | The process of routing a `ParseResult` to the correct handler function. Handled by `src/command/index.ts` |
| **HandlerResult** | `{ status: 'ok' | 'error', message: string }` — the output of a command handler function |

---

## Parser concepts

| Term | Definition |
|---|---|
| **CommandList** | The locale-specific map of command keys to trigger alias lists, used by the parser to resolve which command was typed. Shape: `{[commandKey]: { list: string[], subcommands?: {[subKey]: { list: string[] }} }}` |
| **Trigger** / **Alias** | A word or phrase in `commandList[key].list` that, when matched as the first token, activates that command |
| **Subcommand trigger** | A word in `commandList[key].subcommands[subKey].list` that, when matched as the second token, activates that subcommand |
| **ParserCommandDef** | The type describing a command's parser logic: `{ key, parse, subcommands? }`. Lives in `src/types.ts` |
| **NLP fallback** | After no command alias matches, the parser runs keyword checks on `locale.responses` arrays and returns `{ command: 'nlp', action: '<type>' }` if any keyword matches |
| **action** | The string that identifies what a command should do. E.g. `'create'`, `'list'`, `'delete'`, `'help'`, `'start'`, `'greet'`, `'thanks'` |

---

## Locale concepts

| Term | Definition |
|---|---|
| **Locale** | A full language configuration object. The `Locale` interface is defined in `src/types.ts`. Instances: `en`, `es`, `pt` |
| **locale.code** | ISO 639-1 code: `'en'`, `'es'`, `'pt'` |
| **locale.commandList** | Parser alias map derived by `buildCommandList(defs)` |
| **locale.commands** | Display commands map derived by `buildDisplayCommands(defs)`. Used by `helpHandler`, `pomodoroHelpHandler`, etc. |
| **locale.responses** | All user-facing strings and keyword arrays for the locale |
| **locale.motivationalMessages** | Array of motivational message strings picked randomly by `messageHandler` |
| **CommandEntry** | The single source of truth for a command in a locale file. Contains both the parser alias data (`triggers`, `subcommandTriggers`) and the display data (`name`, `desc`, `emoji`, `helpLines`, etc.). Lives in `src/i18n/en.ts`, `es.ts`, `pt.ts` |
| **CommandDef** | The display-only shape derived from a `CommandEntry` by `buildDisplayCommands`. Shape: `{ name, desc, trigger?, emoji?, featureName?, featureDesc?, subcommands?: string[] }` |
| **builders** | The two functions in `src/i18n/builders.ts`: `buildCommandList` and `buildDisplayCommands`, which derive the two locale structures from a `CommandEntry` map |

---

## Data model terms

| Term | Definition |
|---|---|
| **settings** | SQLite table. Stores the persisted language per `number`. Columns: `number`, `language`, `updated_at` |
| **pomodoros** | SQLite table. Stores active and completed pomodoro timer sessions. Columns: `id`, `number`, `task`, `duration_minutes`, `started_at`, `due_at`, `completed` |
| **reminders** | SQLite table. Stores reminder entries (one-off and recurring). Columns: `id`, `number`, `text`, `recurrence_type`, `recurrence_value`, `remind_at`, `sent` |
| **notes** | SQLite table. Stores to-do notes. Columns: `id`, `number`, `text`, `created_at`, `done`, `done_at` |
| **journal_entries** | SQLite table. Stores personal journal entries. Columns: `id`, `number`, `text`, `created_at` |
| **PomodoroRow** | TypeScript type for a row from the `pomodoros` table |
| **ReminderRow** | TypeScript type for a row from the `reminders` table |
| **NoteRow** | TypeScript type for a row from the `notes` table |
| **JournalRow** | TypeScript type for a row from the `journal_entries` table |
| **JournalStats** | TypeScript type for the computed stats object: `{ totalEntries, totalWords, daysWritten, currentStreak, longestStreak }` |

---

## Infrastructure terms

| Term | Definition |
|---|---|
| **Scheduler** | The cron job in `src/scheduler.ts` that runs every minute to check for due reminders and pomodoros and fires the `sendTo` function |
| **handleCommand** | The function in `src/handleCommand.ts` that orchestrates a single message: parse → check error → executeCommand |
| **gating** | The filtering logic in `src/main.ts` that restricts which incoming messages Remi responds to, controlled by `MY_NUMBER` and `MY_GROUP` env vars |
| **WAL mode** | SQLite write-ahead log mode enabled at DB init via `PRAGMA journal_mode = WAL` for better concurrent read performance |

---

## NLP action names

| action string | Meaning |
|---|---|
| `thanks` | User expressed gratitude |
| `howAreYou` | User asked how Remi is doing |
| `emojiReaction` | User sent a single reaction emoji (from `EMOJI_KEYWORDS`) |
| `whoAreYou` | User asked who Remi is |
| `whatCanYouDo` | User asked what Remi can do |
| `laugh` | User sent a laughter expression (`haha`, `lol`, etc.) |
| `compliment` | User complimented Remi or something |
| `sorry` | User apologised |
