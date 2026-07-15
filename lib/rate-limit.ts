import { RATE_LIMITS } from "./constants";

/**
 * Per-key sliding-window rate limiting held in memory. This bounds abuse and
 * protects the shared AI quota. It is per-instance by design (documented in
 * SECURITY.md); body-size and token caps bound the blast radius across
 * instances. `nowMs` is injectable for deterministic tests.
 */

export interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, nowMs: number = Date.now()): RateResult {
    const windowStart = nowMs - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (recent.length >= this.limit) {
      const earliest = recent[0] ?? nowMs;
      const retryAfterSec = Math.max(1, Math.ceil((earliest + this.windowMs - nowMs) / 1000));
      this.hits.set(key, recent);
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    recent.push(nowMs);
    this.hits.set(key, recent);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterSec: 0 };
  }

  reset(): void {
    this.hits.clear();
  }
}

const limiters = new Map<string, RateLimiter>();

/** Shared limiter per named route, configured from RATE_LIMITS. */
export function rateLimit(
  name: keyof typeof RATE_LIMITS,
  key: string,
  nowMs?: number,
): RateResult {
  let limiter = limiters.get(name);
  if (!limiter) {
    const config = RATE_LIMITS[name];
    limiter = new RateLimiter(config.limit, config.windowMs);
    limiters.set(name, limiter);
  }
  return limiter.check(key, nowMs);
}
