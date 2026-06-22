import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';

/**
 * Cross-report consistency: Daily Sale Report ↔ Income Summary (VP-1048 TC-59…61).
 *
 * Both reports source the same settled daily row, so shared figures must agree.
 * We compare the two services directly for the most recent day that has data —
 * no UI needed, and immune to today's live drift.
 *
 * TC-59 uses the Daily Sale Report row as the BASE (source of truth) and asserts
 * Income Summary matches it on every store-level field the two reports share:
 * Sale / Tip / Tax (total + per method) / payment-method totals / Amount Collected
 * / Total Payment. The detail-only blocks (Staff Payout, Salon Earnings, Supply
 * Fee, Sale Details split) have NO Daily Sale Report counterpart, so they can't
 * be cross-checked this way — they're covered by their own specs.
 */

test.describe(`Income Summary — cross-report (real data) ${Tag.REGRESSION}`, () => {
  test('TC-59: Income Summary matches the Daily Sale Report (base) on every shared figure', async ({
    reportService,
    incomeSummaryService,
  }) => {
    const found = await incomeSummaryService.findRecentDetailDay();
    test.skip(found === null, 'No settled day with data in the last 30 days');
    if (!found) return;

    const dsr = await reportService.getDailyIncome(found.date);
    test.skip(dsr === null, 'Daily Sale Report has no row for that day');
    if (!dsr) return;
    const is = found.row;

    // Totals — Daily Sale Report value drives the expectation.
    expect(dsr.incomeTaxAmount, 'Tax (total)').toBe(is.incomeTaxAmount);
    expect(dsr.dailySaleSale, 'Sale (net total)').toBe(is.incomeNetTotal);
    expect(dsr.dailySaleTip, 'Tip').toBe(is.incomeTip);
    expect(dsr.dailySaleTotalPayment, 'Total Payment').toBe(is.incomeSummaryTotalPayment);

    // Payment-method breakdown.
    expect(dsr.dailySalePaymentAmountCollected, 'Amount Collected').toBe(
      is.incomeSummaryPaymentAmountCollected,
    );
    expect(dsr.dailySalePaymentCash, 'Cash').toBe(is.incomeSummaryPaymentTotalCash);
    expect(dsr.dailySalePaymentCard, 'Card').toBe(is.incomeSummaryPaymentTotalCard);
    expect(dsr.dailySalePaymentOthers, 'Others').toBe(is.incomeSummaryPaymentTotalOthers);
    expect(dsr.dailySalePaymentGiftCardRedemption, 'Gift Card Redemption').toBe(
      is.incomeSummaryPaymentGiftCardRedemption,
    );

    // Per-method tax columns are the same field name in both rows.
    expect(dsr.paymentTaxCash, 'Tax — Cash').toBe(is.paymentTaxCash);
    expect(dsr.paymentTaxCard, 'Tax — Card').toBe(is.paymentTaxCard);
    expect(dsr.paymentTaxOthers, 'Tax — Others').toBe(is.paymentTaxOthers);
    expect(dsr.paymentTaxGiftCardRedemption, 'Tax — Gift Card Redemption').toBe(
      is.paymentTaxGiftCardRedemption,
    );
  });

  test('TC-60: Income Summary Total Refund = Service Refund + Product Refund', async ({
    incomeSummaryService,
  }) => {
    const found = await incomeSummaryService.findRecentDetailDay();
    test.skip(found === null, 'No settled day with data in the last 30 days');
    if (!found) return;
    const r = found.row;

    // The refund total must not double-count (QC#10): it's exactly the two parts.
    expect(r.incomeTotalRefund, 'Total Refund = Service + Product Refund').toBe(
      r.incomeServiceRefund + r.incomeProductRefund,
    );
  });

  // Print-receipt parity needs a print capture harness (native print dialog is
  // not interceptable cross-platform); covered manually per QC#7/#32.
  test.fixme('TC-61: Print receipt numbers match the on-screen report', () => {});
});
