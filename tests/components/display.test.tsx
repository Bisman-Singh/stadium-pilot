// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { KpiRow } from "@/components/ops/kpi-row";
import { ZoneHeatGrid } from "@/components/ops/zone-heat-grid";
import { MarkdownLite } from "@/components/markdown-lite";
import { snapshot } from "@/lib/sim";

describe("KpiRow", () => {
  it("renders labels and values with no accessibility violations", async () => {
    const { container, getByText } = render(
      <KpiRow
        items={[
          { label: "In venue", value: "42,000" },
          { label: "Open alerts", value: "2", tone: "danger" },
        ]}
      />,
    );
    expect(getByText("In venue")).toBeInTheDocument();
    expect(getByText("42,000")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ZoneHeatGrid", () => {
  it("renders a screen-reader table alongside the tiles, no violations", async () => {
    const { container, getByRole, getAllByRole } = render(
      <ZoneHeatGrid zones={snapshot(70).zones} />,
    );
    const table = getByRole("table");
    expect(table).toBeInTheDocument();
    // 12 data rows in the accessible table twin.
    expect(getAllByRole("row")).toHaveLength(13); // 12 zones + header
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("MarkdownLite", () => {
  it("renders headings, bullets, and bold text", () => {
    const { getByText, getByRole } = render(
      <MarkdownLite text={"# Overview\n- point one\n- a **bold** point"} />,
    );
    expect(getByText("Overview")).toBeInTheDocument();
    expect(getByText("bold").tagName).toBe("STRONG");
    expect(getByRole("list")).toBeInTheDocument();
  });

  it("never injects raw HTML from model output", () => {
    const { container } = render(<MarkdownLite text={'<img src=x onerror="alert(1)">'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img");
  });
});
