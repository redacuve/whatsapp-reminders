# Pomodoro – Architecture & Context

## Description
The `pomodoro` command lets users start, track, and cancel timed work sessions (Pomodoro technique). It is the primary stateful command — it reads and writes the `pomodoros` SQLite table.

---

## Full data flow

```
WhatsApp message
  → main.ts              build MessageContext (locale pre-resolved)
  → handleCommand.ts     parseInput(text, ctx.locale) → ParseResult
  → parser/index.ts      alias resolve → parser/command/pomodoro.ts
                         → ParseResult { command: "pomodoro", action, params }
  → command/index.ts     executeCommand: routes action → handler
  → command/pomodoro.ts  handler: DB + locale → HandlerResult { status, message }
  → send(message)        reply to WhatsApp
```

---

## Aliases (i18n)

Defined in `src/i18n/{lang}.ts` under `commandList.pomodoro`:

| Lang | Main command | Subcommands |
|------|-------------|-------------|
| en | `pomodoro`, `pomo`, `timer` | `start/begin/go`, `status/check/current`, `cancel/stop/end`, `help/info/instructions` |
| es | `pomodoro`, `pomo`, `temporizador` | `iniciar/empezar/comenzar`, `estado/ver/actual`, `cancelar/parar/detener`, `ayuda` |
| pt | `pomodoro`, `pomo`, `temporizador` | `iniciar/começar`, `status/ver/atual`, `cancelar/parar/encerrar`, `ajuda` |

---

## Parser layer (`src/parser/command/pomodoro.ts`)

Calling the main command without a subcommand is equivalent to `start`.

### Subcommand → ParseResult mapping

| Subcommand | Tokens consumed      | `action`   | `params`                          |
|------------|----------------------|------------|-----------------------------------|
| `start`    | `[minutes] [name]`   | `"start"`  | `{ minutes: number, name: string }` |
| `status`   | —                    | `"status"` | —                                 |
| `cancel`   | —                    | `"cancel"` | —                                 |
| `help`     | —                    | `"help"`   | —                                 |

### `pomodoroStartParser` logic

1. Iterates tokens left to right.
2. First **all-digit** token (`/^\d+$/`) → `minutes`.
3. All other tokens → `name` (joined with space).
4. Defaults: `minutes = 25`, `name = ctx.locale.responses.pomodoroDefaultTask`.

```
"pomodoro"           → { minutes: 25, name: "Focus session" }
"pomodoro 30"        → { minutes: 30, name: "Focus session" }
"pomodoro Deep work" → { minutes: 25, name: "Deep work" }
"pomodoro 45 Study"  → { minutes: 45, name: "Study" }
"pomodoro Study 45"  → { minutes: 45, name: "Study" }  ← order-flexible
```

---

## Handler layer (`src/command/pomodoro.ts`)

All four handlers are **synchronous** and return `HandlerResult { status, message }`. They never call `send()` directly — that is `executeCommand`'s responsibility.

### `startPomodoroHandler(name, minutes, ctx)`

| State | Outcome |
|-------|---------|
| Active pomodoro + no args | Returns current status (`pomodoroStatus`) |
| Active pomodoro + args | Updates task/mins, returns `pomodoroUpdated` + random `pomodoroStart` phrase |
| No active pomodoro | Starts new session, returns `pomodoroStarted` + random `pomodoroStart` phrase |

### `pomodoroStatusHandler(ctx)`
- No active session → `{ status: 'error', message: pomodoroNoActive }`
- Active → calculates `minsLeft` from `due_at`, returns `pomodoroStatus(task, minsLeft)`

### `cancelPomodoroHandler(ctx)`
- No active session → `{ status: 'error', message: pomodoroNoActive }`
- Cancelled → `{ status: 'ok', message: pomodoroCancelled }`

### `pomodoroHelpHandler(ctx)`
- Returns formatted subcommand list from `ctx.locale.commands.pomodoro.subcommands` (string array)

---

## DB operations (`src/db.ts`)

| Function | When called |
|----------|-------------|
| `getActivePomodoro(chatId)` | All handlers — check for existing session |
| `startPomodoro(chatId, task, mins)` | New session |
| `updatePomodoro(chatId, task, mins)` | Update existing session |
| `cancelPomodoro(chatId)` | Cancel, returns `boolean` |
| `completePomodoro(id)` | Called by scheduler when timer expires |

Table schema:
```sql
CREATE TABLE IF NOT EXISTS pomodoros (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  number           TEXT NOT NULL,
  task             TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  started_at       TEXT DEFAULT (datetime('now')),
  due_at           TEXT,
  completed        INTEGER DEFAULT 0  -- 0 = active, 1 = done/cancelled
);
```

---

## i18n responses used

| Key | Type | Usage |
|-----|------|-------|
| `pomodoroStarted` | `(task, mins) => string` | New session started |
| `pomodoroDefaultTask` | `string` | Default task name |
| `pomodoroStart` | `string[]` | Random motivational phrase appended to start/update messages |
| `pomodoroEnd` | `string[]` | Random phrase sent by scheduler on completion |
| `pomodoroNoActive` | `string` | No session for status/cancel |
| `pomodoroStatus` | `(task, minsLeft) => string` | Current session info |
| `pomodoroCancelled` | `string` | Cancel confirmation |
| `pomodoroUpdated` | `(task, mins) => string` | Update confirmation |
| `pomodoroDone` | `(task) => string` | Scheduler fires this on expiry |

---

## Key files

| File | Responsibility |
|------|----------------|
| `src/parser/command/pomodoro.ts` | Token parsing → `ParseResult` |
| `src/parser/command/definitiions.ts` | Types: `CommandDef`, `ParseResult`, `ParserContext` |
| `src/parser/index.ts` | Routing: tokens → `CommandDef.parse` |
| `src/command/pomodoro.ts` | Handlers: DB + locale → `HandlerResult` |
| `src/command/index.ts` | `executeCommand`: routes action → handler → `send` |
| `src/db.ts` | `pomodoros` table access |
| `src/i18n/{lang}.ts` | Command aliases + response strings |
| `src/scheduler.ts` | Fires completion message when `due_at` expires |

---

## Notes

- The **parser layer** (`src/parser/`) never touches the DB or sends messages. It only maps tokens to `ParseResult`.
- The **handler layer** (`src/command/`) never calls `send()`. It returns `HandlerResult { status, message }`.
- `send()` is only called in `executeCommand` (`src/command/index.ts`).
- `locale` is resolved once in `main.ts` via `getLocale()` and passed through `MessageContext` — no `getLocale()` calls in handlers or parser.
- To add a new subcommand: (1) add it to `CommandDef.subcommands` in `src/parser/command/pomodoro.ts`, (2) add aliases in each `src/i18n/{lang}.ts` under `commandList.pomodoro.subcommands`, (3) add a handler function in `src/command/pomodoro.ts`, (4) add a case in the `pomodoro` branch of `executeCommand`.

## Alias soportados (i18n)

Los alias viven en `src/i18n/{lang}.ts` bajo `commandList.pomodoro`:

| Idioma | Comando principal          | Subcomandos                                     |
|--------|----------------------------|-------------------------------------------------|
| en     | `pomodoro`, `pomo`, `timer` | `start/begin/go`, `status/check/current`, `cancel/stop/end`, `help/info/instructions` |
| es     | `pomodoro`, `pomo`          | `iniciar`, `estado`, `cancelar`, `ayuda`         |
| pt     | `pomodoro`, `pomo`          | (ver pt.ts)                                     |

El parser (`parser.ts`) resuelve el alias al key canónico antes de delegar a `CommandDef`.

---

## Comportamiento del parser (`src/commands/pomodoro.ts`)

### Cuando el usuario escribe solo el comando principal
`pomodoro [minutos?] [nombre?]` → delega a `pomodoroStartParser` (equivale a `start`)

### Subcomandos

| Subcomando | Tokens consumidos  | `action` retornado | `params` retornados               |
|------------|--------------------|--------------------|-----------------------------------|
| `start`    | `[minutos] [nombre]` | `"start"`          | `{ minutes: number, name: string }` |
| `status`   | —                  | `"status"`         | —                                 |
| `cancel`   | —                  | `"cancel"`         | —                                 |
| `help`     | —                  | `"help"`           | —                                 |

### Lógica de `pomodoroStartParser`

1. Itera los tokens de izquierda a derecha.
2. El primer token que sea **únicamente dígitos** (`/^\d+$/`) se toma como `minutes`.
3. El resto de tokens forman el `name` (joined con espacio).
4. Defaults: `minutes = 25`, `name = ctx.locale.responses.pomodoroDefaultTask`.

Ejemplos:
```
"pomodoro"              → { minutes: 25, name: "Focus session" }
"pomodoro 30"           → { minutes: 30, name: "Focus session" }
"pomodoro Deep work"    → { minutes: 25, name: "Deep work" }
"pomodoro 45 Study"     → { minutes: 45, name: "Study" }
"pomodoro Study 45"     → { minutes: 45, name: "Study" }  ← orden flexible
```

---

## Estructura del `CommandDef` (contrato de tipos)

```ts
// src/commands/definitiions.ts
interface CommandDef {
  key: string;
  subcommands?: Record<string, CommandDef>;
  parse: CommandParser;   // (tokens: string[], ctx: ParserContext) => ParseResult
}

interface ParseResult {
  command: string;
  action: string;
  params?: Record<string, unknown>;  // para pomodoro: { minutes, name }
  error?: string;
}
```

---

## Estado persistente (SQLite vía `db.ts`)

Tabla `pomodoros`:
```sql
CREATE TABLE IF NOT EXISTS pomodoros (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  number           TEXT NOT NULL,       -- número de WhatsApp del usuario
  task             TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  started_at       TEXT NOT NULL,
  ends_at          TEXT NOT NULL,
  status           TEXT DEFAULT 'active' -- 'active' | 'done' | 'cancelled'
);
```

### Operaciones esperadas en `handleCommand`
- `start`: verificar que no hay sesión activa → insertar fila con `status='active'`.
- `status`: buscar fila activa del número → calcular minutos restantes → responder.
- `cancel`: marcar `status='cancelled'` la sesión activa.
- Scheduler: al expirar `ends_at`, marcar `status='done'` y enviar mensaje de finalización.

---

## Respuestas i18n relevantes (`locale.responses`)

| Key                     | Tipo                                  | Uso                              |
|-------------------------|---------------------------------------|----------------------------------|
| `pomodoroStarted`       | `(task, mins) => string`              | Al iniciar con éxito             |
| `pomodoroDefaultTask`   | `string`                              | Nombre por defecto del task      |
| `pomodoroStart`         | `string[]`                            | Mensajes motivacionales al inicio (aleatorio) |
| `pomodoroEnd`           | `string[]`                            | Mensajes al finalizar (aleatorio) |
| `pomodoroAlreadyActive` | `string`                              | Si ya hay sesión activa          |
| `pomodoroNoActive`      | `string`                              | Si no hay sesión para status/cancel |
| `pomodoroStatus`        | `(task, minsLeft) => string`          | Respuesta al `status`            |
| `pomodoroCancelled`     | `string`                              | Confirmación de cancelación      |
| `pomodoroUpdated`       | `(task, mins) => string`              | Si se inicia con uno ya activo (actualiza) |
| `pomodoroDone`          | `(task) => string`                    | Mensaje cuando el timer expira   |

---

## Comportamiento especial: pomodoro ya activo

Si el usuario dispara `pomodoro start` con una sesión activa, la lógica de negocio puede:
- **Rechazar**: responder `pomodoroAlreadyActive` y no crear nada.
- **Actualizar**: reemplazar la sesión activa y responder `pomodoroUpdated`.

La decisión se toma en `handleCommand` (capa de negocio), no en el parser.

---

## Archivos clave

| Archivo                           | Responsabilidad                              |
|-----------------------------------|----------------------------------------------|
| `src/commands/pomodoro.ts`        | `CommandDef`: parseo de tokens               |
| `src/commands/definitiions.ts`    | Tipos: `CommandDef`, `ParseResult`, `ParserContext` |
| `src/parser/parser.ts`            | Routing: tokens → `CommandDef.parse`         |
| `src/commands.ts`                 | Lógica de negocio + respuesta al usuario     |
| `src/db.ts`                       | Acceso a tabla `pomodoros`                   |
| `src/i18n/{lang}.ts`              | Alias de comandos + strings de respuesta     |
| `src/scheduler.ts`                | Envío del mensaje de fin de sesión           |

---

## Notas para la IA

- El parser **NO** toca la base de datos ni valida estado. Solo parsea tokens y retorna `ParseResult`.
- La validación de estado activo/inactivo ocurre en `handleCommand` (`src/commands.ts`).
- Al agregar un nuevo subcomando: (1) añadirlo en `CommandDef.subcommands` en `pomodoro.ts`, (2) añadir los aliases en cada `src/i18n/{lang}.ts` bajo `commandList.pomodoro.subcommands`, (3) implementar el handler en `handleCommand`.
- El token de minutos puede venir en cualquier posición entre los argumentos (el parser lo detecta por ser todo dígitos).
