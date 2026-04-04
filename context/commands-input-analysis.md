# Command Input Analysis — Expected Variables

This table maps input patterns to the variables extracted by each parser. The locale-appropriate trigger word is used in examples.

---

## Pomodoro

| Input | `minutes` | `name` |
|-------|-----------|--------|
| `pomodoro` | 25 (default) | “Focus session” (locale default) |
| `pomodoro 25` | 25 | “Focus session” |
| `pomodoro 25 Deep work` | 25 | “Deep work” |
| `pomodoro Deep work 25` | 25 | “Deep work” (order-flexible) |
| `pomo 15 read` | 15 | “read” |
| `pomodoro help` | — | action: help |
| `pomodoro status` | — | action: status |
| `pomodoro cancel` | — | action: cancel |

---

## Reminder

| Input | `action` | `pos` | `input` / `content` | `value` | `text` |
|-------|----------|-------|---------------------|---------|--------|
| `remind 14:30 call doctor` | create | — | `"14:30 call doctor"` | — | — |
| `remind +30 check email` | create | — | `"+30 check email"` | — | — |
| `remind tomorrow 9:00 meeting` | create | — | `"tomorrow 9:00 meeting"` | — | — |
| `remind tomorrow morning buy bread` | create | — | `"tomorrow morning buy bread"` | — | — |
| `remind interval 30 drink water` | interval | — | — | `"30"` | `"drink water"` |
| `remind weekly monday 08:00 gym` | weekly | — | — | `"0 08:00"` | `"gym"` |
| `remind monthly 15 09:00 pay rent` | monthly | — | — | `"15 09:00"` | `"pay rent"` |
| `remind weekdays 09:00 standup` | weekdays | — | — | `"09:00"` | `"standup"` |
| `remind weekends 10:00 read` | weekends | — | — | `"10:00"` | `"read"` |
| `remind list` | list | — | — | — | — |
| `remind delete 2` | delete | 2 | — | — | — |
| `remind edit 1 15:00` | edit | 1 | `"15:00"` | — | — |
| `remind edit 1 new text` | edit | 1 | `"new text"` | — | — |
| `remind edit 1 15:00 new text` | edit | 1 | `"15:00 new text"` | — | — |
| `remind help` | help | — | — | — | — |

---

## Note

| Input | `action` | `pos` | `text` |
|-------|----------|-------|--------|
| `note Buy milk` | create | — | `"Buy milk"` |
| `note list` | list | — | — |
| `note done 1` | done | 1 | — |
| `note undone 2` | undone | 2 | — |
| `note delete 1` | delete | 1 | — |
| `note help` | help | — | — |

---

## Journal

| Input | `action` | `pos` / `dateStr` | `text` |
|-------|----------|-------------------|--------|
| `journal Today was great` | create | — | `"Today was great"` |
| `journal list` | list | — | — |
| `journal random` | random | — | — |
| `journal date 2026-03-15` | date | `"2026-03-15"` | — |
| `journal stats` | stats | — | — |
| `journal delete 2` | delete | 2 | — |
| `journal help` | help | — | — |

---

## NLP fallback (no command word)

| Input example | `command` | `action` |
|---------------|-----------|----------|
| `thanks!` / `gracias` | nlp | thanks |
| `how are you` / `cómo estás` | nlp | howAreYou |
| `🔥` (exact emoji) | nlp | emojiReaction |
| `who are you` / `quién eres` | nlp | whoAreYou |
| `what can you do` | nlp | whatCanYouDo |
| `haha` / `jaja` / `kkk` | nlp | laugh |
| `awesome` / `genial` / `demais` | nlp | compliment |
| `sorry` / `desculpa` | nlp | sorry |

---

## Otros comandos simples

| Entrada      | Acción   |
|--------------|----------|
| help         | ayuda    |
| status       | estado   |
| ping         | ping     |
| lang es      | idioma   |
| msg          | motivar  |

---

Este análisis permite ver claramente qué variables se esperan de cada entrada, facilitando el diseño de un parser robusto y uniforme para todos los comandos.