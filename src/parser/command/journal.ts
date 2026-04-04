import { ParserCommandDef } from '../../types';

const journalCommand: ParserCommandDef = {
  key: 'journal',
  parse: (tokens) => {
    if (tokens.length === 0) {
      return { command: 'journal', action: 'help' };
    }
    return {
      command: 'journal',
      action: 'create',
      params: { text: tokens.join(' ') },
    };
  },
  subcommands: {
    list: {
      key: 'list',
      parse: () => ({ command: 'journal', action: 'list' }),
    },
    help: {
      key: 'help',
      parse: () => ({ command: 'journal', action: 'help' }),
    },
    random: {
      key: 'random',
      parse: () => ({ command: 'journal', action: 'random' }),
    },
    date: {
      key: 'date',
      parse: (tokens) => ({
        command: 'journal',
        action: 'date',
        params: { dateStr: tokens[0] ?? null },
      }),
    },
    stats: {
      key: 'stats',
      parse: () => ({ command: 'journal', action: 'stats' }),
    },
    delete: {
      key: 'delete',
      parse: (tokens) => ({
        command: 'journal',
        action: 'delete',
        params: { pos: tokens.length > 0 ? parseInt(tokens[0], 10) : NaN },
      }),
    },
  },
};

export default journalCommand;
