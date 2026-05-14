import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from './configs/env/loadEnv';

const env = loadEnv();

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  snapshotDir: './tests/visual/__snapshots__',

  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
    toMatchSnapshot: { maxDiffPixelRatio: 0.02 },
  },

  // Volt POS shares global state between orders (active order on home page),
  // so we run serially. Inside-file parallelism is enforced via
  // `test.describe.configure({ mode: 'serial' })` where it matters.
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
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
    // Record everything so the dashboard can replay both passing AND failing flows.
    // For CI cost-sensitivity, set VIDEO=retain-on-failure to keep only failures.
    trace: 'on',
    screenshot: 'on',
    video: (process.env.VIDEO ?? 'on') as 'on' | 'retain-on-failure' | 'off',
    locale: 'en-US',
    timezoneId: 'Asia/Ho_Chi_Minh',
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
