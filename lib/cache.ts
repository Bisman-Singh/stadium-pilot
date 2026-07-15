import { must } from "./must";

/**
 * A tiny in-memory LRU cache with per-entry TTL. Used to serve repeated,
 * non-conversational AI answers (announcements, briefings) without re-spending
 * free-tier quota. `nowMs` is injectable for deterministic tests.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LruCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string, nowMs: number = Date.now()): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= nowMs) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency: delete + re-insert moves the key to the newest position.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, nowMs: number = Date.now()): void {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt: nowMs + this.ttlMs });
    // size > maxEntries (>= 0) implies a non-empty store, so a key always exists.
    while (this.store.size > this.maxEntries) {
      this.store.delete(must(this.store.keys().next().value, "oldest cache key"));
    }
  }

  get size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}
