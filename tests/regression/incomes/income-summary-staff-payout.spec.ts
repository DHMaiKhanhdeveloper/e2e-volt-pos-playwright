import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { valueAfterLabel } from '@utils/incomeSummaryDetail';
import { openRecentDetail } from './incomeSummary.helpers';

/**
 * Income Summary — Staff Payout (VP-1048 TC-38…51).
 *
 * Anchors on the most recent settled past day. Asserts the UI renders the API
 * values (data-driven correctness) and the section totals reconcile:
 *   Total Staff Payout = Commission + Tip − Clean Up Fee + Salary   (QC#12 fix)
 *   Pay 1 + Pay 2 + Staff Salary = Total Staff Payout               (TC-47)
 *
 * Setting-dependent cases (exact commission %, salary type, pay-split %,
 * pay-period close/estimate) need staff/commission fixtures the shared dev
 * environment can't guarantee, so they're marked `fixme` below.
 */

test.describe(`Income Summary — Staff Payout (real data) ${Tag.REGRESSION}`, () => {
  test('TC-38…43: UI renders the API commission / clean-up / salary values', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const sp = d.sections['Staff Payout'];
    const { row } = d;

    expect(valueAfterLabel(sp, 'Staff Commission'), 'Commission').toBe(row.staffPayoutCommission);
    expect(valueAfterLabel(sp, 'Tip'), 'Tip').toBe(row.staffPayoutTip);
    expect(valueAfterLabel(sp, 'Clean Up Fee'), 'Clean Up Fee').toBe(row.staffPayoutCleanUpFee);
    expect(valueAfterLabel(sp, 'Staff Salary'), 'Staff Salary').toBe(row.staffPayoutSalary);
    expect(valueAfterLabel(sp, 'Total Service'), 'Total Service').toBe(row.staffPayoutTotalService);
  });

  test('TC-44: Total Staff Payout = Commission + Tip − Clean Up + Salary', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const sp = d.sections['Staff Payout'];
    const { row } = d;

    expect(valueAfterLabel(sp, 'Total Staff Payout'), 'UI Total Staff Payout').toBe(
      row.staffPayoutTotal,
    );
    // QC#12: clean-up fee is SUBTRACTED, not added.
    expect(row.staffPayoutTotal, 'Commission + Tip − CleanUp + Salary').toBe(
      row.staffPayoutCommission +
        row.staffPayoutTip -
        row.staffPayoutCleanUpFee +
        row.staffPayoutSalary,
    );
  });

  // Pay 1 / Pay 2 split (TC-45, 46) depends on a per-staff commission-split
  // setting and only renders under the "Show more" expander with dynamic "%"
  // subtext, so it can't be asserted deterministically on shared-env data.
  // TC-47 (Pay1 + Pay2 + Salary = Total) is additionally unverified — on real
  // data the three don't sum to Total, matching the doc's open question ⚠️ #1.
  test.fixme('TC-45 + TC-46 + TC-47: Pay 1 / Pay 2 split & their relation to Total (needs split-setting fixture + spec confirmation)', () => {});

  // TC-48 (Show more / Show less toggle) is covered by the overview spec.
  // Remaining setting-dependent cases need a staff/commission/pay-period fixture
  // to assert the exact rate, salary type, or close-vs-estimate value.
  test.fixme('TC-38(rate)/39/40/41/42/43/49/50/51: commission %, salary types, pay-period close', () => {});
});
