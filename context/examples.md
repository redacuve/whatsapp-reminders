# Command Examples

## Reminders

### One-off reminders

| Input | Response |
|-------|----------|
| `remind 14:30 call the doctor` | Reminder set: *call the doctor* — today at 14:30 |
| `remind +30 check email` | Reminder set: *check email* — in 30 minutes |
| `remind tomorrow 9:00 meeting` | Reminder set: *meeting* — tomorrow at 09:00 |
| `remind tomorrow morning buy bread` | Reminder set: *buy bread* — tomorrow at 09:00 |

### Recurring reminders

| Input | Response |
|-------|----------|
| `remind interval 30 drink water` | 🔄 Recurring reminder set: *drink water* — every 30 min |
| `remind weekly monday 08:00 go to gym` | 🔄 Recurring reminder set: *go to gym* — every Monday at 08:00 |
| `remind monthly 1 09:00 pay rent` | 🔄 Recurring reminder set: *pay rent* — every day 1 at 09:00 |
| `remind weekdays 09:00 standup` | 🔄 Recurring reminder set: *standup* — weekdays at 09:00 |
| `remind weekends 10:00 read book` | 🔄 Recurring reminder set: *read book* — weekends at 10:00 |

### Management

| Input | Response |
|-------|----------|
| `remind list` | Lists all pending reminders |
| `remind delete 1` | Deletes reminder #1 |
| `remind edit 1 15:00` | Updates time of reminder #1 to 15:00 |
| `remind help` | Shows reminder command help |

**Spanish:** `recordar 14:30 llamar al doctor`, `recordar intervalo 30 tomar agua`, `recordar semanal lunes 08:00 ir al gym`, `recordar lista`, `recordar borrar 1`
**Portuguese:** `lembrar 14:30 ligar para o médico`, `lembrar intervalo 30 beber água`, `lembrar semanal segunda 08:00 ir à academia`, `lembrar lista`, `lembrar apagar 1`

---

## Notes

| Input | Response |
|-------|----------|
| `note Buy milk` | Note added: *Buy milk* |
| `note list` | Shows all notes (pending first, then done) |
| `note done 1` | Marks note #1 as done |
| `note undone 1` | Marks note #1 as pending |
| `note delete 2` | Deletes note #2 |
| `note help` | Shows note command help |

**Spanish:** `nota Comprar leche`, `nota lista`, `nota hecha 1`, `nota pendiente 1`, `nota borrar 2`
**Portuguese:** `nota Comprar leite`, `nota lista`, `nota feita 1`, `nota pendente 1`, `nota apagar 2`

---

## Pomodoro

| Input | Response |
|-------|----------|
| `pomodoro 25 Write report` | Pomodoro started: *Write report* — 25 min |
| `pomodoro` | Pomodoro started: *Focus session* — 25 min |
| `pomodoro status` | Shows active timer remaining time |
| `pomodoro cancel` | Cancels active timer |
| `pomodoro help` | Shows pomodoro command help |

**Spanish:** `pomodoro 25 Escribir informe`, `pomodoro estado`, `pomodoro cancelar`
**Portuguese:** `pomodoro 25 Escrever relatório`, `pomodoro status`, `pomodoro cancelar`

---

## Journal

| Input | Response |
|-------|----------|
| `journal Today was a great day` | Journal entry saved |
| `journal list` | Shows last 5 entries |
| `journal random` | Shows a random past entry |
| `journal date 2026-03-15` | Shows entry for that date |
| `journal stats` | Shows total entries, words, streak |
| `journal delete 1` | Deletes entry #1 |

**Spanish:** `diario Hoy fue un gran día`, `diario lista`, `diario aleatorio`, `diario fecha 2026-03-15`
**Portuguese:** `diário Hoje foi um ótimo dia`, `diário lista`, `diário aleatório`, `diário data 2026-03-15`

---

## NLP / casual conversation

| Input | Bot behavior |
|-------|-------------|
| `thanks!` / `gracias` / `valeu` | Random thanks response |
| `how are you` / `tudo bem` / `cómo estás` | Random "how are you" response |
| `👍` `🔥` `💪` (exact emoji) | Emoji reaction |
| `who are you` / `quién eres` / `quem é você` | Who-is-Remi response |
| `what can you do` / `qué puedes hacer` | Feature overview |
| `haha` / `lol` / `kkk` / `jaja` | Laugh response |
| `awesome` / `genial` / `demais` | Compliment response |
| `sorry` / `perdona` / `desculpa` | Apology response |
