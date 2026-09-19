import { defineConfig } from "vitest/config";

// End-to-end: builds the app once, then each test file boots the real server
// (`node dist/server/entry.mjs`) on its own port against its own scratch DB.
// Set E2E_SKIP_BUILD=1 to reuse an existing dist/.
export default defineConfig({
  test: {
    include: ["tests/e2e/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/e2e/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
