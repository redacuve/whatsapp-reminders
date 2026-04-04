import * as db from '../db';
import { availableLocales, getLocale } from '../i18n';
import { MessageContext } from '../types';

export function setLanguageHandler(language: string, ctx: MessageContext) {
  if (!availableLocales.includes(language)) {
    return {
      status: 'error',
      message: ctx.locale.responses.langInvalid,
    };
  }
  db.setLanguage(ctx.from, language);
  return {
    status: 'ok',
    message: getLocale(language).responses.langChanged,
  };
}

export function helpLanguageHandler(ctx: MessageContext) {
  const { locale } = ctx;
  return {
    status: 'ok',
    message: locale.responses.languageHelp,
  };
}
