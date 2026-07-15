import { describe, it, expect, vi } from "vitest";

// Mock the network layer so route logic is tested deterministically, no API calls.
vi.mock("@/lib/ai/client", () => ({
  streamFanChat: vi.fn(async () => ({
    toUIMessageStreamResponse: () =>
      new Response("data: ok\n\n", {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      }),
  })),
  generateStructured: vi.fn(async (_schema: unknown, system: string) => {
    if (system.toLowerCase().includes("action card")) {
      return {
        severity: "high",
        summary: "Congestion building.",
        actions: ["Open east doors", "Send stewards"],
        staffingMove: "Move two stewards from Gate B.",
        paDraft: {
          en: "Please use other exits.",
          es: "Usen otras salidas.",
          fr: "Utilisez d'autres sorties.",
        },
      };
    }
    return { announcements: [{ language: "English", localeCode: "en", script: "Welcome." }] };
  }),
  generateProse: vi.fn(async () => "## Report\n- Everything nominal."),
}));

import { POST as chatPost } from "@/app/api/chat/route";
import { GET as crowdGet } from "@/app/api/crowd/route";
import { POST as actionPost } from "@/app/api/ops/action/route";
import { POST as announcePost } from "@/app/api/ops/announce/route";
import { POST as briefingPost } from "@/app/api/ops/briefing/route";
import { POST as reportPost } from "@/app/api/ops/report/route";
import { GET as healthGet } from "@/app/api/health/route";
import { readJson } from "@/lib/json";

let ipCounter = 0;
function freshIp(): string {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

function post(path: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://localhost",
      "content-type": "application/json",
      "x-forwarded-for": freshIp(),
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function get(path: string, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost${path}`, {
    method: "GET",
    headers: { host: "localhost", "x-forwarded-for": freshIp(), ...headers },
  });
}

const oneUserMessage = [{ role: "user", parts: [{ type: "text", text: "Where is Gate A?" }] }];

describe("POST /api/chat", () => {
  it("streams for a valid request", async () => {
    const res = await chatPost(post("/api/chat", { messages: oneUserMessage }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });

  it("rejects an empty message list with 400", async () => {
    const res = await chatPost(post("/api/chat", { messages: [] }));
    expect(res.status).toBe(400);
  });

  it("rejects a cross-origin request with 403", async () => {
    const res = await chatPost(
      post("/api/chat", { messages: oneUserMessage }, { origin: "http://evil.test" }),
    );
    expect(res.status).toBe(403);
  });

  it("rate-limits a noisy client with 429 and a Retry-After header", async () => {
    const ip = "203.0.113.7";
    let last: Response | undefined;
    for (let i = 0; i < 14; i++) {
      last = await chatPost(
        post("/api/chat", { messages: oneUserMessage }, { "x-forwarded-for": ip }),
      );
    }
    expect(last?.status).toBe(429);
    expect(last?.headers.get("retry-after")).toBeTruthy();
  });
});

describe("GET /api/crowd", () => {
  it("returns a snapshot and active incidents", async () => {
    const res = await crowdGet(get("/api/crowd?minute=98"));
    expect(res.status).toBe(200);
    const body = await readJson<{ snapshot: { zones: unknown[] }; incidents: { kind: string }[] }>(
      res,
    );
    expect(body.snapshot.zones).toHaveLength(12);
    expect(body.incidents.some((i) => i.kind === "crowd")).toBe(true);
  });

  it("rejects an out-of-range minute", async () => {
    const res = await crowdGet(get("/api/crowd?minute=999"));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/ops/action", () => {
  it("returns a schema-shaped action card for a known incident", async () => {
    const res = await actionPost(post("/api/ops/action", { incidentId: "inc-crowd-cn" }));
    expect(res.status).toBe(200);
    const body = await readJson<{ card: { severity: string; actions: string[] } }>(res);
    expect(body.card.severity).toBe("high");
    expect(body.card.actions.length).toBeGreaterThanOrEqual(2);
  });

  it("404s for an unknown incident", async () => {
    const res = await actionPost(post("/api/ops/action", { incidentId: "nope" }));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/ops/announce", () => {
  it("generates announcements and serves the second identical call from cache", async () => {
    const body = { topic: "Gate C is now open", tone: "friendly", languages: ["en", "es"] };
    const first = await announcePost(post("/api/ops/announce", body));
    expect(first.status).toBe(200);
    expect((await readJson<{ cached: boolean }>(first)).cached).toBe(false);

    const second = await announcePost(post("/api/ops/announce", body));
    expect((await readJson<{ cached: boolean }>(second)).cached).toBe(true);
  });

  it("rejects an invalid tone", async () => {
    const res = await announcePost(
      post("/api/ops/announce", { topic: "Test topic", tone: "shouting", languages: ["en"] }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/ops/briefing", () => {
  it("returns a briefing for a known gate", async () => {
    const res = await briefingPost(post("/api/ops/briefing", { gateId: "A", shift: "pre-match" }));
    expect(res.status).toBe(200);
    expect((await readJson<{ briefing: string }>(res)).briefing).toContain("Report");
  });

  it("404s for an unknown gate", async () => {
    const res = await briefingPost(post("/api/ops/briefing", { gateId: "Z", shift: "pre-match" }));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/ops/report", () => {
  it("returns a report and telemetry summary", async () => {
    const res = await reportPost(post("/api/ops/report", { upToMinute: 150 }));
    expect(res.status).toBe(200);
    const body = await readJson<{ report: string; summary: { peakZones: unknown[] } }>(res);
    expect(body.report).toContain("Report");
    expect(body.summary.peakZones).toHaveLength(5);
  });
});

describe("GET /api/health", () => {
  it("reports status and configuration", async () => {
    const res = await healthGet(get("/api/health"));
    expect(res.status).toBe(200);
    const body = await readJson<{ status: string; aiConfigured: boolean }>(res);
    expect(body.status).toBe("ok");
    expect(typeof body.aiConfigured).toBe("boolean");
  });
});
