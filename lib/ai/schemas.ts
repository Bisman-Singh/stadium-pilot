import { z } from "zod";

/** Structured-output contracts. Validated at the generation layer with retry. */

/** Contract for an incident action card: severity, actions, staffing, PA drafts. */
export const actionCardSchema = z.object({
  severity: z.enum(["low", "medium", "high"]).describe("Overall severity for responders."),
  summary: z.string().describe("A one or two sentence situation summary."),
  actions: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("Concrete, ordered actions for control-room staff."),
  staffingMove: z.string().describe("A specific, realistic steward or staff redeployment."),
  paDraft: z
    .object({
      en: z.string().describe("Short public-address draft in English."),
      es: z.string().describe("Short public-address draft in Spanish."),
      fr: z.string().describe("Short public-address draft in French."),
    })
    .describe("Calm, non-alarming public-address drafts under 45 words each."),
});
export type ActionCard = z.infer<typeof actionCardSchema>;

/** Contract for a multilingual PA announcement set, one entry per language. */
export const announcementSchema = z.object({
  announcements: z
    .array(
      z.object({
        language: z.string().describe("Language name, e.g. English, Español, العربية."),
        localeCode: z.string().describe("BCP-47 code such as en, es, fr, ar."),
        script: z.string().describe("The announcement text in that language."),
      }),
    )
    .min(1),
});
export type AnnouncementSet = z.infer<typeof announcementSchema>;
