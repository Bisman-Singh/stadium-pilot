import { generateProse } from "@/lib/ai/client";
import { briefingSystem } from "@/lib/ai/prompts";
import { briefingBodySchema } from "@/lib/validate";
import { guardPost } from "@/lib/api-guard";
import { errorResponse, toErrorResponse } from "@/lib/http";
import { LruCache } from "@/lib/cache";
import { VENUE, getZone } from "@/lib/venue";

export const maxDuration = 30;

const cache = new LruCache<string>(100, 10 * 60 * 1000);

export async function POST(req: Request): Promise<Response> {
  try {
    const guard = await guardPost(req, "ops", briefingBodySchema);
    if (!guard.ok) return guard.response;

    const { gateId, shift } = guard.data;
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
