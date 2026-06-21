import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';

/**
 * Income Summary — Staff Payout DERIVED FROM Staff Income (VP-1048 TC-38/40/41/44).
 *
 * Instead of trusting the Income Summary row alone, this rebuilds the Staff
 * Payout section from the per-staff settled report (`reportStaffDailyIncomeList`)
 * and checks the aggregates that the store rollup is a plain sum of:
 *   Σ subtotal   == staffPayoutTotalService
 *   Σ tip        == staffPayoutTip
 *   Σ cleanUpFee == staffPayoutCleanUpFee
 *   Σ staffSalary== staffPayoutSalary
 *
 * Anchors on the most recent SETTLED past day (immutable — the live per-staff
 * query returns today's drifting data, so it can't reconstruct a past day).
 *
 * NOT reconstructable by a plain per-staff sum: Commission, Pay 1/Pay 2, Total
 * and Supply Share — the store-level Staff Payout applies the staff/salon split,
 * so e.g. Σ staffCommission ≠ staffPayoutCommission and Σ supplyFee equals the
 * TOTAL supply fee, not the staff share. Those stay verified against the IS row
 * directly (TC-44/47 in the main staff-payout spec).
 */

test.describe(`Income Summary — Staff Payout from Staff Income (real data) ${Tag.REGRESSION}`, () => {
  test('TC-38/40/41/44: per-staff settled income sums into the Staff Payout section', async ({
    incomeSummaryService,
    reportService,
  }) => {
    const found = await incomeSummaryService.findRecentDetailDay();
    test.skip(found === null, 'No settled day with data in the last 30 days');
    if (!found) return;
    const { date, row } = found;

    const staff = await reportService.getStaffDailyIncomeListSettled(date);
    test.skip(staff.length === 0, 'No per-staff settled rows for that day');

    const sum = (pick: (s: (typeof staff)[number]) => number): number =>
      staff.reduce((acc, s) => acc + pick(s), 0);

    // Total Service (subtotal) — sale − refund across staff.
    expect(sum((s) => s.subtotal), 'Σ subtotal == Total Service').toBe(row.staffPayoutTotalService);
    // Tip / Clean Up Fee / Salary roll up as a straight sum.
    expect(sum((s) => s.tip), 'Σ tip == Staff Payout Tip').toBe(row.staffPayoutTip);
    expect(sum((s) => s.cleanUpFee), 'Σ cleanUpFee == Clean Up Fee').toBe(row.staffPayoutCleanUpFee);
    expect(sum((s) => s.staffSalary), 'Σ staffSalary == Staff Salary').toBe(row.staffPayoutSalary);
  });

  // Commission / Pay 1 / Pay 2 / Total / Supply Share are NOT a plain per-staff
  // sum (the store rollup applies the staff↔salon split). Reconstructing them
  // needs the backend split rule — covered against the IS row in the main spec.
  test.fixme('TC-38(rate)/44: Commission / Pay1+Pay2 / Total / Supply Share from per-staff (needs store split rule)', () => {});
});
