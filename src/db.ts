import Database from 'better-sqlite3';
import path from 'path';

import { PomodoroRow, ReminderRow } from './types';

const DB_PATH = path.resolve(process.cwd(), 'reminders.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initTables(db);
  }
  return db;
}

function initTables(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      number TEXT PRIMARY KEY,
      language TEXT NOT NULL DEFAULT 'en',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pomodoros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL,
      task TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      started_at TEXT DEFAULT (datetime('now')),
      due_at TEXT,
      completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL,
      text TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ---- Settings ----
export function getLanguage(number: string): string | null {
  const row = getDb()
    .prepare('SELECT language FROM settings WHERE number = ?')
    .get(number) as { language: string } | undefined;
  return row?.language ?? null;
}

export function setLanguage(number: string, lang: string): void {
  getDb()
    .prepare(
      `INSERT INTO settings (number, language, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(number) DO UPDATE SET language = excluded.language, updated_at = excluded.updated_at`,
    )
    .run(number, lang);
}

// ---- Pomodoros ----
export function startPomodoro(
  chatId: string,
  task: string,
  minutes: number,
): void {
  const due = new Date(Date.now() + minutes * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
  getDb()
    .prepare(
      'INSERT INTO pomodoros (number, task, duration_minutes, due_at) VALUES (?, ?, ?, ?)',
    )
    .run(chatId, task, minutes, due);
}

export function getActivePomodoro(chatId: string): PomodoroRow | null {
  const row = getDb()
    .prepare('SELECT * FROM pomodoros WHERE number = ? AND completed = 0')
    .get(chatId) as PomodoroRow | undefined;
  return row ?? null;
}

export function getDuePomodoros(): PomodoroRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM pomodoros WHERE completed = 0 AND due_at <= datetime('now')",
    )
    .all() as PomodoroRow[];
}

export function cancelPomodoro(chatId: string): boolean {
  const result = getDb()
    .prepare(
      'UPDATE pomodoros SET completed = 1 WHERE number = ? AND completed = 0',
    )
    .run(chatId);
  return (result as { changes: number }).changes > 0;
}

export function updatePomodoro(
  chatId: string,
  task: string,
  minutes: number,
): void {
  const due = new Date(Date.now() + minutes * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
  getDb()
    .prepare(
      'UPDATE pomodoros SET task = ?, duration_minutes = ?, due_at = ? WHERE number = ? AND completed = 0',
    )
    .run(task, minutes, due, chatId);
}

export function completePomodoro(id: number): void {
  getDb().prepare('UPDATE pomodoros SET completed = 1 WHERE id = ?').run(id);
}

// ---- Reminders ----
export function createReminder(
  chatId: string,
  text: string,
  due: Date,
): number {
  const dueStr = due.toISOString().replace('T', ' ').slice(0, 19);
  const result = getDb()
    .prepare('INSERT INTO reminders (number, text, remind_at) VALUES (?, ?, ?)')
    .run(chatId, text, dueStr);
  return result.lastInsertRowid as number;
}

export function getPendingReminders(chatId: string): ReminderRow[] {
  return getDb()
    .prepare(
      'SELECT * FROM reminders WHERE number = ? AND sent = 0 ORDER BY remind_at ASC',
    )
    .all(chatId) as ReminderRow[];
}

export function getDueReminders(): ReminderRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM reminders WHERE sent = 0 AND remind_at <= datetime('now')",
    )
    .all() as ReminderRow[];
}

export function deleteReminder(id: number, chatId: string): boolean {
  const result = getDb()
    .prepare('DELETE FROM reminders WHERE id = ? AND number = ? AND sent = 0')
    .run(id, chatId);
  return (result as { changes: number }).changes > 0;
}

export function updateReminder(
  id: number,
  chatId: string,
  changes: { text?: string; due?: Date },
): boolean {
  const dueStr = changes.due
    ? changes.due.toISOString().replace('T', ' ').slice(0, 19)
    : null;
  const result = getDb()
    .prepare(
      'UPDATE reminders SET text = COALESCE(?, text), remind_at = COALESCE(?, remind_at) WHERE id = ? AND number = ? AND sent = 0',
    )
    .run(changes.text ?? null, dueStr, id, chatId);
  return (result as { changes: number }).changes > 0;
}

export function markReminderSent(id: number): void {
  getDb().prepare('UPDATE reminders SET sent = 1 WHERE id = ?').run(id);
}
