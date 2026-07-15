import type { z } from "zod";
import type { RATE_LIMITS } from "./constants";
import { rateLimit } from "./rate-limit";
import { clientIp, errorResponse, isSameOrigin, rateLimitResponse, readJsonBody } from "./http";

/**
 * Shared preamble for every JSON POST route: same-origin check, per-IP rate
 * limit, then schema validation. Routes stay focused on their domain logic and
 * the three rejection responses are identical everywhere.
 */

export type GuardResult<T> = { ok: true; data: T } | { ok: false; response: Response };

export async function guardPost<T>(
  req: Request,
  limiter: keyof typeof RATE_LIMITS,
  schema: z.ZodType<T>,
): Promise<GuardResult<T>> {
  if (!isSameOrigin(req)) {
    return {
      ok: false,
      response: errorResponse(403, "forbidden", "Cross-origin requests are not allowed."),
    };
  }

  const limit = rateLimit(limiter, clientIp(req));
  if (!limit.allowed) return { ok: false, response: rateLimitResponse(limit.retryAfterSec) };

  const parsed = schema.safeParse(await readJsonBody(req));
  if (!parsed.success) {
    return {
      ok: false,
      response: errorResponse(400, "invalid_request", "The request was not valid."),
    };
  }

  return { ok: true, data: parsed.data };
}
