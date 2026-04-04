import { ParserCommandDef, ParserContext } from '../../types';

const reminderCommand: ParserCommandDef = {
  key: 'reminder',
  parse: (tokens, _ctx: ParserContext) => {
    if (tokens.length === 0) {
      return { command: 'reminder', action: 'list' };
    }
    return {
      command: 'reminder',
      action: 'create',
      params: { input: tokens.join(' ') },
    };
  },
  subcommands: {
    list: {
      key: 'list',
      parse: () => ({ command: 'reminder', action: 'list' }),
    },
    help: {
      key: 'help',
      parse: () => ({ command: 'reminder', action: 'help' }),
    },
    delete: {
      key: 'delete',
      parse: (tokens) => {
        const pos = tokens.length > 0 ? parseInt(tokens[0], 10) : NaN;
        return {
          command: 'reminder',
          action: 'delete',
          params: { pos: isNaN(pos) || pos <= 0 ? null : pos },
        };
      },
    },
    edit: {
      key: 'edit',
      parse: (tokens, ctx) => {
        if (tokens.length < 2) {
          return {
            command: 'reminder',
            action: 'edit',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const pos = parseInt(tokens[0], 10);
        if (isNaN(pos) || pos <= 0) {
          return {
            command: 'reminder',
            action: 'edit',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        return {
          command: 'reminder',
          action: 'edit',
          params: { pos, content: tokens.slice(1).join(' ') },
        };
      },
    },
  },
};

export default reminderCommand;
