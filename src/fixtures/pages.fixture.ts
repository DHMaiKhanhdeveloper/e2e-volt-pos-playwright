import { test as base } from '@playwright/test';
import { HomePage } from '@pages/pos/HomePage';
import { OrderPendingPage } from '@pages/pos/OrderPendingPage';
import { CheckoutPage } from '@pages/pos/CheckoutPage';
import { OtherPaymentPage } from '@pages/pos/OtherPaymentPage';
import { PaymentSuccessPage } from '@pages/pos/PaymentSuccessPage';
import { DailySaleReportPage } from '@pages/pos/DailySaleReportPage';
import { IncomeSummaryPage } from '@pages/pos/IncomeSummaryPage';
import { OrderHistoryPage } from '@pages/pos/OrderHistoryPage';
import { PasscodeDialog } from '@components/modal/PasscodeDialog';

export interface PagesFixture {
  homePage: HomePage;
  orderPendingPage: OrderPendingPage;
  checkoutPage: CheckoutPage;
  otherPaymentPage: OtherPaymentPage;
  paymentSuccessPage: PaymentSuccessPage;
  dailySaleReportPage: DailySaleReportPage;
  incomeSummaryPage: IncomeSummaryPage;
  orderHistoryPage: OrderHistoryPage;
  passcodeDialog: PasscodeDialog;
}

export const pagesFixture = base.extend<PagesFixture>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  orderPendingPage: async ({ page }, use) => {
    await use(new OrderPendingPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  otherPaymentPage: async ({ page }, use) => {
    await use(new OtherPaymentPage(page));
  },
  paymentSuccessPage: async ({ page }, use) => {
    await use(new PaymentSuccessPage(page));
  },
  dailySaleReportPage: async ({ page }, use) => {
    await use(new DailySaleReportPage(page));
  },
  incomeSummaryPage: async ({ page }, use) => {
    await use(new IncomeSummaryPage(page));
  },
  orderHistoryPage: async ({ page }, use) => {
    await use(new OrderHistoryPage(page));
  },
  passcodeDialog: async ({ page }, use) => {
    await use(new PasscodeDialog(page));
  },
});
