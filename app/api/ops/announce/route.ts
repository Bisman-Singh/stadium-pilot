import { generateStructured } from "@/lib/ai/client";
import { announcementSchema, type AnnouncementSet } from "@/lib/ai/schemas";
import { announceSystem } from "@/lib/ai/prompts";
import { announceBodySchema } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";
import { LruCache } from "@/lib/cache";
import { LOCALE_LABELS } from "@/lib/i18n";
import {
  clientIp,
  errorResponse,
  isSameOrigin,
  rateLimitResponse,
  readJsonBody,
  toErrorResponse,
} from "@/lib/http";

export const maxDuration = 30;

const cache = new LruCache<AnnouncementSet>(200, 10 * 60 * 1000);

export async function POST(req: Request): Promise<Response> {
  try {
    if (!isSameOrigin(req)) {
      return errorResponse(403, "forbidden", "Cross-origin requests are not allowed.");
    }
    const limit = rateLimit("ops", clientIp(req));
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSec);

    const parsed = announceBodySchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return errorResponse(400, "invalid_request", "The request was not valid.");

    const { topic, tone, languages } = parsed.data;
    const key = JSON.stringify({ topic, tone, languages: [...languages].sort() });
    const cached = cache.get(key);
    if (cached) return Response.json({ ...cached, cached: true });

    const langList = languages.map((l) => `${LOCALE_LABELS[l]} (${l})`).join(", ");
    const prompt = `Draft a stadium public-address announcement.\nTopic: ${topic}\nTone: ${tone}\nProduce exactly one entry per language with the correct localeCode for: ${langList}.`;

    const result = await generateStructured(announcementSchema, announceSystem, prompt);
    cache.set(key, result);
    return Response.json({ ...result, cached: false });
  } catch (error) {
    return toErrorResponse(error);
  }
}
