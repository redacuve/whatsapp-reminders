import { ParserCommandDef } from '../../types';

export const helpCommand: ParserCommandDef = {
  key: 'help',
  parse: () => ({ command: 'help', action: 'show' }),
};

export const statusCommand: ParserCommandDef = {
  key: 'status',
  parse: () => ({ command: 'status', action: 'check' }),
};

export const pingCommand: ParserCommandDef = {
  key: 'ping',
  parse: () => ({ command: 'ping', action: 'pong' }),
};

export const messageCommand: ParserCommandDef = {
  key: 'message',
  parse: () => ({
    command: 'message',
    action: 'motivate',
  }),
};

export const helloCommand: ParserCommandDef = {
  key: 'hello',
  parse: () => ({
    command: 'hello',
    action: 'greet',
  }),
};

export const byeCommand: ParserCommandDef = {
  key: 'bye',
  parse: () => ({
    command: 'bye',
    action: 'farewell',
  }),
};

export const remiCommand: ParserCommandDef = {
  key: 'remi',
  parse: () => ({
    command: 'remi',
    action: 'about',
  }),
};
