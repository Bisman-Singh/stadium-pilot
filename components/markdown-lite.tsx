import { Fragment, type ReactNode } from "react";

/**
 * Renders a safe subset of markdown (headings, bullet lists, bold) as React
 * nodes. Deliberately no HTML parsing and no dangerouslySetInnerHTML, so model
 * output can never inject markup.
 */
export function MarkdownLite({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      const items = listItems;
      blocks.push(
        <ul key={key} className="ms-5 list-disc space-y-1">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  };

  text.split("\n").forEach((raw, index) => {
    const line = raw.trimEnd();
    if (/^#{1,6}\s/.test(line)) {
      flushList(`list-${index}`);
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const content = line.replace(/^#+\s/, "");
      blocks.push(
        <p
          key={index}
          className={`mt-3 ${level <= 1 ? "text-lg font-bold" : "text-base font-semibold"}`}
        >
          {renderInline(content)}
        </p>,
      );
    } else if (/^[-*]\s/.test(line)) {
      listItems.push(line.replace(/^[-*]\s/, ""));
    } else if (line === "") {
      flushList(`list-${index}`);
    } else {
      flushList(`list-${index}`);
      blocks.push(
        <p key={index} className="mt-2">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList("list-final");

  return <div className="text-sm leading-relaxed">{blocks}</div>;
}

function renderInline(text: string): ReactNode {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}
