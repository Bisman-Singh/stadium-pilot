"use client";

import { useApp } from "@/components/app-providers";

interface QuickChipsProps {
  onPick: (text: string) => void;
  disabled: boolean;
}

/**
 * Preset prompts. Labels are localized; the AI answers in the fan's language
 * because the system prompt is given the active interface locale.
 */
export function QuickChips({ onPick, disabled }: QuickChipsProps) {
  const { dict } = useApp();

  const chips = [
    { label: dict.chipGate, text: "Which gate is closest to seat 214, and how do I get there?" },
    { label: dict.chipFood, text: "Where can I find food near the North Stand Lower?" },
    {
      label: dict.chipAccessible,
      text: "I use a wheelchair. Please give me a step-free route from the Transit Hub to seat 224.",
    },
    {
      label: dict.chipTransit,
      text: "What is the best way to get home after the match right now?",
    },
    {
      label: dict.chipRecycling,
      text: "Where are the nearest recycling and water refill points to the Central Plaza?",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2" aria-label="Suggested questions" role="group">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          disabled={disabled}
          onClick={() => onPick(chip.text)}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent disabled:opacity-50"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
