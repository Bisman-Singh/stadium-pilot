import type { EdgeKind, Zone } from "./types";
import { LIFT_WAIT_MIN, STAIRS_PENALTY_MIN, WALK_METRES_PER_MIN } from "../constants";
import { must } from "../must";

/**
 * Deterministic shortest-path routing over the venue zone graph. Edges are
 * authored once per connection and treated as undirected. Routes are the ground
 * truth the AI narrates; the AI never computes paths itself.
 */

export interface RouteStep {
  from: string;
  to: string;
  kind: EdgeKind;
  metres: number;
}

export interface RouteResult {
  from: string;
  to: string;
  steps: RouteStep[];
  totalMetres: number;
  estMinutes: number;
  stepFree: boolean;
}

export interface RouteOptions {
  /** Exclude stairs and escalators, forcing lifts and ramps. */
  stepFreeOnly?: boolean;
}

const BLOCKED_WHEN_STEP_FREE: ReadonlySet<EdgeKind> = new Set<EdgeKind>(["stairs", "escalator"]);

interface Adjacent {
  to: string;
  kind: EdgeKind;
  metres: number;
}

function buildAdjacency(zones: Zone[], stepFreeOnly: boolean): Map<string, Adjacent[]> {
  const adjacency = new Map<string, Adjacent[]>();
  const connect = (from: string, edge: Adjacent) => {
    const list = adjacency.get(from);
    if (list) list.push(edge);
    else adjacency.set(from, [edge]);
  };

  for (const zone of zones) {
    if (!adjacency.has(zone.id)) adjacency.set(zone.id, []);
    for (const edge of zone.edges) {
      if (stepFreeOnly && BLOCKED_WHEN_STEP_FREE.has(edge.kind)) continue;
      connect(zone.id, { to: edge.to, kind: edge.kind, metres: edge.metres });
      connect(edge.to, { to: zone.id, kind: edge.kind, metres: edge.metres });
    }
  }
  return adjacency;
}

function estimateMinutes(steps: RouteStep[]): number {
  let minutes = 0;
  for (const step of steps) {
    minutes += step.metres / WALK_METRES_PER_MIN;
    if (step.kind === "stairs" || step.kind === "escalator") minutes += STAIRS_PENALTY_MIN;
    if (step.kind === "lift") minutes += LIFT_WAIT_MIN;
  }
  return Math.max(1, Math.round(minutes));
}

/**
 * Dijkstra over a small (~12 node) graph. Returns the least-distance route, or
 * null if either endpoint is unknown or no path exists under the given filter.
 */
export function findRoute(
  zones: Zone[],
  fromId: string,
  toId: string,
  options: RouteOptions = {},
): RouteResult | null {
  const stepFree = options.stepFreeOnly ?? false;
  const zoneIds = new Set(zones.map((z) => z.id));
  if (!zoneIds.has(fromId) || !zoneIds.has(toId)) return null;
  if (fromId === toId) {
    return { from: fromId, to: toId, steps: [], totalMetres: 0, estMinutes: 0, stepFree };
  }

  const adjacency = buildAdjacency(zones, stepFree);
  const distance = new Map<string, number>();
  const previous = new Map<string, { node: string; edge: Adjacent }>();
  const visited = new Set<string>();
  for (const zone of zones) distance.set(zone.id, Infinity);
  distance.set(fromId, 0);

  while (visited.size < zones.length) {
    let current: string | null = null;
    let best = Infinity;
    for (const [node, dist] of distance) {
      if (!visited.has(node) && dist < best) {
        best = dist;
        current = node;
      }
    }
    if (current === null || best === Infinity) break;
    if (current === toId) break;
    visited.add(current);

    // `current` and every `edge.to` are zone ids seeded into both maps at setup.
    for (const edge of must(adjacency.get(current), "adjacency list")) {
      if (visited.has(edge.to)) continue;
      const candidate = best + edge.metres;
      if (candidate < must(distance.get(edge.to), "edge distance")) {
        distance.set(edge.to, candidate);
        previous.set(edge.to, { node: current, edge });
      }
    }
  }

  if (must(distance.get(toId), "target distance") === Infinity) return null;

  const steps: RouteStep[] = [];
  let cursor = toId;
  while (cursor !== fromId) {
    // A finite distance to `toId` guarantees a predecessor chain back to `fromId`.
    const step = must(previous.get(cursor), "predecessor");
    steps.unshift({ from: step.node, to: cursor, kind: step.edge.kind, metres: step.edge.metres });
    cursor = step.node;
  }

  const totalMetres = steps.reduce((sum, step) => sum + step.metres, 0);
  return {
    from: fromId,
    to: toId,
    steps,
    totalMetres,
    estMinutes: estimateMinutes(steps),
    stepFree,
  };
}
