import parseInput from '../parser';
import { MessageContext, SendFn } from '../types';
import {
  createJournalHandler,
  dateJournalHandler,
  deleteJournalHandler,
  helpJournalHandler,
  listJournalHandler,
  randomJournalHandler,
  statsJournalHandler,
} from './journal';
import { helpLanguageHandler, setLanguageHandler } from './language';
import {
  createNoteHandler,
  deleteNoteHandler,
  helpNoteHandler,
  listNotesHandler,
  markNoteDoneHandler,
  markNoteUndoneHandler,
} from './note';
import {
  cancelPomodoroHandler,
  pomodoroHelpHandler,
  pomodoroStatusHandler,
  startPomodoroHandler,
} from './pomodoro';
import {
  createRecurringReminderHandler,
  createReminderHandler,
  deleteReminderHandler,
  editReminderHandler,
  helpReminderHandler,
  listRemindersHandler,
} from './reminder';
import { nlpHandler } from './nlp';
import {
  byeHandler,
  helloHandler,
  helpHandler,
  messageHandler,
  pingHandler,
  remiHandler,
  statusHandler,
} from './simple';

async function executeCommand(
  parseResult: ReturnType<typeof parseInput>,
  ctx: MessageContext,
  send: SendFn,
): Promise<void> {
  const { command, action, params } = parseResult;
  let result: string;
  switch (command) {
    case 'help':
      result = helpHandler(ctx);
      await send(result);
      break;
    case 'status':
      result = statusHandler(ctx);
      await send(result);
      break;
    case 'ping':
      result = pingHandler(ctx);
      await send(result);
      break;
    case 'message':
      result = messageHandler(ctx);
      await send(result);
      break;
    case 'hello':
      result = helloHandler(ctx);
      await send(result);
      break;
    case 'bye':
      result = byeHandler(ctx);
      await send(result);
      break;

    case 'pomodoro':
      if (action === 'start') {
        const { name, minutes } = (params ?? {}) as {
          name: string | null;
          minutes: number | null;
        };
        await send(startPomodoroHandler(name, minutes, ctx).message);
      } else if (action === 'status') {
        await send(pomodoroStatusHandler(ctx).message);
      } else if (action === 'cancel') {
        await send(cancelPomodoroHandler(ctx).message);
      } else if (action === 'help') {
        await send(pomodoroHelpHandler(ctx).message);
      }
      break;
    case 'remi':
      result = remiHandler(ctx);
      await send(result);
      break;
    case 'language':
      if (action === 'set') {
        const { language } = (params ?? {}) as { language: string };
        await send(setLanguageHandler(language, ctx).message);
      } else if (action === 'help') {
        await send(helpLanguageHandler(ctx).message);
      }
      break;
    case 'reminder':
      if (action === 'list') {
        await send(listRemindersHandler(ctx).message);
      } else if (action === 'help') {
        await send(helpReminderHandler(ctx).message);
      } else if (action === 'delete') {
        const { pos } = (params ?? {}) as { pos: number };
        await send(deleteReminderHandler(pos, ctx).message);
      } else if (action === 'edit') {
        const { pos, content } = (params ?? {}) as {
          pos: number;
          content: string;
        };
        await send(editReminderHandler(pos, content, ctx).message);
      } else if (action === 'create') {
        const { input } = (params ?? {}) as { input: string };
        await send(createReminderHandler(input, ctx).message);
      } else if (action === 'interval' || action === 'weekly' || action === 'monthly' || action === 'weekdays' || action === 'weekends') {
        const { value, text } = (params ?? {}) as { value: string; text: string };
        await send(createRecurringReminderHandler(action, value, text, ctx).message);
      }
      break;
    case 'note':
      if (action === 'help') {
        await send(helpNoteHandler(ctx).message);
      } else if (action === 'list') {
        await send(listNotesHandler(ctx).message);
      } else if (action === 'done') {
        const { pos } = (params ?? {}) as { pos: number };
        await send(markNoteDoneHandler(pos, ctx).message);
      } else if (action === 'undone') {
        const { pos } = (params ?? {}) as { pos: number };
        await send(markNoteUndoneHandler(pos, ctx).message);
      } else if (action === 'delete') {
        const { pos } = (params ?? {}) as { pos: number };
        await send(deleteNoteHandler(pos, ctx).message);
      } else if (action === 'create') {
        const { text } = (params ?? {}) as { text: string };
        await send(createNoteHandler(text, ctx).message);
      }
      break;
    case 'journal':
      if (action === 'help') {
        await send(helpJournalHandler(ctx).message);
      } else if (action === 'list') {
        await send(listJournalHandler(ctx).message);
      } else if (action === 'random') {
        await send(randomJournalHandler(ctx).message);
      } else if (action === 'date') {
        const { dateStr } = (params ?? {}) as { dateStr: string | null };
        await send(dateJournalHandler(dateStr, ctx).message);
      } else if (action === 'stats') {
        await send(statsJournalHandler(ctx).message);
      } else if (action === 'delete') {
        const { pos } = (params ?? {}) as { pos: number };
        await send(deleteJournalHandler(pos, ctx).message);
      } else if (action === 'create') {
        const { text } = (params ?? {}) as { text: string };
        await send(createJournalHandler(text, ctx).message);
      }
      break;
    case 'nlp':
      await send(nlpHandler(action!, ctx).message);
      break;
    default:
      await send(ctx.locale.responses.unknown);
  }
}

export default executeCommand;
