import { z } from "zod";
import type { UIMessage } from "ai";
import {
  MATCH_WINDOW_MINUTES,
  MAX_CHAT_MESSAGES,
  MAX_MESSAGE_CHARS,
  SUPPORTED_LOCALES,
} from "./constants";

/** Zod schemas for every API input. Parsing failures become 400 responses. */

const localeSchema = z.enum(SUPPORTED_LOCALES);

/**
 * Structural envelope check for one chat message. The AI SDK owns the full
 * UIMessage type; the API boundary verifies the parts it relies on so no cast
 * is needed downstream.
 */
function isUIMessage(value: unknown): value is UIMessage {
  if (typeof value !== "object" || value === null) return false;
  if (!("role" in value) || !("parts" in value)) return false;
  const isKnownRole =
    value.role === "user" || value.role === "assistant" || value.role === "system";
  return isKnownRole && Array.isArray(value.parts);
}

/** Combined length of a message's text parts, for the per-message cap. */
function textLength(message: UIMessage): number {
  return message.parts.reduce(
    (sum, part) => sum + ("text" in part && typeof part.text === "string" ? part.text.length : 0),
    0,
  );
}

/**
 * The chat envelope. Message counts, roles, and per-message text length are
 * bounded here; the body-size cap in `readJsonBody` bounds total content.
 */
export const chatBodySchema = z.object({
  messages: z
    .array(z.custom<UIMessage>(isUIMessage))
    .min(1)
    .max(MAX_CHAT_MESSAGES)
    .refine((messages) => messages.every((m) => textLength(m) <= MAX_MESSAGE_CHARS), {
      message: "A message exceeds the maximum length.",
    }),
  locationZone: z.string().max(40).optional(),
  stepFreeOnly: z.boolean().optional(),
  locale: localeSchema.optional(),
});

export const actionBodySchema = z.object({
  incidentId: z.string().min(1).max(60),
  locale: localeSchema.optional(),
});

export const announceBodySchema = z.object({
  topic: z.string().min(3).max(200),
  tone: z.enum(["calm", "urgent", "friendly", "formal"]),
  languages: z.array(localeSchema).min(1).max(4),
});

export const briefingBodySchema = z.object({
  gateId: z.string().min(1).max(4),
  shift: z.enum(["pre-match", "first-half", "halftime", "second-half", "egress"]),
  locale: localeSchema.optional(),
});

export const reportBodySchema = z.object({
  upToMinute: z.number().min(0).max(MATCH_WINDOW_MINUTES),
});

export const crowdQuerySchema = z.object({
  minute: z.coerce.number().min(0).max(MATCH_WINDOW_MINUTES).optional(),
});
