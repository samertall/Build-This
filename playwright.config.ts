import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /(presentation-order|team-review)\.browser\.spec\.ts/,
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "TEAM_REVIEW_TEST_MODE=true PORT=5001 pnpm --filter @workspace/api-server run dev",
      url: "http://127.0.0.1:5001/api/healthz",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        "VITE_PRESENTATION_ORDER_TEST_MODE=true VITE_TEAM_REVIEW_TEST_MODE=true API_PROXY_TARGET=http://127.0.0.1:5001 BASE_PATH=/ PORT=5173 pnpm --filter @workspace/ux-workflow run dev",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "browser",
      use: {
        baseURL: "http://127.0.0.1:5173",
      },
    },
  ],
});