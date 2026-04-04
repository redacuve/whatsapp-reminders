import type { Locale } from '../types';
import { en } from './en';
import { es } from './es';
import { pt } from './pt';

export type { Locale };

const locales: Record<string, Locale> = { en, es, pt };

export const availableLocales = Object.keys(locales);

export function getLocale(lang: string): Locale {
  return locales[lang] || en;
}

/**
 * Builds the compact commands list used in remiAbout.
 * Each entry: "  › *trigger* — desc"
 * trigger = def.trigger ?? def.name.toLowerCase()
 */
export function buildCommandsList(locale: Locale): string {
  return Object.entries(locale.commands)
    .map(
      ([, def]) =>
        `  › *${def.trigger ?? def.name.toLowerCase()}* — ${def.desc}`,
    )
    .join('\n');
}

/**
 * Builds the features section used in whatCanYouDo.
 * Only commands with an emoji are included.
 * Each entry: "emoji *featureName* — featureDesc"
 */
export function buildFeaturesList(locale: Locale): string {
  return Object.entries(locale.commands)
    .filter(([, def]) => def.emoji)
    .map(
      ([, def]) =>
        `${def.emoji} *${def.featureName ?? def.name}* — ${def.featureDesc ?? def.desc}`,
    )
    .join('\n');
}
