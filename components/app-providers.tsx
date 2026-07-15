"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/constants";
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
    // Storage unavailable; the preference simply will not persist.
  }
}

interface PreferenceStore<T extends string> {
  subscribe: (listener: () => void) => () => void;
  read: () => T;
  write: (next: T) => void;
}

/**
 * A tiny external store per preference, consumed via useSyncExternalStore: the
 * server render uses the default snapshot and the client adopts the stored
 * value on hydration, with no mismatch and no state writes inside effects.
 */
function createPreferenceStore<T extends string>(
  key: string,
  isValid: (value: string) => value is T,
  fallback: () => T,
): PreferenceStore<T> {
  let listeners: Array<() => void> = [];
  let value: T | null = null;
  return {
    subscribe(listener) {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    read() {
      if (value === null) {
        const raw = readStored(key);
        value = raw !== null && isValid(raw) ? raw : fallback();
      }
      return value;
    },
    write(next) {
      value = next;
      writeStored(key, next);
      for (const listener of listeners) listener();
    },
  };
}

const isLocale = (value: string): value is Locale => SUPPORTED_LOCALES.some((l) => l === value);
const isTheme = (value: string): value is Theme => value === "dark" || value === "light";
const prefersLight = (): boolean =>
  globalThis.matchMedia?.("(prefers-color-scheme: light)").matches === true;

const localeStore = createPreferenceStore<Locale>("sp-locale", isLocale, () => DEFAULT_LOCALE);
const themeStore = createPreferenceStore<Theme>("sp-theme", isTheme, () =>
  prefersLight() ? "light" : "dark",
);

/** Holds locale and theme, and mirrors them onto the document element. */
export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.read,
    () => DEFAULT_LOCALE,
  );
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.read, (): Theme => "dark");

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirFor(locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setLocale = useCallback((next: Locale) => localeStore.write(next), []);
  const toggleTheme = useCallback(
    () => themeStore.write(themeStore.read() === "dark" ? "light" : "dark"),
    [],
  );

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
