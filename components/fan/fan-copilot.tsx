"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useApp } from "@/components/app-providers";
import { listZones } from "@/lib/venue";
import { QuickChips } from "./quick-chips";
import { MessageBubble } from "./message-bubble";

export function FanCopilot() {
  const { dict, locale } = useApp();
  const [input, setInput] = useState("");
  const [locationZone, setLocationZone] = useState("");
  const [stepFreeOnly, setStepFreeOnly] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error, stop, regenerate } = useChat({ transport });

  const busy = status === "submitted" || status === "streaming";
  const zones = listZones();

  useEffect(() => {
    const node = endRef.current;
    // jsdom does not implement scrollIntoView, so feature-detect rather than assume.
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, busy]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    void sendMessage(
      { text: trimmed },
      { body: { locationZone: locationZone || undefined, stepFreeOnly, locale } },
    );
    setInput("");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold">{dict.fanTitle}</h1>
        <p className="text-muted">{dict.fanSubtitle}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">{dict.fanLocation}</span>
          <select
            value={locationZone}
            onChange={(event) => setLocationZone(event.target.value)}
            className="rounded-md border border-line bg-panel px-2 py-1 text-ink"
          >
            <option value="">{dict.fanLocationNone}</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={stepFreeOnly}
            onChange={(event) => setStepFreeOnly(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span>{dict.fanStepFree}</span>
        </label>
      </div>

      <QuickChips onPick={send} disabled={busy} />

      <div
        role="log"
        aria-live="polite"
        aria-busy={busy}
        aria-label="Conversation"
        className="flex h-[52vh] flex-col gap-3 overflow-y-auto rounded-lg border border-line bg-base p-4"
      >
        {messages.length === 0 && (
          <p className="m-auto max-w-sm text-center text-muted">{dict.fanEmpty}</p>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {status === "submitted" && (
          <p className="text-sm text-muted" aria-hidden="true">
            {dict.fanThinking}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-danger/50 bg-danger/10 px-4 py-2 text-sm"
        >
          <span>{dict.fanError}</span>
          <button
            type="button"
            onClick={() => void regenerate()}
            className="rounded-md border border-line px-3 py-1 font-medium hover:border-accent"
          >
            {dict.fanRetry}
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={dict.fanPlaceholder}
          aria-label={dict.fanPlaceholder}
          dir="auto"
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-ink placeholder:text-muted"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => void stop()}
            className="rounded-lg border border-line px-4 py-2.5 font-medium hover:border-accent"
          >
            {dict.fanStop}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:bg-line disabled:text-muted"
          >
            {dict.fanSend}
          </button>
        )}
      </form>
    </div>
  );
}
