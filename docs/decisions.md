# Architectural Decisions

A record of significant design choices: what was decided, why, and what was considered but rejected. The format is lightweight — one section per decision.

---

## ADR-001: Three-layer architecture (Parser / Handler / Infrastructure)

**Decision:** Strict separation between parsing (text → intent), handling (intent → response), and infrastructure (WhatsApp client, DB init, scheduler).

**Rationale:**
- Parsers can be unit-tested without a DB or a WhatsApp client
- Handlers are pure business logic — they read/write data and produce a message string
- Infrastructure is isolated in `main.ts` and `scheduler.ts`, making it easy to swap the transport layer (e.g. if WhatsApp Web changes API)

**Rejected alternative:** A single monolithic command handler that parses and executes inline (prior design in `src/commands.ts`) — removed because it made testing, adding commands, and adding locales extremely cumbersome.

---

## ADR-002: Locale as the single control point for aliases and display text

**Decision:** All user-facing strings (responses, command names, help text) and all parser trigger aliases live in locale files. Neither parsers nor handlers contain hardcoded user-visible strings.

**Rationale:**
- Adding a new language only requires a new locale file — zero changes to parser or handler logic
- The locale object is resolved once per message in `main.ts` and injected through `MessageContext`, so all downstream code is locale-agnostic
- NLP keyword arrays are also in the locale, enabling language-specific casual conversation keywords

**Rejected alternative:** Having hardcoded English strings in handlers as fallbacks — rejected because it creates hidden UI text that breaks i18n without a compilation error.

---

## ADR-003: `CommandEntry` as the single source of truth for locale command definitions

**Decision:** Each command is defined once per locale as a `CommandEntry` in the `defs` map. The `commandList` (parser aliases) and `commands` (display metadata) are derived from it via `buildCommandList()` / `buildDisplayCommands()`.

**Rationale:**
- Before this change, each command was written twice per locale file: once for parser aliases, once for help text. Adding a trigger meant updating both places.
- `CommandEntry` eliminates this duplication: `triggers` feeds the parser, `name/desc/emoji/helpLines` feed the display layer — defined in one object.
- `buildCommandList` and `buildDisplayCommands` are pure functions — easy to reason about and test.

**Rejected alternative:** Keeping separate `commandList` and `commands` objects — rejected because of the maintenance burden (6 places to update for one new command across 3 locales).

---

## ADR-004: NLP fallback in the parser layer, not the handler layer

**Decision:** Natural language pattern matching (thanks, greetings, compliments, etc.) is done in `src/parser/index.ts` after command alias matching fails. It produces a synthetic `{ command: 'nlp', action: '<type>' }` result that flows through the normal handler dispatch.

**Rationale:**
- NLP is a fallback for unrecognised input — placing it in the parser keeps `handleCommand.ts` and `executeCommand` oblivious to the NLP concept
- The NLP handler (`nlpHandler`) follows the same `HandlerResult` contract as all other handlers
- Keyword arrays live in `locale.responses`, so they are fully localised and support language-specific casual phrases

**Rejected alternative:** Checking NLP patterns inside `handleCommand.ts` before calling `executeCommand` — rejected because it would add a second dispatch path to the orchestrator and leak presentation logic out of the command layer.

---

## ADR-005: `better-sqlite3` (synchronous SQLite)

**Decision:** Use `better-sqlite3` for all database access. All DB calls are synchronous.

**Rationale:**
- The bot processes one message at a time per chat; there is no concurrency requirement that justifies async DB
- Synchronous code eliminates `async`/`await` chains inside handlers, keeping them simpler
- `better-sqlite3` is faster than `node-sqlite3` for single-threaded workloads

**Rejected alternative:** `node-sqlite3` (async) or a full ORM — rejected due to added complexity for a single-user, single-process workload.

---

## ADR-006: 1-based position indexes in list commands

**Decision:** When users reference items in lists (reminder #2, note #3), they use 1-based positions. Internally these are converted to array indices and then to database IDs.

**Rationale:**
- WhatsApp users are non-technical; 0-based indexing is confusing in conversation
- The handler retrieves the full list and picks `list[pos - 1]` to get the database `id`

**Implication:** Parser returns `pos` from user input as-is (the raw number). The handler validates it (must be a positive integer ≤ list length) and uses it to look up the actual DB row id.

---

## ADR-007: Reminder time parsing split by reminder type

**Decision:** One-off reminder parsing remains in the command layer (`createReminderHandler` with `parseReminderTime`), while recurring reminder subcommands perform minimal schedule extraction in the parser layer (e.g. weekly/monthly/weekdays/weekends parse `value` + `text` before dispatch).

**Rationale:**
- One-off time parsing is complex and locale-dependent — handling it in `createReminderHandler` keeps the parser simple for natural expressions like `tomorrow morning ...`
- Recurring subcommands need structured values (`interval`, `weekly`, `monthly`, `weekdays`, `weekends`) so parser-side extraction produces normalized params for handlers
- This split keeps UX flexible for one-off reminders while keeping recurring schedule handling explicit and predictable

---

## ADR-008: Scheduler injects `sendTo`, does not import the WhatsApp client

**Decision:** `startScheduler` receives a `(chatId: string, msg: string) => Promise<void>` callback from `main.ts`. It does not import `whatsapp-web.js` or the `client`.

**Rationale:**
- Clean separation: `scheduler.ts` is infrastructure-agnostic — it only knows about DB and locales
- Easy to test: you can call `startScheduler` with a mock `sendTo` function
- Follows the dependency inversion principle: the scheduler depends on an abstraction, not the concrete WhatsApp transport

---

## ADR-009: Gating is message-level, not session-level

**Decision:** `MY_NUMBER` and `MY_GROUP` filtering happens per-message inside the `client.on('message')` handler. Remi still receives all messages but ignores the filtered ones.

**Rationale:**
- `whatsapp-web.js` does not support selective message subscription at the session level
- Per-message gating is simple and transparent — the bot logs all messages but only processes allowed ones

---

## ADR-010: No `key` field on `CommandDef`

**Decision:** The `CommandDef` interface (display-only metadata) does not include a `key: CommandKey` field, even though it was in an earlier version of the type.

**Rationale:**
- `CommandDef` is always accessed via `locale.commands[key]` — the key is already in scope at the call site
- Including `key` in the value would be redundant and require it to be set identically in every locale file
- Removing it eliminated a class of mismatch bugs where the key in the map differed from the key in the value
