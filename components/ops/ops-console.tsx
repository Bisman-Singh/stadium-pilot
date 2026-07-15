"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CrowdSnapshot, Incident } from "@/lib/sim";
import { telemetrySummary } from "@/lib/sim";
import { MATCH_WINDOW_MINUTES } from "@/lib/constants";
import { KpiRow, type Kpi } from "./kpi-row";
import { ZoneHeatGrid } from "./zone-heat-grid";
import { AlertFeed } from "./alert-feed";
import { AnnouncementComposer } from "./announcement-composer";
import { OpsGenerators } from "./ops-generators";

interface CrowdData {
  snapshot: CrowdSnapshot;
  incidents: Incident[];
}

function formatPhase(phase: string): string {
  return phase.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function OpsConsole() {
  const [data, setData] = useState<CrowdData | null>(null);
  const [minute, setMinute] = useState(0);
  const [live, setLive] = useState(true);
  const [failed, setFailed] = useState(false);
  const liveRef = useRef(live);
  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  const load = useCallback(async (targetMinute?: number) => {
    try {
      const url = targetMinute != null ? `/api/crowd?minute=${targetMinute}` : "/api/crowd";
      const res = await fetch(url);
      if (!res.ok) throw new Error("crowd fetch failed");
      const json: CrowdData = await res.json();
      setData(json);
      setMinute(json.snapshot.minute);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // The fetch is an external-system sync: schedule it (immediate task +
    // refresh interval) so the effect body itself stays free of state writes.
    const initial = setTimeout(() => void load(), 0);
    const interval = setInterval(() => {
      if (liveRef.current && document.visibilityState === "visible") void load();
    }, 5000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [load]);

  const onScrub = (value: number) => {
    setLive(false);
    setMinute(value);
    load(value);
  };

  const goLive = () => {
    setLive(true);
    load();
  };

  const snapshot = data?.snapshot;
  const incidents = data?.incidents ?? [];
  const telemetry = telemetrySummary(minute);
  const critical = snapshot ? snapshot.zones.filter((z) => z.level === "critical").length : 0;

  const kpis: Kpi[] = snapshot
    ? [
        { label: "In venue", value: snapshot.attendance.toLocaleString() },
        { label: "Avg density", value: `${Math.round(snapshot.avgDensity * 100)}%` },
        {
          label: "Open alerts",
          value: String(incidents.length),
          tone: incidents.length > 0 ? "danger" : "default",
        },
        {
          label: "Over capacity",
          value: String(critical),
          tone: critical > 0 ? "danger" : "default",
        },
        {
          label: "Water refills",
          value: telemetry.sustainability.waterRefills.toLocaleString(),
          tone: "accent",
        },
        {
          label: "Waste diverted",
          value: `${telemetry.sustainability.wasteDivertedPct}%`,
          tone: "accent",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Operations Center</h1>
          <p className="text-muted">Live crowd intelligence and AI decision support.</p>
        </div>
        <div className="text-sm text-muted">
          <span className="font-semibold text-ink">
            {formatPhase(snapshot?.phase ?? "pre-gates")}
          </span>
          {" · match minute "}
          {Math.round(minute)}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3">
        <label className="flex flex-1 items-center gap-3 text-sm">
          <span className="whitespace-nowrap text-muted">Timeline</span>
          <input
            type="range"
            min={0}
            max={MATCH_WINDOW_MINUTES}
            value={Math.round(minute)}
            onChange={(event) => onScrub(Number(event.target.value))}
            aria-label="Match minute"
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="w-10 tabular-nums">{Math.round(minute)}&apos;</span>
        </label>
        <button
          type="button"
          onClick={goLive}
          aria-pressed={live}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
            live ? "border-pitch text-pitch" : "border-line text-muted hover:border-accent"
          }`}
        >
          {live ? "● Live" : "Go live"}
        </button>
      </div>

      {failed && (
        <p role="alert" className="text-sm text-danger">
          Could not load live crowd data. Retrying automatically.
        </p>
      )}

      <KpiRow items={kpis} />

      <div className="grid gap-6 lg:grid-cols-2">
        {snapshot && <ZoneHeatGrid zones={snapshot.zones} />}
        <AlertFeed incidents={incidents} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnnouncementComposer />
        <OpsGenerators minute={minute} />
      </div>
    </div>
  );
}
