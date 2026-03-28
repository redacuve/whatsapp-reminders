import { en } from './en';
import type { Locale } from './en';
import { es } from './es';
import { pt } from './pt';

export type { Locale };

const locales: Record<string, Locale> = { en, es, pt };

export function getLocale(lang: string): Locale {
  return locales[lang] || en;
}
