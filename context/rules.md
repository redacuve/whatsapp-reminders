# Rules — Coding conventions for Remi

These rules describe the invariants and patterns every contributor (human or AI) must follow. Violating them will cause bugs or break the architecture.

---

## 1. Layer boundaries

The codebase has three hard layers. **Never cross them.**

| Layer | Location | Allowed imports | Forbidden imports |
|---|---|---|---|
| **Parser** | `src/parser/` | `src/types.ts`, `src/i18n/` | `src/db.ts`, `src/command/`, `src/scheduler.ts` |
| **Command handlers** | `src/command/` | `src/db.ts`, `src/types.ts`, `src/i18n/`, `src/helper.ts` | `src/parser/`, `src/main.ts` |
| **Infrastructure** | `src/main.ts`, `src/scheduler.ts`, `src/handleCommand.ts` | anything | — |

> **Why:** The parser must remain pure and testable. Handlers must never produce side-effect output themselves (they return `HandlerResult`, they never call `send()`).

---

## 2. Locale is resolved exactly once

Locale resolution (`getLocale(language)`) happens **only in `src/main.ts`** (for incoming messages) and **in `src/scheduler.ts`** (for scheduled fire events). It is passed into everything else through `MessageContext.locale`.

- Never call `getLocale()` inside a parser file.
- Never call `getLocale()` inside a command handler.
- Never hardcode `'en'` as a fallback inside handlers — use `ctx.locale`.

---

## 3. Handlers return, they do not send

Every command handler function must return a `HandlerResult` (`{ status, message }`). The `send()` function is called exclusively in `src/command/index.ts` (`executeCommand`).

```ts
// CORRECT
export function pingHandler(ctx: MessageContext): HandlerResult {
  return { status: 'ok', message: ctx.locale.responses.ping };
}

// WRONG — never do this in a handler
export function pingHandler(ctx: MessageContext, send: SendFn) {
  await send(ctx.locale.responses.ping); // ❌
}
```

Exception: `simple.ts` handlers (`helpHandler`, `statusHandler`, `helloHandler`, `byeHandler`, `remiHandler`, `messageHandler`, `pingHandler`) return `string` directly instead of `HandlerResult` because they are called differently in `executeCommand`. This is the one existing inconsistency — do not expand it.

---

## 4. All text visible to users lives in locale files

No string that a user can read should be hardcoded in a handler or parser. Every user-facing response, label, error message, and command name must come from `ctx.locale.responses` or `ctx.locale.commands`.

---

## 5. Adding a new command — required steps

Every new command needs changes in **all four** of these places:

1. **`src/i18n/en.ts` / `es.ts` / `pt.ts`** — add a `CommandEntry` to `defs` with `triggers`, display fields, and `helpLines`
2. **`src/parser/command/<name>.ts`** — create the `ParserCommandDef` with `parse()` and `subcommands`
3. **`src/parser/command/index.ts`** — register the new parser def in the `commands` export map
4. **`src/command/<name>.ts`** — create handler functions
5. **`src/command/index.ts`** — add a `case '<name>':` block in `executeCommand`

If any of the five steps is missing, the command will either not be recognised (missing step 2/3) or recognised but silently do nothing (missing step 4/5).

---

## 6. `CommandEntry` is the single source of truth for locale command definitions

Do **not** manually write a `commandList` or `commands` object in a locale file. Always define a `defs: Record<string, CommandEntry>` object and derive both from it:

```ts
const commandList = buildCommandList(defs);
const commands    = buildDisplayCommands(defs);
```

The `buildCommandList` function produces parser aliases; `buildDisplayCommands` produces display metadata. They are both in `src/i18n/builders.ts`.

---

## 7. Database keys are always the full serialized WhatsApp number

All DB functions use `chatId` (e.g. `5215512345678@c.us`). Never use `senderNumber` (the bare digits) as a DB key. The `number` column in every table stores the full serialized ID.

---

## 8. NLP fallback: keyword arrays live in `locale.responses`

NLP pattern keywords (e.g. `thanksKeywords`, `laughKeywords`) are defined inside the `responses` object of each locale, not as top-level fields. The parser reads them directly:

```ts
if (r.thanksKeywords.some((k) => lower.includes(k)))
  return { command: 'nlp', action: 'thanks' };
```

When adding a new NLP pattern, add the keyword array **and** the response array to all three locales, then add the check in `src/parser/index.ts` and the `case` in `nlpHandler`.

---

## 9. TypeScript strict mode is on

`tsconfig.json` has `"strict": true`. Do not use `any` except in the `journalStats` formatter functions (pre-existing). Do not silence type errors with `// @ts-ignore`.

---

## 10. No direct `console.log`

Use `Logger` from `src/logger.ts` everywhere. `Logger.info`, `Logger.debug`, `Logger.error` are available.
