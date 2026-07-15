import type { Metadata } from "next";
import { APP_NAME, DISCLAIMER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description: "How StadiumPilot maps to the challenge, uses Generative AI, and is built.",
};

const MAPPING: { theme: string; feature: string }[] = [
  {
    theme: "Navigation",
    feature: "Graph-routed directions narrated by AI, with QR-style location deep links.",
  },
  {
    theme: "Crowd management",
    feature: "Live density heat grid, threshold alerts, and AI dispersal recommendations.",
  },
  {
    theme: "Accessibility",
    feature: "Step-free routing, accessible amenity finder, and a WCAG-minded interface.",
  },
  {
    theme: "Transportation",
    feature: "Metro, shuttle, rideshare, and parking guidance combined with live crowd state.",
  },
  {
    theme: "Sustainability",
    feature: "Recycling and refill finder plus waste-diversion and refill KPIs.",
  },
  {
    theme: "Multilingual assistance",
    feature: "Copilot replies in the fan's language; PA drafts in several languages at once.",
  },
  {
    theme: "Operational intelligence",
    feature: "AI incident summaries, volunteer briefings, and an end-of-match report.",
  },
  {
    theme: "Real-time decision support",
    feature: "Each alert becomes a structured action card with human-in-the-loop confirm.",
  },
];

const GENAI_USES = [
  "Multilingual conversational assistance for fans (streaming chat with tool calling).",
  "Turn-by-turn navigation narrated over a deterministic route.",
  "Incident summarization and staff redeployment recommendations (action cards).",
  "Multilingual public-address announcement generation.",
  "Volunteer shift briefings.",
  "End-of-match operations report generation.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">About {APP_NAME}</h1>
      <p className="mt-3 text-muted">
        {APP_NAME} is a Generative-AI companion for FIFA World Cup 2026 match days. It serves fans
        and venue operators from a single application, using deterministic venue data as ground
        truth and Generative AI for language, reasoning, and decision support on top of it.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Challenge alignment</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="py-2 pe-4 font-semibold">
                Theme
              </th>
              <th scope="col" className="py-2 font-semibold">
                How StadiumPilot addresses it
              </th>
            </tr>
          </thead>
          <tbody>
            {MAPPING.map((row) => (
              <tr key={row.theme} className="border-b border-line/60 align-top">
                <td className="py-2 pe-4 font-medium">{row.theme}</td>
                <td className="py-2 text-muted">{row.feature}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-xl font-semibold">How Generative AI is used</h2>
      <ul className="mt-3 list-disc space-y-1 ps-5 text-muted">
        {GENAI_USES.map((use) => (
          <li key={use}>{use}</li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Architecture</h2>
      <p className="mt-3 text-muted">
        A typed venue graph provides routing and amenities; a seeded, deterministic crowd model
        turns the match minute into live density, incidents, and telemetry with no database. The AI
        layer (Vercel AI SDK with Google Gemini) is reached only through server routes that validate
        input, rate-limit per client, enforce same-origin, and cap output tokens. The fan copilot is
        grounded through read-only tools, so it cannot invent venue facts and prompt injection
        cannot cause side effects.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Accessibility</h2>
      <p className="mt-3 text-muted">
        Semantic landmarks and a skip link, full keyboard operability with visible focus, ARIA live
        regions for streaming replies and alerts, a screen-reader table alongside the heat grid,
        automatic text direction for right-to-left languages, a step-free routing mode, and respect
        for reduced-motion preferences.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Security</h2>
      <p className="mt-3 text-muted">
        Input is validated with Zod, POST routes enforce same-origin and body-size limits, each
        client is rate-limited, security headers are set at the edge, and the API key never reaches
        the browser. Model output is rendered as text with a safe markdown subset — never as raw
        HTML.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Built with</h2>
      <p className="mt-3 text-muted">
        Next.js (App Router), React, TypeScript, Tailwind CSS, the Vercel AI SDK with Google Gemini,
        and Vitest. Deployed on Vercel.
      </p>

      <p className="mt-8 border-t border-line pt-4 text-sm text-muted">{DISCLAIMER}</p>
    </div>
  );
}
