import type { Metadata } from "next";
import { OpsConsole } from "@/components/ops/ops-console";

export const metadata: Metadata = {
  title: "Operations Center",
  description: "Live crowd intelligence, AI action cards, multilingual PA drafting, and match reports.",
};

export default function OpsPage() {
  return <OpsConsole />;
}
