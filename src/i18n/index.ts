import { en } from './en';
import type { Locale } from './en';

export type { Locale };

const locales: Record<string, Locale> = { en };

export function getLocale(lang: string): Locale {
  return locales[lang] || en;
}
