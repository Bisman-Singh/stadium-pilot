"use client";

import { useState } from "react";
import type { Incident, Severity } from "@/lib/sim";
import { ActionCardDialog } from "./action-card-dialog";

const SEVERITY_META: Record<Severity, { label: string; cssVar: string }> = {
  high: { label: "High", cssVar: "--d-critical" },
  medium: { label: "Medium", cssVar: "--d-high" },
  low: { label: "Low", cssVar: "--d-moderate" },
};

export function AlertFeed({ incidents }: { incidents: Incident[] }) {
  const [active, setActive] = useState<Incident | null>(null);

  return (
    <section aria-label="Live alerts">
      <h2 className="mb-2 text-lg font-semibold">Live alerts</h2>
      {incidents.length === 0 ? (
        <p className="text-sm text-muted">No active alerts right now.</p>
      ) : (
        <ul className="space-y-2">
          {incidents.map((incident) => {
            const meta = SEVERITY_META[incident.severity];
            return (
              <li key={incident.id} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full border px-2 py-0.5 text-xs font-semibold uppercase"
                    style={{ color: `var(${meta.cssVar})`, borderColor: `var(${meta.cssVar})` }}
                  >
                    {meta.label}
                  </span>
                  <span className="font-semibold">{incident.title}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{incident.detail}</p>
                <button
                  type="button"
                  onClick={() => setActive(incident)}
                  className="mt-2 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
                >
                  Generate action card
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {active && <ActionCardDialog incident={active} onClose={() => setActive(null)} />}
    </section>
  );
}
