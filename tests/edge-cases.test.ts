import { describe, it, expect, vi } from "vitest";
import { venueSchema } from "@/lib/venue/schema";
import { LruCache } from "@/lib/cache";
import { RateLimiter } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/http";
import { logEvent, logError } from "@/lib/log";
import { must } from "@/lib/must";
import { fanTools } from "@/lib/ai/tools";
import { runTool } from "./helpers";

const baseVenue = {
  event: {
    venueName: "V",
    capacity: 100,
    competition: "C",
    fixture: "F",
    kickoffLocal: "19:00",
    gatesOpenLocal: "17:00",
    localTimezone: "local",
  },
  zones: [
    {
      id: "A",
      name: "Alpha",
      role: "plaza",
      level: 1,
      capacity: 10,
      edges: [{ to: "B", kind: "walkway", metres: 10 }],
    },
    { id: "B", name: "Bravo", role: "stand", level: 1, capacity: 10, edges: [] },
  ],
  gates: [{ id: "G", name: "Gate", servesZones: ["A"], throughputPerMin: 100 }],
  sections: [{ id: "1", zoneId: "A", tier: "lower" }],
  amenities: [{ id: "am", name: "Am", type: "food", zoneId: "A", accessible: true, tags: [] }],
  transit: [{ id: "t", mode: "metro", name: "Metro", accessible: true, note: "n" }],
};

describe("venue schema referential integrity", () => {
  it("accepts the valid base", () => {
    expect(venueSchema.safeParse(baseVenue).success).toBe(true);
  });

  it("rejects an edge to an unknown zone", () => {
    const bad = structuredClone(baseVenue);
    bad.zones[0].edges[0].to = "ZZZ";
    expect(venueSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a self-edge", () => {
    const bad = structuredClone(baseVenue);
    bad.zones[0].edges[0].to = "A";
    expect(venueSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an amenity, gate, or section referencing an unknown zone", () => {
    const badAmenity = structuredClone(baseVenue);
    badAmenity.amenities[0].zoneId = "ZZZ";
    expect(venueSchema.safeParse(badAmenity).success).toBe(false);

    const badGate = structuredClone(baseVenue);
    badGate.gates[0].servesZones = ["ZZZ"];
    expect(venueSchema.safeParse(badGate).success).toBe(false);

    const badSection = structuredClone(baseVenue);
    badSection.sections[0].zoneId = "ZZZ";
    expect(venueSchema.safeParse(badSection).success).toBe(false);
  });

  it("rejects duplicate ids across entities", () => {
    const bad = structuredClone(baseVenue);
    bad.gates[0].id = "A"; // collides with a zone id
    expect(venueSchema.safeParse(bad).success).toBe(false);
  });
});

describe("utility surface", () => {
  it("clears the cache", () => {
    const cache = new LruCache<number>(4, 1000);
    cache.set("a", 1, 0);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("resets the rate limiter", () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 1).allowed).toBe(false);
    limiter.reset();
    expect(limiter.check("ip", 2).allowed).toBe(true);
  });

  it("treats a malformed Origin header as cross-origin", () => {
    const req = new Request("http://x/api", {
      method: "POST",
      headers: { origin: "http://[not-a-valid-host", host: "x" },
    });
    expect(isSameOrigin(req)).toBe(false);
  });

  it("must returns present values and fails loudly on undefined", () => {
    expect(must(5, "number")).toBe(5);
    expect(() => must(undefined, "missing thing")).toThrow(
      "Invariant violated: missing missing thing",
    );
  });

  it("logs without throwing", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logEvent("scope", { a: 1 });
    logError("scope", new Error("boom"));
    logError("scope", "string error");
    expect(infoSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(2);
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

describe("getCrowd for a specific location", () => {
  it("returns an area-level reading when the location resolves", async () => {
    const result = await runTool<{ area: string; occupancyPct: number }>(fanTools.getCrowd, {
      location: "North Concourse",
    });
    expect(result.area).toBe("North Concourse");
    expect(typeof result.occupancyPct).toBe("number");
  });
});
