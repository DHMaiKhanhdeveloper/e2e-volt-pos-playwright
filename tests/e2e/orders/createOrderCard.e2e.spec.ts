import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { STAFF, OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';

test.describe(`Orders — create order with Card ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('creates an order with card payment and completes it', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
  }) => {
    const staff = STAFF.ELISE_TERRY;

    await test.step('Select staff member', async () => {
      await homePage.selectStaff(staff.nickname);
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
        staffName: staff.nickname,
        services: [
          { name: SERVICES.GEL_REMOVAL.name, price: SERVICES.GEL_REMOVAL.price },
          { name: SERVICES.DIPPING_OMBRE.name, price: SERVICES.DIPPING_OMBRE.price },
        ],
      });
    });

    await test.step('Tender card amount and complete', async () => {
      await checkoutPage.payByCardForOrderTotal();
      await checkoutPage.clickCompletePayment();
    });

    await test.step('Enter passcode and verify success', async () => {
      await passcodeDialog.enterPasscode(OWNER_PASSCODE);
      await paymentSuccessPage.waitForSuccess();
      expect(await paymentSuccessPage.isSuccessful()).toBe(true);
      await paymentSuccessPage.verifyPaymentMethod('Card');
    });

    await paymentSuccessPage.clickNoReceipt();
  });

  test('creates an order with a single service paid by card', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
  }) => {
    const staff = STAFF.AMELIA;

    await homePage.selectStaff(staff.nickname);
    await homePage.selectService(SERVICES.ACRYLIC_REMOVAL.name);

    await homePage.clickPay();

    await checkoutPage.payByCardForOrderTotal();
    await checkoutPage.clickCompletePayment();

    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    expect(await paymentSuccessPage.isSuccessful()).toBe(true);
    await paymentSuccessPage.verifyPaymentMethod('Card');

    await paymentSuccessPage.clickNoReceipt();
  });

  test('creates an order with multiple services paid by card', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
  }) => {
    const staff = STAFF.LUNA;

    await homePage.selectStaff(staff.nickname);
    await homePage.selectService(SERVICES.WAXING_LIP_CHIN.name);
    await homePage.selectService(SERVICES.SPA_SERVICE.name);

    await homePage.clickPay();

    await checkoutPage.verifyOrderDetails({
      staffName: staff.nickname,
      services: [
        { name: SERVICES.WAXING_LIP_CHIN.name, price: SERVICES.WAXING_LIP_CHIN.price },
        { name: SERVICES.SPA_SERVICE.name, price: SERVICES.SPA_SERVICE.price },
      ],
    });

    await checkoutPage.payByCardForOrderTotal();
    await checkoutPage.clickCompletePayment();

    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    await paymentSuccessPage.verifyPaymentMethod('Card');

    await paymentSuccessPage.clickNoReceipt();
  });

  test('switches from cash to card before completing payment', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
  }) => {
    const staff = STAFF.EMMA2;

    await homePage.selectStaff(staff.nickname);
    await homePage.selectService(SERVICES.GEL_REMOVAL.name);
    await homePage.clickPay();

    await test.step('Initially pick Cash', async () => {
      await checkoutPage.selectPaymentMethod('Cash');
      expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
    });

    await test.step('Switch to Card and complete', async () => {
      await checkoutPage.payByCardForOrderTotal();
      await checkoutPage.clickCompletePayment();
    });

    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    await paymentSuccessPage.verifyPaymentMethod('Card');

    await paymentSuccessPage.clickNoReceipt();
  });

  test('records a video of the full card-payment flow', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
  }) => {
    // Plain happy-path with a different staff — useful as a "recorded reference"
    // for the dashboard so reviewers can replay the card flow end-to-end.
    const staff = STAFF.ISABELLA;

    await homePage.selectStaff(staff.nickname);
    await homePage.selectService(SERVICES.BLACK_WHITE_FULL_SET.name);

    await homePage.clickPay();

    await checkoutPage.payByCardForOrderTotal();
    await checkoutPage.clickCompletePayment();

    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    await paymentSuccessPage.verifyPaymentMethod('Card');

    await paymentSuccessPage.clickNoReceipt();
  });
});
