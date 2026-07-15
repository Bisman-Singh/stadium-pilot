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
import {
  CHAT_MAX_OUTPUT_TOKENS,
  CHAT_MAX_STEPS,
  STRUCTURED_MAX_OUTPUT_TOKENS,
} from "../constants";
import { fanTools } from "./tools";

/**
 * Thin wrapper over the AI SDK + Gemini provider. Centralises model choice,
 * quota controls (no thinking budget, capped output tokens), and a primary ->
 * fallback model chain. Network glue only; exercised by route tests via mocks
 * and by the live smoke test.
 */

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";

// Disables Gemini 2.5 "thinking" to cut latency and token spend on the free tier.
const NO_THINKING = { google: { thinkingConfig: { thinkingBudget: 0 } } };

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
  try {
    const { output } = await generateText({
      model: google(PRIMARY_MODEL),
      system,
      prompt,
      output: Output.object({ schema }),
      temperature: 0.3,
      maxOutputTokens: STRUCTURED_MAX_OUTPUT_TOKENS,
      providerOptions: NO_THINKING,
    });
    return output as T;
  } catch {
    const { output } = await generateText({
      model: google(FALLBACK_MODEL),
      system,
      prompt,
      output: Output.object({ schema }),
      temperature: 0.3,
      maxOutputTokens: STRUCTURED_MAX_OUTPUT_TOKENS,
    });
    return output as T;
  }
}

/** Generates markdown/prose, falling back to a second model on error. */
export async function generateProse(system: string, prompt: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: google(PRIMARY_MODEL),
      system,
      prompt,
      temperature: 0.4,
      maxOutputTokens: STRUCTURED_MAX_OUTPUT_TOKENS,
      providerOptions: NO_THINKING,
    });
    return text;
  } catch {
    const { text } = await generateText({
      model: google(FALLBACK_MODEL),
      system,
      prompt,
      temperature: 0.4,
      maxOutputTokens: STRUCTURED_MAX_OUTPUT_TOKENS,
    });
    return text;
  }
}
