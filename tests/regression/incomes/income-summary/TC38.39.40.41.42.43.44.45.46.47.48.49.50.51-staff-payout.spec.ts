import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { valueAfterLabel } from '@domains/income/incomeSummaryDetail';
import { openRecentDetail } from './incomeSummary.helpers';

/**
 * Income Summary — Staff Payout (VP-1048 TC-38…51).
 *
 * Anchors on the most recent settled past day. Asserts the UI renders the API
 * values (data-driven correctness) and the section total reconciles:
 *   Total Staff Payout = Pay 1 + Pay 2   (the pay-split partitions the total;
 *   Staff Salary is already inside the split, not added on top — resolves ⚠️#1)
 *
 * The refined VP-1048 spec expands the total to
 *   Commission + Tip + Salary − Supply Fee − Clean Up − Discount/Card charges,
 * but the Discount/Card charge line items aren't rendered or exposed by the API
 * (⚠️#5/#6), so that component sum can't be reconstructed here — we verify the
 * authoritative API total instead.
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

  test('TC-44 + TC-47: Total Staff Payout = Pay 1 + Pay 2 (Salary inside the split)', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const sp = d.sections['Staff Payout'];
    const { row } = d;

    // UI shows the authoritative API total.
    expect(valueAfterLabel(sp, 'Total Staff Payout'), 'UI Total Staff Payout').toBe(
      row.staffPayoutTotal,
    );
    // TC-44/47: the total is partitioned by the Pay 1 + Pay 2 split, with Staff
    // Salary already inside it (not added on top). The expanded component formula
    // (… − Supply Fee − Discount/Card charges) can't be reconstructed from the
    // rendered fields — those charge line items aren't exposed (⚠️#5/#6).
    expect(row.staffPayoutTotal, 'Total Staff Payout = Pay 1 + Pay 2').toBe(
      row.staffPayoutPay1 + row.staffPayoutPay2,
    );
  });

  // Pay 1 / Pay 2 split TEXT (TC-45, 46) — the exact value vs the dynamic "%"
  // subtext under "Show more" depends on a per-staff commission-split setting, so
  // it can't be asserted deterministically on shared-env data (the Total = Pay 1
  // + Pay 2 relation itself is covered above).
  test.fixme('TC-45 + TC-46: Pay 1 / Pay 2 split values & dynamic % text (needs split-setting fixture)', () => {});

  // TC-48 (Show more / Show less toggle) is covered by the overview spec.
  // Remaining setting-dependent cases need a staff/commission/pay-period fixture
  // to assert the exact rate, salary type, or close-vs-estimate value.
  test.fixme('TC-38(rate)/39/40/41/42/43/49/50/51: commission %, salary types, pay-period close', () => {});
});
