import { DEMO_LOOP_SECONDS } from "@/lib/constants";
import { activeIncidents, matchMinuteFromWallClock, snapshot } from "@/lib/sim";
import { crowdQuerySchema } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, errorResponse, rateLimitResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const limit = rateLimit("crowd", clientIp(req));
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSec);

  const url = new URL(req.url);
  const parsed = crowdQuerySchema.safeParse({
    minute: url.searchParams.get("minute") ?? undefined,
  });
  if (!parsed.success) {
    return errorResponse(400, "invalid_request", "The minute parameter must be between 0 and 150.");
  }

  const minute =
    parsed.data.minute ?? Math.round(matchMinuteFromWallClock(Date.now(), DEMO_LOOP_SECONDS));

  return Response.json(
    { snapshot: snapshot(minute), incidents: activeIncidents(minute) },
    { headers: { "cache-control": "public, s-maxage=5, stale-while-revalidate=10" } },
  );
}
