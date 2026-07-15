"use client";

import { useState } from "react";
import { VENUE } from "@/lib/venue";
import { MarkdownLite } from "@/components/markdown-lite";

const SHIFTS = ["pre-match", "first-half", "halftime", "second-half", "egress"] as const;

export function OpsGenerators({ minute }: { minute: number }) {
  const [gateId, setGateId] = useState(VENUE.gates[0]?.id ?? "A");
  const [shift, setShift] = useState<(typeof SHIFTS)[number]>("pre-match");
  const [briefing, setBriefing] = useState("");
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingFailed, setBriefingFailed] = useState(false);

  const [report, setReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);

  const generateBriefing = async () => {
    setBriefingLoading(true);
    setBriefingFailed(false);
    try {
      const res = await fetch("/api/ops/briefing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gateId, shift }),
      });
      if (!res.ok) throw new Error("briefing failed");
      const json = await res.json();
      setBriefing(json.briefing as string);
    } catch {
      setBriefingFailed(true);
    } finally {
      setBriefingLoading(false);
    }
  };

  const generateReport = async () => {
    setReportLoading(true);
    setReportFailed(false);
    try {
      const res = await fetch("/api/ops/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ upToMinute: Math.round(minute) }),
      });
      if (!res.ok) throw new Error("report failed");
      const json = await res.json();
      setReport(json.report as string);
    } catch {
      setReportFailed(true);
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "stadiumpilot-ops-report.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section aria-label="Volunteer briefing generator" className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-lg font-semibold">Volunteer briefing</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="text-sm">
            <span className="text-muted">Gate</span>
            <select
              value={gateId}
              onChange={(event) => setGateId(event.target.value)}
              className="mt-1 block rounded-md border border-line bg-panel px-3 py-2 text-ink"
            >
              {VENUE.gates.map((gate) => (
                <option key={gate.id} value={gate.id}>
                  {gate.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted">Match phase</span>
            <select
              value={shift}
              onChange={(event) => setShift(event.target.value as (typeof SHIFTS)[number])}
              className="mt-1 block rounded-md border border-line bg-panel px-3 py-2 text-ink"
            >
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={generateBriefing}
          disabled={briefingLoading}
          className="mt-3 rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-50"
        >
          {briefingLoading ? "Generating…" : "Generate briefing"}
        </button>
        {briefingFailed && (
          <p role="alert" className="mt-3 text-sm text-danger">
            Could not generate the briefing. Please try again.
          </p>
        )}
        {briefing && (
          <div className="mt-3 rounded-lg border border-line bg-panel p-3">
            <MarkdownLite text={briefing} />
          </div>
        )}
      </section>

      <section aria-label="Match operations report" className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-lg font-semibold">Match operations report</h2>
        <p className="mt-1 text-sm text-muted">Summarises the match up to minute {Math.round(minute)}.</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={generateReport}
            disabled={reportLoading}
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-50"
          >
            {reportLoading ? "Generating…" : "Generate report"}
          </button>
          {report && (
            <button
              type="button"
              onClick={downloadReport}
              className="rounded-lg border border-line px-4 py-2 font-medium hover:border-accent"
            >
              Download .md
            </button>
          )}
        </div>
        {reportFailed && (
          <p role="alert" className="mt-3 text-sm text-danger">
            Could not generate the report. Please try again.
          </p>
        )}
        {report && (
          <div className="mt-3 rounded-lg border border-line bg-panel p-3">
            <MarkdownLite text={report} />
          </div>
        )}
      </section>
    </div>
  );
}
