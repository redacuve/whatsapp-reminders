# Key Module API

## src/db.ts

All SQLite access. Uses `better-sqlite3` (synchronous).

```ts
// Language
getLanguage(number: string): string | null
setLanguage(number: string, lang: string): void

// Pomodoro
startPomodoro(chatId: string, task: string, minutes: number): void
getActivePomodoro(chatId: string): PomodoroRow | null
updatePomodoro(chatId: string, task: string, minutes: number): void
cancelPomodoro(chatId: string): boolean

// Reminders
createReminder(chatId: string, text: string, due: Date): number
createRecurringReminder(chatId: string, text: string, recurrenceType: string, recurrenceValue: string, firstDue: Date): number
getPendingReminders(chatId: string): ReminderRow[]
deleteReminder(id: number, chatId: string): boolean
updateReminder(id: number, chatId: string, changes: Partial<ReminderRow>): boolean
markReminderSent(id: number): void
advanceRecurringReminder(id: number, nextDue: Date): void
getDueReminders(): ReminderRow[]

// Notes
createNote(chatId: string, text: string): number
getNotes(chatId: string): NoteRow[]
markNoteDone(id: number, chatId: string): boolean
markNoteUndone(id: number, chatId: string): boolean
deleteNote(id: number, chatId: string): boolean

// Journal
createJournalEntry(chatId: string, text: string): void
getJournalEntries(chatId: string, limit?: number): JournalRow[]
getRandomJournalEntry(chatId: string): JournalRow | null
getJournalEntryByDate(chatId: string, date: string): JournalRow | null
getJournalStats(chatId: string): JournalStats
deleteJournalEntry(id: number, chatId: string): boolean
```

---

## src/handleCommand.ts

```ts
export async function handleCommand(
  text: string,
  send: SendFn,
  ctx: MessageContext,
): Promise<void>
```

Calls `parseInput(text, ctx.locale)`. On error sends `locale.responses.unknown`. On success calls `executeCommand(parseResult, ctx, send)`.

---

## src/command/index.ts — executeCommand

```ts
async function executeCommand(
  parseResult: ParseResult,
  ctx: MessageContext,
  send: SendFn,
): Promise<void>
```

Routes `parseResult.command` via `switch` to the appropriate handler. Handlers covered: `help`, `status`, `ping`, `message`, `hello`, `bye`, `remi`, `language`, `pomodoro`, `reminder`, `note`, `journal`, `nlp`.

---

## src/parser/index.ts

```ts
function parseInput(
  input: string,
  locale: Locale,
): ParseResult | { error: string }
```

Tokenizes, resolves command/subcommand aliases via `locale.commandList`, then runs NLP fallback via `locale.responses` keyword arrays.

---

## src/time.ts

```ts
parseReminderTime(input: string, vagueHours: Record<string, number>, tomorrowKeywords: string[]): { text: string, due: Date } | null
parseEditInput(input: string, vagueHours: Record<string, number>, tomorrowKeywords: string[]): { text?: string, due?: Date }
formatReminderTime(date: Date | string, labels: { today: string, tomorrow: string }): string
computeNextOccurrence(type: string, value: string, from: Date): Date
```

---

## src/i18n/index.ts

```ts
getLocale(lang: string): Locale          // returns en fallback for unknown codes
buildFeaturesList(locale: Locale): string // formatted feature list for whatCanYouDo
buildCommandsList(locale: Locale): string // formatted command list for remi/help
```

---

## src/scheduler.ts

```ts
startScheduler(send: (chatId: string, message: string) => Promise<void>): void
```

Runs every minute for due pomodoros and reminders, calls `send` with completion messages.
For recurring reminders, computes the next occurrence and advances the same row instead of marking it sent.
