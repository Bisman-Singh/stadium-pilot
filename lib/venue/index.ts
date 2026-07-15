import { VENUE } from "./data";
import { findRoute, type RouteOptions, type RouteResult } from "./graph";
import { findAmenities, type AmenityQuery, type RankedAmenity } from "./amenities";
import type { Zone } from "./types";

export { VENUE };
export * from "./types";
export type { RouteResult, RouteStep, RouteOptions } from "./graph";
export type { AmenityQuery, RankedAmenity } from "./amenities";
export { getZone, resolveLocation } from "./locate";

export function listZones(): Zone[] {
  return VENUE.zones;
}

/** Routes between two zones using the shared graph engine. */
export function route(from: string, to: string, options?: RouteOptions): RouteResult | null {
  return findRoute(VENUE.zones, from, to, options);
}

/** Searches amenities, ranking by walking distance when `nearZone` is set. */
export function searchAmenities(query: AmenityQuery): RankedAmenity[] {
  return findAmenities(VENUE.zones, VENUE.amenities, query);
}
