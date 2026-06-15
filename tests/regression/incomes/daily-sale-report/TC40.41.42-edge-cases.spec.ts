import { test, expect } from '@fixtures/index';
import type { Route } from '@playwright/test';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';

/**
 * Daily Sale Report — Tier 3 (mocked GraphQL)
 *
 * Strategy: intercept the GraphQL request via `page.route` and respond with
 * crafted payloads. This is the only way to reliably exercise:
 *   TC-40 loading skeleton (delay the response)
 *   TC-41 error fallback (return 500)
 *   TC-42 %vs Yesterday with yesterday = 0 (must not be Infinity/NaN)
 *
 * The mock intercepts ANY GraphQL POST and dispatches by operation name.
 * Operations we don't care about fall through to the real backend.
 */

/**
 * The Volt POS GraphQL client sends `operationName: null` and embeds the
 * operation name inside the `query` text (e.g. `query storeDailyIncomeLive`).
 * Read it from whichever place is populated so route mocks match reliably.
 */
const operationNameOf = (route: Route): string | undefined => {
  const body = route.request().postDataJSON();
  if (body?.operationName) return body.operationName as string;
  const query = typeof body?.query === 'string' ? body.query : '';
  return /\bquery\s+(\w+)/.exec(query)?.[1];
};

/** Build a "blank" daily income row with all values = `value` cents. */
const buildRow = (date: string, value = 0) => ({
  date,
  dailySaleSale: value,
  dailySaleTip: 0,
  dailySalePaymentCash: value,
  dailySalePaymentCard: 0,
  dailySalePaymentOthers: 0,
  dailySalePaymentGiftCardRedemption: 0,
  dailySalePaymentAmountCollected: value,
  dailySaleTotalPayment: value,
  incomeTaxAmount: 0,
  incomeTotalPayment: value,
  paymentTaxCard: 0,
  paymentTaxCash: 0,
  paymentTaxOthers: 0,
  paymentTaxGiftCardRedemption: 0,
  saleIncomeTaxAmount: 0,
  saleIncomeTotalPayment: value,
});

test.describe(`Daily Sale Report — edge cases (mocked) ${Tag.REGRESSION}`, () => {
  test('TC-40: skeleton appears while data is loading', async ({
    page,
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    // Delay every GraphQL response by 2s so we have time to see the skeleton.
    await page.route('**/graphql', async (route) => {
      await new Promise((r) => setTimeout(r, 2_000));
      await route.continue();
    });

    // Kick off navigation but don't await — we want to assert mid-flight.
    const navigation = dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);

    // Skeleton must be visible while requests are inflight.
    await expect(dailySaleReportPage.skeleton()).toBeVisible({ timeout: 5_000 });

    await navigation;

    // After data loads, the heading should be visible (real content rendered).
    await expect(dailySaleReportPage.heading).toBeVisible({ timeout: 15_000 });
  });

  test('TC-41: error fallback when GraphQL returns 500', async ({
    page,
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    await page.route('**/graphql', async (route) => {
      const op = operationNameOf(route);
      if (op?.startsWith('storeDailyIncome')) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Internal Server Error (mocked)' }],
          }),
        });
        return;
      }
      await route.continue();
    });

    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);

    await expect(dailySaleReportPage.errorMessage()).toBeVisible({ timeout: 15_000 });
  });

  test('TC-42: %vs Yesterday does not show Infinity/NaN when yesterday = 0', async ({
    page,
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    // Today has non-zero sale, yesterday is all zeros — would naïvely yield Infinity%.
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

    await page.route('**/graphql', async (route) => {
      const op = operationNameOf(route);

      if (op === 'storeDailyIncome') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              reportStoreDailyIncomeList: [
                buildRow(toIsoDate(today), 815_155), // $8,151.55
                buildRow(toIsoDate(yesterday), 0),
              ],
            },
          }),
        });
        return;
      }
      if (op === 'storeDailyIncomeLive') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { storeDailyIncomeLive: buildRow(toIsoDate(today), 815_155) },
          }),
        });
        return;
      }
      await route.continue();
    });

    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    // Each card's percentage label must not leak NaN/Infinity into the UI.
    for (const card of ['Total Order', 'Sale', 'Total Tip', 'Total Payment'] as const) {
      const pct = await dailySaleReportPage.cardPercentage(card).innerText();
      expect(pct, `card="${card}" percentage="${pct}"`).not.toMatch(/Infinity|NaN/i);
    }
  });
});
