import cron from 'node-cron';

import * as db from './db';
import { getLocale } from './i18n';
import { computeNextOccurrence } from './time';

type SendToFn = (chatId: string, msg: string) => Promise<void>;

export function startScheduler(sendTo: SendToFn): void {
  // Check reminders and pomodoros every minute
  cron.schedule('* * * * *', async () => {
    await checkReminders(sendTo);
    await checkPomodoros(sendTo);
  });
}

async function checkReminders(sendTo: SendToFn): Promise<void> {
  const due = db.getDueReminders();
  for (const r of due) {
    const loc = getLocale(db.getLanguage(r.number) || 'en');
    await sendTo(r.number, loc.responses.reminderDone(r.text));
    if (r.recurrence_type && r.recurrence_value) {
      const next = computeNextOccurrence(
        r.recurrence_type,
        r.recurrence_value,
        new Date(),
      );
      db.advanceRecurringReminder(r.id, next);
    } else {
      db.markReminderSent(r.id);
    }
  }
}

async function checkPomodoros(sendTo: SendToFn): Promise<void> {
  const due = db.getDuePomodoros();
  for (const p of due) {
    db.completePomodoro(p.id);
    const loc = getLocale(db.getLanguage(p.number) || 'en');
    const endPhrase =
      loc.responses.pomodoroEnd[
        Math.floor(Math.random() * loc.responses.pomodoroEnd.length)
      ];
    await sendTo(
      p.number,
      `${loc.responses.pomodoroDone(p.task)}\n\n_${endPhrase}_`,
    );
  }
}
