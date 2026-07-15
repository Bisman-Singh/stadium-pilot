/**
 * Domain model for a stadium. The data is synthetic and venue-agnostic: swap the
 * data pack in `data.ts` (validated by `schema.ts`) to describe any venue.
 */

/** How two zones connect. `stairs` and `escalator` are excluded from step-free routes. */
export type EdgeKind = "walkway" | "stairs" | "escalator" | "lift" | "ramp" | "gate";

export interface ZoneEdge {
  to: string;
  kind: EdgeKind;
  metres: number;
}

export type ZoneRole = "stand" | "concourse" | "plaza" | "transit" | "gate";

export interface Zone {
  id: string;
  name: string;
  role: ZoneRole;
  /** Level in the venue; used for accessibility hints. */
  level: number;
  /** Nominal standing/seating capacity, used by the crowd model. */
  capacity: number;
  edges: ZoneEdge[];
}

export type AmenityType =
  | "restroom"
  | "accessible-restroom"
  | "food"
  | "water-refill"
  | "first-aid"
  | "prayer-room"
  | "sensory-room"
  | "recycling"
  | "info"
  | "charging"
  | "atm"
  | "merchandise";

export type DietaryTag = "veg" | "vegan" | "halal" | "gluten-free" | "kid-friendly";

export interface Amenity {
  id: string;
  name: string;
  type: AmenityType;
  zoneId: string;
  accessible: boolean;
  tags: DietaryTag[];
  note?: string;
}

export interface Gate {
  id: string;
  name: string;
  servesZones: string[];
  throughputPerMin: number;
}

export type SectionTier = "lower" | "upper" | "premium";

export interface Section {
  id: string;
  zoneId: string;
  tier: SectionTier;
}

export type TransitMode = "metro" | "shuttle" | "rideshare" | "parking";

export interface TransitOption {
  id: string;
  mode: TransitMode;
  name: string;
  /** Service interval in minutes, where applicable. */
  headwayMin?: number;
  accessible: boolean;
  note: string;
}

export interface EventInfo {
  venueName: string;
  capacity: number;
  competition: string;
  fixture: string;
  kickoffLocal: string;
  gatesOpenLocal: string;
  localTimezone: string;
}

export interface VenueData {
  event: EventInfo;
  zones: Zone[];
  gates: Gate[];
  sections: Section[];
  amenities: Amenity[];
  transit: TransitOption[];
}
