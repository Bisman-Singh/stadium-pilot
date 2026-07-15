/**
 * Central configuration for StadiumPilot. Every tunable value lives here so no
 * magic numbers leak into feature code.
 */

export const APP_NAME = "StadiumPilot";
export const APP_VERSION = "1.0.0";
export const APP_TAGLINE = "A GenAI companion for World Cup 2026 match days";
export const DISCLAIMER =
  "Unofficial demo. Not affiliated with FIFA or any real venue. All venue data is synthetic.";

/** Supported UI languages. AI answers are not limited to these. */
export const SUPPORTED_LOCALES = ["en", "es", "fr", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: readonly Locale[] = ["ar"];

/**
 * The match runs on a compressed timeline mapped to minutes 0..150:
 * 0-30 pre-gates, 30-45 ingress, 45-90 first half, 90-105 halftime,
 * 105-150 second half, 150 onward egress. This keeps a live demo always moving.
 */
export const MATCH_WINDOW_MINUTES = 150;
export const DEMO_LOOP_SECONDS = 720; // one full cycle every 12 real minutes

/** Crowd density is normalised 0..1. */
export const DENSITY_ALERT = 0.85;
export const DENSITY_WARN = 0.7;

/** Walking model for route time estimates. */
export const WALK_METRES_PER_MIN = 75;
export const STAIRS_PENALTY_MIN = 1.5;
export const LIFT_WAIT_MIN = 2;

/** AI generation caps to protect the free-tier quota. */
export const CHAT_MAX_OUTPUT_TOKENS = 1024;
export const STRUCTURED_MAX_OUTPUT_TOKENS = 2048;
export const CHAT_MAX_STEPS = 6;

/** Request guards. */
export const MAX_BODY_BYTES = 16_384;
export const MAX_CHAT_MESSAGES = 40;

/** Per-IP rate limits: { limit, windowMs }. */
export const RATE_LIMITS = {
  chat: { limit: 12, windowMs: 60_000 },
  crowd: { limit: 60, windowMs: 60_000 },
  ops: { limit: 8, windowMs: 60_000 },
  report: { limit: 3, windowMs: 60_000 },
} as const;

/** Server-side caching of repeatable AI answers (saves free-tier quota). */
export const AI_CACHE_TTL_MS = 10 * 60 * 1000;
export const ANNOUNCE_CACHE_ENTRIES = 200;
export const BRIEFING_CACHE_ENTRIES = 100;

/** UI timings. */
export const OPS_POLL_MS = 5_000;
export const COPY_FEEDBACK_MS = 1_500;
