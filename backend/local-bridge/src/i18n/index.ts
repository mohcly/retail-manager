import { en } from './en.js';
import { fr } from './fr.js';

export type TranslationKey = keyof typeof en;

const translations: Record<string, Record<string, string>> = { en, fr };

let currentLocale = 'en';

export function setLocale(locale: string) {
  if (translations[locale]) {
    currentLocale = locale;
  }
}

export function getLocale(): string {
  return currentLocale;
}

export function t(key: TranslationKey): string {
  return translations[currentLocale]?.[key] ?? translations['en'][key] ?? key;
}
