import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';
import { PRODUCTS } from '@data/static/products';
import { Logger } from '@utils/logger';

/**
 * SOAK / INFINITE-LOOP variant of `createCashOrder.bug.spec.ts`.
 *
 * Each iteration runs the EXACT same flow as the single-order bug repro
 * (staff → service → product → customer → pending sanity → Cash + tip →
 * passcode → success → No Receipt → assert it left Pending Orders → Home),
 * repeated to stress the Pending Orders / payment path under repeated load.
 *
 * NOTE — why a service is also added: a tip is only collectible when the order
 * has at least one staff-attributed line. The app gates the Tip button on
 * `staffsAmounts.length > 0`; a retail product alone files under the "Store"
 * bucket and keeps Tip disabled. So the flow adds a service to the staff in
 * addition to the product, which mirrors a real salon ticket (service + retail).
 *
 * Operational notes:
 *  - `test.setTimeout(0)` removes the per-test timeout, so the loop is NOT
 *    killed at the default 60s — it runs until you stop it (Ctrl+C).
 *  - trace / video / screenshot are turned OFF at file level (these options
 *    can't live in a describe group, and an endless test would otherwise grow
 *    those artifacts until the run runs out of memory/disk).
 *  - Truly infinite by default. Set `LOOP_COUNT=N` to bound it, e.g.
 *      LOOP_COUNT=20 npx playwright test tests/Bug/createCashOrderLoop.bug.spec.ts --project=chromium
 *  - As an endless test it never "passes" on its own — it either keeps looping
 *    or fails on the first broken iteration (which is the point of a soak run).
 */
test.use({ trace: 'off', video: 'off', screenshot: 'off' });

const log = Logger.child({ module: 'cash-order-soak' });

test.describe(`Bug — cash order soak loop ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
  test('repeatedly creates & pays cash orders (infinite loop)', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
    orderPendingPage,
  }) => {
    test.setTimeout(0); // no timeout — loop until the process is stopped

    // Build pools from the DB-sourced static fixtures and ROTATE through them so
    // every iteration uses a different service / product (cycling once a pool is
    // exhausted) instead of pinning to one fixed item. Fall back to the full
    // list if a filter yields nothing. Staff is whichever card the UI shows
    // first each iteration, not pinned to a fixed nickname.
    const pricedServices = Object.values(SERVICES).filter((s) => s.priceCents > 0);
    const servicePool = pricedServices.length ? pricedServices : Object.values(SERVICES);
    const pricedProducts = Object.values(PRODUCTS).filter((p) => p.priceCents > 0);
    const productPool = pricedProducts.length ? pricedProducts : Object.values(PRODUCTS);
    const customerPhone = '250'; // search fragment for the seeded "UNKNOWN2502" customer
    const tipCents = '2000'; // $20.00

    // Default Infinity ⇒ truly infinite; override with LOOP_COUNT to bound it.
    const maxIterations = Number(process.env.LOOP_COUNT ?? Infinity);
    const label = Number.isFinite(maxIterations) ? `/${maxIterations}` : '';

    for (let i = 1; i <= maxIterations; i++) {
      let orderNumber = '';

      // Enumerate DISTINCT (service × product) combinations by mixed-radix
      // decoding the iteration index. Independent `i % len` per pool moved them in
      // lockstep and repeated the 3-item product pool every 3 orders — so combos
      // looked duplicated. This walks every unique pair before any repeats.
      const comboCount = servicePool.length * productPool.length;
      const n = (i - 1) % comboCount;
      const service = servicePool[Math.floor(n / productPool.length) % servicePool.length];
      const product = productPool[n % productPool.length];

      // Equivalent to the single test's `beforeEach` — start each iteration on Home.
      await homePage.goto();

      let staffName = '';

      await test.step('Select a staff member', async () => {
        staffName = await homePage.selectAnyStaff();
      });

      log.info(
        `iteration ${i}${label} — start (staff=${staffName}, service=${service.name}, product=${product.name})`,
      );

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

      log.info(`iteration ${i}${label} — done (${orderNumber} left Pending)`);
    }
  });
});
