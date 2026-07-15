import { generateStructured } from "@/lib/ai/client";
import { actionCardSchema } from "@/lib/ai/schemas";
import { actionCardSystem } from "@/lib/ai/prompts";
import { actionBodySchema } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";
import {
  clientIp,
  errorResponse,
  isSameOrigin,
  rateLimitResponse,
  readJsonBody,
  toErrorResponse,
} from "@/lib/http";
import { incidentById, snapshot } from "@/lib/sim";
import { VENUE, getZone } from "@/lib/venue";

export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  try {
    if (!isSameOrigin(req)) {
      return errorResponse(403, "forbidden", "Cross-origin requests are not allowed.");
    }
    const limit = rateLimit("ops", clientIp(req));
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSec);

    const parsed = actionBodySchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return errorResponse(400, "invalid_request", "The request was not valid.");

    const incident = incidentById(parsed.data.incidentId);
    if (!incident) return errorResponse(404, "not_found", "Unknown incident.");

    const snap = snapshot(incident.startMinute);
    const zone = snap.zones.find((z) => z.zoneId === incident.zoneId);
    const context = {
      venue: VENUE.event.venueName,
      phase: snap.phase,
      incident: {
        kind: incident.kind,
        severity: incident.severity,
        title: incident.title,
        detail: incident.detail,
        area: getZone(incident.zoneId)?.name ?? incident.zoneId,
      },
      areaOccupancyPct: zone ? Math.round(zone.density * 100) : null,
    };

    const card = await generateStructured(
      actionCardSchema,
      actionCardSystem,
      `Produce an action card for this incident.\nContext: ${JSON.stringify(context)}`,
    );

    return Response.json({ incidentId: incident.id, incident, card });
  } catch (error) {
    return toErrorResponse(error);
  }
}
