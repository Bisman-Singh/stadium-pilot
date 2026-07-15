/**
 * Small deterministic PRNG helpers. The crowd model is a pure function of the
 * match minute, so all "randomness" is seeded and reproducible — identical on
 * every server instance and in tests.
 */

/** FNV-1a hash of a string to an unsigned 32-bit integer. */
export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32: a compact, well-distributed seeded generator returning [0, 1). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic noise in [-amplitude, amplitude] for a (key, bucket) pair.
 * Same inputs always yield the same value, so a given minute never flickers.
 */
export function noise(key: string, bucket: number, amplitude: number): number {
  const seed = hashString(key) ^ Math.imul(bucket + 1, 2654435761);
  const rand = mulberry32(seed >>> 0);
  return (rand() * 2 - 1) * amplitude;
}
