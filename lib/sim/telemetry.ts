import { VENUE } from "../venue/data";
import { MATCH_WINDOW_MINUTES } from "../constants";
import { densityFor, phaseAt, snapshot, type MatchPhase } from "./engine";
import { incidentsUpTo, type IncidentKind, type Severity } from "./incidents";
import { noise } from "./rng";

/**
 * Rolls the match up to a given minute into a compact summary the AI turns into
 * an operations report. Derived entirely from the deterministic model.
 */

export interface ZonePeak {
  zoneId: string;
  name: string;
  peakDensity: number;
  peakMinute: number;
}

export interface IncidentDigest {
  kind: IncidentKind;
  severity: Severity;
  title: string;
  startMinute: number;
}

export interface Sustainability {
  waterRefills: number;
  wasteDivertedPct: number;
  recyclingStations: number;
}

export interface TelemetrySummary {
  upToMinute: number;
  phase: MatchPhase;
  attendance: number;
  avgDensity: number;
  peakZones: ZonePeak[];
  incidents: IncidentDigest[];
  sustainability: Sustainability;
}

function clampMinute(minute: number): number {
  return Math.min(MATCH_WINDOW_MINUTES, Math.max(0, Math.round(minute)));
}

export function telemetrySummary(upToMinuteRaw: number): TelemetrySummary {
  const upToMinute = clampMinute(upToMinuteRaw);
  const now = snapshot(upToMinute);

  const peakZones: ZonePeak[] = VENUE.zones
    .map((zone) => {
      let peakDensity = 0;
      let peakMinute = 0;
      for (let m = 0; m <= upToMinute; m++) {
        const density = densityFor(zone, m);
        if (density > peakDensity) {
          peakDensity = density;
          peakMinute = m;
        }
      }
      return { zoneId: zone.id, name: zone.name, peakDensity, peakMinute };
    })
    .sort((a, b) => b.peakDensity - a.peakDensity)
    .slice(0, 5);

  const incidents: IncidentDigest[] = incidentsUpTo(upToMinute).map((incident) => ({
    kind: incident.kind,
    severity: incident.severity,
    title: incident.title,
    startMinute: incident.startMinute,
  }));

  const progress = upToMinute / MATCH_WINDOW_MINUTES;
  const wasteDivertedPct = Math.round(
    (0.63 + noise("waste", Math.floor(upToMinute / 10), 0.02)) * 100,
  );

  return {
    upToMinute,
    phase: phaseAt(upToMinute),
    attendance: now.attendance,
    avgDensity: now.avgDensity,
    peakZones,
    incidents,
    sustainability: {
      waterRefills: Math.round(VENUE.event.capacity * 0.18 * progress),
      wasteDivertedPct,
      recyclingStations: VENUE.amenities.filter((a) => a.type === "recycling").length,
    },
  };
}
