import * as db from '../db';
import { HandlerResult, MessageContext } from '../types';

export function helpJournalHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const subs = locale.commands.journal.subcommands ?? [];
  return {
    status: 'ok',
    message: `📓 *${locale.commands.journal.name}:*\n\n${subs.map((s) => `  › ${s}`).join('\n')}`,
  };
}

export function listJournalHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const entries = db.getJournalEntries(ctx.from, 5);
  if (entries.length === 0) {
    return { status: 'ok', message: locale.responses.journalEmpty };
  }
  const lines = entries.map((e, i) => {
    const date = e.created_at.slice(0, 10);
    const preview = e.text.length > 60 ? e.text.slice(0, 60) + '…' : e.text;
    return `${i + 1}. _${date}_ — ${preview}`;
  });
  return {
    status: 'ok',
    message: `${locale.responses.journalList}\n\n${lines.join('\n')}`,
  };
}

export function randomJournalHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const entry = db.getRandomJournalEntry(ctx.from);
  if (!entry) {
    return { status: 'ok', message: locale.responses.journalEmpty };
  }
  const date = entry.created_at.slice(0, 10);
  const header = locale.responses.journalRandom ?? 'Random entry:';
  return { status: 'ok', message: `${header}\n\n_${date}_\n${entry.text}` };
}

export function dateJournalHandler(dateStr: string | null, ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { status: 'error', message: locale.responses.journalNotFound };
  }
  const entry = db.getJournalEntryByDate(ctx.from, dateStr);
  if (!entry) {
    return { status: 'error', message: locale.responses.journalNotFound };
  }
  return { status: 'ok', message: `_${dateStr}_\n${entry.text}` };
}

export function statsJournalHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const stats = db.getJournalStats(ctx.from);
  const message = locale.responses.journalStats
    ? locale.responses.journalStats(stats)
    : JSON.stringify(stats);
  return { status: 'ok', message };
}

export function deleteJournalHandler(pos: number, ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  if (isNaN(pos) || pos <= 0) {
    return { status: 'error', message: locale.responses.journalNotFound };
  }
  const entries = db.getJournalEntries(ctx.from, 5);
  const row = entries[pos - 1];
  if (!row) {
    return { status: 'error', message: locale.responses.journalNotFound };
  }
  db.deleteJournalEntry(row.id, ctx.from);
  return { status: 'ok', message: locale.responses.journalDeleted };
}

export function createJournalHandler(text: string, ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const preview = text.length > 60 ? text.slice(0, 60) + '…' : text;
  db.createJournalEntry(ctx.from, text);
  return { status: 'ok', message: locale.responses.journalAdded(preview) };
}
