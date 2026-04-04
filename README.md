<!-- Badges -->
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.2.2-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
  <a href="https://bsky.app/profile/redacuve.bsky.social" target="_blank">
    <img alt="Bluesky: redacuve" src="https://img.shields.io/badge/Bluesky-redacuve-0285FF?logo=bluesky&logoColor=white" />
  </a>
  <a href="https://twitter.com/redacuve" target="_blank">
    <img alt="Twitter: redacuve" src="https://img.shields.io/twitter/follow/redacuve.svg?style=social" />
  </a>
</p>

<!-- Project Header -->
<p align="center">
  <h1 align="center">📱 Remi — WhatsApp Productivity Bot</h1>
  <p align="center">
    Meet <strong>Remi</strong>, your personal productivity sidekick that lives inside WhatsApp. Stay motivated, manage timers and reminders, and get things done — all by sending a message.
  <br>
  <br>
    <a href="https://github.com/redacuve/whatsapp-reminders"><strong>Explore the repo »</strong></a>
  <br>
    <a href="https://github.com/redacuve/whatsapp-reminders/issues">Request Feature</a>
  </p>
</p>

## Table of Contents

* [About the Project](#about-the-project)
* [Built With](#built-with)
* [Architecture](#architecture)
* [Documentation](#documentation)
* [Getting Started](#getting-started)
* [Access Control (Gating)](#access-control-gating)
* [Commands](#commands)
* [Internationalization](#internationalization)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

## About The Project

**Remi** is a WhatsApp bot built for personal productivity. It runs locally on your machine using `whatsapp-web.js` (no Meta Business API needed) and supports multiple languages out of the box.

Remi greets you by name, adapts to the time of day, reacts to emojis, and responds to casual conversation — all while handling motivational messages, pomodoro timers, and both one-off and recurring reminders with flexible time expressions. Every user has their own language preference stored locally.

## Built With

* [TypeScript](https://www.typescriptlang.org/)
* [Node.js](https://nodejs.org/)
* [whatsapp-web.js](https://wwebjs.dev/) — WhatsApp Web client (no Business API required)
* [pino](https://getpino.io/) + [pino-pretty](https://github.com/pinojs/pino-pretty) — Structured, colorized logging
* [tsx](https://github.com/privatenumber/tsx) — TypeScript execution for development
* [prettier](https://prettier.io/) + [eslint](https://eslint.org/) — Code formatting and linting

## Architecture

```
src/
├── main.ts              # Entry point — WhatsApp client, message routing, gating
├── config.ts            # Environment variables (phone numbers, paths, language)
├── handleCommand.ts     # Orchestrator: parse → error-check → execute
├── scheduler.ts         # Cron jobs — checks due reminders and pomodoros every minute
├── db.ts                # SQLite layer (settings, reminders, pomodoros, notes, journal)
├── time.ts              # Time expression parser and formatter
├── helper.ts            # Pure utilities: pickRandom, getTimeOfDay
├── logger.ts            # Pino logger instance
├── types.ts             # Shared TypeScript interfaces
├── i18n/
│   ├── index.ts         # getLocale(), buildCommandsList(), buildFeaturesList()
│   ├── builders.ts      # buildCommandList(), buildDisplayCommands() from CommandEntry
│   ├── en.ts            # 🇺🇸 English locale
│   ├── es.ts            # 🇲🇽 Spanish locale
│   └── pt.ts            # 🇧🇷 Portuguese locale
├── parser/
│   ├── index.ts         # Main parse function: alias matching + NLP fallback
│   └── command/
│       ├── index.ts     # Parser registry for all commands
│       ├── simple.ts    # help, status, ping, message, hello, bye, remi
│       ├── pomodoro.ts  # start / status / cancel / help
│       ├── language.ts  # set / help
│       ├── reminder.ts  # list / help / delete / edit / create / recurring
│       ├── note.ts      # list / help / done / undone / delete / create
│       └── journal.ts   # list / help / random / date / stats / delete / create
└── command/
    ├── index.ts         # executeCommand() — routes ParseResult to handlers
    ├── simple.ts        # help, status, ping, message, hello, bye, remi handlers
    ├── nlp.ts           # nlpHandler — 8 conversational patterns
    ├── pomodoro.ts      # Pomodoro handlers
    ├── language.ts      # Language handlers
    ├── reminder.ts      # Reminder handlers
    ├── note.ts          # Note handlers
    └── journal.ts       # Journal handlers
```

The pipeline for every incoming message is:

```
main.ts → handleCommand.ts → parser/index.ts → command/index.ts → command/<name>.ts
```

## Documentation

Full developer documentation lives in two folders:

### `/context/` — for AI agents and quick orientation

| File | Description |
|---|---|
| [context/product.md](context/product.md) | What Remi is, who it's for, constraints |
| [context/rules.md](context/rules.md) | Coding rules and invariants every contributor must follow |
| [context/glossary.md](context/glossary.md) | Canonical definitions for every term, concept, and interface |

### `/docs/` — deep technical reference

| File | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Full file map, message pipeline, per-command parser and handler reference, locale system, DB schema |
| [docs/api.md](docs/api.md) | Every public function, module, and interface with signatures |
| [docs/decisions.md](docs/decisions.md) | Architectural Decision Records (ADRs) explaining the key design choices |

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) v18+
* [pnpm](https://pnpm.io/)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/redacuve/whatsapp-reminders.git
   cd whatsapp-reminders
   ```

2. Install dependencies
   ```sh
   pnpm install
   ```

3. Create a `.env` file at the root:
   ```env
   MY_NUMBER=YOUR_NUMBER@c.us
   MY_NUMBER_LID=YOUR_LID@lid   # optional, for newer WhatsApp accounts
   MY_GROUP=YOUR_GROUP@g.us     # optional, restrict to a specific group
   ```
   > **Tip:** Run the bot once without these set and send `status` — the bot will print its own `wid` in the startup logs so you can copy the exact value.

4. Start the bot
   ```sh
   pnpm dev
   ```

5. Scan the QR code with WhatsApp (first time only). On subsequent runs, the session is restored automatically from `.wwebjs_auth/`.

### Build for production

```sh
pnpm build
pnpm start
```

## Access Control (Gating)

The bot uses environment variables to control who can interact with it. The logic is evaluated per incoming message:

| `MY_NUMBER` | `MY_GROUP` | Behavior |
|---|---|---|
| ✅ set | ✅ set | Only responds to `MY_NUMBER` inside `MY_GROUP` |
| ✅ set | ❌ not set | Only responds to `MY_NUMBER` in any chat |
| ❌ not set | ✅ set | Responds to anyone inside `MY_GROUP` |
| ❌ not set | ❌ not set | Responds to anyone, anywhere (open mode) |

`MY_NUMBER_LID` is an alternative ID for the same number used by newer WhatsApp multi-device accounts. If set, it is treated as equivalent to `MY_NUMBER`.

All messages are still logged regardless of gating — only command processing is restricted.

## Commands

Commands are case-insensitive:

| Command | Aliases | Description |
|---|---|---|
| `help` | `h`, `?`, `commands` | Show all available commands |
| `msg` | `motivate` | Send a random motivational message |
| `status` | — | Show sender info + bot info |
| `ping` | — | Responds with pong 🏓 |
| `lang <code>` | — | Change your language (`en`, `es`, `pt`) |
| `remind` | `recordar`, `lembrar` | Set and manage one-off and recurring reminders |
| `pomodoro` | `pomo` | Start, check, or cancel a pomodoro timer |
| `note` | `nota` | Save and manage quick notes |
| `journal` | `diario`, `diário` | Write and browse personal journal entries |

### Reminders

The reminder command accepts flexible time expressions and recurring schedules:

| Input | When |
|---|---|
| `remind 14:30 call the doctor` | Today at 14:30 (tomorrow if already past) |
| `remind 30 check email` | In 30 minutes |
| `remind +30 check email` | In 30 minutes (`+` is optional) |
| `remind tomorrow 9:00 meeting` | Tomorrow at 09:00 |
| `remind tomorrow morning buy bread` | Tomorrow at 09:00 |
| `remind tomorrow afternoon pay bill` | Tomorrow at 14:00 |
| `remind interval 30 drink water` | Every 30 minutes |
| `remind weekly monday 08:00 go to gym` | Every Monday at 08:00 |
| `remind monthly 1 09:00 pay rent` | Every 1st day of the month at 09:00 |
| `remind weekdays 09:00 standup` | Monday to Friday at 09:00 |
| `remind weekends 10:00 read` | Saturday and Sunday at 10:00 |

#### Subcommands

| Input | Description |
|---|---|
| `remind list` | Show pending reminders numbered 1, 2, 3… |
| `remind delete <n>` | Delete reminder #n from the list |
| `remind edit <n> 15:00` | Update only the time of reminder #n |
| `remind edit <n> new text` | Update only the text of reminder #n |
| `remind edit <n> 15:00 new text` | Update both time and text |
| `remind interval <mins> <text>` | Create a recurring reminder every N minutes |
| `remind weekly <day> <time> <text>` | Create a recurring reminder for a weekday + time |
| `remind monthly <day> <time> <text>` | Create a recurring reminder for a day of month + time |
| `remind weekdays <time> <text>` | Create a recurring reminder for Monday to Friday |
| `remind weekends <time> <text>` | Create a recurring reminder for Saturday and Sunday |
| `remind help` | Show the subcommand list |

> In Spanish: `recordar lista` / `recordar borrar <n>` / `recordar editar <n>`  
> Also recurring in Spanish: `recordar intervalo`, `recordar semanal`, `recordar mensual`, `recordar laborables`, `recordar fines-de-semana`  
> In Portuguese: `lembrar lista` / `lembrar apagar <n>` / `lembrar editar <n>`  
> Also recurring in Portuguese: `lembrar intervalo`, `lembrar semanal`, `lembrar mensal`, `lembrar dias-uteis`, `lembrar fim-de-semana`

#### Vague time expressions

Each language defines its own time keywords:

| Language | Morning (09:00) | Afternoon (14:00) | Evening (18:00) | Night (21:00) |
|---|---|---|---|---|
| EN | `morning`, `in the morning` | `afternoon`, `in the afternoon` | `evening`, `in the evening` | `night`, `at night`, `tonight` |
| ES | `en la mañana`, `por la mañana` | `en la tarde`, `por la tarde`, `tarde` | — | `en la noche`, `por la noche`, `noche` |
| PT | `de manhã`, `pela manhã` | `à tarde`, `de tarde`, `tarde` | — | `à noite`, `de noite`, `noite` |

When a reminder fires, the bot sends the reminder message back to the same chat in the user's language. Recurring reminders are automatically moved to their next occurrence.

### Pomodoro

All forms work with `pomodoro` or `pomo` (or the locale equivalent):

| Input | Minutes | Task |
|---|---|---|
| `pomodoro` | 25 | Default task name |
| `pomodoro 20` | 20 | Default task name |
| `pomodoro my task` | 25 | "my task" |
| `pomodoro 10 my task` | 10 | "my task" |

#### Subcommands

| Input | Description |
|---|---|
| `pomodoro help` | Show the subcommand list |
| `pomodoro status` | Show the active pomodoro and minutes remaining |
| `pomodoro cancel` | Cancel the active pomodoro |

> In Spanish: `pomodoro ayuda` / `pomodoro estado` / `pomodoro cancelar`  
> In Portuguese: `pomodoro ajuda` / `pomodoro status` / `pomodoro cancelar`

#### Behavior when a pomodoro is already running

| Input | Result |
|---|---|
| `pomodoro` | Shows current status (same as `pomodoro status`) |
| `pomodoro 20` | Updates the timer to 20 min, keeps the current task |
| `pomodoro new task` | Updates the task name, keeps the current duration |
| `pomodoro 20 new task` | Updates both timer and task |

When the timer expires, the bot sends a completion message directly to the chat that started it.

### Notes

Quick notes are plain text, stored and numbered. No timestamps needed — just capture the thought.

| Input | Description |
|---|---|
| `note buy milk` | Save a new note |
| `note list` | Show all notes numbered 1, 2, 3… |
| `note delete <n>` | Delete note #n |
| `note help` | Show the subcommand list |

> In Spanish: `nota lista` / `nota borrar <n>`  
> In Portuguese: `nota lista` / `nota apagar <n>`

### Journal

Personal journal entries are auto-timestamped. The list shows the 5 most recent entries with a date and preview. Long texts are stored in full.

| Input | Description |
|---|---|
| `journal Today was a great day` | Write a new entry |
| `journal list` | Show last 5 entries (date + 60-char preview) |
| `journal delete <n>` | Delete entry #n from the list |
| `journal help` | Show the subcommand list |

> In Spanish: `diario lista` / `diario borrar <n>`  
> In Portuguese: `diário lista` / `diário apagar <n>`

### `status` response includes

**Your info:** name, display name, number, WhatsApp ID, business account flag, chat context, message timestamp.

**Bot info:** bot number, bot display name, platform (`android` / `iphone` / `smba`).

## Internationalization

The bot supports multiple languages. Each user has their own language preference stored in SQLite — changing the language only affects that user, not others.

The default language for new users is resolved from the `LANG` environment variable (e.g. `es_MX.UTF-8` → `es`), with fallback to `en`.

### Changing language

Any user can change their own language at any time:

```
lang en
lang es
lang pt
```

The `help`, `pomodoro`, and completion messages will instantly switch to the selected language for that user.

### Supported languages

| Code | Language | Pomodoro keywords | Reminder keywords | Note keywords | Journal keywords |
|---|---|---|---|---|---|
| `en` | 🇺🇸 English | `help`, `status`, `cancel` | `list`, `delete`, `edit`, `help` | `list`, `delete`, `help` | `list`, `delete`, `help` |
| `es` | 🇲🇽 Español | `ayuda`, `estado`, `cancelar` | `lista`, `borrar`, `editar`, `ayuda` | `lista`, `borrar`, `ayuda` | `lista`, `borrar`, `ayuda` |
| `pt` | 🇧🇷 Português | `ajuda`, `status`, `cancelar` | `lista`, `apagar`, `editar`, `ajuda` | `lista`, `apagar`, `ajuda` | `lista`, `apagar`, `ajuda` |

### Adding a new language

Create a new file in `src/i18n/` following the structure of `en.ts`, then register it in `src/i18n/index.ts`. Update the validation in `commands.ts` to include the new code.

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the ISC License. See `LICENSE` for more information.

## Contact

Rey David Cuevas Vela - [@redacuve](https://twitter.com/redacuve) - [redacuve@gmail.com](mailto:redacuve@gmail.com) - [linkedin.com/in/redacuve/](https://www.linkedin.com/in/redacuve/)

Project Link: [github.com/redacuve/whatsapp-reminders](https://github.com/redacuve/whatsapp-reminders)