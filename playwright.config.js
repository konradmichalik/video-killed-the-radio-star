import { defineConfig, devices } from '@playwright/test';

// Mobile-first E2E. Runs the Vite dev server and tests on emulated touch devices.
// Requires a one-time browser install:  npx playwright install
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173', hasTouch: true },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 7) landscape'] } },
  ],
});
