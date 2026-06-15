import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';

/**
 * Daily Sale Report — Order Detail dialog (Tier 1, read-only)
 *
 * Coverage:
 *   TC-35 Click a row in the orders table → "Order Details" dialog opens
 *         and the URL gains `orderId=<id>`.
 *   TC-36 Dialog closes via the (×) button AND via ESC; URL drops `orderId`.
 *
 * Code source: `income-daily-orders-table-dialog.tsx` syncs the dialog
 * `open` state to the `orderId` URL param (see `useIncomeDailyActions`).
 */
test.describe(`Daily Sale Report — Order Detail dialog ${Tag.REGRESSION}`, () => {
  test.beforeEach(async ({ dailySaleReportPage, passcodeDialog }) => {
    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();
  });

  test('TC-35: clicking a row opens the Order Details dialog and sets ?orderId', async ({
    page,
    dailySaleReportPage,
  }) => {
    const orderCode = await dailySaleReportPage.firstOrderCode();
    test.skip(orderCode === null, 'No orders today — seed data first');
    if (!orderCode) return;

    await dailySaleReportPage.openOrderDetail(orderCode);

    await expect(dailySaleReportPage.orderDetailDialogTitle).toBeVisible();
    await expect(page).toHaveURL(/orderId=/);

    // The dialog body should at least mention the order code we clicked, so
    // we have a sanity check that it loaded the right order.
    await expect(dailySaleReportPage.orderDetailDialog).toContainText(orderCode);
  });

  test('TC-36: dialog closes via the × button and clears ?orderId', async ({
    page,
    dailySaleReportPage,
  }) => {
    const orderCode = await dailySaleReportPage.firstOrderCode();
    test.skip(orderCode === null, 'No orders today — seed data first');
    if (!orderCode) return;

    await dailySaleReportPage.openOrderDetail(orderCode);
    await dailySaleReportPage.closeOrderDetailViaButton();

    await expect(dailySaleReportPage.orderDetailDialog).toBeHidden();
    await expect(page).not.toHaveURL(/orderId=/);
  });

  test('TC-36: dialog closes via ESC and clears ?orderId', async ({
    page,
    dailySaleReportPage,
  }) => {
    const orderCode = await dailySaleReportPage.firstOrderCode();
    test.skip(orderCode === null, 'No orders today — seed data first');
    if (!orderCode) return;

    await dailySaleReportPage.openOrderDetail(orderCode);
    await dailySaleReportPage.closeOrderDetailViaEscape();

    await expect(dailySaleReportPage.orderDetailDialog).toBeHidden();
    await expect(page).not.toHaveURL(/orderId=/);
  });

  test('TC-36: reopening with another row replaces ?orderId without leaking state', async ({
    page,
    dailySaleReportPage,
  }) => {
    // Pull two distinct order codes from the table.
    const rows = dailySaleReportPage.ordersTable.locator('tbody tr');
    const rowCount = await rows.count();
    test.skip(rowCount < 2, 'Need at least 2 orders today to verify dialog replacement');

    const codes: string[] = [];
    for (let i = 0; i < rowCount && codes.length < 2; i++) {
      const text = (await rows.nth(i).textContent()) ?? '';
      const match = text.match(/OD\d{6}-\d+/);
      if (match) codes.push(match[0]);
    }
    if (codes.length < 2) return;
    const [first, second] = codes;

    // The `orderId` URL param is an internal UUID, not the visible OD-code,
    // so capture the actual value from the URL rather than asserting on the
    // order code.
    await dailySaleReportPage.openOrderDetail(first);
    const firstId = new URL(page.url()).searchParams.get('orderId');
    expect(firstId, 'first open sets an orderId').toBeTruthy();

    await dailySaleReportPage.closeOrderDetailViaButton();
    await dailySaleReportPage.openOrderDetail(second);
    const secondId = new URL(page.url()).searchParams.get('orderId');
    expect(secondId, 'second open sets an orderId').toBeTruthy();

    // Reopening with a different row swaps the orderId — the first one must
    // not leak into the second dialog's URL.
    expect(secondId, 'orderId is replaced, not appended').not.toBe(firstId);
  });
});
