import { describe, it, expect } from "vitest";
import { z } from "zod";
import { guardPost } from "@/lib/api-guard";
import { chatBodySchema } from "@/lib/validate";

const schema = z.object({ n: z.number() });

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("guardPost", () => {
  it("rejects cross-origin requests with 403", async () => {
    const req = post({ n: 1 }, { origin: "https://evil.example", host: "localhost" });
    const result = await guardPost(req, "chat", schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("rejects invalid bodies with 400", async () => {
    const result = await guardPost(post({ n: "not-a-number" }), "chat", schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("passes valid requests through with parsed data", async () => {
    const result = await guardPost(post({ n: 5 }), "chat", schema);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.n).toBe(5);
  });

  it("rate limits once the per-IP budget is spent", async () => {
    // The "report" limiter allows 3 per minute; the 4th call must be a 429.
    const headers = { "x-forwarded-for": "203.0.113.77" };
    let last = await guardPost(post({ n: 1 }, headers), "report", schema);
    for (let i = 0; i < 3; i++) {
      last = await guardPost(post({ n: 1 }, headers), "report", schema);
    }
    expect(last.ok).toBe(false);
    if (!last.ok) expect(last.response.status).toBe(429);
  });
});

describe("chat message envelope validation", () => {
  const body = (messages: unknown[]) => ({ messages });

  it("accepts user, assistant, and system messages with parts", () => {
    const messages = [
      { id: "1", role: "user", parts: [{ type: "text", text: "hi" }] },
      { id: "2", role: "assistant", parts: [] },
      { id: "3", role: "system", parts: [] },
    ];
    expect(chatBodySchema.safeParse(body(messages)).success).toBe(true);
  });

  it("rejects non-object and null messages", () => {
    expect(chatBodySchema.safeParse(body([42])).success).toBe(false);
    expect(chatBodySchema.safeParse(body([null])).success).toBe(false);
  });

  it("rejects messages missing role or parts", () => {
    expect(chatBodySchema.safeParse(body([{ parts: [] }])).success).toBe(false);
    expect(chatBodySchema.safeParse(body([{ role: "user" }])).success).toBe(false);
  });

  it("rejects unknown roles and non-array parts", () => {
    expect(chatBodySchema.safeParse(body([{ role: "tool", parts: [] }])).success).toBe(false);
    expect(chatBodySchema.safeParse(body([{ role: "user", parts: "text" }])).success).toBe(false);
  });
});
