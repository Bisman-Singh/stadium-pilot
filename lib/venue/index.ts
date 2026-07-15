import { VENUE } from "./data";
import { findRoute, type RouteOptions, type RouteResult } from "./graph";
import { findAmenities, type AmenityQuery, type RankedAmenity } from "./amenities";
import type { Gate, Section, Zone } from "./types";

export { VENUE };
export * from "./types";
export type { RouteResult, RouteStep, RouteOptions } from "./graph";
export type { AmenityQuery, RankedAmenity } from "./amenities";

const zonesById = new Map<string, Zone>(VENUE.zones.map((z) => [z.id, z]));
const sectionsById = new Map<string, Section>(VENUE.sections.map((s) => [s.id, s]));

export function listZones(): Zone[] {
  return VENUE.zones;
}

export function getZone(id: string): Zone | undefined {
  return zonesById.get(id);
}

/** Routes between two zones using the shared graph engine. */
export function route(from: string, to: string, options?: RouteOptions): RouteResult | null {
  return findRoute(VENUE.zones, from, to, options);
}

/** Searches amenities, ranking by walking distance when `nearZone` is set. */
export function searchAmenities(query: AmenityQuery): RankedAmenity[] {
  return findAmenities(VENUE.zones, VENUE.amenities, query);
}

/** The first gate serving a given zone, if any. */
export function gateForZone(zoneId: string): Gate | undefined {
  return VENUE.gates.find((gate) => gate.servesZones.includes(zoneId));
}

/**
 * Resolves a free-form location (zone id, section id, or zone name) to a zone id.
 * Returns undefined when nothing matches, so callers can ask the user to clarify.
 */
export function resolveLocation(input: string): string | undefined {
  const raw = input.trim();
  if (raw.length === 0) return undefined;
  if (zonesById.has(raw)) return raw;

  const section = sectionsById.get(raw);
  if (section) return section.zoneId;

  const lower = raw.toLowerCase();
  const byExactName = VENUE.zones.find(
    (zone) => zone.name.toLowerCase() === lower || zone.id.toLowerCase() === lower,
  );
  if (byExactName) return byExactName.id;

  const byPartialName = VENUE.zones.find((zone) => zone.name.toLowerCase().includes(lower));
  return byPartialName?.id;
}
