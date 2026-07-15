import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';

const ORDER_CONFIGS = [
  { services: [SERVICES.GEL_REMOVAL] },
  { services: [SERVICES.DIPPING_OMBRE] },
  { services: [SERVICES.ACRYLIC_REMOVAL] },
  { services: [SERVICES.WAXING_LIP_CHIN] },
  { services: [SERVICES.SPA_SERVICE] },
  { services: [SERVICES.GEL_REMOVAL, SERVICES.DIPPING_OMBRE] },
  { services: [SERVICES.ACRYLIC_REMOVAL, SERVICES.WAXING_LIP_CHIN] },
  { services: [SERVICES.SPA_SERVICE, SERVICES.GEL_REMOVAL] },
  { services: [SERVICES.DIPPING_OMBRE, SERVICES.ACRYLIC_REMOVAL] },
  { services: [SERVICES.WAXING_LIP_CHIN, SERVICES.SPA_SERVICE] },
];

test.describe(`Orders — bulk create 10 orders ${Tag.REGRESSION} ${Tag.SLOW}`, () => {
  for (let i = 0; i < ORDER_CONFIGS.length; i++) {
    const config = ORDER_CONFIGS[i];
    const serviceNames = config.services.map((s) => s.name).join(' + ');

    test(`Order ${i + 1}/10: ${serviceNames}`, async ({
      homePage,
      checkoutPage,
      passcodeDialog,
      paymentSuccessPage,
    }) => {
      await homePage.goto();

      await test.step('Select staff', async () => {
        await homePage.selectAnyStaff();
      });

      await test.step('Add services', async () => {
        for (const service of config.services) {
          await homePage.selectService(service.name);
        }
      });

      await test.step('Go to checkout', async () => {
        await homePage.clickPay();
      });

      await test.step('Pay with cash', async () => {
        // Tip must be set on cashier side before Complete Payment — otherwise
        // the app waits on the (absent) customer-facing display.
        await checkoutPage.addTip('100');
        await checkoutPage.selectPaymentMethod('Cash');
        await checkoutPage.clickCompletePayment();
      });

      await test.step('Enter passcode', async () => {
        await passcodeDialog.enterPasscode(OWNER_PASSCODE);
      });

      await test.step('Verify success', async () => {
        await paymentSuccessPage.waitForSuccess();
        expect(await paymentSuccessPage.isSuccessful()).toBe(true);
      });

      await paymentSuccessPage.clickNoReceipt();
    });
  }
});
