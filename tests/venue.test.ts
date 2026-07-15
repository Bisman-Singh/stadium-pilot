import { describe, it, expect } from "vitest";
import { venueSchema } from "@/lib/venue/schema";
import { findRoute } from "@/lib/venue/graph";
import { findAmenities } from "@/lib/venue/amenities";
import type { Zone } from "@/lib/venue/types";
import {
  VENUE,
  route,
  searchAmenities,
  resolveLocation,
  gateForZone,
  getZone,
} from "@/lib/venue";

describe("venue data integrity", () => {
  it("passes the full schema including referential integrity", () => {
    expect(() => venueSchema.parse(VENUE)).not.toThrow();
  });

  it("has 12 zones, 8 gates and 48 sections", () => {
    expect(VENUE.zones).toHaveLength(12);
    expect(VENUE.gates).toHaveLength(8);
    expect(VENUE.sections).toHaveLength(48);
  });

  it("gives every zone a route to every other zone (fully connected)", () => {
    for (const from of VENUE.zones) {
      for (const to of VENUE.zones) {
        expect(route(from.id, to.id), `${from.id} -> ${to.id}`).not.toBeNull();
      }
    }
  });

  it("keeps every upper stand reachable step-free (lift alternatives exist)", () => {
    for (const upper of ["N2", "E2", "S2", "W2"]) {
      const stepFree = route("TH", upper, { stepFreeOnly: true });
      expect(stepFree, `TH -> ${upper} step-free`).not.toBeNull();
      expect(stepFree?.steps.some((s) => s.kind === "stairs" || s.kind === "escalator")).toBe(false);
    }
  });
});

describe("routing", () => {
  it("returns an empty route for identical endpoints", () => {
    const r = route("PL", "PL");
    expect(r?.steps).toHaveLength(0);
    expect(r?.totalMetres).toBe(0);
  });

  it("returns null for unknown zones", () => {
    expect(route("N1", "NOPE")).toBeNull();
    expect(route("NOPE", "N1")).toBeNull();
  });

  it("prefers stairs by distance but switches to a lift when step-free", () => {
    const normal = route("N2", "CN");
    const stepFree = route("N2", "CN", { stepFreeOnly: true });
    expect(normal?.steps[0]?.kind).toBe("stairs");
    expect(stepFree?.steps[0]?.kind).toBe("lift");
    expect(stepFree?.stepFree).toBe(true);
  });

  it("never routes over stairs or escalators when step-free is requested", () => {
    const r = route("N2", "S2", { stepFreeOnly: true });
    expect(r).not.toBeNull();
    expect(r?.steps.every((s) => s.kind !== "stairs" && s.kind !== "escalator")).toBe(true);
  });

  it("estimates at least one minute for any real journey", () => {
    const r = route("N2", "S2");
    expect(r?.estMinutes).toBeGreaterThanOrEqual(1);
  });

  it("finds the shortest path on a tiny hand-built graph", () => {
    const zones: Zone[] = [
      { id: "A", name: "A", role: "plaza", level: 1, capacity: 1, edges: [{ to: "B", kind: "walkway", metres: 10 }, { to: "C", kind: "walkway", metres: 100 }] },
      { id: "B", name: "B", role: "plaza", level: 1, capacity: 1, edges: [{ to: "C", kind: "walkway", metres: 10 }] },
      { id: "C", name: "C", role: "plaza", level: 1, capacity: 1, edges: [] },
    ];
    const r = findRoute(zones, "A", "C");
    expect(r?.totalMetres).toBe(20);
    expect(r?.steps.map((s) => s.to)).toEqual(["B", "C"]);
  });

  it("returns null when no path exists", () => {
    const zones: Zone[] = [
      { id: "A", name: "A", role: "plaza", level: 1, capacity: 1, edges: [] },
      { id: "B", name: "B", role: "plaza", level: 1, capacity: 1, edges: [] },
    ];
    expect(findRoute(zones, "A", "B")).toBeNull();
  });
});

describe("amenity search", () => {
  it("filters by type", () => {
    const results = searchAmenities({ types: ["prayer-room"] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((a) => a.type === "prayer-room")).toBe(true);
  });

  it("requires all requested dietary tags", () => {
    const results = searchAmenities({ types: ["food"], dietaryTags: ["halal"] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((a) => a.tags.includes("halal"))).toBe(true);
  });

  it("returns only accessible amenities when accessibleOnly is set", () => {
    const results = searchAmenities({ types: ["restroom", "accessible-restroom"], accessibleOnly: true });
    expect(results.every((a) => a.accessible)).toBe(true);
  });

  it("ranks by walking distance from the reference zone", () => {
    const results = searchAmenities({ types: ["food"], nearZone: "N1" });
    const distances = results.map((a) => a.walkMetres ?? Infinity);
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
    expect(results[0]?.walkMetres).toBeDefined();
  });

  it("respects the result limit", () => {
    const results = findAmenities(VENUE.zones, VENUE.amenities, { limit: 3 });
    expect(results).toHaveLength(3);
  });
});

describe("location + gate resolution", () => {
  it("resolves zone ids, section ids and names", () => {
    expect(resolveLocation("N1")).toBe("N1");
    expect(resolveLocation("224")).toBe("S2");
    expect(resolveLocation("214")).toBe("E2");
    expect(resolveLocation("North Concourse")).toBe("CN");
    expect(resolveLocation("transit")).toBe("TH");
  });

  it("returns undefined for gibberish", () => {
    expect(resolveLocation("qwerty")).toBeUndefined();
    expect(resolveLocation("")).toBeUndefined();
  });

  it("resolves gate names and ids to the zone the gate serves", () => {
    expect(resolveLocation("Gate A")).toBe("N1");
    expect(resolveLocation("gate f")).toBe("S1");
    expect(resolveLocation("g")).toBe("PL");
  });

  it("matches a lowercase zone id via the exact-name comparison", () => {
    expect(resolveLocation("cn")).toBe("CN");
  });

  it("finds a gate serving a zone", () => {
    expect(gateForZone("N2")?.id).toBe("A");
    expect(gateForZone("TH")?.id).toBe("H");
  });

  it("exposes zones by id", () => {
    expect(getZone("PL")?.name).toBe("Central Plaza");
    expect(getZone("ZZ")).toBeUndefined();
  });
});
