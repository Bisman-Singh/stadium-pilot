# Contributing

Thanks for taking an interest in StadiumPilot. This is a small demo project,
but it is run like a production codebase, and contributions are expected to
keep it that way.

## Getting set up

```bash
npm install
cp .env.example .env.local   # add your own Gemini API key
npm run dev
```

## Before you open a pull request

Every check below runs in CI and must pass:

```bash
npm run typecheck       # strict TypeScript, no errors
npm run lint            # ESLint with jsx-a11y, no errors and no suppressions
npm run format:check    # Prettier
npm run test:coverage   # all tests pass at 100% line and branch coverage
npm run build           # production build
```

## Ground rules

- **Tests first.** New behaviour lands with tests that assert it; coverage
  thresholds are set to 100% and are not lowered.
- **No suppressions.** Do not add `eslint-disable`, `@ts-ignore`, or type
  casts to get code through the gates; restructure instead. Invariants the
  type system cannot see go through `lib/must.ts` so they fail loudly.
- **Accessibility is a feature.** Interactive elements need labels, focus
  handling, and keyboard support; component tests include axe checks.
- **Determinism.** The venue and crowd model stay pure functions of their
  inputs. Anything time-based takes the timestamp as a parameter.
- **No secrets in the repo.** Keys live in `.env.local` (gitignored) and in
  the deployment platform's encrypted environment.

## Commit style

Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) with a
short body explaining the why when it is not obvious.

## Security

Please report suspected vulnerabilities privately; see [SECURITY.md](./SECURITY.md).
