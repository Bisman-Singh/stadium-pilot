import type { Amenity, AmenityType, DietaryTag, Zone } from "./types";
import { findRoute } from "./graph";

/**
 * Filter and rank amenities. When `nearZone` is given, results are sorted by
 * walking distance using the same routing engine that powers navigation.
 */

export interface AmenityQuery {
  types?: AmenityType[];
  /** All listed tags must be present on a matching amenity. */
  dietaryTags?: DietaryTag[];
  accessibleOnly?: boolean;
  nearZone?: string;
  limit?: number;
}

export interface RankedAmenity extends Amenity {
  walkMetres?: number;
  walkMinutes?: number;
}

const DEFAULT_LIMIT = 8;

export function findAmenities(
  zones: Zone[],
  amenities: Amenity[],
  query: AmenityQuery = {},
): RankedAmenity[] {
  const { types, dietaryTags, accessibleOnly, nearZone, limit = DEFAULT_LIMIT } = query;

  const matches: RankedAmenity[] = amenities.filter((amenity) => {
    if (types && types.length > 0 && !types.includes(amenity.type)) return false;
    if (accessibleOnly && !amenity.accessible) return false;
    if (dietaryTags && dietaryTags.length > 0) {
      const hasAll = dietaryTags.every((tag) => amenity.tags.includes(tag));
      if (!hasAll) return false;
    }
    return true;
  });

  if (!nearZone) return matches.slice(0, limit);

  const ranked = matches.map((amenity) => {
    if (amenity.zoneId === nearZone) return { ...amenity, walkMetres: 0, walkMinutes: 0 };
    const route = findRoute(zones, nearZone, amenity.zoneId);
    return { ...amenity, walkMetres: route?.totalMetres, walkMinutes: route?.estMinutes };
  });

  const distance = (a: RankedAmenity) => a.walkMetres ?? Infinity;
  ranked.sort((a, b) => distance(a) - distance(b));
  return ranked.slice(0, limit);
}
