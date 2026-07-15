import { streamFanChat } from "@/lib/ai/client";
import { fanSystemPrompt } from "@/lib/ai/prompts";
import { chatBodySchema } from "@/lib/validate";
import { guardPost } from "@/lib/api-guard";
import { toErrorResponse } from "@/lib/http";

export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  try {
    const guard = await guardPost(req, "chat", chatBodySchema);
    if (!guard.ok) return guard.response;

    const { messages, locationZone, stepFreeOnly, locale } = guard.data;
    const system = fanSystemPrompt({ locationZone, stepFreeOnly, locale });
    const result = await streamFanChat(system, messages);

    return result.toUIMessageStreamResponse({
      onError: () => "The assistant is unavailable right now. Please try again.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
