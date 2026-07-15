import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from './configs/env/loadEnv';
import { shopTimezone } from './src/data/static/shops';

const env = loadEnv();

// Browser timezone = the active shop's zone (each merchant keeps its own books in
// its local time). Driven by `SHOP` / `TZ_ID` so date math + the app's "Today"
// agree. Defaults to the shop map / Asia/Ho_Chi_Minh.
const timezoneId = shopTimezone(process.env.SHOP);

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  snapshotDir: './tests/visual/__snapshots__',

  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
    toMatchSnapshot: { maxDiffPixelRatio: 0.02 },
  },

  // Single worker because Volt POS shares backend state across browser
  // sessions: 2 workers create race conditions on the same staff's active
  // order. If the backend is later isolated per-session, workers can go up.
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/json/results.json' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    [
      'allure-playwright',
      { outputFolder: 'reports/allure-results', detail: true, suiteTitle: true },
    ],
  ],

  use: {
    baseURL: env.BASE_URL,
    headless: env.HEADLESS,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // Only keep artifacts for failing tests by default — recording everything
    // (trace/video/screenshot 'on') was the biggest source of runtime overhead
    // in the full-suite run. Set TRACE/SCREENSHOT/VIDEO=on to force full capture.
    trace: (process.env.TRACE ?? 'retain-on-failure') as 'on' | 'retain-on-failure' | 'off',
    screenshot: (process.env.SCREENSHOT ?? 'only-on-failure') as 'on' | 'only-on-failure' | 'off',
    video: (process.env.VIDEO ?? 'retain-on-failure') as 'on' | 'retain-on-failure' | 'off',
    locale: 'en-US',
    timezoneId,
    launchOptions: {
      slowMo: env.SLOW_MO,
    },
  },

  projects: [
    {
      name: 'chromium',
      testIgnore: '**/tests/api/**',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.BASE_URL },
    },
    // Uncomment when cross-browser coverage is needed.
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],
});
