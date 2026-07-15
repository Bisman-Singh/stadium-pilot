import { generateProse } from "@/lib/ai/client";
import { reportSystem } from "@/lib/ai/prompts";
import { reportBodySchema } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";
import {
  clientIp,
  errorResponse,
  isSameOrigin,
  rateLimitResponse,
  readJsonBody,
  toErrorResponse,
} from "@/lib/http";
import { telemetrySummary } from "@/lib/sim";
import { VENUE } from "@/lib/venue";

export const maxDuration = 45;

export async function POST(req: Request): Promise<Response> {
  try {
    if (!isSameOrigin(req)) {
      return errorResponse(403, "forbidden", "Cross-origin requests are not allowed.");
    }
    const limit = rateLimit("report", clientIp(req));
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSec);

    const parsed = reportBodySchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return errorResponse(400, "invalid_request", "The request was not valid.");

    const summary = telemetrySummary(parsed.data.upToMinute);
    const prompt = `Write the end-of-match operations report.\nVenue: ${VENUE.event.venueName}\nFixture: ${VENUE.event.fixture}\nTelemetry (JSON): ${JSON.stringify(summary)}`;

    const report = await generateProse(reportSystem, prompt);
    return Response.json({ upToMinute: summary.upToMinute, summary, report });
  } catch (error) {
    return toErrorResponse(error);
  }
}
