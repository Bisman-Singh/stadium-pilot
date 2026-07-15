import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  generateText,
  Output,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import type { z } from "zod";
import { CHAT_MAX_OUTPUT_TOKENS, CHAT_MAX_STEPS, STRUCTURED_MAX_OUTPUT_TOKENS } from "../constants";
import { fanTools } from "./tools";

/**
 * Thin wrapper over the AI SDK + Gemini provider. Centralises model choice,
 * quota controls (no thinking budget, capped output tokens), and a primary ->
 * fallback model chain. Network glue only; exercised by route tests via mocks
 * and by the live smoke test.
 */

const PRIMARY_MODEL = "gemini-2.5-flash";
// Fallbacks differ by task: gemini-2.5-pro handles schema-constrained output
// correctly (the Gemini 3 preview stalls on it), while the Gemini 3 preview is
// the faster prose fallback. 2.0-flash lost its free tier entirely.
const STRUCTURED_FALLBACK_MODEL = "gemini-2.5-pro";
const PROSE_FALLBACK_MODEL = "gemini-3-flash-preview";

// Bounds any single model attempt so a stalled call fails over or errors
// cleanly instead of running a route into its function timeout.
const ATTEMPT_TIMEOUT_MS = 25_000;

// Disables Gemini 2.5 Flash "thinking" to cut latency and free-tier spend.
// (2.5 Pro requires thinking, so its attempts send no thinking config.)
const NO_THINKING = { google: { thinkingConfig: { thinkingBudget: 0 } } };
// Gemini 3 models tune reasoning depth via thinkingLevel instead of a budget.
const MINIMAL_THINKING = { google: { thinkingConfig: { thinkingLevel: "minimal" as const } } };

interface ModelAttempt {
  modelId: string;
  providerOptions?: typeof NO_THINKING | typeof MINIMAL_THINKING;
  /** The primary retries once at most so the fallback still fits the route budget. */
  maxRetries: number;
}

/** Runs a generation against the primary model, then once against a fallback. */
async function withModelFallback<T>(
  fallback: ModelAttempt,
  run: (attempt: ModelAttempt) => Promise<T>,
): Promise<T> {
  try {
    return await run({ modelId: PRIMARY_MODEL, providerOptions: NO_THINKING, maxRetries: 1 });
  } catch {
    return run(fallback);
  }
}

/** Streams a grounded, tool-using fan chat response. */
export async function streamFanChat(system: string, messages: UIMessage[]) {
  return streamText({
    model: google(PRIMARY_MODEL),
    system,
    messages: await convertToModelMessages(messages),
    tools: fanTools,
    stopWhen: stepCountIs(CHAT_MAX_STEPS),
    temperature: 0.6,
    maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
    providerOptions: NO_THINKING,
  });
}

/**
 * Generates a schema-validated object using the current v7 structured-output
 * pattern (generateText + Output.object), falling back to a second model on error.
 */
export async function generateStructured<T>(
  schema: z.ZodType<T>,
  system: string,
  prompt: string,
): Promise<T> {
  return withModelFallback(
    { modelId: STRUCTURED_FALLBACK_MODEL, maxRetries: 1 },
    async ({ modelId, providerOptions, maxRetries }) => {
      const { output } = await generateText({
        model: google(modelId),
        system,
        prompt,
        output: Output.object({ schema }),
        temperature: 0.3,
        maxOutputTokens: STRUCTURED_MAX_OUTPUT_TOKENS,
        maxRetries,
        providerOptions,
        abortSignal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
      return output;
    },
  );
}

/** Generates markdown/prose, falling back to a second model on error. */
export async function generateProse(system: string, prompt: string): Promise<string> {
  return withModelFallback(
    { modelId: PROSE_FALLBACK_MODEL, providerOptions: MINIMAL_THINKING, maxRetries: 1 },
    async ({ modelId, providerOptions, maxRetries }) => {
      const { text } = await generateText({
        model: google(modelId),
        system,
        prompt,
        temperature: 0.4,
        maxOutputTokens: STRUCTURED_MAX_OUTPUT_TOKENS,
        maxRetries,
        providerOptions,
        abortSignal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
      return text;
    },
  );
}
