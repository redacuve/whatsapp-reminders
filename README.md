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

# 📱 Remi — WhatsApp Productivity Bot

Remi is your personal productivity sidekick that lives inside WhatsApp. Stay motivated, manage timers and reminders, and get things done — all by sending a message. No extra apps, no Meta Business API, just chat.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Sample Commands](#sample-commands)
- [Project Structure & Architecture](#project-structure--architecture)
- [Documentation](#documentation)
- [Getting Started](#getting-started)
- [Access Control (Gating)](#access-control-gating)
- [Commands](#commands)
- [Internationalization](#internationalization)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## ✨ Features

- ⏰ Flexible reminders (one-off & recurring, natural language)
- 🍅 Pomodoro focus timers
- 📝 Quick notes
- 📔 Personal journal
- 💬 Conversational fallback (NLP)
- 🌎 Multi-language (English, Spanish, Portuguese)
- 🔒 Access control (per number/group)
- 🗄️ Local SQLite storage

---

## 🚀 Quick Start

**Requirements:**
- Node.js v18+
- [pnpm](https://pnpm.io/)
- WhatsApp account (scan QR on first run)

```sh
git clone https://github.com/redacuve/whatsapp-reminders.git
cd whatsapp-reminders
pnpm install
# Create a .env file (see below)
pnpm dev
# Scan the QR code with WhatsApp
```

**.env example:**
```
MY_NUMBER=YOUR_NUMBER@c.us
MY_NUMBER_LID=YOUR_LID@lid   # optional, for newer WhatsApp accounts
MY_GROUP=YOUR_GROUP@g.us     # optional, restrict to a specific group
```

Send `ping` to Remi on WhatsApp. If you get `pong 🏓`, you’re ready!

---

## 💬 Sample Commands

Send these to Remi on WhatsApp:

| Message | What happens? |
|---|---|
| `remind 14:30 call the doctor` | Sets a reminder for today at 14:30 |
| `remind interval 30 drink water` | Recurring reminder every 30 min |
| `pomodoro 20 write report` | Starts a 20-min focus timer |
| `note buy milk` | Saves a quick note |
| `journal Had a great day!` | Adds a journal entry |
| `lang es` | Switches your language to Spanish |
| `help` | Lists all commands |

See [Commands](#commands) for more.

---

## 📂 Project Structure & Architecture

Remi is organized for clarity and extensibility. See [context/architecture.md](context/architecture.md) and [docs/architecture.md](docs/architecture.md) for full details.

**Pipeline:**

```
WhatsApp message
  → main.ts           resolve language + locale, build MessageContext
  → handleCommand.ts  parse input, dispatch to executor
  → parser/index.ts   tokenize → resolve aliases → NLP fallback → ParseResult
  → command/index.ts  executeCommand: route ParseResult to handler
  → command/*.ts      handler: DB + locale → HandlerResult { status, message }
  → send(message)     reply to WhatsApp
```

**Layers:**
- Transport: WhatsApp client lifecycle, context building
- Coordination: Parsing, routing, error handling
- Handlers: Pure functions, DB access, locale

---

## 📚 Documentation

- [context/](context/) — orientation, product, rules, glossary
- [docs/](docs/) — deep technical reference, API, architecture, decisions

---

## 🛠️ Getting Started

1. Clone the repo
   ```sh
   git clone https://github.com/redacuve/whatsapp-reminders.git
   cd whatsapp-reminders
   ```
2. Install dependencies
   ```sh
   pnpm install
   ```
3. Create a `.env` file at the root (see Quick Start above)
4. Start the bot
   ```sh
   pnpm dev
   ```
5. Scan the QR code with WhatsApp (first time only). On subsequent runs, the session is restored automatically from `.wwebjs_auth/`.

**Build for production:**
```sh
pnpm build
pnpm start
```

---

## 🔐 Access Control (Gating)

Remi uses environment variables to control who can interact with it. See table below for behavior:

| `MY_NUMBER` | `MY_GROUP` | Behavior |
|---|---|---|
| ✅ set | ✅ set | Only responds to `MY_NUMBER` inside `MY_GROUP` |
| ✅ set | ❌ not set | Only responds to `MY_NUMBER` in any chat |
| ❌ not set | ✅ set | Responds to anyone inside `MY_GROUP` |
| ❌ not set | ❌ not set | Responds to anyone, anywhere (open mode) |

`MY_NUMBER_LID` is an alternative ID for the same number used by newer WhatsApp multi-device accounts. If set, it is treated as equivalent to `MY_NUMBER`.

All messages are still logged regardless of gating — only command processing is restricted.

---

## 🗣️ Commands

Commands are case-insensitive. See [context/product.md](context/product.md) for full details.

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

---

## 🌍 Internationalization

Remi supports English (`en`), Spanish (`es`), and Portuguese (`pt`). Each user’s language is stored per WhatsApp number. Change your language anytime with `lang <code>`.

The default language for new users is resolved from the `LANG` environment variable (e.g. `es_MX.UTF-8` → `es`), with fallback to `en`.

To add a new language, create a new file in `src/i18n/` following the structure of `en.ts`, then register it in `src/i18n/index.ts`. Update the validation in `commands.ts` to include the new code. See [context/i18n.md](context/i18n.md) for more.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [context/rules.md](context/rules.md) for coding standards.

---

## 📝 License

Distributed under the ISC License. See [LICENSE](LICENSE) for more information.

---

## 📬 Contact

Rey David Cuevas Vela - [@redacuve](https://twitter.com/redacuve) - [redacuve@gmail.com](mailto:redacuve@gmail.com) - [linkedin.com/in/redacuve/](https://www.linkedin.com/in/redacuve/)

Project Link: [github.com/redacuve/whatsapp-reminders](https://github.com/redacuve/whatsapp-reminders)