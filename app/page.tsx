import Link from "next/link";
import { APP_NAME, APP_TAGLINE, DISCLAIMER } from "@/lib/constants";
import { VENUE } from "@/lib/venue";

const THEMES = [
  "Navigation",
  "Crowd management",
  "Accessibility",
  "Transportation",
  "Sustainability",
  "Multilingual assistance",
  "Operational intelligence",
  "Real-time decision support",
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-14 sm:py-20">
        <span className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Challenge 4 · Smart Stadiums &amp; Tournament Operations
        </span>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          {APP_NAME}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{APP_TAGLINE}</p>
        <p className="mt-2 max-w-2xl text-muted">
          One app, two sides: a multilingual copilot for fans, and a live operations center for
          organizers, volunteers, and venue staff.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/fan"
            className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-ink"
          >
            Open Fan Copilot
          </Link>
          <Link
            href="/ops"
            className="rounded-lg border border-line px-5 py-2.5 font-semibold hover:border-accent"
          >
            Open Ops Center
          </Link>
        </div>
      </section>

      <section className="grid gap-4 pb-8 md:grid-cols-2">
        <article className="rounded-xl border border-line bg-surface p-6">
          <h2 className="text-xl font-semibold">For fans</h2>
          <p className="mt-2 text-muted">
            Ask anything in any language and get grounded answers: the closest gate to your seat, a
            step-free route for a wheelchair, halal or vegan food nearby, or the best way home right
            now based on live crowds.
          </p>
          <Link href="/fan" className="mt-4 inline-block font-semibold text-accent">
            Try it →
          </Link>
        </article>
        <article className="rounded-xl border border-line bg-surface p-6">
          <h2 className="text-xl font-semibold">For organizers</h2>
          <p className="mt-2 text-muted">
            Watch crowd density by area in real time, turn each alert into an AI action card with
            concrete steps and staffing moves, draft multilingual announcements, and generate an
            end-of-match operations report.
          </p>
          <Link href="/ops" className="mt-4 inline-block font-semibold text-accent">
            Open the console →
          </Link>
        </article>
      </section>

      <section className="pb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Every challenge theme, covered
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {THEMES.map((theme) => (
            <li
              key={theme}
              className="rounded-full border border-line bg-panel px-3 py-1 text-sm"
            >
              {theme}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 pb-16 md:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="font-semibold">Grounded, not guessed</h3>
          <p className="mt-2 text-sm text-muted">
            Routing and amenities come from a real venue graph. Generative AI narrates and reasons
            over that ground truth through tool calls, and never invents venue facts.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="font-semibold">Live without the plumbing</h3>
          <p className="mt-2 text-sm text-muted">
            The crowd model is a deterministic function of the match minute, so the dashboard feels
            live with no database, and every result is reproducible and testable.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="font-semibold">Built for everyone</h3>
          <p className="mt-2 text-sm text-muted">
            Full keyboard support, screen-reader friendly, right-to-left languages, and a
            step-free mode for accessible routing throughout.
          </p>
        </div>
      </section>

      <p className="pb-12 text-sm text-muted">
        Demo venue: {VENUE.event.venueName} ({VENUE.event.capacity.toLocaleString()} capacity).{" "}
        {DISCLAIMER}
      </p>
    </div>
  );
}
