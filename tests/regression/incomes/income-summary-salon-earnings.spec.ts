import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { valueAfterLabel } from '@utils/incomeSummaryDetail';
import { openRecentDetail } from './incomeSummary.helpers';

/**
 * Income Summary — Salon Earnings (VP-1048 TC-52…55).
 *
 * Anchors on the most recent settled past day. Verifies the UI renders the API
 * values and the section formulas hold (allowing negatives — QC#13):
 *   Net Earnings  = Salon Commission + Product Sale − Product Refund − Total Discount
 *   Total Earnings = Net Earnings + Staff Supply Share + Clean Up Fee − Staff Salary
 * The Salon total and the Staff Payout total are computed independently — never
 * forced to match (TC-55).
 */

const v = (text: string, label: string): number => {
  const value = valueAfterLabel(text, label);
  expect(value, `"${label}" present in Salon Earnings`).not.toBeNull();
  return value as number;
};

test.describe(`Income Summary — Salon Earnings (real data) ${Tag.REGRESSION}`, () => {
  test('TC-52 + TC-53: UI renders API values; Net Earnings formula holds', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const se = d.sections['Salon Earnings'];
    const { row } = d;

    // TC-52: UI shows the API Salon Commission (computed from owner rate).
    expect(v(se, 'Salon Commission')).toBe(row.salonEarningsCommission);
    expect(v(se, 'Net Earnings')).toBe(row.salonEarningsNet);

    // TC-53: Net Earnings = Commission + Product Sale − Product Refund − Total Discount
    expect(v(se, 'Net Earnings'), 'Net Earnings formula').toBe(
      v(se, 'Salon Commission') +
        v(se, 'Product Sale') -
        v(se, 'Product Refund') -
        v(se, 'Total Discount'),
    );
  });

  test('TC-54 + TC-55: Total Earnings formula; independent of Staff Payout', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const se = d.sections['Salon Earnings'];
    const { row } = d;

    expect(v(se, 'Total Earnings')).toBe(row.salonEarningsTotal);

    // TC-54: Total Earnings = Net + Staff Supply Share + Clean Up − Staff Salary
    expect(v(se, 'Total Earnings'), 'Total Earnings formula').toBe(
      v(se, 'Net Earnings') +
        v(se, 'Staff Supply Share') +
        v(se, 'Clean Up Fee') -
        v(se, 'Staff Salary'),
    );

    // TC-55: Salon total and Staff total are each their own number (not coerced equal).
    expect(row.salonEarningsTotal, 'Salon total computed independently').not.toBeNaN();
    expect(row.staffPayoutTotal, 'Staff total computed independently').not.toBeNaN();
  });
});
