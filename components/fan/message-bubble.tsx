import type { UIMessage } from "ai";

/**
 * Renders one chat message. `dir="auto"` lets the browser infer text direction,
 * so a reply in Arabic renders right-to-left without us detecting the language.
 */
export function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
  const usedTools = message.parts.some(
    (part) => typeof part.type === "string" && part.type.startsWith("tool-"),
  );

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div
        dir="auto"
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
          isUser ? "bg-accent text-accent-ink" : "border border-line bg-panel text-ink"
        }`}
      >
        {text || <span className="text-muted">…</span>}
      </div>
      {!isUser && usedTools && (
        <span className="px-1 text-xs text-muted">✓ Checked live stadium data</span>
      )}
    </div>
  );
}
