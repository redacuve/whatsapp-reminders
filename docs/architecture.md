# Architecture

## Overview

Remi is a single-process Node.js application with three clearly separated layers:

```
WhatsApp message
       │
       ▼
  main.ts          ← Event listener + gating + context assembly
       │
       ▼
  handleCommand.ts  ← Orchestrator: parse → error-check → execute
       │
   ┌───┴────────────────────────┐
   ▼                            ▼
parser/              command/
index.ts             index.ts (executeCommand)
   │                    │
parser layer         handler layer
(reads locale,       (reads db, locale,
 returns ParseResult) returns HandlerResult)
```

---

## Full file map

```
src/
├── main.ts                        Entry point. WhatsApp client, gating, context assembly, calls handleCommand
├── config.ts                      Env var exports (MY_NUMBER, MY_GROUP, LANG, SESSION_PATH)
├── handleCommand.ts               Orchestrator: parse → check error → executeCommand
├── scheduler.ts                   Cron job (every minute): fires due reminders and pomodoros
├── db.ts                          SQLite access layer (better-sqlite3). All DB functions exported here
├── helper.ts                      Pure utilities: pickRandom(), getTimeOfDay()
├── logger.ts                      Pino logger instance
├── time.ts                        Time parsing utilities for reminder creation
├── types.ts                       All shared TypeScript types and interfaces
│
├── i18n/
│   ├── index.ts                   getLocale(), availableLocales, buildCommandsList(), buildFeaturesList()
│   ├── builders.ts                buildCommandList(), buildDisplayCommands() — derives locale structures from CommandEntry
│   ├── en.ts                      English locale (defs → commandList + commands + motivationalMessages + responses)
│   ├── es.ts                      Spanish locale
│   └── pt.ts                      Portuguese locale
│
├── parser/
│   ├── index.ts                   Main parse function: alias matching → subcommand matching → NLP fallback
│   └── command/
│       ├── index.ts               Registers all ParserCommandDef instances: { help, status, ping, message, hello, bye, pomodoro, language, reminder, note, journal, remi }
│       ├── simple.ts              Parsers for: help, status, ping, message, hello, bye, remi
│       ├── pomodoro.ts            Pomodoro parser (start/status/cancel/help + naked call = start)
│       ├── language.ts            Language parser (set/help + naked call = set)
│       ├── reminder.ts            Reminder parser (list/help/delete/edit/create/recurring + naked call = list)
│       ├── note.ts                Note parser (list/help/done/undone/delete/create + naked call = help)
│       └── journal.ts             Journal parser (list/help/random/date/stats/delete/create + naked call = help)
│
└── command/
    ├── index.ts                   executeCommand(): routes ParseResult to handler functions; calls send()
    ├── simple.ts                  Handlers: helpHandler, statusHandler, pingHandler, messageHandler, helloHandler, byeHandler, remiHandler
    ├── nlp.ts                     nlpHandler(action, ctx): handles all 8 NLP action types
    ├── pomodoro.ts                startPomodoroHandler, pomodoroStatusHandler, cancelPomodoroHandler, pomodoroHelpHandler
    ├── language.ts                setLanguageHandler, helpLanguageHandler
    ├── reminder.ts                createReminderHandler, createRecurringReminderHandler, listRemindersHandler, helpReminderHandler, deleteReminderHandler, editReminderHandler
    ├── note.ts                    createNoteHandler, listNotesHandler, helpNoteHandler, markNoteDoneHandler, markNoteUndoneHandler, deleteNoteHandler
    └── journal.ts                 createJournalHandler, listJournalHandler, helpJournalHandler, randomJournalHandler, dateJournalHandler, statsJournalHandler, deleteJournalHandler
```

---

## Message pipeline (step by step)

### 1. `src/main.ts` — event listener

```
client.on('message', async (message) => {
  1. Get chat
  2. Apply gating (MY_GROUP / MY_NUMBER filter)
  3. Resolve locale: getLocale(db.getLanguage(from) || LANG)
  4. Build MessageContext (locale, sender info, bot info, timestamp)
  5. Call handleCommand(message.body, send, ctx)
})
```

### 2. `src/handleCommand.ts` — orchestrator

```
handleCommand(text, send, ctx):
  1. parseInput(text, locale)            → ParseResult | { error }
  2. If error → send(locale.responses.unknown) and return
  3. Logger.info(parsed command)
  4. executeCommand(parseResult, ctx, send)
```

### 3. `src/parser/index.ts` — parser

```
parseInput(input, locale):
  1. Lowercase + trim + split into tokens
  2. Find commandKey: first token matched against locale.commandList[key].list
  3. If commandKey found:
     a. Get ParserCommandDef from commands registry
     b. If command has subcommands AND second token exists:
        - Try to match second token against locale.commandList[commandKey].subcommands[subKey].list
        - If subcommand found: call subcommand.parse(restTokens, context)
        - If no subcommand found: call command.parse(restTokens, context) (treats second token as parameter)
     c. If no subcommands or no second token: call command.parse(restTokens, context)
     d. Return { command, action, params }
  4. NLP fallback (if no commandKey matched):
     - Check thanksKeywords → action: 'thanks'
     - Check howAreYouKeywords → action: 'howAreYou'
     - Check emojiKeywords (exact) → action: 'emojiReaction'
     - Check whoAreYouKeywords → action: 'whoAreYou'
     - Check whatCanYouDoKeywords → action: 'whatCanYouDo'
     - Check laughKeywords (exact) → action: 'laugh'
     - Check complimentKeywords → action: 'compliment'
     - Check sorryKeywords → action: 'sorry'
     - None matched → { error: 'Unknown command' }
```

### 4. `src/command/index.ts` — handler dispatch

```
executeCommand(parseResult, ctx, send):
  switch (command):
    case 'help'     → helpHandler(ctx) → send
    case 'status'   → statusHandler(ctx) → send
    case 'ping'     → pingHandler(ctx) → send
    case 'message'  → messageHandler(ctx) → send
    case 'hello'    → helloHandler(ctx) → send
    case 'bye'      → byeHandler(ctx) → send
    case 'remi'     → remiHandler(ctx) → send
    case 'pomodoro' → startPomodoroHandler / pomodoroStatusHandler / cancelPomodoroHandler / pomodoroHelpHandler
    case 'language' → setLanguageHandler / helpLanguageHandler
    case 'reminder' → createReminderHandler / createRecurringReminderHandler / listRemindersHandler / helpReminderHandler / deleteReminderHandler / editReminderHandler
    case 'note'     → createNoteHandler / listNotesHandler / helpNoteHandler / markNoteDoneHandler / markNoteUndoneHandler / deleteNoteHandler
    case 'journal'  → createJournalHandler / listJournalHandler / helpJournalHandler / randomJournalHandler / dateJournalHandler / statsJournalHandler / deleteJournalHandler
    case 'nlp'      → nlpHandler(action, ctx)
    default         → send(locale.responses.unknown)
```

---

## Parser per command

### Simple commands (no subcommands, no params)

| Command | Parser file | parse() always returns |
|---|---|---|
| `help` | `parser/command/simple.ts` | `{ command: 'help', action: 'show' }` |
| `status` | `parser/command/simple.ts` | `{ command: 'status', action: 'check' }` |
| `ping` | `parser/command/simple.ts` | `{ command: 'ping', action: 'pong' }` |
| `message` | `parser/command/simple.ts` | `{ command: 'message', action: 'motivate' }` |
| `hello` | `parser/command/simple.ts` | `{ command: 'hello', action: 'greet' }` |
| `bye` | `parser/command/simple.ts` | `{ command: 'bye', action: 'farewell' }` |
| `remi` | `parser/command/simple.ts` | `{ command: 'remi', action: 'about' }` |

### `pomodoro` — `parser/command/pomodoro.ts`

Naked call (no subcommand) defaults to `start`. Subcommand `start` runs the same parser as the naked call.

```
pomodoroStartParser(tokens):
  Walk tokens:
    - First numeric token → minutes
    - All other tokens → task name parts
  minutes = parsed ?? 25
  name = joined parts ?? locale.responses.pomodoroDefaultTask

Subcommands:
  start  → pomodoroStartParser(tokens)   → { command: 'pomodoro', action: 'start',  params: { minutes, name } }
  status → fixed                         → { command: 'pomodoro', action: 'status' }
  cancel → fixed                         → { command: 'pomodoro', action: 'cancel' }
  help   → fixed                         → { command: 'pomodoro', action: 'help' }
```

### `language` — `parser/command/language.ts`

Naked call defaults to `set`. If no token, returns `help`.

```
languageStartParser(tokens):
  If no tokens → { command: 'language', action: 'help' }
  Else         → { command: 'language', action: 'set', params: { language: tokens[0] } }

Subcommands:
  set  → languageStartParser(tokens)
  help → fixed → { command: 'language', action: 'help' }
```

### `reminder` — `parser/command/reminder.ts`

Naked call with no tokens returns `list`. Naked call with tokens returns `create`.

```
Main parse(tokens):
  If tokens empty → { command: 'reminder', action: 'list' }
  Else            → { command: 'reminder', action: 'create', params: { input: tokens.join(' ') } }

Subcommands:
  list   → fixed → { command: 'reminder', action: 'list' }
  help   → fixed → { command: 'reminder', action: 'help' }
  delete → { command: 'reminder', action: 'delete',  params: { pos: parseInt(tokens[0]) } }
  edit   → Requires ≥2 tokens (pos + content)
           tokens[0] must be a valid positive integer
           → { command: 'reminder', action: 'edit', params: { pos, content: tokens.slice(1).join(' ') } }
           If invalid → { error: locale.responses.invalidArgs }
  interval → Requires mins + text
             → { command: 'reminder', action: 'interval', params: { value: '<mins>', text: '<text>' } }
  weekly   → Requires day + time + text
             → { command: 'reminder', action: 'weekly', params: { value: '<dow HH:MM>', text: '<text>' } }
  monthly  → Requires day-of-month + time + text
             → { command: 'reminder', action: 'monthly', params: { value: '<day HH:MM>', text: '<text>' } }
  weekdays → Requires time + text
             → { command: 'reminder', action: 'weekdays', params: { value: '<HH:MM>', text: '<text>' } }
  weekends → Requires time + text
             → { command: 'reminder', action: 'weekends', params: { value: '<HH:MM>', text: '<text>' } }
```

One-off reminder time parsing (e.g. `14:30`, `+30`, `tomorrow 9:00 morning`) is handled in `src/time.ts`, called by `createReminderHandler` in the command layer. Recurring subcommands (`interval`, `weekly`, `monthly`, `weekdays`, `weekends`) do lightweight parser-side extraction into `{ value, text }` and are persisted by `createRecurringReminderHandler`.

### `note` — `parser/command/note.ts`

Naked call with no tokens returns `help`. Naked call with tokens creates a note.

```
Main parse(tokens):
  If tokens empty → { command: 'note', action: 'help' }
  Else            → { command: 'note', action: 'create', params: { text: tokens.join(' ') } }

Subcommands:
  list   → fixed → { command: 'note', action: 'list' }
  help   → fixed → { command: 'note', action: 'help' }
  done   → { command: 'note', action: 'done',   params: { pos: parseInt(tokens[0]) } }
  undone → { command: 'note', action: 'undone', params: { pos: parseInt(tokens[0]) } }
  delete → { command: 'note', action: 'delete', params: { pos: parseInt(tokens[0]) } }
```

### `journal` — `parser/command/journal.ts`

Naked call with no tokens returns `help`. Naked call with tokens creates an entry.

```
Main parse(tokens):
  If tokens empty → { command: 'journal', action: 'help' }
  Else            → { command: 'journal', action: 'create', params: { text: tokens.join(' ') } }

Subcommands:
  list   → fixed → { command: 'journal', action: 'list' }
  help   → fixed → { command: 'journal', action: 'help' }
  random → fixed → { command: 'journal', action: 'random' }
  date   → { command: 'journal', action: 'date',   params: { dateStr: tokens[0] ?? null } }
  stats  → fixed → { command: 'journal', action: 'stats' }
  delete → { command: 'journal', action: 'delete', params: { pos: parseInt(tokens[0]) } }
```

### NLP (synthetic command)

Not registered in `parser/command/index.ts` — produced directly by `parser/index.ts` after no alias match.

```
Input lower-includes thanksKeywords       → { command: 'nlp', action: 'thanks' }
Input lower-includes howAreYouKeywords    → { command: 'nlp', action: 'howAreYou' }
Input exactly equals emojiKeywords entry  → { command: 'nlp', action: 'emojiReaction' }
Input lower-includes whoAreYouKeywords    → { command: 'nlp', action: 'whoAreYou' }
Input lower-includes whatCanYouDoKeywords → { command: 'nlp', action: 'whatCanYouDo' }
Input exactly equals laughKeywords entry  → { command: 'nlp', action: 'laugh' }
Input lower-includes complimentKeywords   → { command: 'nlp', action: 'compliment' }
Input lower-includes sorryKeywords        → { command: 'nlp', action: 'sorry' }
None match                                → { error: 'Unknown command' }
```

---

## Handler per command

### `src/command/simple.ts`

| Function | Returns | DB access |
|---|---|---|
| `helpHandler(ctx)` | `string` — formatted command list | None |
| `statusHandler(ctx)` | `string` — sender + bot info | None |
| `pingHandler(ctx)` | `string` | None |
| `messageHandler(ctx)` | `string` — random motivational message | None |
| `helloHandler(ctx)` | `string` — time-aware greeting | None |
| `byeHandler(ctx)` | `string` — random farewell | None |
| `remiHandler(ctx)` | `string` — full self-introduction + command list | None |

### `src/command/nlp.ts` — `nlpHandler(action, ctx)`

| action | Response source |
|---|---|
| `thanks` | `pickRandom(locale.responses.thanks)` |
| `howAreYou` | `pickRandom(locale.responses.howAreYou)` |
| `emojiReaction` | `pickRandom(locale.responses.emojiReactions)` |
| `whoAreYou` | `pickRandom(locale.responses.whoAreYou)` |
| `whatCanYouDo` | `locale.responses.whatCanYouDo(buildFeaturesList(locale))` |
| `laugh` | `pickRandom(locale.responses.laughResponses)` |
| `compliment` | `pickRandom(locale.responses.complimentResponses)` |
| `sorry` | `pickRandom(locale.responses.sorryResponses)` |

### `src/command/pomodoro.ts`

| Function | Params | DB writes |
|---|---|---|
| `startPomodoroHandler(name, minutes, ctx)` | name nullable, minutes nullable | `db.startPomodoro` or `db.updatePomodoro` |
| `pomodoroStatusHandler(ctx)` | — | None (reads `db.getActivePomodoro`) |
| `cancelPomodoroHandler(ctx)` | — | `db.cancelPomodoro` |
| `pomodoroHelpHandler(ctx)` | — | None |

### `src/command/language.ts`

| Function | Params | DB writes |
|---|---|---|
| `setLanguageHandler(language, ctx)` | `language: string` | `db.setLanguage(from, language)` |
| `helpLanguageHandler(ctx)` | — | None |

### `src/command/reminder.ts`

| Function | Params | DB writes |
|---|---|---|
| `createReminderHandler(input, ctx)` | `input: string` (raw remainder after command word) | `db.createReminder` |
| `createRecurringReminderHandler(type, value, text, ctx)` | `type: 'interval' \| 'weekly' \| 'monthly' \| 'weekdays' \| 'weekends'`, `value: string`, `text: string` | `db.createRecurringReminder` |
| `listRemindersHandler(ctx)` | — | None (reads) |
| `helpReminderHandler(ctx)` | — | None |
| `deleteReminderHandler(pos, ctx)` | `pos: number` (1-based position) | `db.deleteReminder` |
| `editReminderHandler(pos, content, ctx)` | `pos: number`, `content: string` | `db.updateReminder` |

### `src/command/note.ts`

| Function | Params | DB writes |
|---|---|---|
| `createNoteHandler(text, ctx)` | `text: string` | `db.createNote` |
| `listNotesHandler(ctx)` | — | None (reads) |
| `helpNoteHandler(ctx)` | — | None |
| `markNoteDoneHandler(pos, ctx)` | `pos: number` | `db.markNoteDone` |
| `markNoteUndoneHandler(pos, ctx)` | `pos: number` | `db.markNoteUndone` |
| `deleteNoteHandler(pos, ctx)` | `pos: number` | `db.deleteNote` |

### `src/command/journal.ts`

| Function | Params | DB writes |
|---|---|---|
| `createJournalHandler(text, ctx)` | `text: string` | `db.createJournalEntry` |
| `listJournalHandler(ctx)` | — | None (reads last 5) |
| `helpJournalHandler(ctx)` | — | None |
| `randomJournalHandler(ctx)` | — | None (reads random) |
| `dateJournalHandler(dateStr \| null, ctx)` | `dateStr: string \| null` | None (reads by date) |
| `statsJournalHandler(ctx)` | — | None (reads stats) |
| `deleteJournalHandler(pos, ctx)` | `pos: number` | `db.deleteJournalEntry` |

---

## Locale system

### How locales are structured

Each of `en.ts`, `es.ts`, `pt.ts` exports a `Locale` object built from a single `defs` map:

```
defs: Record<string, CommandEntry>
         │
    ┌────┴────────────────────┐
    ▼                         ▼
buildCommandList(defs)   buildDisplayCommands(defs)
         │                         │
  commandList             commands
  (used by parser)        (used by handlers for help text)
```

### `CommandEntry` structure

```ts
{
  triggers: string[]                           // parser aliases (commandList.list)
  subcommandTriggers?: Record<string, string[]> // subcommand aliases
  name?: string                                // display name (omit = not shown in help)
  desc?: string                                // short description
  trigger?: string                             // override trigger shown in help (default: triggers[0])
  emoji?: string                               // marks as a feature (shown in whatCanYouDo)
  featureName?: string                         // feature list name (default: name)
  featureDesc?: string                         // feature list description (default: desc)
  helpLines?: string[]                         // usage lines for subcommand help output
}
```

### Locale responses structure (relevant fields)

```
locale.responses:
  // NLP keyword arrays (checked by parser)
  thanksKeywords, howAreYouKeywords, emojiKeywords, whoAreYouKeywords,
  whatCanYouDoKeywords, laughKeywords, complimentKeywords, sorryKeywords

  // NLP response arrays (used by nlpHandler)
  thanks[], howAreYou[], emojiReactions[], whoAreYou[],
  laughResponses[], complimentResponses[], sorryResponses[]

  // whatCanYouDo is a function: (featuresSection: string) => string
  whatCanYouDo(featuresSection)

  // Greeting/farewell arrays
  greetings: { morning[], afternoon[], evening[], night[] }   (each entry is (name) => string)
  greetingKeywords[], farewellKeywords[], farewells[]

  // Per-command response strings and functions
  pomodoroStarted, pomodoroStatus, pomodoroDone, pomodoroStart[], pomodoroEnd[], ...
  reminderAdded, reminderEdited, reminderDeleted, reminderDone, reminderList, reminderEmpty, ...
  noteAdded, noteList, noteEmpty, noteMarkedDone, noteMarkedUndone, ...
  journalAdded, journalList, journalEmpty, journalStats, ...
  langChanged, langInvalid
  unknown, ping, status, motivatePrefix, invalidArgs
```

---

## Database schema

```sql
CREATE TABLE settings (
  number     TEXT PRIMARY KEY,       -- chatId
  language   TEXT NOT NULL DEFAULT 'en',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE pomodoros (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  number           TEXT NOT NULL,    -- chatId
  task             TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  started_at       TEXT DEFAULT (datetime('now')),
  due_at           TEXT,
  completed        INTEGER DEFAULT 0
);

CREATE TABLE reminders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  number     TEXT NOT NULL,          -- chatId
  text       TEXT NOT NULL,
  recurrence_type  TEXT,
  recurrence_value TEXT,
  remind_at  TEXT NOT NULL,
  sent       INTEGER DEFAULT 0
);

CREATE TABLE notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  number     TEXT NOT NULL,          -- chatId
  text       TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  done       INTEGER DEFAULT 0,
  done_at    TEXT
);

CREATE TABLE journal_entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  number     TEXT NOT NULL,          -- chatId
  text       TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Scheduler

`src/scheduler.ts` runs a `node-cron` job every minute (`* * * * *`):

1. `db.getDueReminders()` → for each: resolve locale, call `sendTo(number, reminderDone(text))`
  - one-off reminders: `db.markReminderSent(id)`
  - recurring reminders: `db.advanceRecurringReminder(id, computeNextOccurrence(...))`
2. `db.getDuePomodoros()` → for each: mark completed, resolve locale, call `sendTo(number, pomodoroDone(task) + endPhrase)`

The `sendTo` function is injected from `main.ts` and calls `client.sendMessage(chatId, message)`.
