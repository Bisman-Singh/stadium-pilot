import { describe, it, expect } from "vitest";
import {
  snapshot,
  densityFor,
  phaseAt,
  matchMinuteFromWallClock,
  overCapacityZones,
  activeIncidents,
  incidentsUpTo,
  incidentById,
  telemetrySummary,
} from "@/lib/sim";
import { VENUE } from "@/lib/venue";
import { MATCH_WINDOW_MINUTES } from "@/lib/constants";

const zoneById = (id: string) => VENUE.zones.find((z) => z.id === id)!;
const avgRole = (minute: number, role: string) => {
  const zones = snapshot(minute).zones.filter((z) => z.role === role);
  return zones.reduce((s, z) => s + z.density, 0) / zones.length;
};

describe("crowd model determinism", () => {
  it("returns identical snapshots for the same minute", () => {
    expect(snapshot(60)).toEqual(snapshot(60));
    expect(densityFor(zoneById("N2"), 72)).toBe(densityFor(zoneById("N2"), 72));
  });

  it("keeps every density within [0, 1] across the whole match", () => {
    for (let m = 0; m <= MATCH_WINDOW_MINUTES; m++) {
      for (const zone of snapshot(m).zones) {
        expect(zone.density).toBeGreaterThanOrEqual(0);
        expect(zone.density).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("match phase curve invariants", () => {
  it("fills stands after kickoff versus before gates open", () => {
    expect(avgRole(70, "stand")).toBeGreaterThan(avgRole(10, "stand"));
  });

  it("surges concourses at halftime relative to open play", () => {
    expect(avgRole(98, "concourse")).toBeGreaterThan(avgRole(70, "concourse"));
  });

  it("grows total attendance from early to mid match", () => {
    expect(snapshot(60).attendance).toBeGreaterThan(snapshot(5).attendance);
  });

  it("crowds the transit hub during egress", () => {
    expect(densityFor(zoneById("TH"), 149)).toBeGreaterThan(0.7);
  });

  it("flags at least one over-capacity zone at peak concourse load", () => {
    expect(overCapacityZones(98).length).toBeGreaterThan(0);
  });
});

describe("phaseAt boundaries", () => {
  it.each([
    [0, "pre-gates"],
    [29, "pre-gates"],
    [30, "ingress"],
    [44, "ingress"],
    [45, "first-half"],
    [89, "first-half"],
    [90, "halftime"],
    [104, "halftime"],
    [105, "second-half"],
    [139, "second-half"],
    [140, "egress"],
    [150, "egress"],
  ])("minute %i is %s", (minute, phase) => {
    expect(phaseAt(minute as number)).toBe(phase);
  });
});

describe("wall-clock mapping", () => {
  it("stays within the match window and loops", () => {
    const loop = 720;
    expect(matchMinuteFromWallClock(0, loop)).toBe(0);
    expect(matchMinuteFromWallClock(loop * 1000 * 500, loop)).toBe(0); // exact loop multiple wraps to start
    const mid = matchMinuteFromWallClock(loop * 1000 * 0.5, loop);
    expect(mid).toBeCloseTo(MATCH_WINDOW_MINUTES / 2, 5);
    for (const ms of [123, 45678, 999999, 1_000_000_000]) {
      const minute = matchMinuteFromWallClock(ms, loop);
      expect(minute).toBeGreaterThanOrEqual(0);
      expect(minute).toBeLessThan(MATCH_WINDOW_MINUTES);
    }
  });
});

describe("incident schedule", () => {
  it("has no active incidents before the match", () => {
    expect(activeIncidents(0)).toHaveLength(0);
  });

  it("activates the South Upper medical incident around minute 62, highest severity first", () => {
    const active = activeIncidents(62);
    expect(active.some((i) => i.id === "inc-medical-s2")).toBe(true);
    expect(active[0]?.severity).toBe("high");
  });

  it("anchors every incident to a real zone", () => {
    const zoneIds = new Set(VENUE.zones.map((z) => z.id));
    for (const incident of incidentsUpTo(MATCH_WINDOW_MINUTES)) {
      expect(zoneIds.has(incident.zoneId)).toBe(true);
    }
  });

  it("resolves an incident by id", () => {
    expect(incidentById("inc-turnstile-a")?.zoneId).toBe("N1");
    expect(incidentById("nope")).toBeUndefined();
  });
});

describe("telemetry summary", () => {
  it("returns five peak zones sorted by density", () => {
    const summary = telemetrySummary(120);
    expect(summary.peakZones).toHaveLength(5);
    const densities = summary.peakZones.map((z) => z.peakDensity);
    expect(densities).toEqual([...densities].sort((a, b) => b - a));
  });

  it("accumulates incidents over time", () => {
    expect(telemetrySummary(40).incidents.length).toBeLessThan(
      telemetrySummary(150).incidents.length,
    );
  });

  it("reports bounded sustainability metrics", () => {
    const s = telemetrySummary(150).sustainability;
    expect(s.recyclingStations).toBe(6);
    expect(s.waterRefills).toBeGreaterThan(0);
    expect(s.wasteDivertedPct).toBeGreaterThan(55);
    expect(s.wasteDivertedPct).toBeLessThan(70);
  });

  it("clamps out-of-range minutes", () => {
    expect(telemetrySummary(-10).upToMinute).toBe(0);
    expect(telemetrySummary(9999).upToMinute).toBe(MATCH_WINDOW_MINUTES);
  });
});
