/**
 * A deterministic incident schedule spread across the match. These drive the ops
 * alert feed and the AI action cards. Every incident anchors to a real zone id.
 */

export type IncidentKind = "turnstile" | "medical" | "crowd" | "weather" | "security" | "transport";

export type Severity = "low" | "medium" | "high";

export interface Incident {
  id: string;
  startMinute: number;
  durationMin: number;
  zoneId: string;
  kind: IncidentKind;
  severity: Severity;
  title: string;
  detail: string;
}

const INCIDENTS: Incident[] = [
  {
    id: "inc-turnstile-a",
    startMinute: 34,
    durationMin: 12,
    zoneId: "N1",
    kind: "turnstile",
    severity: "medium",
    title: "Turnstile fault at Gate A",
    detail: "Two turnstiles offline at the North entrance; the arrival queue is building.",
  },
  {
    id: "inc-medical-s2",
    startMinute: 61,
    durationMin: 8,
    zoneId: "S2",
    kind: "medical",
    severity: "high",
    title: "Medical assistance — South Upper",
    detail: "A spectator is unwell near Section 224. Medics have been dispatched.",
  },
  {
    id: "inc-crowd-cn",
    startMinute: 95,
    durationMin: 10,
    zoneId: "CN",
    kind: "crowd",
    severity: "high",
    title: "Halftime congestion — North Concourse",
    detail: "The halftime surge is pushing the North Concourse past a comfortable density.",
  },
  {
    id: "inc-weather-pl",
    startMinute: 118,
    durationMin: 30,
    zoneId: "PL",
    kind: "weather",
    severity: "medium",
    title: "Heavy rain approaching",
    detail:
      "A weather warning indicates heavy rain in about 20 minutes. Open covered waiting areas.",
  },
  {
    id: "inc-transport-th",
    startMinute: 144,
    durationMin: 12,
    zoneId: "TH",
    kind: "transport",
    severity: "medium",
    title: "Metro platform crowding",
    detail: "Post-match egress is building at the Transit Hub. Consider staggering stand releases.",
  },
];

/** Incidents active at the given minute, ordered by severity then start time. */
export function activeIncidents(minute: number): Incident[] {
  const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return INCIDENTS.filter(
    (incident) =>
      minute >= incident.startMinute && minute < incident.startMinute + incident.durationMin,
  ).sort((a, b) => rank[a.severity] - rank[b.severity] || a.startMinute - b.startMinute);
}

export function incidentById(id: string): Incident | undefined {
  return INCIDENTS.find((incident) => incident.id === id);
}

/** All incidents that have started at or before the given minute (for reports). */
export function incidentsUpTo(minute: number): Incident[] {
  return INCIDENTS.filter((incident) => incident.startMinute <= minute).sort(
    (a, b) => a.startMinute - b.startMinute,
  );
}
