"use client";

import { SUPPORTED_LOCALES, type Locale } from "@/lib/constants";
import { LOCALE_LABELS } from "@/lib/i18n";
import { useApp } from "./app-providers";

export function LocaleSwitcher() {
  const { locale, setLocale, dict } = useApp();
  return (
    <label className="flex items-center gap-1.5 text-sm">
      <span className="sr-only">{dict.langLabel}</span>
      <select
        aria-label={dict.langLabel}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="rounded-md border border-line bg-surface px-2 py-1 text-ink"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
