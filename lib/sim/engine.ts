import type { Zone, ZoneRole } from "../venue/types";
import { VENUE } from "../venue/data";
import { DENSITY_ALERT, DENSITY_WARN, MATCH_WINDOW_MINUTES } from "../constants";
import { noise } from "./rng";

/**
 * Deterministic crowd model. Occupancy for each zone is a piecewise-linear curve
 * keyed to its role across the match timeline, plus a fixed per-zone bias and a
 * per-minute jitter. Everything is a pure function of the match minute, so the
 * "live" dashboard needs no database and every instance agrees.
 */

export type MatchPhase =
  | "pre-gates"
  | "ingress"
  | "first-half"
  | "halftime"
  | "second-half"
  | "egress";

export type DensityLevel = "low" | "moderate" | "high" | "critical";

export interface ZoneDensity {
  zoneId: string;
  name: string;
  role: ZoneRole;
  density: number;
  occupancy: number;
  level: DensityLevel;
}

export interface CrowdSnapshot {
  minute: number;
  phase: MatchPhase;
  attendance: number;
  avgDensity: number;
  zones: ZoneDensity[];
}

interface Keyframe {
  minute: number;
  value: number;
}

const CURVES: Record<ZoneRole, Keyframe[]> = {
  stand: [
    { minute: 0, value: 0.02 },
    { minute: 30, value: 0.12 },
    { minute: 45, value: 0.9 },
    { minute: 90, value: 0.9 },
    { minute: 98, value: 0.52 },
    { minute: 105, value: 0.58 },
    { minute: 140, value: 0.9 },
    { minute: 150, value: 0.06 },
  ],
  concourse: [
    { minute: 0, value: 0.03 },
    { minute: 30, value: 0.22 },
    { minute: 45, value: 0.3 },
    { minute: 90, value: 0.28 },
    { minute: 98, value: 0.95 },
    { minute: 105, value: 0.9 },
    { minute: 140, value: 0.3 },
    { minute: 150, value: 0.72 },
  ],
  plaza: [
    { minute: 0, value: 0.08 },
    { minute: 25, value: 0.7 },
    { minute: 45, value: 0.32 },
    { minute: 90, value: 0.12 },
    { minute: 105, value: 0.14 },
    { minute: 140, value: 0.2 },
    { minute: 150, value: 0.85 },
  ],
  transit: [
    { minute: 0, value: 0.25 },
    { minute: 30, value: 0.45 },
    { minute: 45, value: 0.18 },
    { minute: 130, value: 0.14 },
    { minute: 150, value: 0.92 },
  ],
  gate: [
    { minute: 0, value: 0.0 },
    { minute: 30, value: 0.5 },
    { minute: 45, value: 0.2 },
    { minute: 150, value: 0.1 },
  ],
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Piecewise-linear interpolation across a role's keyframes, clamped at the ends.
 * Frames are non-empty and strictly increasing by construction, so after the
 * two clamp checks a bracketing segment always exists — a single return path.
 */
function interpolate(frames: Keyframe[], minute: number): number {
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (minute <= first.minute) return first.value;
  if (minute >= last.minute) return last.value;
  let i = 0;
  while (minute > frames[i + 1].minute) i++;
  const a = frames[i];
  const b = frames[i + 1];
  return a.value + (b.value - a.value) * ((minute - a.minute) / (b.minute - a.minute));
}

export function phaseAt(minute: number): MatchPhase {
  if (minute < 30) return "pre-gates";
  if (minute < 45) return "ingress";
  if (minute < 90) return "first-half";
  if (minute < 105) return "halftime";
  if (minute < 140) return "second-half";
  return "egress";
}

function levelFor(density: number): DensityLevel {
  if (density >= DENSITY_ALERT) return "critical";
  if (density >= DENSITY_WARN) return "high";
  if (density >= 0.4) return "moderate";
  return "low";
}

/** Occupancy fraction (0..1) for a zone at a given match minute. */
export function densityFor(zone: Zone, minute: number): number {
  const base = interpolate(CURVES[zone.role], minute);
  const bias = noise(zone.id, 0, 0.04); // fixed per-zone character
  const jitter = noise(zone.id, Math.floor(minute) + 1, 0.03);
  return clamp01(base + bias + jitter);
}

function densityForZone(zone: Zone, minute: number): ZoneDensity {
  const density = densityFor(zone, minute);
  return {
    zoneId: zone.id,
    name: zone.name,
    role: zone.role,
    density,
    occupancy: Math.round(density * zone.capacity),
    level: levelFor(density),
  };
}

/** Full crowd picture at a match minute. */
export function snapshot(minute: number): CrowdSnapshot {
  const zones = VENUE.zones.map((zone) => densityForZone(zone, minute));
  const attendance = zones.reduce((sum, z) => sum + z.occupancy, 0);
  // Every venue has stand and concourse zones, so `counted` is never empty.
  const counted = zones.filter((z) => z.role === "stand" || z.role === "concourse");
  const avgDensity = counted.reduce((sum, z) => sum + z.density, 0) / counted.length;
  return { minute, phase: phaseAt(minute), attendance, avgDensity, zones };
}

/** Zones at or above the critical density threshold, busiest first. */
export function overCapacityZones(minute: number): ZoneDensity[] {
  return snapshot(minute)
    .zones.filter((z) => z.density >= DENSITY_ALERT)
    .sort((a, b) => b.density - a.density);
}

/**
 * Maps wall-clock time to a looping match minute in [0, MATCH_WINDOW_MINUTES).
 * Pure: the caller supplies `nowMs` (e.g. Date.now()).
 */
export function matchMinuteFromWallClock(nowMs: number, loopSeconds: number): number {
  const loopMs = loopSeconds * 1000;
  const position = ((nowMs % loopMs) + loopMs) % loopMs;
  return (position / loopMs) * MATCH_WINDOW_MINUTES;
}
