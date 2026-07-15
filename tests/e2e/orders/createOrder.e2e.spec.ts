import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';

test.describe(`Orders — create order ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('creates an order with cash payment and completes it', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
  }) => {
    let staffName = '';

    await test.step('Select staff member', async () => {
      staffName = await homePage.selectAnyStaff();
    });

    await test.step('Add services', async () => {
      await homePage.selectService(SERVICES.GEL_REMOVAL.name);
      await homePage.selectService(SERVICES.DIPPING_OMBRE.name);
    });

    await test.step('Navigate to checkout', async () => {
      await homePage.clickPay();
    });

    await test.step('Verify order details on checkout', async () => {
      await checkoutPage.verifyOrderDetails({
        staffName,
        services: [
          { name: SERVICES.GEL_REMOVAL.name, price: SERVICES.GEL_REMOVAL.price },
          { name: SERVICES.DIPPING_OMBRE.name, price: SERVICES.DIPPING_OMBRE.price },
        ],
      });
    });

    await test.step('Pay with cash and complete', async () => {
      // Tip must be set on cashier side before Complete Payment — otherwise
      // the app waits on the (absent) customer-facing display. $1.00 here.
      await checkoutPage.addTip('100');
      await checkoutPage.selectPaymentMethod('Cash');
      expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
      await checkoutPage.clickCompletePayment();
    });

    await test.step('Enter passcode and verify success', async () => {
      await passcodeDialog.enterPasscode(OWNER_PASSCODE);
      await paymentSuccessPage.waitForSuccess();
      expect(await paymentSuccessPage.isSuccessful()).toBe(true);
      await paymentSuccessPage.verifyPaymentMethod('Cash');
    });

    await paymentSuccessPage.clickNoReceipt();
  });

  test('does not allow pay without selecting a service', async ({ homePage }) => {
    await homePage.selectAnyStaff();
    await expect(homePage.payButton).toBeDisabled();
  });

  test('creates an order with multiple services', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
  }) => {
    await homePage.selectAnyStaff();
    await homePage.selectService(SERVICES.WAXING_LIP_CHIN.name);
    await homePage.selectService(SERVICES.SPA_SERVICE.name);

    await homePage.clickPay();

    await checkoutPage.addTip('100');
    await checkoutPage.selectPaymentMethod('Cash');
    await checkoutPage.clickCompletePayment();

    await passcodeDialog.enterPasscode(OWNER_PASSCODE);

    await paymentSuccessPage.waitForSuccess();
    expect(await paymentSuccessPage.isSuccessful()).toBe(true);

    await paymentSuccessPage.clickNoReceipt();
  });

  test('creates order with single service and pays with cash', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
  }) => {
    await homePage.selectAnyStaff();
    await homePage.selectService(SERVICES.ACRYLIC_REMOVAL.name);

    await homePage.clickPay();

    await checkoutPage.addTip('100');
    await checkoutPage.selectPaymentMethod('Cash');
    await checkoutPage.clickCompletePayment();

    await passcodeDialog.enterPasscode(OWNER_PASSCODE);

    await paymentSuccessPage.waitForSuccess();
    expect(await paymentSuccessPage.isSuccessful()).toBe(true);

    await paymentSuccessPage.clickNoReceipt();
  });
});
