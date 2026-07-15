import type { ReactNode } from "react";

/** Shared bordered shell for the ops tools, so panels stay visually uniform. */
export function OpsPanel({
  title,
  ariaLabel,
  children,
}: {
  title: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={ariaLabel} className="rounded-xl border border-line bg-surface p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
