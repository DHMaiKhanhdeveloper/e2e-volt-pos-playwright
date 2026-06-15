import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';

/**
 * Daily Sale Report — URL persistence (Tier 1, read-only)
 *
 * Coverage:
 *   TC-31 Reload preserves `activeChart` and `from`/`to` in the URL.
 *
 * The route at `index.tsx` declares `validateSearch: incomeDailySearchParamsSchema`,
 * so the URL is the source of truth for these params — they survive a hard
 * reload because TanStack Router re-parses them from the location.
 */

const unixForLocalMidnight = (date: Date): number => {
  const x = new Date(date);
  x.setHours(0, 0, 0, 0);
  return Math.floor(x.getTime() / 1000);
};

const unixForLocalEndOfDay = (date: Date): number => {
  const x = new Date(date);
  x.setHours(23, 59, 59, 999);
  return Math.floor(x.getTime() / 1000);
};

test.describe(`Daily Sale Report — URL persistence ${Tag.REGRESSION}`, () => {
  test('TC-31: reload keeps activeChart + from/to in the URL and the UI reflects them', async ({
    page,
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    // Pick a deterministic past day so the values don't drift between runs.
    // Yesterday at the box's local midnight.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const from = unixForLocalMidnight(yesterday);
    const to = unixForLocalEndOfDay(yesterday);

    const targetUrl = `${dailySaleReportPage['path']}?from=${from}&to=${to}&activeChart=totalTip`;

    // 1. Enter the report with a fully specified URL.
    await page.goto(targetUrl);
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    // Pre-reload: URL + UI agree with what we set.
    await expect(page).toHaveURL(/activeChart=totalTip/);
    await expect(page).toHaveURL(new RegExp(`from=${from}`));
    await expect(page).toHaveURL(new RegExp(`to=${to}`));
    expect(dailySaleReportPage.activeChartFromUrl()).toBe('totalTip');
    await expect(dailySaleReportPage.chartHeading).toHaveText('Total Tip');

    // 2. Hard reload.
    await page.reload();

    // Reload re-prompts the passcode (PermissionProtectedRoute does not
    // persist auth across page lifecycles). Re-enter, then assert state.
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    // Post-reload: same URL, same UI state.
    await expect(page).toHaveURL(/activeChart=totalTip/);
    await expect(page).toHaveURL(new RegExp(`from=${from}`));
    await expect(page).toHaveURL(new RegExp(`to=${to}`));
    expect(dailySaleReportPage.activeChartFromUrl()).toBe('totalTip');
    await expect(dailySaleReportPage.chartHeading).toHaveText('Total Tip');
    expect(await dailySaleReportPage.isCardSelected('Total Tip')).toBe(true);
  });
});
