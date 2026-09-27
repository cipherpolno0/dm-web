import { defineConfig, devices } from "@playwright/test";

const databaseUrl = process.env.E2E_DATABASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  globalSetup: "./tests/e2e/global-setup.ts",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: databaseUrl
    ? {
        command: "pnpm exec next dev --webpack --port 3100",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: !process.env.CI,
        env: {
          DATABASE_URL: databaseUrl,
          AUTH_SECRET: "e2e-only-auth-secret-not-for-production",
          AUTH_TRUST_HOST: "true",
          APPLICANT_ID_HASH_SECRET: "e2e-test-only",
          NODE_ENV: "test",
        },
      }
    : undefined,
});
