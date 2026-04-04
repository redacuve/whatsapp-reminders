import * as db from '../db';
import { formatReminderTime, parseEditInput, parseReminderTime } from '../time';
import { HandlerResult, MessageContext } from '../types';

export function listRemindersHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const pending = db.getPendingReminders(ctx.from);
  if (pending.length === 0) {
    return { status: 'ok', message: locale.responses.reminderEmpty };
  }
  const lines = pending.map(
    (r, i) =>
      `${i + 1}. *${r.text}* — ${formatReminderTime(r.remind_at, locale.dayLabels)}`,
  );
  return {
    status: 'ok',
    message: `${locale.responses.reminderList}\n\n${lines.join('\n')}`,
  };
}

export function helpReminderHandler(ctx: MessageContext): HandlerResult {
  const subs = ctx.locale.commands.reminder.subcommands ?? [];
  return {
    status: 'ok',
    message: `⏰ *${ctx.locale.commands.reminder.name}:*\n\n${subs.map((s) => `  › ${s}`).join('\n')}`,
  };
}

export function deleteReminderHandler(
  pos: number,
  ctx: MessageContext,
): HandlerResult {
  const { locale } = ctx;
  const pending = db.getPendingReminders(ctx.from);
  const row = pending[pos - 1];
  if (!row) {
    return { status: 'error', message: locale.responses.reminderNotFound };
  }
  db.deleteReminder(row.id, ctx.from);
  return { status: 'ok', message: locale.responses.reminderDeleted(row.text) };
}

export function editReminderHandler(
  pos: number,
  content: string,
  ctx: MessageContext,
): HandlerResult {
  const { locale } = ctx;
  const pending = db.getPendingReminders(ctx.from);
  const row = pending[pos - 1];
  if (!row) {
    return { status: 'error', message: locale.responses.reminderNotFound };
  }
  const edit = parseEditInput(content, locale.vagueHours, locale.tomorrowKeywords);
  const changes: { text?: string; due?: Date } = {};
  if (edit.due) changes.due = edit.due;
  if (edit.text) changes.text = edit.text;
  db.updateReminder(row.id, ctx.from, changes);
  const displayText = changes.text ?? row.text;
  const displayDue =
    changes.due ?? new Date(row.remind_at.replace(' ', 'T') + 'Z');
  return {
    status: 'ok',
    message: locale.responses.reminderEdited(
      displayText,
      formatReminderTime(displayDue, locale.dayLabels),
    ),
  };
}

export function createReminderHandler(
  input: string,
  ctx: MessageContext,
): HandlerResult {
  const { locale } = ctx;
  const parsed = parseReminderTime(input, locale.vagueHours, locale.tomorrowKeywords);
  if (!parsed) {
    return { status: 'error', message: locale.responses.reminderInvalidTime };
  }
  db.createReminder(ctx.from, parsed.text, parsed.due);
  return {
    status: 'ok',
    message: locale.responses.reminderAdded(
      parsed.text,
      formatReminderTime(parsed.due, locale.dayLabels),
    ),
  };
}
