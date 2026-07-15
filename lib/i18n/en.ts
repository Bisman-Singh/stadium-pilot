export const en = {
  tagline: "A GenAI companion for World Cup 2026 match days",
  navHome: "Home",
  navFan: "Fan Copilot",
  navOps: "Ops Center",
  navAbout: "About",
  langLabel: "Language",
  fanTitle: "Fan Copilot",
  fanSubtitle: "Ask anything about the stadium in your language.",
  fanPlaceholder: "Ask about gates, food, accessible routes, transit…",
  fanSend: "Send",
  fanStop: "Stop",
  fanThinking: "Thinking…",
  fanError: "Something went wrong. Please try again.",
  fanRetry: "Retry",
  fanEmpty: "Start by asking a question, or tap a suggestion below.",
  fanRateLimited: "You're sending messages quickly. Please wait a moment.",
  fanStepFree: "Step-free routes only",
  fanLocation: "Your location",
  fanLocationNone: "Not set",
  chipGate: "Find my gate",
  chipFood: "Food near me",
  chipAccessible: "Accessible route",
  chipTransit: "Best way home",
  chipRecycling: "Recycling points",
  disclaimer:
    "Unofficial demo. Not affiliated with FIFA or any real venue. All venue data is synthetic.",
  poweredBy: "Grounded in stadium data. Generative AI never invents venue facts.",
};

export type DictKey = keyof typeof en;
export type Dictionary = Record<DictKey, string>;
