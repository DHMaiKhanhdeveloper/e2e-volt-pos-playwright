import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { formatUsdFromCents } from '@utils/moneyUtils';
import { valueAfterLabel } from '@utils/incomeSummaryDetail';
import { openRecentDetail } from '../income-summary/incomeSummary.helpers';

/**
 * Income Reports — cross-report UI consistency (VP-1048 / VP-1402, AC6).
 *
 * The data-level reconciliation lives in tests/api/income-reports; this checks
 * the same invariant at the UI layer: the Daily Sale Report and Income Summary
 * screens must DISPLAY the same Tax & Total Payment for the same settled day.
 *
 * Anchored on the most recent settled past day (immutable → the rendered
 * numbers don't drift like "today" does). See
 * docs/test-cases/income-reports/README.md.
 */
test.describe(`Income Reports — cross-report UI consistency ${Tag.REGRESSION}`, () => {
  test('Daily Sale Report and Income Summary show the same Tax & Total Payment (AC6)', async ({
    dailySaleReportPage,
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    // 1. Income Summary side — open the detail panel for the settled day.
    const is = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(is === null, 'No settled day with data in the last 30 days');
    if (!is) return;

    const isTax = valueAfterLabel(is.sections['Sale Details'], 'Tax Collected');
    const isTotalPayment = valueAfterLabel(is.sections['Payment Details'], 'Total Payment');
    expect(isTax, 'Income Summary shows Tax Collected').not.toBeNull();
    expect(isTotalPayment, 'Income Summary shows Total Payment').not.toBeNull();

    // The Income Summary UI must match its own API row (sanity anchor).
    expect(isTax, 'IS Tax == API row').toBe(is.row.incomeTaxAmount);
    expect(isTotalPayment, 'IS Total Payment == API row').toBe(is.row.incomeSummaryTotalPayment);

    // 2. Daily Sale Report side — same day.
    await dailySaleReportPage.gotoDate(is.date);
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    // 3. Cross-report: the two screens display identical Tax & Total Payment.
    await expect(
      dailySaleReportPage.incomeTaxCollected(),
      'Tax Collected matches across both reports',
    ).toHaveText(formatUsdFromCents(isTax as number));
    await expect(
      dailySaleReportPage.paymentTotalPayment(),
      'Total Payment matches across both reports',
    ).toHaveText(formatUsdFromCents(isTotalPayment as number));
  });
});
