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

export { de, en, es, it, ja, pt };
