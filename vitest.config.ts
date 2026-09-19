import { defineConfig } from "vitest/config";

// Fast unit tests: libs against throwaway SQLite files, no server involved.
// The browser-facing behaviour lives in vitest.e2e.config.ts.
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    restoreMocks: true,
  },
});
