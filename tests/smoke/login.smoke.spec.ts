import { test, expect } from '@fixtures/index';
import { env } from '@configs/env/loadEnv';
import { Tag } from '@/types/testTags';

test.describe(`Auth — login ${Tag.SMOKE} ${Tag.AUTH}`, () => {
  test('admin can log in and reach the dashboard', async ({
    page,
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(env.ADMIN_USER, env.ADMIN_PASS);
    await dashboardPage.waitForReady();
    await dashboardPage.expectLoaded();
    await expect(page).toHaveURL(new RegExp(env.DASHBOARD_PATH));
  });

  test('rejects invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('not-a-user@example.com', 'wrong-password');
    await loginPage.expectError(/invalid/i);
  });
});
