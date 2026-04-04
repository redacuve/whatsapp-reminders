import { buildFeaturesList } from '../i18n';
import { pickRandom } from '../helper';
import { HandlerResult, MessageContext } from '../types';

export function nlpHandler(action: string, ctx: MessageContext): HandlerResult {
  const { locale } = ctx;
  switch (action) {
    case 'thanks':
      return { status: 'ok', message: pickRandom(locale.responses.thanks) };
    case 'howAreYou':
      return { status: 'ok', message: pickRandom(locale.responses.howAreYou) };
    case 'emojiReaction':
      return { status: 'ok', message: pickRandom(locale.responses.emojiReactions) };
    case 'whoAreYou':
      return { status: 'ok', message: pickRandom(locale.responses.whoAreYou) };
    case 'whatCanYouDo':
      return { status: 'ok', message: locale.responses.whatCanYouDo(buildFeaturesList(locale)) };
    case 'laugh':
      return { status: 'ok', message: pickRandom(locale.responses.laughResponses) };
    case 'compliment':
      return { status: 'ok', message: pickRandom(locale.responses.complimentResponses) };
    case 'sorry':
      return { status: 'ok', message: pickRandom(locale.responses.sorryResponses) };
    default:
      return { status: 'error', message: locale.responses.unknown };
  }
}
