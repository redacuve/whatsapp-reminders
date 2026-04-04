import * as db from '../db';
import { formatReminderTime, parseEditInput, parseReminderTime, computeNextOccurrence } from '../time';
import { HandlerResult, MessageContext } from '../types';

export function listRemindersHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const pending = db.getPendingReminders(ctx.from);
  if (pending.length === 0) {
    return { status: 'ok', message: locale.responses.reminderEmpty };
  }
  const lines = pending.map((r, i) => {
    const timeLabel = formatReminderTime(r.remind_at, locale.dayLabels);
    if (r.recurrence_type && r.recurrence_value) {
      const desc = buildRecurrenceDesc(r.recurrence_type, r.recurrence_value, locale);
      const nextLabel = locale.responses.recurringNextLabel ?? 'next';
      return `${i + 1}. 🔄 *${r.text}* — ${desc} _(${nextLabel}: ${timeLabel})_`;
    }
    return `${i + 1}. *${r.text}* — ${timeLabel}`;
  });
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

function buildRecurrenceDesc(
  type: string,
  value: string,
  locale: MessageContext['locale'],
): string {
  const r = locale.responses;
  if (type === 'interval') {
    const mins = parseInt(value, 10);
    return r.recurringIntervalLabel?.(mins) ?? `every ${mins} min`;
  }
  if (type === 'weekly') {
    const [dayStr, timeStr] = value.split(' ');
    const dayName = r.weekDayNames?.[parseInt(dayStr, 10)] ?? dayStr;
    return r.recurringWeeklyLabel?.(dayName, timeStr) ?? `every ${dayName} ${timeStr}`;
  }
  if (type === 'monthly') {
    const [dayStr, timeStr] = value.split(' ');
    return r.recurringMonthlyLabel?.(parseInt(dayStr, 10), timeStr) ?? `every ${dayStr} of month ${timeStr}`;
  }
  if (type === 'weekdays') {
    return r.recurringWeekdaysLabel?.(value) ?? `weekdays at ${value}`;
  }
  if (type === 'weekends') {
    return r.recurringWeekendsLabel?.(value) ?? `weekends at ${value}`;
  }
  return value;
}

export function createRecurringReminderHandler(
  type: string,
  value: string,
  text: string,
  ctx: MessageContext,
): HandlerResult {
  const { locale } = ctx;
  const firstDue = computeNextOccurrence(type, value, new Date());
  db.createRecurringReminder(ctx.from, text, type, value, firstDue);
  const desc = buildRecurrenceDesc(type, value, locale);
  const added =
    locale.responses.recurringAdded?.(text, desc) ??
    `🔄 Recurring reminder set! *${text}* — ${desc}`;
  return { status: 'ok', message: added };
}
