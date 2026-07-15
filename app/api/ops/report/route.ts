import { generateProse } from "@/lib/ai/client";
import { reportSystem } from "@/lib/ai/prompts";
import { reportBodySchema } from "@/lib/validate";
import { guardPost } from "@/lib/api-guard";
import { toErrorResponse } from "@/lib/http";
import { telemetrySummary } from "@/lib/sim";
import { VENUE } from "@/lib/venue";

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  try {
    const guard = await guardPost(req, "report", reportBodySchema);
    if (!guard.ok) return guard.response;

    const summary = telemetrySummary(guard.data.upToMinute);
    const prompt = `Write the end-of-match operations report.\nVenue: ${VENUE.event.venueName}\nFixture: ${VENUE.event.fixture}\nTelemetry (JSON): ${JSON.stringify(summary)}`;

    const report = await generateProse(reportSystem, prompt);
    return Response.json({ upToMinute: summary.upToMinute, summary, report });
  } catch (error) {
    return toErrorResponse(error);
  }
}
