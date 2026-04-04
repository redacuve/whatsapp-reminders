# Commands — Implemented Architecture Pattern

Every command in this project follows the same two-object pattern:

1. A **`CommandDef`** (parser layer) — pure alias resolution, no DB, no side effects
2. One or more **handler functions** (handler layer) — DB access, locale responses, return `HandlerResult`

---

## Parser layer pattern (`src/parser/command/{name}.ts`)

```ts
import type { CommandDef, ParseResult, ParserContext } from './definitiions';

export const noteCommand: CommandDef = {
  key: 'note',
  parse(tokens: string[], ctx: ParserContext): ParseResult {
    const sub = ctx.locale.commandList.note?.subcommands;

    if (sub?.list?.list.some((a) => tokens[0] === a))
      return { command: 'note', action: 'list' };

    if (sub?.done?.list.some((a) => tokens[0] === a)) {
      const pos = parseInt(tokens[1], 10);
      return { command: 'note', action: 'done', params: { pos } };
    }

    if (sub?.undone?.list.some((a) => tokens[0] === a)) {
      const pos = parseInt(tokens[1], 10);
      return { command: 'note', action: 'undone', params: { pos } };
    }

    if (sub?.delete?.list.some((a) => tokens[0] === a)) {
      const pos = parseInt(tokens[1], 10);
      return { command: 'note', action: 'delete', params: { pos } };
    }

    if (sub?.help?.list.some((a) => tokens[0] === a))
      return { command: 'note', action: 'help' };

    // default — create
    return { command: 'note', action: 'create', params: { text: tokens.join(' ') } };
  },
};
```

**Rules:**
- No imports from `../db`, `../helper`, `../time`
- All strings come from `ctx.locale.commandList` (never hard-coded)
- Returns `{ command, action, params? }` or `{ error: string }`

---

## Handler layer pattern (`src/command/{name}.ts`)

```ts
import type { HandlerResult, MessageContext } from '../types';
import * as db from '../db';

export function createNoteHandler(text: string, ctx: MessageContext): HandlerResult {
  if (!text?.trim())
    return { status: 'error', message: ctx.locale.responses.invalidArgs };
  const id = db.createNote(ctx.from, text.trim());
  return { status: 'ok', message: ctx.locale.responses.noteAdded(text.trim()) };
}

export function listNotesHandler(ctx: MessageContext): HandlerResult {
  const notes = db.getNotes(ctx.from);
  const { locale } = ctx;
  if (notes.length === 0)
    return { status: 'ok', message: locale.responses.noteEmpty };
  // ... format and return
  return { status: 'ok', message: '...' };
}
```

**Rules:**
- Synchronous — no `await`, no `send()`
- Return `HandlerResult { status: 'ok' | 'error', message: string }`
- Never call `send()` — that is `executeCommand`’s responsibility
- All user-facing strings from `ctx.locale.responses`

---

## Executor wiring (`src/command/index.ts`)

```ts
case 'note':
  if (action === 'help') {
    await send(helpNoteHandler(ctx).message);
  } else if (action === 'list') {
    await send(listNotesHandler(ctx).message);
  } else if (action === 'done') {
    const { pos } = (params ?? {}) as { pos: number };
    await send(markNoteDoneHandler(pos, ctx).message);
  } else if (action === 'undone') {
    const { pos } = (params ?? {}) as { pos: number };
    await send(markNoteUndoneHandler(pos, ctx).message);
  } else if (action === 'delete') {
    const { pos } = (params ?? {}) as { pos: number };
    await send(deleteNoteHandler(pos, ctx).message);
  } else if (action === 'create') {
    const { text } = (params ?? {}) as { text: string };
    await send(createNoteHandler(text, ctx).message);
  }
  break;
```

---

## Registration checklist

| Step | What | File |
|------|------|------|
| 1 | Add `commandList.{name}` with trigger words + subcommand aliases | `src/i18n/en.ts`, `es.ts`, `pt.ts` |
| 2 | Create parser `CommandDef` | `src/parser/command/{name}.ts` |
| 3 | Export from command registry | `src/parser/command/index.ts` |
| 4 | Create handler functions | `src/command/{name}.ts` |
| 5 | Wire `case` in executor | `src/command/index.ts` |
  if (commands[cmd]) await commands[cmd](args, ctx, send);
  else await send('Comando desconocido');
}
```

### Pros
- Simple y directo.
- Fácil de leer y modificar.
- Menos boilerplate.

### Contras
- Menos flexible para comandos complejos o con subcomandos.
- Difícil de extender con herencia o composición.

---

## 3. Subcomandos y Argumentos

- En ambos patrones, los subcomandos pueden ser manejados con un segundo nivel de diccionario o con métodos adicionales en la clase.
- El parseo de argumentos puede centralizarse antes de llamar al comando, o delegarse a cada comando.

---

## 4. Inspiración Python/C++
- En Python, frameworks CLI como `argparse` o `click` usan subclases o funciones registradas.
- En C++, se usa el patrón Command clásico (clases con execute) o tablas de punteros a función.

---

## 5. Recomendación
- Para proyectos medianos/grandes: usar el patrón orientado a objetos (Command Pattern).
- Para bots simples o prototipos: usar tabla de funciones.
- Centralizar el parseo de argumentos y la validación.
- Separar la lógica de negocio de la de routing/dispatch.

---

¿Quieres un ejemplo concreto de cómo refactorizar un comando usando alguno de estos patrones?