import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { formatUsdFromCents } from '@utils/moneyUtils';

/**
 * Daily Sale Report — Tier 1 (math + reconciliation)
 *
 * Strategy: query GraphQL to read the *current* row for today, compute the
 * expected totals using the formulas in the spec, then assert the UI shows
 * the same numbers. No data is created or mutated.
 *
 * Coverage:
 *   TC-19 Income Detail: Sale / Tip / Tax Collected / Total Payment
 *   TC-20 Payment Detail: Card / Cash / Others / Amount Collected
 *   TC-21 Reconciliation: Income.TotalPayment === Payment.TotalPayment
 *
 * Pre-requisite: today must have at least 1 settled order, otherwise the
 * row is null and the test self-skips.
 */
test.describe(`Daily Sale Report — math & reconciliation ${Tag.REGRESSION}`, () => {
  test('TC-19 + TC-20 + TC-21: Income / Payment Details match GraphQL + reconcile', async ({
    dailySaleReportPage,
    passcodeDialog,
    reportService,
  }) => {
    // 1. Read the source of truth from GraphQL.
    const row = await reportService.getDailyIncome();
    test.skip(row === null, 'No income row for today — seed data first');
    if (!row) return; // narrowing for TS

    const totals = reportService.computeTotals(row);

    // 2. Open the report (passcode-protected route).
    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    // 3. TC-19 — Income Details
    await test.step('TC-19 Income Details match GraphQL', async () => {
      await expect(dailySaleReportPage.incomeSale()).toHaveText(
        formatUsdFromCents(totals.incomeSale),
      );
      await expect(dailySaleReportPage.incomeTip()).toHaveText(
        formatUsdFromCents(totals.incomeTip),
      );
      await expect(dailySaleReportPage.incomeTaxCollected()).toHaveText(
        formatUsdFromCents(totals.incomeTaxCollected),
      );
      await expect(dailySaleReportPage.incomeTotalPayment()).toHaveText(
        formatUsdFromCents(totals.incomeTotalPayment),
      );
    });

    // 4. TC-20 — Payment Details (Card/Cash/Others/Amount Collected)
    await test.step('TC-20 Payment Details match GraphQL', async () => {
      await expect(dailySaleReportPage.paymentCard()).toHaveText(
        formatUsdFromCents(totals.paymentCard),
      );
      await expect(dailySaleReportPage.paymentCash()).toHaveText(
        formatUsdFromCents(totals.paymentCash),
      );
      await expect(dailySaleReportPage.paymentOthers()).toHaveText(
        formatUsdFromCents(totals.paymentOthers),
      );
      await expect(dailySaleReportPage.paymentAmountCollected()).toHaveText(
        formatUsdFromCents(totals.paymentAmountCollected),
      );
      await expect(dailySaleReportPage.paymentGiftCardRedemption()).toHaveText(
        formatUsdFromCents(totals.paymentGiftCardRedemption),
      );
    });

    // 5. TC-21 — Reconciliation: Income.TotalPayment === Payment.TotalPayment === card
    await test.step('TC-21 Reconciliation: both Total Payment values agree', async () => {
      expect(totals.incomeTotalPayment).toBe(totals.paymentTotalPayment);

      await expect(dailySaleReportPage.paymentTotalPayment()).toHaveText(
        formatUsdFromCents(totals.paymentTotalPayment),
      );
      await expect(dailySaleReportPage.cardValue('Total Payment')).toHaveText(
        formatUsdFromCents(totals.paymentTotalPayment),
      );
    });
  });

  test('TC-26: every money value renders as $#,##0.00', async ({
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    const values = [
      dailySaleReportPage.incomeSale(),
      dailySaleReportPage.incomeTip(),
      dailySaleReportPage.incomeTaxCollected(),
      dailySaleReportPage.incomeTotalPayment(),
      dailySaleReportPage.paymentCard(),
      dailySaleReportPage.paymentCash(),
      dailySaleReportPage.paymentOthers(),
      dailySaleReportPage.paymentAmountCollected(),
      dailySaleReportPage.paymentGiftCardRedemption(),
      dailySaleReportPage.paymentTotalPayment(),
    ];

    for (const value of values) {
      // Matches "$0.00", "$1,234.56", "-$60.00" — never "0", "$1234", or empty.
      await expect(value).toHaveText(/^-?\$\d{1,3}(,\d{3})*\.\d{2}$/);
    }
  });
});
