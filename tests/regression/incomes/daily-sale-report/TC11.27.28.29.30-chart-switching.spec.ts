import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import type { ChartCard, ChartKey } from '@pages/pos/DailySaleReportPage';

// `ChartKey` is used to type the table below; importing it keeps the test
// data list strongly typed even though we don't annotate `.toBe()` calls.

/**
 * Daily Sale Report — chart switching (Tier 1, read-only)
 *
 * Coverage:
 *   TC-11 Sale chart (default)         — already implicit; included for completeness
 *   TC-27 Total Order chart            — click → activeChart=totalOrder
 *   TC-28 Total Tip chart              — click → activeChart=totalTip
 *   TC-29 Total Payment chart          — click → activeChart=totalPayment
 *   TC-30 Card selected visual state   — only the clicked card has the active classes
 *
 * Spec source: VP-1048 test cases §27–30.
 * Code source: `income-daily-statistics.tsx` (handleChartChange in
 * `use-income-daily.ts`) — clicking a card calls `navigate({ search: ... })`
 * setting `activeChart` in the URL.
 */
const CARDS: Array<{ card: ChartCard; key: ChartKey; label: string }> = [
  { card: 'Total Order', key: 'totalOrder', label: 'Total Order' },
  { card: 'Sale', key: 'sale', label: 'Sale' },
  { card: 'Total Tip', key: 'totalTip', label: 'Total Tip' },
  { card: 'Total Payment', key: 'totalPayment', label: 'Total Payment' },
];

test.describe(`Daily Sale Report — chart switching ${Tag.REGRESSION}`, () => {
  test.beforeEach(async ({ dailySaleReportPage, passcodeDialog }) => {
    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();
  });

  test('TC-11: defaults to the Sale chart on first load', async ({ dailySaleReportPage }) => {
    expect(dailySaleReportPage.activeChartFromUrl()).toBe('sale');
    await expect(dailySaleReportPage.chartHeading).toHaveText('Sale');
    expect(await dailySaleReportPage.isCardSelected('Sale')).toBe(true);
  });

  for (const { card, key, label } of CARDS) {
    test(`TC-27/28/29: clicking "${card}" sets activeChart=${key} and updates chart heading`, async ({
      dailySaleReportPage,
    }) => {
      await dailySaleReportPage.clickCard(card);

      expect(dailySaleReportPage.activeChartFromUrl()).toBe(key);
      await expect(dailySaleReportPage.chartHeading).toHaveText(label);
    });
  }

  test('TC-30: only the clicked card carries the selected visual state', async ({
    dailySaleReportPage,
  }) => {
    for (const { card } of CARDS) {
      await dailySaleReportPage.clickCard(card);

      // The clicked card is selected, every other card is not.
      for (const { card: other } of CARDS) {
        expect(
          await dailySaleReportPage.isCardSelected(other),
          `after clicking "${card}", card "${other}" selected=${other === card}`,
        ).toBe(other === card);
      }
    }
  });
});
