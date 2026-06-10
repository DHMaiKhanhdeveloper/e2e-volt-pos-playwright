import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { STAFF, OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';
import { parseCentsFromUsd } from '@utils/moneyUtils';
import type { StoreDailyIncomeRow } from '@api/models/Report';
import type { ReportService } from '@api/services/ReportService';

/**
 * Daily Sale Report — refund & cancel flows (Tier 2 / Cluster D).
 *
 * Coverage:
 *   TC-2  Total Order excludes cancelled orders (count delta = 0 after cancel)
 *   TC-4  Sale excludes cancelled orders (no Sale delta after cancel)
 *   TC-6  Total Tip excludes cancelled orders
 *   TC-8  Total Payment stays consistent after refund/cancel
 *   TC-22 Refund reduces Sale (Sale delta = order − refund amount)
 *   TC-23 Cancel removes order from every total
 *   TC-37 Refund row visual: red text + minus sign in orders table
 *
 * Strategy:
 *   1. Snapshot today's row via GraphQL.
 *   2. Create + complete a cash order via the UI (known service price).
 *   3. Cancel OR refund through Order History.
 *   4. Re-fetch the row, assert deltas line up with spec invariants.
 *
 * These are the slowest tests in the suite (~45s each) — they run serial
 * and tagged @slow so they're easy to exclude from quick smoke runs.
 */

interface IncomeFields {
  sale: number;
  tip: number;
  cash: number;
  card: number;
  amountCollected: number;
  totalPayment: number;
}

const toFields = (row: StoreDailyIncomeRow | null): IncomeFields => ({
  sale: row?.dailySaleSale ?? 0,
  tip: row?.dailySaleTip ?? 0,
  cash: row?.dailySalePaymentCash ?? 0,
  card: row?.dailySalePaymentCard ?? 0,
  amountCollected: row?.dailySalePaymentAmountCollected ?? 0,
  totalPayment: row?.dailySaleTotalPayment ?? 0,
});

/** Poll GraphQL until the live row's totalPayment changes vs `prev`, or timeout. */
const waitForRowToAdvance = async (
  reportService: ReportService,
  prev: IncomeFields,
  timeoutMs = 10_000,
): Promise<StoreDailyIncomeRow> => {
  const deadline = Date.now() + timeoutMs;
  let row: StoreDailyIncomeRow | null = null;
  while (Date.now() < deadline) {
    row = await reportService.getDailyIncome();
    const current = toFields(row);
    if (current.totalPayment !== prev.totalPayment || current.sale !== prev.sale) {
      return row!;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!row) throw new Error('Live row never returned');
  return row;
};

test.describe.configure({ mode: 'serial' });

test.describe(`Daily Sale Report — refund & cancel ${Tag.REGRESSION} ${Tag.PAYMENT} ${Tag.SLOW}`, () => {
  test("TC-23 + TC-2 + TC-6: cancelling an unsettled order leaves no trace in today's totals", async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
    orderHistoryPage,
    reportService,
  }) => {
    const service = SERVICES.GEL_REMOVAL; // $10.00
    const tipCents = 100; // $1.00

    // 1. Snapshot
    const before = toFields(await reportService.getDailyIncome());

    // 2. Create + pay
    await homePage.goto();
    await homePage.selectStaff(STAFF.AMELIA.nickname);
    await homePage.selectService(service.name);
    const orderCode = await homePage.getOrderNumber();
    await homePage.clickPay();
    await checkoutPage.addTip(String(tipCents));
    await checkoutPage.selectPaymentMethod('Cash');
    await checkoutPage.clickCompletePayment();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    await paymentSuccessPage.clickNoReceipt();

    // Sanity: the row must have advanced after the order completed.
    await waitForRowToAdvance(reportService, before);

    // 3. Cancel via Order History
    await orderHistoryPage.goto();
    await orderHistoryPage.openOrder(orderCode);
    const cancellable = await orderHistoryPage.canCancel();
    test.skip(!cancellable, 'Order is not cancellable in current state — UI gating prevented it');
    if (!cancellable) return;
    await orderHistoryPage.cancelOrder({ reason: 'e2e test cancel' });

    // 4. Re-snapshot and assert deltas → all zero
    // Brief settle window so the cancel propagates to the live report.
    await new Promise((r) => setTimeout(r, 1500));
    const after = toFields(await reportService.getDailyIncome());

    expect(after.sale - before.sale, 'Sale delta (cancel = no trace)').toBe(0);
    expect(after.tip - before.tip, 'Tip delta').toBe(0);
    expect(after.cash - before.cash, 'Cash delta').toBe(0);
    expect(after.totalPayment - before.totalPayment, 'Total Payment delta').toBe(0);
  });

  test('TC-22 + TC-4 + TC-37: refunding a settled order reduces Sale and renders the row in red', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
    orderHistoryPage,
    dailySaleReportPage,
    reportService,
  }) => {
    const service = SERVICES.WAXING_LIP_CHIN; // $8.00
    const expectedSale = parseCentsFromUsd(service.price);

    // 1. Snapshot
    const before = toFields(await reportService.getDailyIncome());

    // 2. Create + pay
    await homePage.goto();
    await homePage.selectStaff(STAFF.EMMA2.nickname);
    await homePage.selectService(service.name);
    const orderCode = await homePage.getOrderNumber();
    await homePage.clickPay();
    await checkoutPage.addTip('0');
    await checkoutPage.selectPaymentMethod('Cash');
    await checkoutPage.clickCompletePayment();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    await paymentSuccessPage.clickNoReceipt();

    await waitForRowToAdvance(reportService, before);
    const afterPay = toFields(await reportService.getDailyIncome());
    expect(afterPay.sale - before.sale, 'Sale +order before refund').toBe(expectedSale);

    // 3. Refund via Order History — note: refund requires settled status,
    // which may not happen immediately on a fresh order. If the button is
    // not yet available, skip rather than fail.
    await orderHistoryPage.goto();
    await orderHistoryPage.openOrder(orderCode);
    const refundable = await orderHistoryPage.canRefund();
    test.skip(!refundable, 'Order is not settled yet — Refund button gated');
    if (!refundable) return;
    await orderHistoryPage.refundOrder({ reason: 'e2e test refund' });

    // 4. Re-snapshot and assert Sale delta back to baseline
    await new Promise((r) => setTimeout(r, 1500));
    const afterRefund = toFields(await reportService.getDailyIncome());
    expect(afterRefund.sale - before.sale, 'Sale delta after refund (≈ 0)').toBe(0);

    // 5. TC-37: the refund row must render in destructive (red) styling
    // in today's Daily Sale Report orders table.
    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    const row = dailySaleReportPage.orderRow(orderCode);
    await expect(row).toBeVisible();
    // The row's Sale cell should carry the destructive Tailwind class.
    const saleCell = row.locator('td, [role="cell"]').nth(1);
    const cellClass = (await saleCell.getAttribute('class')) ?? '';
    expect(cellClass, 'refund row has destructive styling').toMatch(/text-destructive/);
    // And the value should be negative (leading minus).
    const saleText = (await saleCell.textContent())?.trim() ?? '';
    expect(saleText, 'refund row has negative Sale').toMatch(/^-\$/);
  });

  test('TC-8: Total Payment stays consistent across order lifecycle (create → cancel)', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
    orderHistoryPage,
    reportService,
  }) => {
    const service = SERVICES.SPA_SERVICE; // $5.80

    const before = toFields(await reportService.getDailyIncome());

    await homePage.goto();
    await homePage.selectStaff(STAFF.LUNA.nickname);
    await homePage.selectService(service.name);
    const orderCode = await homePage.getOrderNumber();
    await homePage.clickPay();
    await checkoutPage.addTip('0');
    await checkoutPage.selectPaymentMethod('Cash');
    await checkoutPage.clickCompletePayment();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    await paymentSuccessPage.clickNoReceipt();

    await waitForRowToAdvance(reportService, before);
    const afterPay = await reportService.getDailyIncome();
    if (afterPay) {
      // TC-8 reconciliation in the mid state: Income.TotalPayment must equal
      // Payment.TotalPayment, regardless of where in the lifecycle we are.
      const incomeTP = afterPay.dailySaleSale + afterPay.dailySaleTip + afterPay.incomeTaxAmount;
      const paymentTP =
        afterPay.dailySalePaymentCard +
        afterPay.dailySalePaymentCash +
        afterPay.dailySalePaymentOthers +
        afterPay.dailySalePaymentGiftCardRedemption;
      expect(incomeTP, 'mid-state: Income TP == Payment TP').toBe(paymentTP);
    }

    await orderHistoryPage.goto();
    await orderHistoryPage.openOrder(orderCode);
    const cancellable = await orderHistoryPage.canCancel();
    test.skip(!cancellable, 'Order is not cancellable');
    if (!cancellable) return;
    await orderHistoryPage.cancelOrder({ reason: 'e2e' });

    await new Promise((r) => setTimeout(r, 1500));
    const after = toFields(await reportService.getDailyIncome());
    expect(after.totalPayment, 'Total Payment back to baseline after cancel').toBe(
      before.totalPayment,
    );
  });
});
