export interface Kpi {
  label: string;
  value: string;
  tone?: "default" | "accent" | "danger";
}

const TONE_CLASS: Record<NonNullable<Kpi["tone"]>, string> = {
  default: "text-ink",
  accent: "text-accent",
  danger: "text-danger",
};

export function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((kpi) => (
        <div key={kpi.label} className="rounded-lg border border-line bg-surface p-3">
          <dt className="text-xs uppercase tracking-wide text-muted">{kpi.label}</dt>
          <dd
            className={`mt-1 text-xl font-bold tabular-nums ${TONE_CLASS[kpi.tone ?? "default"]}`}
          >
            {kpi.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
