import { parseFlexibleTimeToken } from '../../time';
import { ParserCommandDef, ParserContext } from '../../types';

/**
 * Scans `tokens` for the first time-like token using parseFlexibleTimeToken.
 * Returns the zero-padded HH:MM string and the remaining tokens (text).
 * Returns null if no time token is found.
 */
function extractTimeFromTokens(
  tokens: string[],
): { paddedTime: string; textTokens: string[] } | null {
  const idx = tokens.findIndex((t) => parseFlexibleTimeToken(t) !== null);
  if (idx === -1) return null;
  const parsed = parseFlexibleTimeToken(tokens[idx])!;
  const paddedTime = `${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}`;
  const textTokens = tokens.filter((_, i) => i !== idx);
  return { paddedTime, textTokens };
}

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
    interval: {
      key: 'interval',
      parse: (tokens, ctx) => {
        const mins = tokens.length > 0 ? parseInt(tokens[0], 10) : NaN;
        const text = tokens.slice(1).join(' ').trim();
        if (isNaN(mins) || mins <= 0 || !text) {
          return {
            command: 'reminder',
            action: 'interval',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        return {
          command: 'reminder',
          action: 'interval',
          params: { value: String(mins), text },
        };
      },
    },
    weekly: {
      key: 'weekly',
      // tokens: [dayName, <time-anywhere-in-rest>, ...text]
      parse: (tokens, ctx) => {
        if (tokens.length < 3) {
          return {
            command: 'reminder',
            action: 'weekly',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const dayName = tokens[0].toLowerCase();
        const aliases = ctx.locale.responses.weekDayAliases ?? {};
        const dow = aliases[dayName];
        if (dow === undefined) {
          return {
            command: 'reminder',
            action: 'weekly',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const rest = tokens.slice(1);
        const extracted = extractTimeFromTokens(rest);
        if (!extracted) {
          return {
            command: 'reminder',
            action: 'weekly',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const text = extracted.textTokens.join(' ').trim();
        if (!text) {
          return {
            command: 'reminder',
            action: 'weekly',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        return {
          command: 'reminder',
          action: 'weekly',
          params: { value: `${dow} ${extracted.paddedTime}`, text },
        };
      },
    },
    monthly: {
      key: 'monthly',
      // tokens: [dayOfMonth, <time-anywhere-in-rest>, ...text]
      parse: (tokens, ctx) => {
        if (tokens.length < 3) {
          return {
            command: 'reminder',
            action: 'monthly',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const dom = parseInt(tokens[0], 10);
        if (isNaN(dom) || dom < 1 || dom > 31) {
          return {
            command: 'reminder',
            action: 'monthly',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const rest = tokens.slice(1);
        const extracted = extractTimeFromTokens(rest);
        if (!extracted) {
          return {
            command: 'reminder',
            action: 'monthly',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const text = extracted.textTokens.join(' ').trim();
        if (!text) {
          return {
            command: 'reminder',
            action: 'monthly',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        return {
          command: 'reminder',
          action: 'monthly',
          params: { value: `${dom} ${extracted.paddedTime}`, text },
        };
      },
    },
    weekdays: {
      key: 'weekdays',
      // tokens: [...text and time in any order]
      parse: (tokens, ctx) => {
        if (tokens.length < 2) {
          return {
            command: 'reminder',
            action: 'weekdays',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const extracted = extractTimeFromTokens(tokens);
        if (!extracted) {
          return {
            command: 'reminder',
            action: 'weekdays',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const text = extracted.textTokens.join(' ').trim();
        if (!text) {
          return {
            command: 'reminder',
            action: 'weekdays',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        return {
          command: 'reminder',
          action: 'weekdays',
          params: { value: extracted.paddedTime, text },
        };
      },
    },
    weekends: {
      key: 'weekends',
      // tokens: [...text and time in any order]
      parse: (tokens, ctx) => {
        if (tokens.length < 2) {
          return {
            command: 'reminder',
            action: 'weekends',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const extracted = extractTimeFromTokens(tokens);
        if (!extracted) {
          return {
            command: 'reminder',
            action: 'weekends',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        const text = extracted.textTokens.join(' ').trim();
        if (!text) {
          return {
            command: 'reminder',
            action: 'weekends',
            error: ctx.locale.responses.invalidArgs,
          };
        }
        return {
          command: 'reminder',
          action: 'weekends',
          params: { value: extracted.paddedTime, text },
        };
      },
    },
  },
};

export default reminderCommand;
