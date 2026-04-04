import { Locale } from '../i18n';
import { Logger } from '../logger';
import { ParserContext } from '../types';
import { commands } from './command/index';

function parseInput(input: string, locale: Locale) {
  const tokens = input.toLowerCase().trim().split(/\s+/);

  if (tokens.length === 0) {
    return { error: 'Empty' };
  }

  const firstToken = tokens[0];

  // get the key for the command based on the first token and the locale's command list
  const commandKey = Object.keys(locale.commandList).find((key) =>
    locale.commandList[key].list.some(
      (alias: string) => alias.toLowerCase() === firstToken,
    ),
  );

  if (commandKey) {
    Logger.debug({ commandKey }, 'Command resolved');
    const command = commands[commandKey as keyof typeof commands];
    const restTokens = tokens.slice(1);
    const secondToken = restTokens[0]?.toLowerCase();

    const context: ParserContext = { locale };

    if (command.subcommands && secondToken) {
      const subcommandKey = Object.keys(
        locale.commandList[commandKey].subcommands,
      ).find((key) =>
        locale.commandList[commandKey].subcommands[key].list.some(
          (alias: string) => alias.toLowerCase() === secondToken,
        ),
      );

      if (subcommandKey) {
        Logger.debug({ commandKey, subcommandKey }, 'Subcommand resolved');
        const subcommand = command.subcommands[subcommandKey];
        const subRestTokens = restTokens.slice(1);

        const result = subcommand.parse(subRestTokens, context);
        if (result.error) {
          return { error: result.error };
        }
        return {
          command: commandKey,
          action: result.action,
          params: result.params,
        };
      }

      // handle the main command with the second token as part of its parameters (e.g. "pomodoro 15" or "pomodoro work")
      const result = command.parse(restTokens, context);
      if (result.error) {
        return { error: result.error };
      }
      return {
        command: commandKey,
        action: result.action,
        params: result.params,
      };
    }

    // handle the main command without subcommands
    const result = command.parse(restTokens, context);
    if (result.error) {
      return { error: result.error };
    }
    return {
      command: commandKey,
      action: result.action,
      params: result.params,
    };
  }

  const lower = input.toLowerCase().trim();
  const trimmed = input.trim();

  // Multi-word trigger match: the first token didn't match, but the full input might
  // match a multi-word trigger (e.g. "buenos días", "hasta luego", "quién eres")
  const multiWordCommandKey = Object.keys(locale.commandList).find((key) =>
    locale.commandList[key].list.some(
      (alias: string) => alias.toLowerCase() === lower,
    ),
  );

  if (multiWordCommandKey) {
    const command = commands[multiWordCommandKey as keyof typeof commands];
    const result = command.parse([], { locale });
    if (!result.error) {
      return {
        command: multiWordCommandKey,
        action: result.action,
        params: result.params,
      };
    }
  }

  // Natural language fallback
  const r = locale.responses;

  if (r.thanksKeywords.some((k) => lower.includes(k)))
    return { command: 'nlp', action: 'thanks' };

  if (r.howAreYouKeywords.some((k) => lower.includes(k)))
    return { command: 'nlp', action: 'howAreYou' };

  if (r.emojiKeywords.includes(trimmed))
    return { command: 'nlp', action: 'emojiReaction' };

  if (r.whoAreYouKeywords.some((k) => lower.includes(k)))
    return { command: 'nlp', action: 'whoAreYou' };

  if (r.whatCanYouDoKeywords.some((k) => lower.includes(k)))
    return { command: 'nlp', action: 'whatCanYouDo' };

  if (r.laughKeywords.some((k) => lower === k || trimmed === k))
    return { command: 'nlp', action: 'laugh' };

  if (r.complimentKeywords.some((k) => lower.includes(k)))
    return { command: 'nlp', action: 'compliment' };

  if (r.sorryKeywords.some((k) => lower.includes(k)))
    return { command: 'nlp', action: 'sorry' };

  Logger.debug({ input }, 'No command matched');
  return { error: 'Unknown command' };
}

export default parseInput;
