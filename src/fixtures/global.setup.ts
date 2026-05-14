import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { env } from '@configs/env/loadEnv';
import { UserRole, RoleStoragePath } from '@configs/constants/roles';
import { Logger } from '@utils/logger';

const log = Logger.child({ module: 'global.setup' });

interface SeedUser {
  role: UserRole;
  username: string;
  password: string;
}

/**
 * Logs in once per role and writes Playwright storageState JSON files.
 * Subsequent tests reuse the session via auth.fixture.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  log.info(`Global setup running on ENV=${env.ENV} BASE_URL=${env.BASE_URL}`);

  const users: SeedUser[] = [
    { role: UserRole.ADMIN, username: env.ADMIN_USER, password: env.ADMIN_PASS },
    { role: UserRole.CASHIER, username: env.CASHIER_USER, password: env.CASHIER_PASS },
  ];

  const browser = await chromium.launch();
  try {
    for (const u of users) {
      await seedAuthState(browser, u);
    }
  } finally {
    await browser.close();
  }

  log.info('Global setup complete');
}

async function seedAuthState(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  user: SeedUser,
): Promise<void> {
  const file = path.resolve(process.cwd(), RoleStoragePath[user.role]);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const ctx = await browser.newContext({ baseURL: env.BASE_URL, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  log.info(`Seeding auth for role=${user.role} user=${user.username}`);
  await page.goto(env.LOGIN_PATH, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('login-username').fill(user.username);
  await page.getByTestId('login-password').fill(user.password);
  await page.getByTestId('login-submit').click();
  // Wait for an authenticated state signal — adjust selector per real app.
  await page.waitForURL(new RegExp(env.DASHBOARD_PATH));

  await ctx.storageState({ path: file });
  await ctx.close();
}
