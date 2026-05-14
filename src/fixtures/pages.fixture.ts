import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/auth/LoginPage';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { PaymentPage } from '@pages/payment/PaymentPage';

export interface PagesFixture {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  paymentPage: PaymentPage;
}

export const pagesFixture = base.extend<PagesFixture>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  paymentPage: async ({ page }, use) => {
    await use(new PaymentPage(page));
  },
});
