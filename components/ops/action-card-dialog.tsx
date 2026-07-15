"use client";

import { useEffect, useRef, useState } from "react";
import type { Incident } from "@/lib/sim";
import { actionCardSchema, type ActionCard } from "@/lib/ai/schemas";
import { COPY_FEEDBACK_MS } from "@/lib/constants";
import { readJson } from "@/lib/json";

const SEVERITY_VAR: Record<ActionCard["severity"], string> = {
  low: "--d-moderate",
  medium: "--d-high",
  high: "--d-critical",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      // Clipboard unavailable (insecure context, tests); ignore silently.
    }
  };
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="rounded border border-line px-2 py-0.5 text-xs hover:border-accent"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** Accessible modal that requests and displays an AI action card for an incident. */
export function ActionCardDialog({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const [card, setCard] = useState<ActionCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "action-card-title";

  useEffect(() => {
    // Aborting on unmount cancels the in-flight request as well as the state writes.
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);
        const res = await fetch("/api/ops/action", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ incidentId: incident.id }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("action failed");
        const json = await readJson<{ card?: unknown }>(res);
        // Re-validate at the client boundary; a malformed card shows the error state.
        const parsed = actionCardSchema.safeParse(json.card);
        if (parsed.success) setCard(parsed.data);
        else setFailed(true);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [incident.id]);

  useEffect(() => {
    const active = document.activeElement;
    const previouslyFocused = active instanceof HTMLElement ? active : null;
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-xl outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold">
            AI action card
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">{incident.title}</p>

        {loading && <p className="mt-4 text-sm">Generating recommendation…</p>}
        {failed && (
          <p role="alert" className="mt-4 text-sm text-danger">
            Could not generate the action card. Please try again.
          </p>
        )}

        {card && (
          <div className="mt-4 space-y-4">
            <span
              className="inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase"
              style={{
                color: `var(${SEVERITY_VAR[card.severity]})`,
                borderColor: `var(${SEVERITY_VAR[card.severity]})`,
              }}
            >
              {card.severity} severity
            </span>
            <p className="text-sm">{card.summary}</p>

            <div>
              <h3 className="text-sm font-semibold">Recommended actions</h3>
              <ol className="ms-5 mt-1 list-decimal space-y-1 text-sm">
                {card.actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Staffing move</h3>
              <p className="mt-1 text-sm">{card.staffingMove}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Public-address drafts</h3>
              <div className="mt-1 space-y-2">
                {(["en", "es", "fr"] as const).map((code) => (
                  <div key={code} className="rounded-lg border border-line bg-panel p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-muted">{code}</span>
                      <CopyButton text={card.paDraft[code]} />
                    </div>
                    <p dir="auto" className="text-sm">
                      {card.paDraft[code]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-accent py-2 font-semibold text-accent-ink"
            >
              Acknowledge &amp; close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
