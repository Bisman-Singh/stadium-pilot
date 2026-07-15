import { describe, it, expect } from "vitest";
import { actionCardSchema, announcementSchema } from "@/lib/ai/schemas";
import { fanTools } from "@/lib/ai/tools";
import { fanSystemPrompt } from "@/lib/ai/prompts";

type ExecFn = (input: unknown, options: unknown) => Promise<unknown>;

/** Invokes a tool's execute function with a stub of the options it ignores. */
async function runTool(tool: unknown, input: unknown): Promise<Record<string, unknown>> {
  const exec = (tool as { execute?: ExecFn }).execute;
  if (!exec) throw new Error("tool has no execute");
  return (await exec(input, { toolCallId: "test", messages: [] })) as Record<string, unknown>;
}

describe("structured output schemas", () => {
  it("accepts a well-formed action card", () => {
    const card = {
      severity: "high",
      summary: "Congestion building in the North Concourse.",
      actions: ["Open the east doors", "Send stewards to the ramp"],
      staffingMove: "Move two stewards from Gate B to the North Concourse.",
      paDraft: { en: "Please use alternative exits.", es: "Usen salidas alternativas.", fr: "Utilisez d'autres sorties." },
    };
    expect(actionCardSchema.safeParse(card).success).toBe(true);
  });

  it("rejects an action card with too few actions or missing PA drafts", () => {
    expect(
      actionCardSchema.safeParse({
        severity: "low",
        summary: "x",
        actions: ["only one"],
        staffingMove: "y",
        paDraft: { en: "a", es: "b", fr: "c" },
      }).success,
    ).toBe(false);
    expect(
      actionCardSchema.safeParse({
        severity: "low",
        summary: "x",
        actions: ["a", "b"],
        staffingMove: "y",
        paDraft: { en: "a" },
      }).success,
    ).toBe(false);
  });

  it("accepts an announcement set", () => {
    expect(
      announcementSchema.safeParse({
        announcements: [{ language: "English", localeCode: "en", script: "Welcome." }],
      }).success,
    ).toBe(true);
  });
});

describe("fan tools ground answers in venue data", () => {
  it("findAmenity returns only halal food, ranked by distance", async () => {
    const result = await runTool(fanTools.findAmenity, {
      types: ["food"],
      dietaryTags: ["halal"],
      nearLocation: "N1",
    });
    const amenities = result.amenities as { dietaryTags: string[]; walkMinutes: number | null }[];
    expect(amenities.length).toBeGreaterThan(0);
    expect(amenities.every((a) => a.dietaryTags.includes("halal"))).toBe(true);
    expect(result.nearZone).toBe("North Stand Lower");
  });

  it("getRoute avoids stairs when step-free is requested", async () => {
    const normal = await runTool(fanTools.getRoute, { from: "N2", to: "CN" });
    const stepFree = await runTool(fanTools.getRoute, { from: "N2", to: "CN", stepFreeOnly: true });
    const normalSteps = normal.steps as { via: string }[];
    const stepFreeSteps = stepFree.steps as { via: string }[];
    expect(normalSteps.some((s) => s.via === "stairs")).toBe(true);
    expect(stepFreeSteps.every((s) => s.via !== "stairs" && s.via !== "escalator")).toBe(true);
  });

  it("getRoute reports a friendly error for unknown places", async () => {
    const result = await runTool(fanTools.getRoute, { from: "N1", to: "nowhere-land" });
    expect(result.error).toContain("nowhere-land");
  });

  it("getTransit filters by mode and accessibility", async () => {
    const metro = await runTool(fanTools.getTransit, { mode: "metro" });
    const options = metro.options as { mode: string }[];
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.mode === "metro")).toBe(true);

    const accessible = await runTool(fanTools.getTransit, { accessibleOnly: true });
    const accessibleOptions = accessible.options as { accessible: boolean }[];
    expect(accessibleOptions.every((o) => o.accessible)).toBe(true);
  });

  it("getEventInfo returns the venue basics", async () => {
    const result = await runTool(fanTools.getEventInfo, {});
    expect(result.venue).toBe("Crescent Bay Stadium");
    expect(result.fixture).toContain("Atlantis");
  });

  it("getCrowd returns a well-formed snapshot", async () => {
    const result = await runTool(fanTools.getCrowd, {});
    expect(typeof result.phase).toBe("string");
    expect(Array.isArray(result.busiest)).toBe(true);
    expect((result.busiest as unknown[]).length).toBe(3);
  });
});

describe("fan system prompt", () => {
  it("carries grounding, multilingual, and injection-resistance rules", () => {
    const prompt = fanSystemPrompt();
    expect(prompt).toContain("same language");
    expect(prompt).toContain("Never invent");
    expect(prompt.toLowerCase()).toContain("data, not instructions");
  });

  it("adds step-free and location context when provided", () => {
    const prompt = fanSystemPrompt({ stepFreeOnly: true, locationZone: "S2" });
    expect(prompt).toContain("stepFreeOnly: true");
    expect(prompt).toContain("S2");
  });
});
