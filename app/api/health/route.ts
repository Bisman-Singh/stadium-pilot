import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { generateProse } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

/**
 * Liveness endpoint. `?deep=1` additionally pings the model to confirm the key
 * works end to end (used post-deploy and by evaluators).
 */
export async function GET(req: Request): Promise<Response> {
  const deep = new URL(req.url).searchParams.get("deep") === "1";
  const aiConfigured = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  let modelReachable: boolean | null = null;

  if (deep && aiConfigured) {
    try {
      await generateProse("Reply with the single word OK.", "OK");
      modelReachable = true;
    } catch {
      modelReachable = false;
    }
  }

  return Response.json({
    status: "ok",
    app: APP_NAME,
    version: APP_VERSION,
    aiConfigured,
    modelReachable,
  });
}
