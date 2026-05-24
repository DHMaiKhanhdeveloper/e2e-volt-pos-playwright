import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { STAFF, OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';
import { OTHER_PAYMENT_LABELS } from '@data/static/paymentMethods';

const STAFF_POOL = Object.values(STAFF);
const [defaultStaff, secondaryStaff = defaultStaff] = STAFF_POOL;

test.describe(`Orders — Other payment method ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  OTHER_PAYMENT_LABELS.forEach(({ label, methodName }, index) => {
    test(`pays with Other (${label})`, async ({
      homePage,
      otherPaymentPage,
      passcodeDialog,
      paymentSuccessPage,
    }) => {
      // Rotate through the staff pool so coverage isn't pinned to a single name.
      const staff = STAFF_POOL[index % STAFF_POOL.length];

      await test.step('Build order: staff + single service', async () => {
        await homePage.selectStaff(staff.nickname);
        await homePage.selectService(SERVICES.RED_WHITE_FULL_SET.name);
        await homePage.clickPay();
      });

      await test.step(`Pay with Other tagged "${methodName}"`, async () => {
        // Tip must be set on cashier side before Complete Payment — otherwise
        // the app waits on the (absent) customer-facing display.
        await otherPaymentPage.addTip('100');
        await otherPaymentPage.payWithOther(methodName);
        await passcodeDialog.enterPasscode(OWNER_PASSCODE);
      });

      await test.step('Verify payment success carries the custom label', async () => {
        await paymentSuccessPage.waitForSuccess();
        expect(await paymentSuccessPage.isSuccessful()).toBe(true);
        await paymentSuccessPage.verifyPaymentMethod('Other');
        await paymentSuccessPage.verifyPaymentMethod(methodName);
      });

      await paymentSuccessPage.clickNoReceipt();
    });
  });

  test('Other payment input becomes visible only after selecting Other', async ({
    homePage,
    otherPaymentPage,
  }) => {
    await homePage.selectStaff(defaultStaff.nickname);
    await homePage.selectService(SERVICES.RED_WHITE_FULL_SET.name);
    await homePage.clickPay();

    await expect(otherPaymentPage.methodNameInput).toBeHidden();
    await otherPaymentPage.selectOther();
    await expect(otherPaymentPage.methodNameInput).toBeVisible();
    expect(await otherPaymentPage.getMethodNameValue()).toBe('');
  });

  test('Other payment with multiple services', async ({
    homePage,
    otherPaymentPage,
    passcodeDialog,
    paymentSuccessPage,
  }) => {
    await homePage.selectStaff(secondaryStaff.nickname);
    await homePage.selectService(SERVICES.GEL_REMOVAL.name);
    await homePage.selectService(SERVICES.WAXING_LIP_CHIN.name);
    await homePage.clickPay();

    await otherPaymentPage.addTip('100');
    await otherPaymentPage.payWithOther('Bank Transfer');
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);

    await paymentSuccessPage.waitForSuccess();
    expect(await paymentSuccessPage.isSuccessful()).toBe(true);
    await paymentSuccessPage.verifyPaymentMethod('Other');
    await paymentSuccessPage.verifyPaymentMethod('Bank Transfer');

    await paymentSuccessPage.clickNoReceipt();
  });

  test('changing the typed name updates the field value before submit', async ({
    homePage,
    otherPaymentPage,
  }) => {
    await homePage.selectStaff(defaultStaff.nickname);
    await homePage.selectService(SERVICES.RED_WHITE_FULL_SET.name);
    await homePage.clickPay();

    await otherPaymentPage.selectOther();
    await otherPaymentPage.enterMethodName('First');
    expect(await otherPaymentPage.getMethodNameValue()).toBe('First');

    await otherPaymentPage.enterMethodName('Second');
    expect(await otherPaymentPage.getMethodNameValue()).toBe('Second');
  });
});
