import * as db from '../db';
import { HandlerResult, MessageContext } from '../types';

export function helpNoteHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const subs = locale.commands.note.subcommands ?? [];
  return {
    status: 'ok',
    message: `📝 *${locale.commands.note.name}:*\n\n${subs.map((s) => `  › ${s}`).join('\n')}`,
  };
}

export function listNotesHandler(ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  const notes = db.getNotes(ctx.from);
  if (notes.length === 0) {
    return { status: 'ok', message: locale.responses.noteEmpty };
  }
  const pending = notes.filter((n) => !n.done);
  const done = notes.filter((n) => n.done);
  const lines = [
    ...(pending.length
      ? [
          locale.responses.notePendingList
            ? locale.responses.notePendingList +
              '\n' +
              pending.map((n, i) => `${i + 1}. ${n.text}`).join('\n')
            : pending.map((n, i) => `${i + 1}. ${n.text}`).join('\n'),
        ]
      : []),
    ...(done.length
      ? [
          locale.responses.noteDoneList
            ? locale.responses.noteDoneList +
              '\n' +
              done.map((n, i) => `${pending.length + i + 1}. ${n.text}`).join('\n')
            : done.map((n, i) => `${pending.length + i + 1}. ${n.text}`).join('\n'),
        ]
      : []),
  ];
  return {
    status: 'ok',
    message: `${locale.responses.noteList}\n\n${lines.join('\n\n')}`,
  };
}

export function markNoteDoneHandler(pos: number, ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  if (isNaN(pos) || pos <= 0) {
    return { status: 'error', message: locale.responses.noteNotFound };
  }
  const notes = db.getNotes(ctx.from);
  const row = notes[pos - 1];
  if (!row) {
    return { status: 'error', message: locale.responses.noteNotFound };
  }
  if (row.done) {
    return {
      status: 'ok',
      message: locale.responses.noteAlreadyDone
        ? locale.responses.noteAlreadyDone(row.text)
        : `Already done: ${row.text}`,
    };
  }
  db.markNoteDone(row.id, ctx.from);
  return {
    status: 'ok',
    message: locale.responses.noteMarkedDone
      ? locale.responses.noteMarkedDone(row.text)
      : `Marked as done: ${row.text}`,
  };
}

export function markNoteUndoneHandler(pos: number, ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  if (isNaN(pos) || pos <= 0) {
    return { status: 'error', message: locale.responses.noteNotFound };
  }
  const notes = db.getNotes(ctx.from);
  const row = notes[pos - 1];
  if (!row) {
    return { status: 'error', message: locale.responses.noteNotFound };
  }
  if (!row.done) {
    return {
      status: 'ok',
      message: locale.responses.noteAlreadyPending
        ? locale.responses.noteAlreadyPending(row.text)
        : `Already pending: ${row.text}`,
    };
  }
  db.markNoteUndone(row.id, ctx.from);
  return {
    status: 'ok',
    message: locale.responses.noteMarkedUndone
      ? locale.responses.noteMarkedUndone(row.text)
      : `Marked as pending: ${row.text}`,
  };
}

export function deleteNoteHandler(pos: number, ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  if (isNaN(pos) || pos <= 0) {
    return { status: 'error', message: locale.responses.noteNotFound };
  }
  const notes = db.getNotes(ctx.from);
  const row = notes[pos - 1];
  if (!row) {
    return { status: 'error', message: locale.responses.noteNotFound };
  }
  db.deleteNote(row.id, ctx.from);
  return { status: 'ok', message: locale.responses.noteDeleted(row.text) };
}

export function createNoteHandler(text: string, ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  db.createNote(ctx.from, text);
  return { status: 'ok', message: locale.responses.noteAdded(text) };
}
