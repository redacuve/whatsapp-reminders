
# WhatsApp Reminders – Overview & Architecture

## What it is
WhatsApp bot for managing reminders, notes, pomodoro timers, motivational messages, and a personal journal. Multilanguage support (en/es/pt) with local SQLite persistence. The bot also handles natural-language conversation (thanks, laughter, compliments, etc.) through a keyword-based NLP fallback.

## Pipeline (high-level)

```
WhatsApp message
  → main.ts           resolve language + locale, build MessageContext
  → handleCommand.ts  parse input, dispatch to executor
  → parser/index.ts   tokenize → resolve aliases → NLP fallback → ParseResult
  → command/index.ts  executeCommand: route ParseResult to handler
  → command/*.ts      handler: DB + locale → HandlerResult { status, message }
  → send(message)     reply to WhatsApp
```

## Three-layer separation

| Layer | Files | Responsibility |
|-------|-------|---------------|
| **Transport** | `main.ts` | WhatsApp client lifecycle, builds `MessageContext` (includes pre-resolved `locale`) |
| **Coordination** | `handleCommand.ts`, `command/index.ts` | Parse → route → call handler → send |
| **Handlers** | `command/*.ts` | Pure sync functions: DB + locale → `HandlerResult` |

## Key contracts

```ts
// Context passed to every handler — locale is pre-resolved in main.ts
interface MessageContext {
  locale: Locale;       // already resolved, no getLocale() needed in handlers
  language: string;
  chatId: string;
  from: string;
  senderName: string;
  // ...full shape in src/types.ts
}

// All handlers return this — never call send() directly
interface HandlerResult {
  status: 'ok' | 'error';
  message: string;
}
```

## Data persistence
All DB access goes through `src/db.ts` (better-sqlite3, synchronous).

Tables: `settings`, `pomodoros`, `reminders`, `notes`, `journal_entries`.

## i18n
Locale files live in `src/i18n/` (en.ts, es.ts, pt.ts). Each exports a `Locale` object with:
- `commandList` — alias tables used by the parser (trigger words + subcommand aliases)
- `commands` — display metadata (name, desc, subcommands string list)
- `responses` — all user-facing strings, template functions, and NLP keyword arrays

Language is resolved once in `main.ts` via `getLocale(language)` and attached to `MessageContext`.

## NLP fallback
When no command alias matches, the parser checks `locale.responses` keyword arrays in order:
`thanksKeywords` → `howAreYouKeywords` → `emojiKeywords` → `whoAreYouKeywords` → `whatCanYouDoKeywords` → `laughKeywords` → `complimentKeywords` → `sorryKeywords`

Matched patterns return `{ command: 'nlp', action: '<type>' }` and are routed to `nlpHandler` in `src/command/nlp.ts`.

## File map

| File | Role |
|------|------|
| `src/main.ts` | WhatsApp client, builds `MessageContext`, calls `handleCommand` |
| `src/handleCommand.ts` | Calls parser, logs result, calls `executeCommand` |
| `src/parser/index.ts` | Tokenize → alias resolve → NLP fallback → `ParseResult` |
| `src/parser/command/index.ts` | Command registry: maps key → `CommandDef` |
| `src/parser/command/simple.ts` | Parse logic for hello, bye, help, status, ping, message, language |
| `src/parser/command/pomodoro.ts` | Parse logic for pomodoro |
| `src/parser/command/reminder.ts` | Parse logic for reminder |
| `src/parser/command/note.ts` | Parse logic for note |
| `src/parser/command/journal.ts` | Parse logic for journal |
| `src/command/index.ts` | `executeCommand`: routes `ParseResult` → handler → `send` |
| `src/command/simple.ts` | hello, bye, help, status, ping, message, remi handlers |
| `src/command/language.ts` | Language change handlers |
| `src/command/pomodoro.ts` | Pomodoro handlers → `HandlerResult` |
| `src/command/reminder.ts` | Reminder handlers → `HandlerResult` |
| `src/command/note.ts` | Note handlers → `HandlerResult` |
| `src/command/journal.ts` | Journal handlers → `HandlerResult` |
| `src/command/nlp.ts` | NLP fallback handler → `HandlerResult` |
| `src/db.ts` | All SQLite access |
| `src/types.ts` | Shared types: `MessageContext`, `HandlerResult`, `SendFn`, `Locale`, etc. |
| `src/i18n/en.ts` | English locale |
| `src/i18n/es.ts` | Spanish locale |
| `src/i18n/pt.ts` | Portuguese locale |
| `src/i18n/index.ts` | `getLocale()`, `buildFeaturesList()`, `buildCommandsList()` |
| `src/scheduler.ts` | Fires pomodoro/reminder completion messages |
| `src/time.ts` | Date/time parsing and formatting |
| `src/helper.ts` | Utilities: `pickRandom`, `getTimeOfDay` |
| `src/logger.ts` | Structured logging (pino) |
| `src/config.ts` | Env config: LANG, MY_NUMBER, SESSION_PATH, … |
- **src/scheduler.ts**: Programación de tareas (opcional).

## Esquema de base de datos (SQLite)

```sql
-- Tabla de configuración de usuario
CREATE TABLE IF NOT EXISTS settings (
	number TEXT PRIMARY KEY,
	language TEXT NOT NULL DEFAULT 'en',
	updated_at TEXT DEFAULT (datetime('now'))
);

-- Pomodoros
CREATE TABLE IF NOT EXISTS pomodoros (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	number TEXT NOT NULL,
	task TEXT NOT NULL,
	duration_minutes INTEGER NOT NULL,
	started_at TEXT DEFAULT (datetime('now')),
	due_at TEXT,
	completed INTEGER DEFAULT 0
);

-- Recordatorios
CREATE TABLE IF NOT EXISTS reminders (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	number TEXT NOT NULL,
	text TEXT NOT NULL,
	recurrence_type TEXT,
	recurrence_value TEXT,
	remind_at TEXT NOT NULL,
	sent INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notas
CREATE TABLE IF NOT EXISTS notes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	number TEXT NOT NULL,
	text TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	done INTEGER NOT NULL DEFAULT 0,
	done_at TEXT
);

-- Diario
CREATE TABLE IF NOT EXISTS journal_entries (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	number TEXT NOT NULL,
	text TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Tipos principales (TypeScript)

- **ReminderRow**: id, number, text, recurrence_type, recurrence_value, remind_at, sent, created_at
- **NoteRow**: id, number, text, created_at, done, done_at
- **PomodoroRow**: id, number, task, duration_minutes, started_at, due_at, completed
- **JournalRow**: id, number, text, created_at
- **JournalStats**: totalEntries, totalWords, daysWritten, currentStreak, longestStreak
- **MessageContext**: Información del remitente, chat, hora, etc.

## Ejemplo de flujo de comando

1. Usuario envía: `remind +10 Llamar a mamá`
2. `handleCommand` detecta comando `remind`, parsea tiempo y texto (o una recurrencia si usa `interval`, `weekly`, `monthly`, `weekdays`, `weekends`).
3. Se llama a `db.createReminder` para guardar el recordatorio.
4. El bot responde con confirmación en el idioma del usuario.

## Dependencias clave
- Node.js + TypeScript
- pnpm para gestión de paquetes
- better-sqlite3 para persistencia local

## Notas
- El sistema es extensible a nuevos idiomas agregando archivos en `src/i18n/`.
- Los comandos y respuestas se adaptan al idioma del usuario.
- El diseño es modular y fácilmente ampliable para nuevas funciones.

---
Este archivo resume la arquitectura y contexto del proyecto para uso de IA y desarrolladores.