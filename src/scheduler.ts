import cron from 'node-cron';

import * as db from './db';
import { getLocale } from './i18n';

type SendToFn = (chatId: string, msg: string) => Promise<void>;

export function startScheduler(sendTo: SendToFn): void {
  // Check reminders every minute
  cron.schedule('* * * * *', async () => {
    await checkPomodoros(sendTo);
  });
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
