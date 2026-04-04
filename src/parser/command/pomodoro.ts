import { ParserCommandDef, ParserContext } from '../../types';

const POMODORO_DEFAULT_MINUTES = 25;

function pomodoroStartParser(tokens: string[], ctx: ParserContext) {
  let minutes: number | null = null;
  const nameParts: string[] = [];

  for (const token of tokens) {
    if (/^\d+$/.test(token) && minutes === null) {
      minutes = parseInt(token, 10);
    } else {
      nameParts.push(token);
    }
  }

  minutes = minutes ?? POMODORO_DEFAULT_MINUTES;
  const defaultName =
    ctx.locale.responses.pomodoroDefaultTask || 'Pomodoro Task';
  const name = nameParts.length > 0 ? nameParts.join(' ') : defaultName;

  return {
    command: 'pomodoro',
    action: 'start',
    params: {
      minutes,
      name,
    },
  };
}

const pomodoroCommand: ParserCommandDef = {
  key: 'pomodoro',
  // Calling pomodoro without a subcommand defaults to start
  parse: (tokens, ctx) => pomodoroStartParser(tokens, ctx),
  subcommands: {
    start: {
      key: 'start',
      parse: (tokens, ctx) => pomodoroStartParser(tokens, ctx),
    },
    status: {
      key: 'status',
      parse: () => ({
        command: 'pomodoro',
        action: 'status',
      }),
    },
    cancel: {
      key: 'cancel',
      parse: () => ({
        command: 'pomodoro',
        action: 'cancel',
      }),
    },
    help: {
      key: 'help',
      parse: () => ({
        command: 'pomodoro',
        action: 'help',
      }),
    },
  },
};

export default pomodoroCommand;
