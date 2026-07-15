import { DEFAULT_LOCALE, RTL_LOCALES, type Locale } from "../constants";
import { en, type Dictionary, type DictKey } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { ar } from "./ar";

export type { Dictionary, DictKey };

const DICTIONARIES: Record<Locale, Dictionary> = { en, es, fr, ar };

/** Native-language display names for the locale switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  ar: "العربية",
};

/** The full UI dictionary for a locale, falling back to the default. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** Whether the locale is written right-to-left. */
export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** The document direction for a locale, for the `dir` attribute. */
export function dirFor(locale: Locale): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}
