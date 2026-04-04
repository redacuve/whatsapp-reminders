import executeCommand from './command';
import { Logger } from './logger';
import parseInput from './parser/index';
import { MessageContext, SendFn } from './types';

export async function handleCommand(
  text: string,
  send: SendFn,
  ctx: MessageContext,
): Promise<void> {
  const { locale } = ctx;
  const parseResult = parseInput(text, locale);

  if (parseResult.error) {
    await send(locale.responses.unknown);
    return;
  }

  Logger.info({
    'Parsed command': parseResult.command,
    action: parseResult.action,
    params: parseResult.params,
  });
  await executeCommand(parseResult, ctx, send);
}
