# Security

StadiumPilot is a demo application, but it is built to production security norms.
This document describes the controls that ship with it and how to report a problem.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to **bismanmadaan1@gmail.com**
rather than opening a public issue. Include steps to reproduce and the affected
route or component. You can expect an acknowledgement within a few days.

## What this app does with data

- **No database, no accounts, no personal data.** Every "live" figure is a pure
  function of the current match minute, computed on each request. There is
  nothing to breach because there is nothing stored.
- **Venue data is synthetic.** The stadium, teams, and layout are fictional. No
  real floor plans, sponsor names, or proprietary tournament data are used.
- **The AI has read-only tools.** The fan copilot can look up amenities, routes,
  crowd levels, transit, and event facts. None of its tools write state, so
  prompt injection cannot make it take a harmful action.

## Controls in the codebase

| Area | Control | Where |
|---|---|---|
| Secrets | API key read from env only; never committed; `.env*` gitignored | `lib/ai/client.ts`, `.gitignore` |
| Transport | HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy | `next.config.ts` |
| Content | Content-Security-Policy restricting scripts, styles, and connect targets | `next.config.ts` |
| CSRF | Cross-origin POSTs rejected by an Origin/Host check | `lib/http.ts` (`isSameOrigin`) |
| Abuse | Sliding-window per-IP rate limiting on every API route | `lib/rate-limit.ts` |
| Input | Zod schema validation and a request body-size cap on all inputs | `lib/validate.ts`, `lib/http.ts` |
| Output | Errors return opaque messages; stack traces are logged server-side only | `lib/http.ts` (`toErrorResponse`) |
| Model | `thinkingBudget: 0`, output token caps, and a model fallback bound cost and blast radius | `lib/ai/client.ts` |

## Handling of the demo API key

The deployed instance uses a Google Gemini API key stored as an encrypted
environment variable on the hosting platform. It is never present in the
repository or in client-side code. Any key used during development is rotated
after the event.
