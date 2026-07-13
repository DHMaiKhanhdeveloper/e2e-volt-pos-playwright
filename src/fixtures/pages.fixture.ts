import { test as base } from '@playwright/test';
import { HomePage } from '@pages/pos/HomePage';
import { OrderPendingPage } from '@pages/pos/OrderPendingPage';
import { CheckoutPage } from '@pages/pos/CheckoutPage';
import { OtherPaymentPage } from '@pages/pos/OtherPaymentPage';
import { PaymentSuccessPage } from '@pages/pos/PaymentSuccessPage';
import { DailySaleReportPage } from '@pages/pos/DailySaleReportPage';
import { IncomeSummaryPage } from '@pages/pos/IncomeSummaryPage';
import { IncomeStaffPage } from '@pages/pos/IncomeStaffPage';
import { OrderHistoryPage } from '@pages/pos/OrderHistoryPage';
import { TimeTrackingPage } from '@pages/pos/TimeTrackingPage';
import { EmployeeSettingsPage } from '@pages/settings/EmployeeSettingsPage';
import { BusinessInfoPage } from '@pages/settings/BusinessInfoPage';
import { LanguageSettingsPage } from '@pages/settings/LanguageSettingsPage';
import { AppointmentPage } from '@pages/pos/AppointmentPage';
import { PasscodeDialog } from '@components/modal/PasscodeDialog';

export interface PagesFixture {
  homePage: HomePage;
  orderPendingPage: OrderPendingPage;
  checkoutPage: CheckoutPage;
  otherPaymentPage: OtherPaymentPage;
  paymentSuccessPage: PaymentSuccessPage;
  dailySaleReportPage: DailySaleReportPage;
  incomeSummaryPage: IncomeSummaryPage;
  incomeStaffPage: IncomeStaffPage;
  orderHistoryPage: OrderHistoryPage;
  timeTrackingPage: TimeTrackingPage;
  employeeSettingsPage: EmployeeSettingsPage;
  businessInfoPage: BusinessInfoPage;
  languageSettingsPage: LanguageSettingsPage;
  appointmentPage: AppointmentPage;
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
  incomeStaffPage: async ({ page }, use) => {
    await use(new IncomeStaffPage(page));
  },
  orderHistoryPage: async ({ page }, use) => {
    await use(new OrderHistoryPage(page));
  },
  timeTrackingPage: async ({ page }, use) => {
    await use(new TimeTrackingPage(page));
  },
  employeeSettingsPage: async ({ page }, use) => {
    await use(new EmployeeSettingsPage(page));
  },
  businessInfoPage: async ({ page }, use) => {
    await use(new BusinessInfoPage(page));
  },
  languageSettingsPage: async ({ page }, use) => {
    await use(new LanguageSettingsPage(page));
  },
  appointmentPage: async ({ page }, use) => {
    await use(new AppointmentPage(page));
  },
  passcodeDialog: async ({ page }, use) => {
    await use(new PasscodeDialog(page));
  },
});
