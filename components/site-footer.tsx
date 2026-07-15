"use client";

import Link from "next/link";
import { useApp } from "./app-providers";

export function SiteFooter() {
  const { dict } = useApp();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted">
        <p>{dict.poweredBy}</p>
        <p className="mt-1">
          {dict.disclaimer}{" "}
          <Link href="/about" className="text-accent underline">
            {dict.navAbout}
          </Link>
        </p>
      </div>
    </footer>
  );
}
