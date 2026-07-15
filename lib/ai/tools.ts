import { tool } from "ai";
import { z } from "zod";
import { DEMO_LOOP_SECONDS } from "../constants";
import {
  VENUE,
  getZone,
  resolveLocation,
  route,
  searchAmenities,
  type RouteResult,
} from "../venue";
import { matchMinuteFromWallClock, snapshot, type CrowdSnapshot } from "../sim";

/**
 * Read-only tools that ground the fan copilot in real venue data. They have no
 * side effects, so prompt injection cannot make them do anything harmful.
 */

const amenityTypeEnum = z.enum([
  "restroom",
  "accessible-restroom",
  "food",
  "water-refill",
  "first-aid",
  "prayer-room",
  "sensory-room",
  "recycling",
  "info",
  "charging",
  "atm",
  "merchandise",
]);

const dietaryEnum = z.enum(["veg", "vegan", "halal", "gluten-free", "kid-friendly"]);

/** Human-readable zone name, echoing an unrecognised id rather than throwing. */
export function zoneName(id: string): string {
  return getZone(id)?.name ?? id;
}

/** Shapes a routing result for the model, reporting the no-path case as an error. */
export function formatRoute(result: RouteResult | null) {
  if (!result) return { error: "No route is available between those points." };
  return {
    from: zoneName(result.from),
    to: zoneName(result.to),
    stepFree: result.stepFree,
    totalMetres: result.totalMetres,
    estMinutes: result.estMinutes,
    steps: result.steps.map((s) => ({ arriveAt: zoneName(s.to), via: s.kind, metres: s.metres })),
  };
}

/**
 * Crowd answer for the model. With a known zone it reports that area; otherwise
 * (no zone given, or an area we can't place) it falls back to a busiest/quietest
 * overview.
 */
export function crowdReport(snap: CrowdSnapshot, zoneId?: string) {
  const zone = zoneId ? snap.zones.find((z) => z.zoneId === zoneId) : undefined;
  if (zone) {
    return {
      phase: snap.phase,
      area: zone.name,
      level: zone.level,
      occupancyPct: Math.round(zone.density * 100),
    };
  }
  const byDensity = [...snap.zones].sort((a, b) => b.density - a.density);
  return {
    phase: snap.phase,
    busiest: byDensity.slice(0, 3).map((z) => ({ area: z.name, level: z.level })),
    quietest: byDensity
      .slice(-3)
      .reverse()
      .map((z) => ({ area: z.name, level: z.level })),
  };
}

export const fanTools = {
  findAmenity: tool({
    description:
      "Find amenities in the stadium (food, restrooms, water refill, first aid, prayer room, sensory room, recycling, charging, ATM, info, merchandise). Use dietaryTags for food requests and nearLocation to rank by walking distance.",
    inputSchema: z.object({
      types: z.array(amenityTypeEnum).optional().describe("Amenity types to include."),
      dietaryTags: z.array(dietaryEnum).optional().describe("Required tags; all must match."),
      accessibleOnly: z.boolean().optional().describe("Only step-free / accessible amenities."),
      nearLocation: z
        .string()
        .optional()
        .describe("A zone id, section number, or area name to rank results by distance."),
    }),
    execute: async ({ types, dietaryTags, accessibleOnly, nearLocation }) => {
      const nearZone = nearLocation ? resolveLocation(nearLocation) : undefined;
      const results = searchAmenities({ types, dietaryTags, accessibleOnly, nearZone, limit: 6 });
      return {
        matchCount: results.length,
        nearZone: nearZone ? zoneName(nearZone) : null,
        amenities: results.map((a) => ({
          name: a.name,
          type: a.type,
          location: zoneName(a.zoneId),
          accessible: a.accessible,
          dietaryTags: a.tags,
          note: a.note ?? null,
          walkMinutes: a.walkMinutes ?? null,
        })),
      };
    },
  }),

  getRoute: tool({
    description:
      "Get walking directions between two places in the stadium. Accepts zone ids, section numbers, or area names. Set stepFreeOnly for wheelchair or pram routes.",
    inputSchema: z.object({
      from: z.string().describe("Origin: zone id, section number, or area name."),
      to: z.string().describe("Destination: zone id, section number, or area name."),
      stepFreeOnly: z.boolean().optional().describe("Avoid stairs and escalators."),
    }),
    execute: async ({ from, to, stepFreeOnly }) => {
      const fromZone = resolveLocation(from);
      const toZone = resolveLocation(to);
      if (!fromZone) return { error: `No location matches "${from}".` };
      if (!toZone) return { error: `No location matches "${to}".` };
      return formatRoute(route(fromZone, toZone, { stepFreeOnly }));
    },
  }),

  getCrowd: tool({
    description:
      "Current crowd levels by area right now. Use for 'is it busy', when to move, or to suggest quieter routes.",
    inputSchema: z.object({
      location: z.string().optional().describe("Optional area to report on specifically."),
    }),
    execute: async ({ location }) => {
      const minute = Math.round(matchMinuteFromWallClock(Date.now(), DEMO_LOOP_SECONDS));
      const zoneId = location ? resolveLocation(location) : undefined;
      return crowdReport(snapshot(minute), zoneId);
    },
  }),

  getTransit: tool({
    description:
      "Transport options to leave the stadium: metro, shuttles, rideshare, and parking, with accessibility notes.",
    inputSchema: z.object({
      mode: z.enum(["metro", "shuttle", "rideshare", "parking"]).optional(),
      accessibleOnly: z.boolean().optional(),
    }),
    execute: async ({ mode, accessibleOnly }) => {
      let options = VENUE.transit;
      if (mode) options = options.filter((t) => t.mode === mode);
      if (accessibleOnly) options = options.filter((t) => t.accessible);
      return {
        options: options.map((t) => ({
          name: t.name,
          mode: t.mode,
          accessible: t.accessible,
          everyMinutes: t.headwayMin ?? null,
          note: t.note,
        })),
      };
    },
  }),

  getEventInfo: tool({
    description:
      "Match and venue basics: teams, kickoff time, gates-open time, venue and capacity.",
    inputSchema: z.object({}),
    execute: async () => ({
      venue: VENUE.event.venueName,
      capacity: VENUE.event.capacity,
      competition: VENUE.event.competition,
      fixture: VENUE.event.fixture,
      kickoff: VENUE.event.kickoffLocal,
      gatesOpen: VENUE.event.gatesOpenLocal,
    }),
  }),
};
