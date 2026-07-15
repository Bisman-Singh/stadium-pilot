import { VENUE } from "./data";
import type { Section, Zone } from "./types";

/** Lookup helpers that turn user-facing names into zone ids. */

const zonesById = new Map<string, Zone>(VENUE.zones.map((z) => [z.id, z]));
const sectionsById = new Map<string, Section>(VENUE.sections.map((s) => [s.id, s]));

/** Zone by exact id. */
export function getZone(id: string): Zone | undefined {
  return zonesById.get(id);
}

/**
 * Resolves a free-form location (zone id, section id, zone name, or gate) to a
 * zone id. Returns undefined when nothing matches, so callers can ask the user
 * to clarify.
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
  if (byPartialName) return byPartialName.id;

  // Fans and stewards name gates ("Gate A"); resolve to the first zone it
  // serves. An exact gate id wins over a name fragment, as with zones.
  const gate =
    VENUE.gates.find((g) => g.id.toLowerCase() === lower) ??
    VENUE.gates.find((g) => g.name.toLowerCase().includes(lower));
  return gate?.servesZones[0];
}
