import { defineConfig } from "@playwright/test";

// Public-page smoke tests run without production credentials or any database.
export default defineConfig({
  testDir: "./tests",
  testMatch: /public-pages\.browser\.spec\.ts/,
  fullyParallel: false,
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:5182" },
  webServer: {
    command: "VITE_TEAM_REVIEW_TEST_MODE=true BASE_PATH=/ PORT=5182 pnpm --filter @workspace/ux-workflow run dev",
    url: "http://127.0.0.1:5182/privacy",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
