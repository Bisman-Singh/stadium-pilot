import { DEFAULT_LOCALE, RTL_LOCALES, type Locale } from "../constants";
import { en, type Dictionary, type DictKey } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { ar } from "./ar";

export type { Dictionary, DictKey };

const DICTIONARIES: Record<Locale, Dictionary> = { en, es, fr, ar };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  ar: "العربية",
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}
