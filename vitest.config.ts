import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * Tests default to the fast Node environment. Component tests opt into jsdom
 * per-file with a `// @vitest-environment jsdom` docblock.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/index.ts", "lib/venue/data.ts", "lib/**/types.ts", "lib/ai/client.ts"],
      reporter: ["text-summary", "html"],
      thresholds: { lines: 100, functions: 100, statements: 100, branches: 100 },
    },
  },
});
