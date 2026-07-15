import { generateProse } from "@/lib/ai/client";
import { briefingSystem } from "@/lib/ai/prompts";
import { briefingBodySchema } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";
import { LruCache } from "@/lib/cache";
import {
  clientIp,
  errorResponse,
  isSameOrigin,
  rateLimitResponse,
  readJsonBody,
  toErrorResponse,
} from "@/lib/http";
import { VENUE, getZone } from "@/lib/venue";

export const maxDuration = 30;

const cache = new LruCache<string>(100, 10 * 60 * 1000);

export async function POST(req: Request): Promise<Response> {
  try {
    if (!isSameOrigin(req)) {
      return errorResponse(403, "forbidden", "Cross-origin requests are not allowed.");
    }
    const limit = rateLimit("ops", clientIp(req));
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSec);

    const parsed = briefingBodySchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return errorResponse(400, "invalid_request", "The request was not valid.");

    const { gateId, shift } = parsed.data;
    const gate = VENUE.gates.find((g) => g.id === gateId.toUpperCase());
    if (!gate) return errorResponse(404, "not_found", "Unknown gate.");

    const key = JSON.stringify({ gateId: gate.id, shift });
    const cached = cache.get(key);
    if (cached) return Response.json({ gateId: gate.id, briefing: cached, cached: true });

    const zonesServed = gate.servesZones.map((z) => getZone(z)?.name ?? z).join(", ");
    const prompt = `Write a volunteer shift briefing.\nGate: ${gate.name}\nAreas served: ${zonesServed}\nMatch phase: ${shift}\nVenue: ${VENUE.event.venueName}, fixture ${VENUE.event.fixture}.`;

    const briefing = await generateProse(briefingSystem, prompt);
    cache.set(key, briefing);
    return Response.json({ gateId: gate.id, briefing, cached: false });
  } catch (error) {
    return toErrorResponse(error);
  }
}
