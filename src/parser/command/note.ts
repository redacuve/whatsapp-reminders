import { ParserCommandDef } from '../../types';

const noteCommand: ParserCommandDef = {
  key: 'note',
  parse: (tokens) => {
    if (tokens.length === 0) {
      return { command: 'note', action: 'help' };
    }
    return {
      command: 'note',
      action: 'create',
      params: { text: tokens.join(' ') },
    };
  },
  subcommands: {
    list: {
      key: 'list',
      parse: () => ({ command: 'note', action: 'list' }),
    },
    help: {
      key: 'help',
      parse: () => ({ command: 'note', action: 'help' }),
    },
    done: {
      key: 'done',
      parse: (tokens) => ({
        command: 'note',
        action: 'done',
        params: { pos: tokens.length > 0 ? parseInt(tokens[0], 10) : NaN },
      }),
    },
    undone: {
      key: 'undone',
      parse: (tokens) => ({
        command: 'note',
        action: 'undone',
        params: { pos: tokens.length > 0 ? parseInt(tokens[0], 10) : NaN },
      }),
    },
    delete: {
      key: 'delete',
      parse: (tokens) => ({
        command: 'note',
        action: 'delete',
        params: { pos: tokens.length > 0 ? parseInt(tokens[0], 10) : NaN },
      }),
    },
  },
};

export default noteCommand;
