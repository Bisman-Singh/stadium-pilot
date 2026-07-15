import { generateStructured } from "@/lib/ai/client";
import { actionCardSchema } from "@/lib/ai/schemas";
import { actionCardSystem } from "@/lib/ai/prompts";
import { actionBodySchema } from "@/lib/validate";
import { guardPost } from "@/lib/api-guard";
import { errorResponse, toErrorResponse } from "@/lib/http";
import { incidentById, snapshot } from "@/lib/sim";
import { VENUE, getZone } from "@/lib/venue";

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  try {
    const guard = await guardPost(req, "ops", actionBodySchema);
    if (!guard.ok) return guard.response;

    const incident = incidentById(guard.data.incidentId);
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
