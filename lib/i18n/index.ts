import { RTL_LOCALES, SUPPORTED_LOCALES, type Locale } from "../constants";
import { must } from "../must";
import { TRANSLATIONS, type Dictionary, type DictKey } from "./translations";

export type { Dictionary, DictKey };

/** One flat dictionary per locale, materialised once from the keyed source. */
function dictionaryFor(locale: Locale): Dictionary {
  // Object.fromEntries widens keys to string; the shape is guaranteed by the
  // `satisfies` clause on TRANSLATIONS, so this narrows it back losslessly.
  return Object.fromEntries(
    Object.entries(TRANSLATIONS).map(([key, byLocale]) => [key, byLocale[locale]]),
  ) as Dictionary;
}

const DICTIONARIES = new Map<Locale, Dictionary>(
  SUPPORTED_LOCALES.map((locale) => [locale, dictionaryFor(locale)]),
);

/** Native-language display names for the locale switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  ar: "العربية",
};

/** The full UI dictionary for a locale. */
export function getDictionary(locale: Locale): Dictionary {
  return must(DICTIONARIES.get(locale), `dictionary for ${locale}`);
}

/** Whether the locale is written right-to-left. */
export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** The document direction for a locale, for the `dir` attribute. */
export function dirFor(locale: Locale): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}
