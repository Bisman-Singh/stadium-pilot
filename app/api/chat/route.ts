import type { UIMessage } from "ai";
import { streamFanChat } from "@/lib/ai/client";
import { fanSystemPrompt } from "@/lib/ai/prompts";
import { chatBodySchema } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";
import {
  clientIp,
  errorResponse,
  isSameOrigin,
  rateLimitResponse,
  readJsonBody,
  toErrorResponse,
} from "@/lib/http";

export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  try {
    if (!isSameOrigin(req)) {
      return errorResponse(403, "forbidden", "Cross-origin requests are not allowed.");
    }
    const limit = rateLimit("chat", clientIp(req));
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSec);

    const parsed = chatBodySchema.safeParse(await readJsonBody(req));
    if (!parsed.success) {
      return errorResponse(400, "invalid_request", "The chat request was not valid.");
    }

    const { messages, locationZone, stepFreeOnly, locale } = parsed.data;
    const system = fanSystemPrompt({ locationZone, stepFreeOnly, locale });
    // Shape is validated by chatBodySchema; the SDK owns the exact UIMessage type.
    const result = await streamFanChat(system, messages as unknown as UIMessage[]);

    return result.toUIMessageStreamResponse({
      onError: () => "The assistant is unavailable right now. Please try again.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
