import * as db from '../db';
import { HandlerResult, MessageContext } from '../types';

export function startPomodoroHandler(
  name: string | null,
  minutes: number | null,
  ctx: MessageContext,
): HandlerResult {
  const { locale } = ctx;
  const active = db.getActivePomodoro(ctx.chatId);

  if (active) {
    if (name === null && minutes === null) {
      const due = new Date(active.due_at.replace(' ', 'T') + 'Z');
      const minsLeft = Math.max(
        0,
        Math.ceil((due.getTime() - Date.now()) / 60000),
      );
      return {
        status: 'ok',
        message: locale.responses.pomodoroStatus(active.task, minsLeft),
      };
    }
    const finalMins = minutes ?? active.duration_minutes;
    const finalTask = name ?? active.task;
    db.updatePomodoro(ctx.chatId, finalTask, finalMins);
    const startPhrase =
      locale.responses.pomodoroStart[
        Math.floor(Math.random() * locale.responses.pomodoroStart.length)
      ];
    return {
      status: 'ok',
      message: `${locale.responses.pomodoroUpdated(finalTask, finalMins)}\n\n_${startPhrase}_`,
    };
  }

  const finalMins = minutes ?? 25;
  const finalTask = name ?? locale.responses.pomodoroDefaultTask;
  db.startPomodoro(ctx.chatId, finalTask, finalMins);
  const startPhrase =
    locale.responses.pomodoroStart[
      Math.floor(Math.random() * locale.responses.pomodoroStart.length)
    ];
  return {
    status: 'ok',
    message: `${locale.responses.pomodoroStarted(finalTask, finalMins)}\n\n_${startPhrase}_`,
  };
}

export function pomodoroStatusHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const active = db.getActivePomodoro(ctx.chatId);
  if (!active) {
    return { status: 'error', message: locale.responses.pomodoroNoActive };
  }
  const due = new Date(active.due_at.replace(' ', 'T') + 'Z');
  const minsLeft = Math.max(0, Math.ceil((due.getTime() - Date.now()) / 60000));
  return {
    status: 'ok',
    message: locale.responses.pomodoroStatus(active.task, minsLeft),
  };
}

export function cancelPomodoroHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const cancelled = db.cancelPomodoro(ctx.chatId);
  if (!cancelled) {
    return { status: 'error', message: locale.responses.pomodoroNoActive };
  }
  return { status: 'ok', message: locale.responses.pomodoroCancelled };
}

export function pomodoroHelpHandler(ctx: MessageContext): HandlerResult {
  const subs = ctx.locale.commands.pomodoro.subcommands ?? [];
  return {
    status: 'ok',
    message: `⏱️ *Pomodoro:*\n\n${subs.map((s) => `  › ${s}`).join('\n')}`,
  };
}
