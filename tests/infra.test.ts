import { describe, it, expect } from "vitest";
import { LruCache } from "@/lib/cache";
import { RateLimiter, rateLimit } from "@/lib/rate-limit";
import {
  clientIp,
  isSameOrigin,
  readJsonBody,
  toErrorResponse,
  HttpError,
} from "@/lib/http";
import {
  chatBodySchema,
  announceBodySchema,
  reportBodySchema,
  crowdQuerySchema,
} from "@/lib/validate";

describe("LruCache", () => {
  it("stores and returns values", () => {
    const cache = new LruCache<number>(3, 1000);
    cache.set("a", 1, 0);
    expect(cache.get("a", 100)).toBe(1);
  });

  it("expires entries after the TTL", () => {
    const cache = new LruCache<number>(3, 1000);
    cache.set("a", 1, 0);
    expect(cache.get("a", 1001)).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("evicts the least recently used entry past capacity", () => {
    const cache = new LruCache<number>(2, 10_000);
    cache.set("a", 1, 0);
    cache.set("b", 2, 0);
    cache.get("a", 0); // touch a so b is now oldest
    cache.set("c", 3, 0);
    expect(cache.get("a", 0)).toBe(1);
    expect(cache.get("b", 0)).toBeUndefined();
    expect(cache.get("c", 0)).toBe(3);
  });
});

describe("RateLimiter", () => {
  it("allows up to the limit then blocks with a retry hint", () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 10).allowed).toBe(true);
    const blocked = limiter.check("ip", 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it("recovers once the window passes", () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 500).allowed).toBe(false);
    expect(limiter.check("ip", 1001).allowed).toBe(true);
  });

  it("isolates keys", () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
  });

  it("named wrapper allows the first request", () => {
    expect(rateLimit("crowd", "fresh-key").allowed).toBe(true);
  });
});

function post(headers: Record<string, string>, body?: string): Request {
  return new Request("http://stadium.test/api", { method: "POST", headers, body });
}

describe("http helpers", () => {
  it("extracts the first forwarded client IP", () => {
    expect(clientIp(post({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
    expect(clientIp(post({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIp(post({}))).toBe("anonymous");
  });

  it("accepts same-origin and missing-origin, rejects cross-origin", () => {
    expect(isSameOrigin(post({ host: "stadium.test", origin: "http://stadium.test" }))).toBe(true);
    expect(isSameOrigin(post({ host: "stadium.test" }))).toBe(true);
    expect(isSameOrigin(post({ host: "stadium.test", origin: "http://evil.test" }))).toBe(false);
  });

  it("parses valid JSON and rejects invalid or oversized bodies", async () => {
    await expect(readJsonBody(post({}, JSON.stringify({ ok: true })))).resolves.toEqual({ ok: true });
    await expect(readJsonBody(post({}, "not json"))).rejects.toBeInstanceOf(HttpError);
    const huge = JSON.stringify({ x: "a".repeat(20_000) });
    await expect(readJsonBody(post({}, huge))).rejects.toMatchObject({ status: 413 });
  });

  it("maps errors to safe responses", () => {
    expect(toErrorResponse(new HttpError(400, "bad", "nope")).status).toBe(400);
    expect(toErrorResponse(new Error("boom")).status).toBe(500);
  });
});

describe("input validation", () => {
  it("accepts a valid chat body and rejects empty message lists", () => {
    expect(
      chatBodySchema.safeParse({ messages: [{ role: "user", parts: [] }] }).success,
    ).toBe(true);
    expect(chatBodySchema.safeParse({ messages: [] }).success).toBe(false);
  });

  it("validates announcement tone and language bounds", () => {
    expect(
      announceBodySchema.safeParse({ topic: "Gate change", tone: "calm", languages: ["en", "es"] })
        .success,
    ).toBe(true);
    expect(
      announceBodySchema.safeParse({ topic: "x", tone: "calm", languages: ["en"] }).success,
    ).toBe(false); // topic too short
    expect(
      announceBodySchema.safeParse({ topic: "Gate change", tone: "screaming", languages: ["en"] })
        .success,
    ).toBe(false);
  });

  it("bounds report minute and coerces crowd query minute", () => {
    expect(reportBodySchema.safeParse({ upToMinute: 90 }).success).toBe(true);
    expect(reportBodySchema.safeParse({ upToMinute: 999 }).success).toBe(false);
    const parsed = crowdQuerySchema.parse({ minute: "42" });
    expect(parsed.minute).toBe(42);
  });
});
