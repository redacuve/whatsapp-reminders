# Product — Remi

## What is Remi?

Remi is a personal productivity bot for WhatsApp. It runs as a Node.js process on a server and communicates entirely through WhatsApp messages using the `whatsapp-web.js` library (which automates the WhatsApp Web interface via Puppeteer).

Users send plain-text messages to Remi's WhatsApp number. Remi parses the message, executes the matching command, and replies.

## Target user

A single person (or a small group) who wants to manage reminders, focus timers, notes, and a journal — all inside the WhatsApp chat they already use every day, without installing any extra app.

## Core value propositions

1. **Zero-friction inputs** — anything you would type normally works: `remind 14:30 call the doctor`, not a rigid form
2. **Multilingual** — full support for English, Spanish, and Portuguese (locale is persisted per number)
3. **Productivity suite in one chat** — reminders, pomodoro timers, notes, journal, and motivational messages
4. **Conversational NLP fallback** — Remi responds naturally to greetings, thanks, compliments, jokes, and other casual messages instead of returning an error

## Commands (user-facing)

| Command | Primary triggers (EN) | What it does |
|---|---|---|
| `help` | `help`, `?` | Lists all commands |
| `status` | `status` | Shows user info + bot info |
| `ping` | `ping` | Health check |
| `message` | `message`, `msg`, `motivate` | Random motivational message |
| `hello` | `hello`, `hi`, `hey` | Time-aware greeting |
| `bye` | `bye`, `goodbye`, `see you` | Farewell |
| `remi` | `remi`, `who are you` | Self-introduction + command list |
| `language` | `language`, `lang` | Change language (`lang set en`) |
| `pomodoro` | `pomodoro`, `pomo`, `timer` | Focus timer (start / status / cancel / help) |
| `reminder` | `remind`, `reminder` | Reminders (one-off + recurring: create / list / edit / delete / help) |
| `note` | `note` | To-do notes (create / list / done / undone / delete / help) |
| `journal` | `journal` | Personal journal (create / list / random / date / stats / delete / help) |
| _(NLP)_ | any casual phrase | Conversational fallback — no trigger word |

## Constraints

- **Single user per WhatsApp number** — all data is keyed on `chatId` (the sender's full serialized number e.g. `5215512345678@c.us`)
- **No web UI** — Remi has no dashboard, API, or admin panel; everything is chat-based
- **SQLite only** — data is stored locally in `reminders.db` in the project root
- **WhatsApp Web dependency** — Remi requires a physical device (or an always-on session) to stay authenticated; if the session expires the bot goes offline until re-scanned
