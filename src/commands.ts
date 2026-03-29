import { LANG } from './config';
import * as db from './db';
import { availableLocales, getLocale } from './i18n';
import { formatReminderTime, parseEditInput, parseReminderTime } from './time';
import { MessageContext, SendFn } from './types';

export async function handleCommand(
  text: string,
  send: SendFn,
  ctx: MessageContext,
): Promise<void> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const lang = db.getLanguage(ctx.from) || LANG;
  const locale = getLocale(lang);

  // Returns true if lower matches any of the given aliases OR the locale command name
  const matches = (key: keyof typeof locale.commands, ...aliases: string[]) =>
    aliases.includes(lower) ||
    lower === locale.commands[key].name.toLowerCase();

  // Matches a prefix command (e.g. "pomodoro 25 task"), returns the rest after the alias
  const matchCommand = (
    key: keyof typeof locale.commands,
    ...aliases: string[]
  ): { rest: string; restLower: string } | null => {
    const all = [
      ...new Set([...aliases, locale.commands[key].name.toLowerCase()]),
    ];
    const hit = all.find((a) => lower === a || lower.startsWith(a + ' '));
    if (!hit) return null;
    const rest = trimmed.slice(hit.length).trim();
    return { rest, restLower: rest.toLowerCase() };
  };

  // Help command
  if (matches('help', 'help', 'h', '?', 'commands')) {
    const lines = Object.values(locale.commands).map((cmd) => {
      const sub = cmd.subcommands
        ? '\n' + cmd.subcommands.map((s) => `  › ${s}`).join('\n')
        : '';
      return `*${cmd.name}*: ${cmd.desc}${sub}`;
    });
    await send(`*${locale.name} Commands:*\n\n${lines.join('\n\n')}`);
    return;
  }

  // Language command
  if (lower.startsWith('lang ')) {
    const lang = lower.slice(5).trim();
    if (!availableLocales.includes(lang)) {
      await send(locale.responses.langInvalid);
      return;
    }
    db.setLanguage(ctx.from, lang);
    await send(getLocale(lang).responses.langChanged);
    return;
  }

  // Motivate command
  if (matches('msg', 'msg', 'motivate')) {
    const msgs = locale.motivationalMessages;
    const random = msgs[Math.floor(Math.random() * msgs.length)];
    await send(`${locale.responses.motivatePrefix}\n\n${random}`);
    return;
  }

  // Status command
  if (matches('status', 'status')) {
    const time = ctx.timestamp.toLocaleString();
    const chat = ctx.isGroup
      ? `👥 ${ctx.groupName ?? ctx.chatId}`
      : `💬 ${ctx.chatId}`;
    const pushLine = ctx.senderPushName
      ? `\n📲 Display name: ${ctx.senderPushName}`
      : '';
    const bizLine = ctx.senderIsBusiness ? '\n💼 Business account: Yes' : '';
    const langLine = ctx.senderLanguage
      ? `\n🌐 Language: ${ctx.senderLanguage}`
      : '';
    await send(
      `📊 *Your info*\n👤 Name: ${ctx.senderName}${pushLine}\n📞 Number: +${ctx.senderNumber}\n🔑 ID: ${ctx.from}${bizLine}${langLine}\n💬 Chat: ${chat}\n🕐 Message sent at: ${time}\n\n🤖 *Bot info*\n📞 Number: ${ctx.botNumber}\n👤 Name: ${ctx.botName}\n📱 Platform: ${ctx.botPlatform}`,
    );
    return;
  }

  // Ping command
  if (matches('ping', 'ping')) {
    await send(locale.responses.ping);
    return;
  }

  // Pomodoro command
  const pomo = matchCommand('pomodoro', 'pomodoro', 'pomo');
  if (pomo) {
    const { rest, restLower } = pomo;

    // pomodoro help
    if (
      restLower === 'help' ||
      restLower === locale.responses.pomodoroHelpCmd
    ) {
      const subs = locale.commands.pomodoro.subcommands ?? [];
      await send(`⏱️ *Pomodoro:*\n\n${subs.map((s) => `  › ${s}`).join('\n')}`);
      return;
    }

    // pomodoro status
    if (
      restLower === 'status' ||
      restLower === locale.responses.pomodoroStatusCmd
    ) {
      const active = db.getActivePomodoro(ctx.chatId);
      if (!active) {
        await send(locale.responses.pomodoroNoActive);
        return;
      }
      const due = new Date(active.due_at.replace(' ', 'T') + 'Z');
      const minsLeft = Math.max(
        0,
        Math.ceil((due.getTime() - Date.now()) / 60000),
      );
      await send(locale.responses.pomodoroStatus(active.task, minsLeft));
      return;
    }

    // pomodoro cancel
    if (
      restLower === 'cancel' ||
      restLower === locale.responses.pomodoroCancelCmd
    ) {
      const cancelled = db.cancelPomodoro(ctx.chatId);
      await send(
        cancelled
          ? locale.responses.pomodoroCancelled
          : locale.responses.pomodoroNoActive,
      );
      return;
    }

    // Parse optional mins and task — shared by both update and create paths
    let mins: number | null = null;
    let task: string | null = null;

    if (rest) {
      const spaceIdx = rest.indexOf(' ');
      const firstToken = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx);
      const maybeNum = parseInt(firstToken, 10);

      if (!isNaN(maybeNum) && maybeNum > 0) {
        mins = maybeNum;
        if (spaceIdx !== -1) task = rest.slice(spaceIdx + 1).trim();
      } else {
        task = rest;
      }
    }

    const active = db.getActivePomodoro(ctx.chatId);

    if (active) {
      if (mins === null && task === null) {
        // No args with active pomodoro: show current status
        const due = new Date(active.due_at.replace(' ', 'T') + 'Z');
        const minsLeft = Math.max(
          0,
          Math.ceil((due.getTime() - Date.now()) / 60000),
        );
        await send(locale.responses.pomodoroStatus(active.task, minsLeft));
      } else {
        // Args provided: update, preserving unspecified fields
        const finalMins = mins ?? active.duration_minutes;
        const finalTask = task ?? active.task;
        db.updatePomodoro(ctx.chatId, finalTask, finalMins);
        const startPhrase =
          locale.responses.pomodoroStart[
            Math.floor(Math.random() * locale.responses.pomodoroStart.length)
          ];
        await send(
          `${locale.responses.pomodoroUpdated(finalTask, finalMins)}\n\n_${startPhrase}_`,
        );
      }
      return;
    }

    // No active pomodoro: start a new one
    const finalMins = mins ?? 25;
    const finalTask = task ?? locale.responses.pomodoroDefaultTask;
    db.startPomodoro(ctx.chatId, finalTask, finalMins);
    const startPhrase =
      locale.responses.pomodoroStart[
        Math.floor(Math.random() * locale.responses.pomodoroStart.length)
      ];
    await send(
      `${locale.responses.pomodoroStarted(finalTask, finalMins)}\n\n_${startPhrase}_`,
    );
    return;
  }

  // Reminder command
  const remind = matchCommand('reminder', 'recordar', 'remind', 'lembrar');
  if (remind) {
    const { rest, restLower } = remind;

    // no args or list → show pending reminders
    const listCmds = ['list', locale.responses.reminderListCmd];
    if (!rest || listCmds.includes(restLower)) {
      const pending = db.getPendingReminders(ctx.from);
      if (pending.length === 0) {
        await send(locale.responses.reminderEmpty);
        return;
      }
      const lines = pending.map(
        (r, i) =>
          `${i + 1}. *${r.text}* — ${formatReminderTime(r.remind_at, locale.dayLabels)}`,
      );
      await send(`${locale.responses.reminderList}\n\n${lines.join('\n')}`);
      return;
    }

    // help
    const helpCmds = ['help', locale.responses.reminderHelpCmd];
    if (helpCmds.includes(restLower)) {
      const subs = locale.commands.reminder.subcommands ?? [];
      await send(
        `⏰ *${locale.commands.reminder.name}:*\n\n${subs.map((s) => `  › ${s}`).join('\n')}`,
      );
      return;
    }

    // delete <n>
    const deleteCmds = ['delete', 'del', locale.responses.reminderDeleteCmd];
    let deletePosStr: string | null = null;
    for (const cmd of deleteCmds) {
      if (restLower.startsWith(cmd + ' ')) {
        deletePosStr = restLower.slice(cmd.length).trim();
        break;
      }
    }
    if (deletePosStr !== null) {
      const pos = parseInt(deletePosStr, 10);
      if (!isNaN(pos) && pos > 0) {
        const pending = db.getPendingReminders(ctx.from);
        const row = pending[pos - 1];
        if (!row) {
          await send(locale.responses.reminderNotFound);
          return;
        }
        db.deleteReminder(row.id, ctx.from);
        await send(locale.responses.reminderDeleted(row.text));
        return;
      }
    }

    // edit <n> <content>
    const editCmds = ['edit', locale.responses.reminderEditCmd];
    let editPos: number | null = null;
    let editContent: string | null = null;
    for (const cmd of editCmds) {
      if (!restLower.startsWith(cmd + ' ')) continue;
      const after = rest.slice(cmd.length).trim();
      const spaceIdx = after.indexOf(' ');
      if (spaceIdx === -1) continue;
      const pos = parseInt(after.slice(0, spaceIdx), 10);
      if (isNaN(pos) || pos <= 0) continue;
      editPos = pos;
      editContent = after.slice(spaceIdx + 1).trim();
      break;
    }
    if (editPos !== null && editContent !== null) {
      const pending = db.getPendingReminders(ctx.from);
      const row = pending[editPos - 1];
      if (!row) {
        await send(locale.responses.reminderNotFound);
        return;
      }
      const edit = parseEditInput(
        editContent,
        locale.vagueHours,
        locale.tomorrowKeywords,
      );
      const changes: { text?: string; due?: Date } = {};
      if (edit.due) changes.due = edit.due;
      if (edit.text) changes.text = edit.text;
      db.updateReminder(row.id, ctx.from, changes);
      const displayText = changes.text ?? row.text;
      const displayDue =
        changes.due ?? new Date(row.remind_at.replace(' ', 'T') + 'Z');
      await send(
        locale.responses.reminderEdited(
          displayText,
          formatReminderTime(displayDue, locale.dayLabels),
        ),
      );
      return;
    }

    // create
    const parsed = parseReminderTime(
      rest,
      locale.vagueHours,
      locale.tomorrowKeywords,
    );
    if (!parsed) {
      await send(locale.responses.reminderInvalidTime);
      return;
    }
    db.createReminder(ctx.from, parsed.text, parsed.due);
    await send(
      locale.responses.reminderAdded(
        parsed.text,
        formatReminderTime(parsed.due, locale.dayLabels),
      ),
    );
    return;
  }

  // Unknown command
  await send(locale.responses.unknown);
}
