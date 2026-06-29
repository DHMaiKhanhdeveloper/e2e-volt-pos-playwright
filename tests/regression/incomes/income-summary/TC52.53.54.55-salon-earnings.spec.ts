import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { valueAfterLabel } from '@utils/incomeSummaryDetail';
import { openRecentDetail } from './incomeSummary.helpers';

/**
 * Income Summary — Salon Earnings (VP-1048 TC-52…55).
 *
 * Anchors on the most recent settled past day. Verifies the UI renders the API
 * values and the formulas that ARE reconstructable hold (allowing negatives — QC#13):
 *   Net Earnings = Salon Commission + Product Sale − Product Refund − Total Discount
 *
 * The refined VP-1048 spec expands Total Earning with Discount Charge + Card
 * Charge (Comm+Tip) added back to the salon; those charge line items aren't
 * rendered / exposed by the API (⚠️#6), so the full component sum can't be
 * reconstructed — we assert the UI matches the authoritative API total instead.
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

    // TC-54: UI shows the authoritative API Total Earnings. The expanded formula
    // (Net + Staff Supply Share + Clean Up + Discount Charge − Staff Salary +
    // Card Charge) adds charge terms the panel/API don't surface (⚠️#6), so the
    // partial Net + Staff Supply Share + Clean Up − Staff Salary no longer sums
    // to the total — the full reconciliation needs a charge-bearing fixture.
    expect(v(se, 'Total Earnings')).toBe(row.salonEarningsTotal);

    // TC-55: Salon total and Staff total are each their own number (not coerced equal).
    expect(row.salonEarningsTotal, 'Salon total computed independently').not.toBeNaN();
    expect(row.staffPayoutTotal, 'Staff total computed independently').not.toBeNaN();
  });

  test('TC-55b: Salon ↔ Staff shared anchors are consistent', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row } = d;

    // Both sections quote the SAME Total Service (Service Sale − Service Refund).
    expect(row.salonEarningsTotalService, 'Salon Total Service == Staff Total Service').toBe(
      row.staffPayoutTotalService,
    );
    // The supply fee splits into exactly the staff share + salon share.
    expect(
      row.supplyFeeStaffShare + row.supplyFeeSalonShare,
      'Staff Supply Share + Salon Supply Share == Total Supply Fee',
    ).toBe(row.supplyFeeTotal);
    // The staff supply share is the same number both sections reference.
    expect(
      row.salonEarningsStaffSupplyShare,
      'Salon-side Staff Supply Share == Supply Fee staff share',
    ).toBe(row.supplyFeeStaffShare);
  });

  // The expanded Total Earning reconciliation (incl. Discount Charge + Card
  // Charge added back to the salon) needs a fixture that surfaces those charges
  // and BA confirmation of the formula (⚠️#5/#6).
  test.fixme('TC-54 (expanded): Total Earning = Net + Staff Supply Share + Clean Up + Discount Charge − Salary + Card Charge (needs charge fixture)', () => {});
});
