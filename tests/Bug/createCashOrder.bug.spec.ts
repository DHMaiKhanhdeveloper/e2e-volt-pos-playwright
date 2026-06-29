import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { STAFF, OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';
import { PRODUCTS } from '@data/static/products';

/**
 * BUG REPRO — Pending Orders after a completed cash payment.
 *
 * Reproduces the manual flow:
 *   1. Pick a staff member
 *   2. Add a retail product
 *   3. Enter customer phone "250" and pick the first matched customer
 *   4. Pay → Cash
 *   5. Add a tip
 *   6. Complete Payment
 *   7. Enter owner passcode (8888)
 *   8. "No Receipt"
 *   9. The paid order should then leave the Pending Orders list.
 *  10. Return to the Home screen.
 *
 * NOTE — why a service is also added: a tip is only collectible when the order
 * has at least one staff-attributed line. The app gates the Tip button on
 * `staffsAmounts.length > 0`; a retail product alone files under the "Store"
 * bucket and keeps Tip disabled. So the flow adds a service to the staff in
 * addition to the product, which mirrors a real salon ticket (service + retail).
 */
test.describe(`Bug — cash order should leave Pending Orders ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('completed cash order (product + service + tip) is removed from Pending Orders', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
    orderPendingPage,
  }) => {
    // Pick catalogue items generically from the DB-sourced static fixtures so
    // the test isn't pinned to one specific seeded service/product/staff — any
    // active staff and any priced service/product reproduces the bug.
    const staff =
      Object.values(STAFF).find((s) => s.status === 'active') ?? Object.values(STAFF)[0];
    const service =
      Object.values(SERVICES).find((s) => s.priceCents > 0) ?? Object.values(SERVICES)[0];
    const product =
      Object.values(PRODUCTS).find((p) => p.priceCents > 0) ?? Object.values(PRODUCTS)[0];
    const customerPhone = '250'; // search fragment for the seeded "UNKNOWN2502" customer
    const tipCents = '2000'; // $20.00
    let orderNumber = '';

    await test.step('Select a staff member', async () => {
      await homePage.selectStaff(staff.nickname);
    });

    await test.step('Add a service (so a tip can be collected for the staff)', async () => {
      await homePage.selectService(service.name);
    });

    await test.step('Add a retail product', async () => {
      await homePage.selectProduct(product.name);
    });

    await test.step(`Attach a customer by phone "${customerPhone}"`, async () => {
      await homePage.enterCustomerPhone(customerPhone);
      await homePage.selectFirstCustomerResult();
    });

    await test.step('Capture the order number before paying', async () => {
      orderNumber = await homePage.getOrderNumber();
      expect(orderNumber, 'order number should be captured from the active order panel').toMatch(
        /^OD\d{6}-\d+$/,
      );
    });

    await test.step('Sanity check: the order shows in the Pending Orders sidebar', async () => {
      // The active order is also listed in the Home pending-orders sidebar, so
      // this asserts presence without navigating away (which would disturb the
      // active order). The same locator works on /order-pending too.
      await orderPendingPage.expectOrderPresent(orderNumber);
    });

    await test.step('Pay with cash + tip and complete', async () => {
      await homePage.clickPay();
      // Tip must be set on the cashier side before Complete Payment, otherwise
      // the build pauses on the (absent) customer-facing display.
      await checkoutPage.addTip(tipCents);
      await checkoutPage.selectPaymentMethod('Cash');
      expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
      await checkoutPage.clickCompletePayment();
    });

    await test.step('Enter passcode and confirm success', async () => {
      await passcodeDialog.enterPasscode(OWNER_PASSCODE);
      await paymentSuccessPage.waitForSuccess();
      expect(await paymentSuccessPage.isSuccessful()).toBe(true);
      await paymentSuccessPage.verifyPaymentMethod('Cash');
    });

    await test.step('Skip the receipt', async () => {
      await paymentSuccessPage.clickNoReceipt();
    });

    await test.step('The paid order is no longer in Pending Orders', async () => {
      await orderPendingPage.goto();
      await orderPendingPage.expectOrderAbsent(orderNumber);
    });

    await test.step('Return to the Home screen', async () => {
      await homePage.goto();
      await expect(homePage.staffSearchInput).toBeVisible();
      await homePage.expectUrlContains('/home');
    });
  });
});
