import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { STAFF, OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';

test.describe(`Orders — Other payment method ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  // Parameterised set of common "Other" labels a salon may use.
  const otherCases = [
    { label: 'Bank Transfer', methodName: 'Bank Transfer' },
    { label: 'Zelle', methodName: 'Zelle' },
    { label: 'Venmo', methodName: 'Venmo' },
    { label: 'numeric label', methodName: '12345' },
    { label: 'special characters', methodName: 'Crypto-Pay #1' },
  ] as const;

  for (const { label, methodName } of otherCases) {
    test(`pays with Other (${label})`, async ({
      homePage,
      otherPaymentPage,
      passcodeDialog,
      paymentSuccessPage,
    }) => {
      const staff = STAFF.LUNA;

      await test.step('Build order: staff + single service', async () => {
        await homePage.selectStaff(staff.nickname);
        await homePage.selectService(SERVICES.RED_WHITE_FULL_SET.name);
        await homePage.clickPay();
      });

      await test.step(`Pay with Other tagged "${methodName}"`, async () => {
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
  }

  test('Other payment input becomes visible only after selecting Other', async ({
    homePage,
    otherPaymentPage,
  }) => {
    await homePage.selectStaff(STAFF.LUNA.nickname);
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
    await homePage.selectStaff(STAFF.AMELIA.nickname);
    await homePage.selectService(SERVICES.GEL_REMOVAL.name);
    await homePage.selectService(SERVICES.WAXING_LIP_CHIN.name);
    await homePage.clickPay();

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
    await homePage.selectStaff(STAFF.LUNA.nickname);
    await homePage.selectService(SERVICES.RED_WHITE_FULL_SET.name);
    await homePage.clickPay();

    await otherPaymentPage.selectOther();
    await otherPaymentPage.enterMethodName('First');
    expect(await otherPaymentPage.getMethodNameValue()).toBe('First');

    await otherPaymentPage.enterMethodName('Second');
    expect(await otherPaymentPage.getMethodNameValue()).toBe('Second');
  });
});
