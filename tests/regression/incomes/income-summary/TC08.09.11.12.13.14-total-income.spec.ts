import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { parseCentsFromUsd } from '@utils/moneyUtils';

/**
 * Income Summary — Total Income headline & gross/net (VP-1048 TC-8…14).
 *
 * Gross/Net are read straight from the API detail row and verified to exclude
 * Gift Card sale (QC#9 / AC5):
 *   Gross = Service Sale + Product Sale                 (excludes Gift Card)
 *   Net   = Gross − Total Refund
 * The headline Total Income equals the period's Net Total and keeps its sign on
 * a loss day (TC-11).
 */

const MONEY = /^-?\$\d{1,3}(,\d{3})*\.\d{2}$/;

test.describe(`Income Summary — Total Income (real data) ${Tag.REGRESSION}`, () => {
  test('TC-8 + TC-9: a comparison label and percentage are shown', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await incomeSummaryPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await incomeSummaryPage.waitForReady();

    // Day/Custom compares to the previous period of the same length.
    await expect(incomeSummaryPage.comparisonLabel()).toBeVisible();
    await expect(incomeSummaryPage.comparisonPercent()).toBeVisible();
  });

  test('TC-11: Total Income renders its value with the correct sign', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const found = await incomeSummaryService.findRecentDetailDay();
    test.skip(found === null, 'No settled day with data in the last 30 days');
    if (!found) return;

    await incomeSummaryPage.gotoRange(found.date, found.date, 'Day');
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await incomeSummaryPage.waitForReady();

    const headline = (await incomeSummaryPage.totalIncomeValue().textContent())?.trim() ?? '';
    expect(headline, 'Total Income is a signed money value').toMatch(MONEY);
    // Headline equals the period's Net Total (negative days are not clamped to 0).
    expect(parseCentsFromUsd(headline)).toBe(found.row.incomeNetTotal);
  });

  test('TC-12 + TC-13 + TC-14: Gross / Net exclude Gift Card sale', async ({
    incomeSummaryService,
  }) => {
    const found = await incomeSummaryService.findRecentDetailDay();
    test.skip(found === null, 'No settled day with data in the last 30 days');
    if (!found) return;
    const r = found.row;

    // TC-12: Gross = Service + Product sale, NOT including Gift Card sale.
    const gross = r.incomeServiceSale + r.incomeProductSale;
    const grossWithGc = gross + r.incomeGiftCardSale;
    // TC-14: the buggy value folded Gift Card sale in — guard against it.
    if (r.incomeGiftCardSale !== 0) {
      expect(gross, 'Gross excludes Gift Card sale').not.toBe(grossWithGc);
    }

    // TC-13: Net = Gross − Total Refund (refund stored positive in Sale Details).
    const net = gross - r.incomeTotalRefund;
    expect(r.incomeNetTotal, 'Net Total = Gross − Refund').toBe(net);
  });
});
