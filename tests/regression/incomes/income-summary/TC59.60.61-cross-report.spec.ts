import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';

/**
 * Cross-report consistency: Daily Sale Report ↔ Income Summary (VP-1048 TC-59…61).
 *
 * Both reports source the same settled daily row, so shared figures must agree.
 * We compare the two services directly for the most recent day that has data —
 * no UI needed, and immune to today's live drift.
 */

test.describe(`Income Summary — cross-report (real data) ${Tag.REGRESSION}`, () => {
  test('TC-59: Daily Sale Report and Income Summary agree on Tax for the same day', async ({
    reportService,
    incomeSummaryService,
  }) => {
    const found = await incomeSummaryService.findRecentDetailDay();
    test.skip(found === null, 'No settled day with data in the last 30 days');
    if (!found) return;

    const dsr = await reportService.getDailyIncome(found.date);
    test.skip(dsr === null, 'Daily Sale Report has no row for that day');
    if (!dsr) return;

    // Tax is the same column in both reports → must be identical.
    expect(dsr.incomeTaxAmount, 'DSR Tax == Income Summary Tax').toBe(found.row.incomeTaxAmount);
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
