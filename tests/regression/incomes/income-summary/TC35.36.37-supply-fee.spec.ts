import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { valueAfterLabel } from '@domains/income/incomeSummaryDetail';
import { openRecentDetail } from './incomeSummary.helpers';

/**
 * Income Summary — Supply Fee (VP-1048 TC-35…37).
 *
 * Anchors on the most recent settled past day. Verifies the UI shows the API
 * values and the share split reconciles:
 *   Staff Supply Share + Salon Supply Share = Total Supply Fee
 * Supply Fee may be negative on a refund-heavy day (QC#17 regression).
 */

test.describe(`Income Summary — Supply Fee (real data) ${Tag.REGRESSION}`, () => {
  test('TC-35 + TC-36 + TC-37: Total Supply Fee = Staff Share + Salon Share', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const supply = d.sections['Supply Fee'];
    const { row } = d;

    // TC-35: UI shows the API Total Supply Fee (refund-adjusted; may be < 0).
    expect(valueAfterLabel(supply, 'Total Supply Fee'), 'UI Total Supply Fee').toBe(
      row.supplyFeeTotal,
    );
    // TC-36: shares come from the API and the staff share is shown.
    expect(valueAfterLabel(supply, 'Staff Supply Share')).toBe(row.supplyFeeStaffShare);
    // TC-37: Salon Supply Share = Total − Staff Supply Share.
    expect(valueAfterLabel(supply, 'Salon Supply Share')).toBe(row.supplyFeeSalonShare);
    expect(row.supplyFeeStaffShare + row.supplyFeeSalonShare, 'Staff + Salon = Total').toBe(
      row.supplyFeeTotal,
    );
  });
});
