import { generateStructured } from "@/lib/ai/client";
import { announcementSchema, type AnnouncementSet } from "@/lib/ai/schemas";
import { announceSystem } from "@/lib/ai/prompts";
import { announceBodySchema } from "@/lib/validate";
import { guardPost } from "@/lib/api-guard";
import { toErrorResponse } from "@/lib/http";
import { LruCache } from "@/lib/cache";
import { LOCALE_LABELS } from "@/lib/i18n";
import { AI_CACHE_TTL_MS, ANNOUNCE_CACHE_ENTRIES } from "@/lib/constants";

export const maxDuration = 30;

const cache = new LruCache<AnnouncementSet>(ANNOUNCE_CACHE_ENTRIES, AI_CACHE_TTL_MS);

export async function POST(req: Request): Promise<Response> {
  try {
    const guard = await guardPost(req, "ops", announceBodySchema);
    if (!guard.ok) return guard.response;

    const { topic, tone, languages } = guard.data;
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
