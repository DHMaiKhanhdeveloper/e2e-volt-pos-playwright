import { Page } from '@playwright/test';
import { LoginPage } from '@pages/auth/LoginPage';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { env } from '@configs/env/loadEnv';

/**
 * UI-level helper. Use this when the test scenario itself is about login,
 * or when storage-state pre-auth is not appropriate.
 * For most tests, prefer the authFixture (asAdminContext / asCashierContext).
 */
export const loginViaUi = async (
  page: Page,
  user: string,
  pass: string,
): Promise<DashboardPage> => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user, pass);
  const dashboard = new DashboardPage(page);
  await dashboard.waitForReady();
  return dashboard;
};

export const loginAsAdmin = (page: Page) => loginViaUi(page, env.ADMIN_USER, env.ADMIN_PASS);
export const loginAsCashier = (page: Page) => loginViaUi(page, env.CASHIER_USER, env.CASHIER_PASS);
