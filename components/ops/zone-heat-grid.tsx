import type { DensityLevel, ZoneDensity } from "@/lib/sim";

const LEVEL_META: Record<DensityLevel, { cssVar: string; label: string }> = {
  low: { cssVar: "--d-low", label: "Low" },
  moderate: { cssVar: "--d-moderate", label: "Moderate" },
  high: { cssVar: "--d-high", label: "High" },
  critical: { cssVar: "--d-critical", label: "Critical" },
};

/**
 * A crowd heat grid. Density is conveyed by fill intensity, a level word, and a
 * numeric percentage — never colour alone. A visually-hidden table mirrors the
 * data for screen readers.
 */
export function ZoneHeatGrid({ zones }: { zones: ZoneDensity[] }) {
  return (
    <section aria-label="Crowd density by area">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-hidden="true">
        {zones.map((zone) => {
          const meta = LEVEL_META[zone.level];
          const pct = Math.round(zone.density * 100);
          return (
            <li
              key={zone.zoneId}
              className="rounded-lg border p-3"
              style={{
                borderColor: `var(${meta.cssVar})`,
                background: `color-mix(in srgb, var(${meta.cssVar}) ${Math.round(pct * 0.32)}%, var(--surface))`,
              }}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums">{pct}%</span>
                {/* Ink text keeps 4.5:1 on the tinted tile; the border carries the hue. */}
                <span className="text-xs font-semibold text-ink">{meta.label}</span>
              </div>
              <div className="mt-1 text-sm text-ink">{zone.name}</div>
            </li>
          );
        })}
      </ul>

      <table className="sr-only">
        <caption>Crowd density by area</caption>
        <thead>
          <tr>
            <th scope="col">Area</th>
            <th scope="col">Occupancy</th>
            <th scope="col">Level</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone.zoneId}>
              <td>{zone.name}</td>
              <td>{Math.round(zone.density * 100)}%</td>
              <td>{LEVEL_META[zone.level].label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
