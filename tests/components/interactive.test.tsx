// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { AppProviders } from "@/components/app-providers";
import type { Incident } from "@/lib/sim";

const sendMessage = vi.fn();

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: [],
    sendMessage,
    status: "ready",
    error: undefined,
    stop: vi.fn(),
    regenerate: vi.fn(),
  }),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: class {},
}));

import { FanCopilot } from "@/components/fan/fan-copilot";
import { AlertFeed } from "@/components/ops/alert-feed";

function withProviders(ui: React.ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

describe("FanCopilot", () => {
  beforeEach(() => sendMessage.mockClear());

  it("shows the empty state and sends a suggestion when a chip is tapped", () => {
    withProviders(<FanCopilot />);
    expect(screen.getByText(/start by asking/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Find my gate" }));
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = withProviders(<FanCopilot />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

const incident: Incident = {
  id: "inc-test",
  startMinute: 95,
  durationMin: 10,
  zoneId: "CN",
  kind: "crowd",
  severity: "high",
  title: "Halftime congestion",
  detail: "The North Concourse is getting busy.",
};

describe("AlertFeed and action card", () => {
  beforeEach(() => {
    global.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            card: {
              severity: "high",
              summary: "Congestion is building.",
              actions: ["Open east doors", "Send stewards"],
              staffingMove: "Move two stewards from Gate B.",
              paDraft: { en: "Please use other exits.", es: "Usen otras salidas.", fr: "Utilisez d'autres sorties." },
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    ) as unknown as typeof fetch;
  });

  it("opens an accessible dialog and shows the generated action card", async () => {
    render(<AlertFeed incidents={[incident]} />);
    fireEvent.click(screen.getByRole("button", { name: /generate action card/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");

    await waitFor(() => expect(screen.getByText(/high severity/i)).toBeInTheDocument());
    expect(screen.getByText("Congestion is building.")).toBeInTheDocument();
  });

  it("renders the alert feed with no accessibility violations", async () => {
    const { container } = render(<AlertFeed incidents={[incident]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
