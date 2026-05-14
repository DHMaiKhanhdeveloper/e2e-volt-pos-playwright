import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
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

  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/json/results.json' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['allure-playwright', { outputFolder: 'reports/allure-results', detail: true, suiteTitle: true }],
  ],

  use: {
    baseURL: env.BASE_URL,
    headless: env.HEADLESS,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Ho_Chi_Minh',
    extraHTTPHeaders: {
      'X-Test-Run': 'playwright-e2e',
    },
    launchOptions: {
      slowMo: env.SLOW_MO,
    },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      dependencies: ['setup'],
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: env.API_BASE_URL,
      },
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  globalSetup: path.resolve(__dirname, './src/fixtures/global.setup.ts'),
  globalTeardown: path.resolve(__dirname, './src/fixtures/global.teardown.ts'),

  webServer: undefined,
});
