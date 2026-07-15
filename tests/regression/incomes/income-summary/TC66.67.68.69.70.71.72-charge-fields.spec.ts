import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { valueAfterLabel } from '@domains/income/incomeSummaryDetail';
import { openRecentDetail } from './incomeSummary.helpers';

/**
 * Income Summary — Staff Payout & Salon Earnings charge fields (VP-1048 TC-66…72).
 *
 * Line items added in the refined VP-1048 spec:
 *   Staff Discount Charge · Staff Card Charge - Commission · Staff Card Charge - Tip
 *     → Staff Payout SUBTRACTS them from Total / Pay 1; Salon Earnings ADDS them back.
 *   Salon Earnings → Tax Collected.
 *
 * The exact charge VALUES depend on per-staff `Staff Compensation` settings
 * (On Staff Commission / On Credit Card Tip) and promotion staff-share data the
 * shared dev environment can't guarantee, and the expanded Total formula has an
 * open question (doc ⚠️#5: Supply Fee may be double-counted vs the share already
 * netted into Commission). So the value-exact + total-reconciliation cases are
 * `fixme` pending a fixture + BA confirmation — see TC-44/45/54 too.
 *
 * TC-72 (Salon "Tax Collected") IS verifiable against the API today: it must
 * equal the Sale Details total tax (`incomeTaxAmount`), so it runs for real
 * whenever the build renders that line.
 */

const CHARGE_LABELS = [
  'Staff Discount Charge',
  'Staff Card Charge - Commission',
  'Staff Card Charge - Tip',
] as const;

test.describe(`Income Summary — charge fields & Salon tax (real data) ${Tag.REGRESSION}`, () => {
  test('TC-66…71: charge lines, when rendered, parse as valid money (integer cents)', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;

    let rendered = 0;
    for (const section of [d.sections['Staff Payout'], d.sections['Salon Earnings']]) {
      for (const label of CHARGE_LABELS) {
        const value = valueAfterLabel(section, label);
        if (value !== null) {
          rendered++;
          expect(Number.isInteger(value), `"${label}" parses to integer cents`).toBe(true);
        }
      }
    }
    // No charge settings on this dataset → nothing to assert (not a failure).
    test.skip(rendered === 0, 'Charge-field lines not rendered on this dataset');
  });

  test('TC-72: Salon Earnings "Tax Collected" = Sale Details total tax', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;

    const salonTax = valueAfterLabel(d.sections['Salon Earnings'], 'Tax Collected');
    test.skip(salonTax === null, 'Salon Earnings has no Tax Collected line on this build');
    expect(salonTax, 'Salon tax = Sale Details total tax (incomeTaxAmount)').toBe(
      d.row.incomeTaxAmount,
    );
  });

  // Value-exact cases need a Staff Compensation fixture (On Staff Commission /
  // On Credit Card Tip %) + promotion staff-share data, and the expanded
  // Total Staff Payout / Pay 1 / Total Earning formulas await BA confirmation on
  // the Supply Fee double-count (doc ⚠️#5). The API model has no field for these
  // charges yet, so they can't be data-driven asserted today.
  test.fixme('TC-66/67/68 (staff, subtracted) + TC-69/70/71 (salon, added): exact charge values & expanded totals (needs Staff Compensation fixture + ⚠️#5 confirmation + API fields)', () => {});
});
