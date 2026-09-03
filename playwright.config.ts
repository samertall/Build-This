import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /presentation-order\.browser\.spec\.ts/,
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "VITE_PRESENTATION_ORDER_TEST_MODE=true BASE_PATH=/ PORT=5173 pnpm --filter @workspace/ux-workflow run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});