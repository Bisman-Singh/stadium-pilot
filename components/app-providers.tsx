"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";
import { dirFor, getDictionary, type Dictionary } from "@/lib/i18n";

type Theme = "dark" | "light";

interface AppContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Dictionary;
  dir: "rtl" | "ltr";
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const LOCALE_KEY = "sp-locale";
const THEME_KEY = "sp-theme";

/** localStorage can be absent (SSR, tests) or throw (private mode); never let it break the app. */
function readStored(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Storage unavailable; preference simply will not persist.
  }
}

/**
 * Holds locale and theme. State starts at the SSR defaults and only adopts
 * stored preferences after mount, so the first client render matches the server.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- SSR-safe: reading storage in a lazy initializer would cause a hydration mismatch */
    const storedLocale = readStored(LOCALE_KEY) as Locale | null;
    if (storedLocale) setLocaleState(storedLocale);
    const storedTheme = readStored(THEME_KEY) as Theme | null;
    if (storedTheme) setTheme(storedTheme);
    else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) setTheme("light");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirFor(locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStored(LOCALE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      writeStored(THEME_KEY, next);
      return next;
    });
  }, []);

  const value: AppContextValue = {
    locale,
    setLocale,
    dict: getDictionary(locale),
    dir: dirFor(locale),
    theme,
    toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProviders");
  return context;
}
