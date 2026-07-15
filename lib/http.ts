import { MAX_BODY_BYTES } from "./constants";
import { logError } from "./log";

/** Request helpers shared by every route handler. */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Best-effort client IP for rate limiting, from proxy headers. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "anonymous";
}

/**
 * Rejects cross-site POSTs. When an Origin header is present it must match the
 * Host; requests without an Origin (server-to-server, curl) are allowed through
 * so the demo stays inspectable.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Reads and JSON-parses a request body, enforcing the size cap. */
export async function readJsonBody(req: Request): Promise<unknown> {
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new HttpError(413, "payload_too_large", "Request body is too large.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

export function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

/** Converts any thrown value into a safe JSON error response (no stack traces). */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return errorResponse(error.status, error.code, error.message);
  }
  // Unexpected failure: log server-side, return an opaque message to the client.
  logError("unhandled", error);
  return errorResponse(500, "internal_error", "Something went wrong. Please try again.");
}

export function rateLimitResponse(retryAfterSec: number): Response {
  return Response.json(
    { error: { code: "rate_limited", message: "Too many requests. Please slow down." } },
    { status: 429, headers: { "retry-after": String(retryAfterSec) } },
  );
}
