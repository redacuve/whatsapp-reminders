import { ParserCommandDef } from '../../types';

function languageStartParser(tokens: string[]) {
  if (tokens.length === 0) {
    return {
      command: 'language',
      action: 'help',
    };
  }

  const language = tokens[0].toLowerCase();
  return {
    command: 'language',
    action: 'set',
    params: { language },
  };
}

export const languageCommand: ParserCommandDef = {
  key: 'language',
  // Calling language without a subcommand defaults to start
  parse: (tokens) => languageStartParser(tokens),
  subcommands: {
    set: {
      key: 'set',
      parse: (tokens) => languageStartParser(tokens),
    },
    help: {
      key: 'help',
      parse: () => ({
        command: 'language',
        action: 'help',
      }),
    },
  },
};
