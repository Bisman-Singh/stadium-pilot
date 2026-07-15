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

// Both models sit on the Gemini free tier with separate quota pools, so the
// app never depends on paid capacity. The quality model leads structured and
// prose generation with the fast model as its fallback; chat streams cannot
// switch models mid-flight, so the highest-traffic surface rides the lite
// model's larger pool outright. (2.0 Flash lost its free tier, the Gemini 3
// preview stalls on structured output, and 2.5 Pro's free pool is too small.)
const QUALITY_MODEL = "gemini-2.5-flash";
const FAST_MODEL = "gemini-3.1-flash-lite";

// Bounds any single model attempt so a stalled call fails over or errors
// cleanly instead of running a route into its function timeout.
const ATTEMPT_TIMEOUT_MS = 25_000;

// Disables Gemini 2.5 Flash "thinking" to cut latency and free-tier spend.
const NO_THINKING = { google: { thinkingConfig: { thinkingBudget: 0 } } };
// Gemini 3 models tune reasoning depth via thinkingLevel instead of a budget.
const MINIMAL_THINKING = { google: { thinkingConfig: { thinkingLevel: "minimal" as const } } };

interface ModelAttempt {
  modelId: string;
  providerOptions: typeof NO_THINKING | typeof MINIMAL_THINKING;
  /** One retry per attempt at most, so the fallback still fits the route budget. */
  maxRetries: number;
}

/** Runs a generation against the quality model, then once against the fast one. */
async function withModelFallback<T>(run: (attempt: ModelAttempt) => Promise<T>): Promise<T> {
  try {
    return await run({ modelId: QUALITY_MODEL, providerOptions: NO_THINKING, maxRetries: 1 });
  } catch {
    return run({ modelId: FAST_MODEL, providerOptions: MINIMAL_THINKING, maxRetries: 1 });
  }
}

/** Streams a grounded, tool-using fan chat response. */
export async function streamFanChat(system: string, messages: UIMessage[]) {
  return streamText({
    model: google(FAST_MODEL),
    system,
    messages: await convertToModelMessages(messages),
    tools: fanTools,
    stopWhen: stepCountIs(CHAT_MAX_STEPS),
    temperature: 0.6,
    maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
    providerOptions: MINIMAL_THINKING,
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
  return withModelFallback(async ({ modelId, providerOptions, maxRetries }) => {
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
  });
}

/** Generates markdown/prose, falling back to a second model on error. */
export async function generateProse(system: string, prompt: string): Promise<string> {
  return withModelFallback(async ({ modelId, providerOptions, maxRetries }) => {
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
  });
}
