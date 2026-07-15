/**
 * Minimal structured logging with no dependencies. Lines are JSON so they are
 * queryable in Vercel logs. Never log request bodies, secrets, or PII.
 */

export function logError(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ level: "error", scope, message }));
}

export function logEvent(scope: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({ level: "info", scope, ...data }));
}
