/**
 * Invokes a tool's execute function directly, bypassing the model loop. Tool
 * results are JSON-shaped; the tests assert their structure at runtime, so the
 * casts below are confined to this one helper instead of every call site.
 */
export async function runTool<Output = Record<string, unknown>>(
  tool: unknown,
  input: unknown,
): Promise<Output> {
  const { execute } = tool as {
    execute?: (input: unknown, options: { toolCallId: string; messages: never[] }) => unknown;
  };
  if (!execute) throw new Error("tool has no execute()");
  return (await execute(input, { toolCallId: "test", messages: [] })) as Output;
}
