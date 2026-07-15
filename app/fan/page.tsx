import type { Metadata } from "next";
import { FanCopilot } from "@/components/fan/fan-copilot";

export const metadata: Metadata = {
  title: "Fan Copilot",
  description:
    "Ask anything about the stadium in your language — gates, food, accessible routes, transit.",
};

export default function FanPage() {
  return <FanCopilot />;
}
