import de from './de';
import en from './en';
import eo from './eo';
import es from './es';
import fr from './fr-FR';
import he from './he';
import it from './it';
import ja from './ja';
import la from './la';
import nl from './nl';
import sv from './sv';
import pt from './pt';
import uk from './uk';
import zh from './zh';

// Extra "en-x-*" locales for fun and testing purposes.
import enXCorp from './en-x-corp';
import enXLeet from './en-x-leet';
import enXMin from './en-x-min';
import enXCyberpunk from './en-x-cyberpunk';
import enXStarwars from './en-x-starwars';
import enXAislop from './en-x-aislop';
import enXNASA from './en-x-nasa';
import enXBrainrot from './en-x-brainrot';
import enXCowboy from './en-x-cowboy';

import { LOCALES } from "./locales.js";

export type Translations = typeof de;

const translations: Record<string, Translations> = { de, en, eo, es, fr, he, it, ja, la, nl, pt, sv, uk, zh, 'en-x-corp': enXCorp, 'en-x-leet': enXLeet, 'en-x-min': enXMin, 'en-x-starwars': enXStarwars, 'en-x-cyberpunk': enXCyberpunk, 'en-x-aislop': enXAislop, 'en-x-nasa': enXNASA, 'en-x-brainrot': enXBrainrot, 'en-x-cowboy': enXCowboy };

export function getTranslations(locale: string | undefined): Translations {
  return translations[locale ?? 'de'] ?? translations['de'];
}

export { LOCALES };
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  eo: 'Esperanto',
  fr: 'Français',
  he: 'עברית',
  it: 'Italiano',
  ja: '日本語',
  la: 'Latina',
  nl: 'Nederlands',
  sv: 'Svenska',
  pt: 'Português',
  uk: 'Українська',
  zh: '中文',
  'en-x-corp': 'LinkedIn',
  'en-x-leet': 'Leet',
  'en-x-min': 'Minimal',
  'en-x-cowboy': 'Cowboy',
  'en-x-starwars': 'Star Wars',
  'en-x-cyberpunk': 'Cyberpunk',
  'en-x-aislop': 'AISLOP',
  'en-x-nasa': 'NASA',
  'en-x-brainrot': 'Gen ALPHA',
};
