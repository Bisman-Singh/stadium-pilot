"use client";

import { useState, type FormEvent } from "react";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/constants";
import { LOCALE_LABELS } from "@/lib/i18n";
import { OpsPanel } from "./panel";

interface AnnouncementItem {
  language: string;
  localeCode: string;
  script: string;
}

const TONES = ["calm", "urgent", "friendly", "formal"] as const;

export function AnnouncementComposer() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("calm");
  const [languages, setLanguages] = useState<Locale[]>(["en", "es"]);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggleLanguage = (locale: Locale) =>
    setLanguages((prev) =>
      prev.includes(locale) ? prev.filter((l) => l !== locale) : [...prev, locale],
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (topic.trim().length < 3 || languages.length === 0) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch("/api/ops/announce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), tone, languages }),
      });
      if (!res.ok) throw new Error("announce failed");
      const json: { announcements?: AnnouncementItem[] } = await res.json();
      setItems(json.announcements ?? []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OpsPanel title="Multilingual PA announcement" ariaLabel="Multilingual announcement composer">
      <form onSubmit={submit} className="mt-3 space-y-3">
        <label className="block text-sm">
          <span className="text-muted">Topic</span>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. Gate C is now open for South Stand ticket holders"
            className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-ink"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted">Tone</span>
          <select
            value={tone}
            onChange={(event) => {
              // The option list is built from TONES, so this always matches.
              const next = TONES.find((t) => t === event.target.value);
              if (next) setTone(next);
            }}
            className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-ink"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="text-sm text-muted">Languages</legend>
          <div className="mt-1 flex flex-wrap gap-3">
            {SUPPORTED_LOCALES.map((locale) => (
              <label key={locale} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={languages.includes(locale)}
                  onChange={() => toggleLanguage(locale)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                {LOCALE_LABELS[locale]}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading || topic.trim().length < 3 || languages.length === 0}
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink disabled:bg-line disabled:text-muted"
        >
          {loading ? "Drafting…" : "Draft announcement"}
        </button>
      </form>

      {failed && (
        <p role="alert" className="mt-3 text-sm text-danger">
          Could not draft the announcement. Please try again.
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.localeCode} className="rounded-lg border border-line bg-panel p-3">
              <div className="mb-1 text-xs font-semibold uppercase text-muted">{item.language}</div>
              <p dir="auto" className="text-sm">
                {item.script}
              </p>
            </li>
          ))}
        </ul>
      )}
    </OpsPanel>
  );
}
