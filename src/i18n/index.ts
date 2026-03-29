import de from './de';
import en from './en';
import es from './es';
import it from './it';
import ja from './ja';
import pt from './pt';

export type Translations = typeof de;

const translations: Record<string, Translations> = { de, en, es, it, ja, pt };

export function getTranslations(locale: string | undefined): Translations {
  return translations[locale ?? 'de'] ?? translations['de'];
}

export const LOCALES = ['de', 'en', 'es', 'it', 'ja', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  ja: '日本語',
  pt: 'Portugués',
};

export { de, en, es, it, ja, pt };
