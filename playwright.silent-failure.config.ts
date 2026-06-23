import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/integration',
  testMatch: 'silent-failure.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 90_000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3006',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx next dev -p 3006',
    url: 'http://localhost:3006',
    reuseExistingServer: false,
    env: {
      HCM_SILENT_FAIL_RATE: '1',
      HCM_TIMEOUT_RATE: '0',
      HCM_CONFLICT_RATE: '0',
      NEXT_PUBLIC_BALANCE_POLL_MS: '2000',
      HCM_REQUEST_DELAY_MS: '0',
      HCM_BATCH_RATE_LIMIT_MS: '0',
    },
  },
})
