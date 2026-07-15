# StadiumPilot

[![CI](https://github.com/Bisman-Singh/stadium-pilot/actions/workflows/ci.yml/badge.svg)](https://github.com/Bisman-Singh/stadium-pilot/actions/workflows/ci.yml)

A Generative-AI companion for World Cup 2026 match days. It serves two people at
once. Fans get a multilingual copilot that answers "where, how long, how busy,
how do I get out" in plain language. Organizers get a live operations center that
turns crowd telemetry into ranked incidents and AI-drafted responses.

**Live demo:** https://stadium.bisman.org
**Personas:** [`/fan`](https://stadium.bisman.org/fan) (spectator copilot) and [`/ops`](https://stadium.bisman.org/ops) (operations center)

> Unofficial demo. Not affiliated with FIFA or any real venue. Every stadium,
> team, and crowd figure is synthetic and generated on the fly.

---

## The problem it solves

Challenge 4, Smart Stadiums & Tournament Operations, asks for technology that
improves how a stadium runs on match day. StadiumPilot addresses both sides of
that:

- **For 68,500 fans**, the hard questions are navigation and timing. Where is the
  nearest halal food, and is it worth the walk? What is the step-free route to my
  seat? When should I leave to beat the crush? The copilot answers these grounded
  in a real venue graph, in English, Spanish, French, or Arabic, with full
  right-to-left support.
- **For the operations team**, the hard problem is attention. Which of a dozen
  developing situations matters most right now, and what should we tell people?
  The ops center ranks live incidents by severity, shows a heat map of every
  zone, and drafts public announcements and internal action plans with AI.

## Why the architecture is the interesting part

The design separates **deterministic ground truth** from **generative language**.

```
             deterministic core                         generative layer
   ┌─────────────────────────────────┐        ┌──────────────────────────────┐
   │  venue graph (zones, gates,     │        │  Gemini via the AI SDK       │
   │  amenities, transit)            │  tools │                              │
   │  Dijkstra step-free routing     │◄───────│  fan copilot (streaming +    │
   │  seeded crowd simulation        │  call  │  grounded tool calling)      │
   │  (pure function of match minute)│───────►│  ops drafting (structured    │
   └─────────────────────────────────┘  data  │  output, schema-validated)   │
                                               └──────────────────────────────┘
```

The AI never invents a route, a distance, or a crowd number. It calls read-only
tools that return facts from the core, then explains them. That is what makes the
answers trustworthy and what makes prompt injection harmless: the tools cannot
write anything.

Because the "live" data is a pure function of the match minute, the app needs no
database. Every request recomputes the same ground truth, so any number of
instances agree and the demo is perfectly reproducible.

## How Generative AI is used

Generative AI is core to the product, not a bolt-on.

- **Fan copilot** streams responses from Gemini (`gemini-2.5-flash`) with a set
  of five grounded tools: find amenities, get a route, check crowd levels, get
  transit options, and get event facts. The model decides which to call, chains
  them when needed, and answers in the user's language. See `lib/ai/tools.ts` and
  `app/api/chat/route.ts`.
- **Operations drafting** uses schema-constrained structured output to generate
  public announcements, internal action plans, and shift briefings from the
  current incident and crowd state. Every generation is validated against a Zod
  schema before it reaches the UI, with a typed fallback if the model drifts. See
  `lib/ai/client.ts` and the `app/api/ops/*` routes.
- A model fallback (`gemini-3-flash-preview`), disabled "thinking", output token caps,
  and an LRU cache keep the experience fast and within free-tier limits.

## Judging criteria, and where to verify each

| Criterion             | How it is addressed                                                                                                    | Look at                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Problem alignment** | Two real match-day personas, both fully built and grounded in a venue model                                            | `app/fan`, `app/ops`, `lib/venue`                                   |
| **Code quality**      | Typed end to end, small pure modules, clear separation of core and AI, zero lint and type errors                       | `lib/`, `tsconfig.json`, `eslint.config.mjs`                        |
| **Security**          | CSP and security headers, same-origin checks, per-IP rate limiting, Zod validation, no stored data, no secrets in repo | `SECURITY.md`, `next.config.ts`, `lib/http.ts`, `lib/rate-limit.ts` |
| **Efficiency**        | No database, seeded O(1) simulation, Dijkstra on a small graph, LRU and TTL cache, capped tokens                       | `lib/sim`, `lib/venue/graph.ts`, `lib/cache.ts`                     |
| **Testing**           | 122 tests, **100% line, branch, function, and statement coverage**                                                     | `tests/`, `npm run test:coverage`                                   |
| **Accessibility**     | Step-free routing as a first-class feature, WCAG-minded UI, ARIA live regions, RTL, automated axe tests                | `components/`, `tests/components`, `lib/i18n`                       |

## Getting started

```bash
# 1. Install
npm install

# 2. Add your Gemini API key (free at https://aistudio.google.com/apikey)
cp .env.example .env.local
# then edit .env.local and set GOOGLE_GENERATIVE_AI_API_KEY

# 3. Run
npm run dev        # http://localhost:3000

# 4. Verify
npm run test:coverage   # 122 tests, 100% coverage
npm run typecheck       # no type errors
npm run lint            # no lint errors
npm run build           # production build
```

The only required environment variable is `GOOGLE_GENERATIVE_AI_API_KEY`. Without
it the UI still renders and the deterministic core works; only the AI features
need the key.

## Tech stack

- **Next.js 16** (App Router, Turbopack) and **React 19**
- **TypeScript**, strict throughout
- **Vercel AI SDK v7** with the **`@ai-sdk/google`** provider (Gemini)
- **Tailwind CSS v4** for styling
- **Zod** for schema validation of both venue data and AI output
- **Vitest** with **vitest-axe** for unit, integration, and accessibility tests

## Project layout

```
app/            routes: landing, /fan, /ops, /about, and /api/*
components/     fan and ops UI, all accessible and theme-aware
lib/venue/      the venue graph, amenities, and Dijkstra routing
lib/sim/        the seeded crowd simulation and incident model
lib/ai/         prompts, grounded tools, and the Gemini client
lib/            cross-cutting: cache, rate limiting, http, i18n, validation
tests/          unit, integration, and component and a11y tests
```

## License

MIT. See [LICENSE](./LICENSE).
