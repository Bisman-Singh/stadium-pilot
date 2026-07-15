import { describe, it, expect } from "vitest";
import { activeIncidents, snapshot } from "@/lib/sim";
import { validateVenue } from "@/lib/venue/schema";
import { VENUE, searchAmenities } from "@/lib/venue";
import { findAmenities } from "@/lib/venue/amenities";
import type { Amenity, Zone } from "@/lib/venue/types";
import { fanSystemPrompt } from "@/lib/ai/prompts";
import { fanTools, zoneName, formatRoute, crowdReport } from "@/lib/ai/tools";
import { LruCache } from "@/lib/cache";
import { RateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

type ExecFn = (input: unknown, options: unknown) => Promise<unknown>;
async function runTool(tool: unknown, input: unknown): Promise<Record<string, unknown>> {
  const exec = (tool as { execute?: ExecFn }).execute;
  if (!exec) throw new Error("no execute");
  return (await exec(input, { toolCallId: "t", messages: [] })) as Record<string, unknown>;
}

describe("incident ordering tiebreak", () => {
  it("orders equal-severity incidents by start time", () => {
    // Minute 145: weather (medium, starts 118) and transport (medium, starts 144) overlap.
    const active = activeIncidents(145);
    const medium = active.filter((i) => i.severity === "medium");
    expect(medium.length).toBeGreaterThanOrEqual(2);
    expect(medium[0].startMinute).toBeLessThan(medium[1].startMinute);
  });
});

describe("validateVenue wrapper", () => {
  it("parses and returns the live venue", () => {
    expect(validateVenue(VENUE).event.venueName).toBe("Crescent Bay Stadium");
  });
});

describe("system prompt locale line", () => {
  it("names the interface language when a locale is given", () => {
    expect(fanSystemPrompt({ locale: "es" })).toContain("Spanish");
  });
});

describe("cache overwrite", () => {
  it("updates the value for an existing key without growing", () => {
    const cache = new LruCache<number>(3, 1000);
    cache.set("k", 1, 0);
    cache.set("k", 2, 0);
    expect(cache.get("k", 0)).toBe(2);
    expect(cache.size).toBe(1);
  });
});

describe("rate limiter zero limit", () => {
  it("blocks immediately and still returns a retry hint", () => {
    const limiter = new RateLimiter(0, 1000);
    const result = limiter.check("ip", 0);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSec).toBeGreaterThanOrEqual(1);
  });
});

describe("clientIp with an empty forwarded segment", () => {
  it("falls back to x-real-ip when the first segment is blank", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": ", 9.9.9.9", "x-real-ip": "8.8.8.8" },
    });
    expect(clientIp(req)).toBe("8.8.8.8");
  });
});

describe("amenity in the reference zone", () => {
  it("ranks an amenity in the reference zone at zero distance", () => {
    const results = searchAmenities({ types: ["food"], nearZone: "PL" });
    expect(results.some((a) => a.walkMetres === 0)).toBe(true);
  });
});

describe("tool fallback branches", () => {
  it("findAmenity without a location returns notes and null distances", async () => {
    const result = await runTool(fanTools.findAmenity, { types: ["first-aid"] });
    const amenities = result.amenities as { note: string | null; walkMinutes: number | null }[];
    expect(amenities.length).toBeGreaterThan(0);
    expect(amenities.some((a) => a.note !== null)).toBe(true);
    expect(amenities.every((a) => a.walkMinutes === null)).toBe(true);
    expect(result.nearZone).toBeNull();
  });

  it("getTransit with no filters returns every option", async () => {
    const result = await runTool(fanTools.getTransit, {});
    expect((result.options as unknown[]).length).toBe(VENUE.transit.length);
  });

  it("getRoute errors on an unknown origin", async () => {
    const result = await runTool(fanTools.getRoute, { from: "nowhere-place", to: "PL" });
    expect(result.error).toContain("nowhere-place");
  });
});

describe("response formatters handle unknown inputs defensively", () => {
  it("zoneName echoes an id it cannot resolve instead of throwing", () => {
    expect(zoneName("CN")).toBe("North Concourse");
    expect(zoneName("not-a-real-zone")).toBe("not-a-real-zone");
  });

  it("formatRoute reports the no-path case as an error", () => {
    expect(formatRoute(null)).toEqual({
      error: "No route is available between those points.",
    });
  });

  it("crowdReport falls back to an overview when the zone cannot be placed", () => {
    const report = crowdReport(snapshot(50), "not-a-real-zone");
    expect(report).toHaveProperty("busiest");
    expect(report).toHaveProperty("quietest");
    expect(report).not.toHaveProperty("area");
  });
});

describe("amenity ranking with an unreachable zone", () => {
  it("sorts an amenity in a disconnected zone last with no distance", () => {
    const zones: Zone[] = [
      { id: "X", name: "X", role: "plaza", level: 1, capacity: 1, edges: [] },
      { id: "Y", name: "Y", role: "plaza", level: 1, capacity: 1, edges: [] },
    ];
    const amenities: Amenity[] = [
      { id: "near", name: "Near", type: "food", zoneId: "X", accessible: true, tags: [] },
      { id: "far", name: "Far", type: "food", zoneId: "Y", accessible: true, tags: [] },
    ];
    const results = findAmenities(zones, amenities, { nearZone: "X" });
    expect(results[0].id).toBe("near");
    expect(results[results.length - 1].id).toBe("far");
    expect(results.find((r) => r.id === "far")?.walkMetres).toBeUndefined();
  });
});
