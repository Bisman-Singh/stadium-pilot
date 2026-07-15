import { z } from "zod";
import type { VenueData } from "./types";

/**
 * Runtime validation for the venue data pack. Beyond shape checks, `superRefine`
 * enforces referential integrity so a typo in the data fails loudly in tests
 * rather than producing a broken route at runtime.
 */

const edgeKind = z.enum(["walkway", "stairs", "escalator", "lift", "ramp", "gate"]);
const zoneRole = z.enum(["stand", "concourse", "plaza", "transit", "gate"]);
const amenityType = z.enum([
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
const dietaryTag = z.enum(["veg", "vegan", "halal", "gluten-free", "kid-friendly"]);
const transitMode = z.enum(["metro", "shuttle", "rideshare", "parking"]);
const sectionTier = z.enum(["lower", "upper", "premium"]);

const zoneEdgeSchema = z.object({
  to: z.string().min(1),
  kind: edgeKind,
  metres: z.number().positive(),
});

const zoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: zoneRole,
  level: z.number().int(),
  capacity: z.number().int().nonnegative(),
  edges: z.array(zoneEdgeSchema),
});

const amenitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: amenityType,
  zoneId: z.string().min(1),
  accessible: z.boolean(),
  tags: z.array(dietaryTag),
  note: z.string().optional(),
});

const gateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  servesZones: z.array(z.string().min(1)).min(1),
  throughputPerMin: z.number().positive(),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  zoneId: z.string().min(1),
  tier: sectionTier,
});

const transitSchema = z.object({
  id: z.string().min(1),
  mode: transitMode,
  name: z.string().min(1),
  headwayMin: z.number().positive().optional(),
  accessible: z.boolean(),
  note: z.string().min(1),
});

const eventSchema = z.object({
  venueName: z.string().min(1),
  capacity: z.number().int().positive(),
  competition: z.string().min(1),
  fixture: z.string().min(1),
  kickoffLocal: z.string().min(1),
  gatesOpenLocal: z.string().min(1),
  localTimezone: z.string().min(1),
});

export const venueSchema = z
  .object({
    event: eventSchema,
    zones: z.array(zoneSchema).min(1),
    gates: z.array(gateSchema),
    sections: z.array(sectionSchema),
    amenities: z.array(amenitySchema),
    transit: z.array(transitSchema),
  })
  .superRefine((data, ctx) => {
    const zoneIds = new Set(data.zones.map((z) => z.id));
    const addIssue = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: "custom", message, path });

    data.zones.forEach((zone, zi) => {
      zone.edges.forEach((edge, ei) => {
        if (!zoneIds.has(edge.to)) {
          addIssue(`edge target "${edge.to}" is not a known zone`, ["zones", zi, "edges", ei, "to"]);
        }
        if (edge.to === zone.id) {
          addIssue(`zone "${zone.id}" has a self-edge`, ["zones", zi, "edges", ei]);
        }
      });
    });

    data.amenities.forEach((a, i) => {
      if (!zoneIds.has(a.zoneId)) {
        addIssue(`amenity "${a.id}" references unknown zone "${a.zoneId}"`, ["amenities", i, "zoneId"]);
      }
    });

    data.gates.forEach((g, i) => {
      g.servesZones.forEach((zid, zi) => {
        if (!zoneIds.has(zid)) {
          addIssue(`gate "${g.id}" serves unknown zone "${zid}"`, ["gates", i, "servesZones", zi]);
        }
      });
    });

    data.sections.forEach((s, i) => {
      if (!zoneIds.has(s.zoneId)) {
        addIssue(`section "${s.id}" references unknown zone "${s.zoneId}"`, ["sections", i, "zoneId"]);
      }
    });

    const ids = [
      ...data.zones.map((z) => z.id),
      ...data.amenities.map((a) => a.id),
      ...data.gates.map((g) => g.id),
    ];
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) addIssue(`duplicate id "${id}"`, []);
      seen.add(id);
    }
  });

/** Parses and validates raw data, throwing a descriptive error on any problem. */
export function validateVenue(data: unknown): VenueData {
  return venueSchema.parse(data) as VenueData;
}
