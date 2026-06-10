import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { STAFF, OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';
import { formatUsdFromCents, parseCentsFromUsd } from '@utils/moneyUtils';
import type { StoreDailyIncomeRow } from '@api/models/Report';
import type { ReportService } from '@api/services/ReportService';

/**
 * Daily Sale Report — Tier 2 (live data delta)
 *
 * Strategy: snapshot today's totals via GraphQL → create a known order in
 * the UI → re-fetch totals → assert the DELTA equals the order amount.
 *
 * Coverage:
 *   TC-38 Live data — Cash order updates Sale, Cash, Total Payment by exactly
 *         the right amount.
 *   TC-19/TC-21 (live) — Tip flows to Total Tip card and Amount Collected,
 *         NOT to Sale.
 *
 * These are slower (~30s each) because they drive the full create-order UI
 * flow. Run in serial within this file — they share today's totals and would
 * race with each other.
 */
test.describe.configure({ mode: 'serial' });

interface IncomeFields {
  sale: number;
  tip: number;
  cash: number;
  card: number;
  others: number;
  amountCollected: number;
  totalPayment: number;
}

const toFields = (row: StoreDailyIncomeRow | null): IncomeFields => ({
  sale: row?.dailySaleSale ?? 0,
  tip: row?.dailySaleTip ?? 0,
  cash: row?.dailySalePaymentCash ?? 0,
  card: row?.dailySalePaymentCard ?? 0,
  others: row?.dailySalePaymentOthers ?? 0,
  amountCollected: row?.dailySalePaymentAmountCollected ?? 0,
  totalPayment: row?.dailySaleTotalPayment ?? 0,
});

/**
 * After completing an order the backend needs a moment to roll the live
 * report. Poll until either `sale` OR `totalPayment` moves vs `prev`, then
 * read the final row. 10s ceiling — well under a Playwright assertion timeout.
 */
const waitForRowToAdvance = async (
  reportService: ReportService,
  prev: IncomeFields,
): Promise<StoreDailyIncomeRow> => {
  const deadline = Date.now() + 10_000;
  let row: StoreDailyIncomeRow | null = null;
  while (Date.now() < deadline) {
    row = await reportService.getDailyIncome();
    const current = toFields(row);
    if (current.totalPayment !== prev.totalPayment || current.sale !== prev.sale) {
      return row!;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!row) throw new Error('storeDailyIncomeLive never returned a row');
  return row;
};

test.describe(`Daily Sale Report — live delta ${Tag.REGRESSION} ${Tag.PAYMENT} ${Tag.SLOW}`, () => {
  test('TC-38: cash order increases Sale, Cash, and Total Payment by the order amount', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
    dailySaleReportPage,
    reportService,
  }) => {
    const service = SERVICES.GEL_REMOVAL; // $10.00
    const expectedSaleDelta = parseCentsFromUsd(service.price);
    // No tip in this test — keeps the delta math simple. The tip path is
    // covered by the follow-up test below.
    const expectedTipDelta = 0;
    const expectedCashDelta = expectedSaleDelta + expectedTipDelta;

    // 1. Snapshot today's totals BEFORE creating the order.
    const before = toFields(await reportService.getDailyIncome());

    // 2. Create + pay a fresh cash order via the UI.
    await homePage.goto();
    await homePage.selectStaff(STAFF.AMELIA.nickname);
    await homePage.selectService(service.name);
    await homePage.clickPay();
    await checkoutPage.addTip('0');
    await checkoutPage.selectPaymentMethod('Cash');
    expect(await checkoutPage.isCompletePaymentEnabled()).toBe(true);
    await checkoutPage.clickCompletePayment();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    await paymentSuccessPage.clickNoReceipt();

    // 3. Re-fetch the report row and assert the delta is exactly the order.
    const afterRow = await waitForRowToAdvance(reportService, before);
    const after = toFields(afterRow);

    expect(after.sale - before.sale, 'Sale delta').toBe(expectedSaleDelta);
    expect(after.tip - before.tip, 'Tip delta').toBe(expectedTipDelta);
    expect(after.cash - before.cash, 'Cash delta').toBe(expectedCashDelta);
    expect(after.card - before.card, 'Card delta').toBe(0);
    expect(after.others - before.others, 'Others delta').toBe(0);
    expect(after.amountCollected - before.amountCollected, 'Amount Collected delta').toBe(
      expectedCashDelta,
    );
    expect(after.totalPayment - before.totalPayment, 'Total Payment delta').toBe(expectedCashDelta);

    // 4. The UI must show the same numbers the report row reports.
    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    await expect(dailySaleReportPage.incomeSale()).toHaveText(formatUsdFromCents(after.sale));
    await expect(dailySaleReportPage.paymentCash()).toHaveText(formatUsdFromCents(after.cash));
    await expect(dailySaleReportPage.paymentAmountCollected()).toHaveText(
      formatUsdFromCents(after.amountCollected),
    );
    await expect(dailySaleReportPage.paymentTotalPayment()).toHaveText(
      formatUsdFromCents(after.totalPayment),
    );
  });

  test('TC-19 (live): tip goes to Total Tip & Amount Collected, NOT to Sale', async ({
    homePage,
    checkoutPage,
    passcodeDialog,
    paymentSuccessPage,
    reportService,
  }) => {
    const service = SERVICES.WAXING_LIP_CHIN; // $8.00
    const expectedSaleDelta = parseCentsFromUsd(service.price);
    const expectedTipDelta = 100; // $1.00
    const expectedAmountCollectedDelta = expectedSaleDelta + expectedTipDelta;

    const before = toFields(await reportService.getDailyIncome());

    await homePage.goto();
    await homePage.selectStaff(STAFF.EMMA2.nickname);
    await homePage.selectService(service.name);
    await homePage.clickPay();
    await checkoutPage.addTip('100'); // $1.00 — same shape used by createOrder.e2e.spec.ts
    await checkoutPage.selectPaymentMethod('Cash');
    await checkoutPage.clickCompletePayment();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    await paymentSuccessPage.clickNoReceipt();

    const after = toFields(await waitForRowToAdvance(reportService, before));

    // Spec invariant: tip is NOT counted in Sale.
    expect(after.sale - before.sale, 'Sale delta (no tip)').toBe(expectedSaleDelta);
    // Tip lands in its own bucket.
    expect(after.tip - before.tip, 'Tip delta').toBe(expectedTipDelta);
    // Tip IS collected, so Amount Collected = sale + tip.
    expect(
      after.amountCollected - before.amountCollected,
      'Amount Collected delta (sale+tip)',
    ).toBe(expectedAmountCollectedDelta);
  });
});
