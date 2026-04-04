# Frequently Asked Questions

**How is data stored?**
All data is stored in a local SQLite database via `src/db.ts` (better-sqlite3, synchronous). Tables: `settings`, `pomodoros`, `reminders`, `notes`, `journal_entries`.

**How do I change the bot language?**
Send `language set en` (or `es` / `pt`). In Spanish: `idioma cambiar es`. In Portuguese: `idioma mudar pt`.
The setting is stored per user in the `settings` table.

**What happens when I send an unknown command?**
The parser first tries the NLP fallback (thanks, how-are-you, compliments, etc.). If nothing matches, the bot replies with `locale.responses.unknown`.

**How do I add a new command?**
1. Add trigger words to `commandList` in `src/i18n/en.ts`, `es.ts`, `pt.ts`
2. Create `src/parser/command/{name}.ts` — pure parse logic, no DB
3. Register it in `src/parser/command/index.ts`
4. Create `src/command/{name}.ts` — handlers returning `HandlerResult`
5. Add `case '{name}'` in `src/command/index.ts`

See `context/architecture.md` for the full step-by-step guide with code examples.

**How are scheduled tasks handled?**
`src/scheduler.ts` checks the DB every minute for due pomodoros and reminders, then sends the completion message via the WhatsApp client callback passed in from `main.ts`.
For recurring reminders, it computes the next occurrence and updates the same row instead of marking it finished.

**How does the NLP fallback work?**
When no command alias matches, `parser/index.ts` checks keyword arrays in `locale.responses` (e.g. `thanksKeywords`, `laughKeywords`) and returns `{ command: 'nlp', action: '<type>' }`. The `nlpHandler` in `src/command/nlp.ts` picks a random response from the matching array.

**Can I use the bot in a group?**
Yes. Set `MY_GROUP` in the env config to restrict the bot to one group, or leave it unset to respond to all chats. Groups are gated in `main.ts`.
