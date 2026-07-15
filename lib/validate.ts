import { z } from "zod";
import { MATCH_WINDOW_MINUTES, MAX_CHAT_MESSAGES, SUPPORTED_LOCALES } from "./constants";

/** Zod schemas for every API input. Parsing failures become 400 responses. */

export const localeSchema = z.enum(SUPPORTED_LOCALES);

/**
 * The chat envelope. Message parts are validated loosely (the AI SDK owns their
 * exact shape); we bound the count and roles, and the body-size cap in
 * `readJsonBody` bounds total content.
 */
export const chatBodySchema = z.object({
  messages: z
    .array(
      z
        .object({ role: z.enum(["user", "assistant", "system"]) })
        .passthrough(),
    )
    .min(1)
    .max(MAX_CHAT_MESSAGES),
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

export type ChatBody = z.infer<typeof chatBodySchema>;
export type ActionBody = z.infer<typeof actionBodySchema>;
export type AnnounceBody = z.infer<typeof announceBodySchema>;
export type BriefingBody = z.infer<typeof briefingBodySchema>;
export type ReportBody = z.infer<typeof reportBodySchema>;
