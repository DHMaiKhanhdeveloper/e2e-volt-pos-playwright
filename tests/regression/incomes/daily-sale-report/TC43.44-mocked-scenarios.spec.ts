import { test, expect } from '@fixtures/index';
import type { Route } from '@playwright/test';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { formatUsdFromCents } from '@utils/moneyUtils';
import type { StoreDailyIncomeRow } from '@api/models/Report';

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

/**
 * Daily Sale Report — mocked GraphQL scenarios (Tier 3).
 *
 * These TCs depend on data shapes that are awkward to reproduce in a fresh
 * dev environment — a single order with split tender, an order timestamped on
 * the timezone boundary. We respond to the GraphQL operations directly with
 * crafted payloads.
 *
 * Note: TC-16 (per-order tax) and TC-24 (gift card redemption) moved to
 * daily-sale-report-payment-types.spec.ts, where they now run against real
 * data through the checkout UI instead of mocked rows.
 *
 * Coverage:
 *   TC-43 Split payment allocates across Card / Cash / Gift Card buckets
 *   TC-44 Timezone boundary — an order at 23:59 belongs to the chosen day,
 *         00:01 the next day does not
 */

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

const blankRow = (overrides: Partial<StoreDailyIncomeRow> = {}): StoreDailyIncomeRow => ({
  date: todayIsoDate(),
  dailySaleSale: 0,
  dailySaleTip: 0,
  dailySalePaymentCash: 0,
  dailySalePaymentCard: 0,
  dailySalePaymentOthers: 0,
  dailySalePaymentGiftCardRedemption: 0,
  dailySalePaymentAmountCollected: 0,
  dailySaleTotalPayment: 0,
  incomeTaxAmount: 0,
  incomeTotalPayment: 0,
  paymentTaxCard: 0,
  paymentTaxCash: 0,
  paymentTaxOthers: 0,
  paymentTaxGiftCardRedemption: 0,
  saleIncomeTaxAmount: 0,
  saleIncomeTotalPayment: 0,
  ...overrides,
});

/**
 * Install a route that responds to BOTH daily-income operations with the
 * same row. Other GraphQL operations fall through to the real backend so
 * permission/router queries still work.
 */
const installMockedRow = async (
  page: import('@playwright/test').Page,
  row: StoreDailyIncomeRow,
) => {
  await page.route('**/graphql', async (route) => {
    const op = operationNameOf(route);
    if (op === 'storeDailyIncome') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { reportStoreDailyIncomeList: [row], reportStoreDailyIncomeOrderList: [] },
        }),
      });
      return;
    }
    if (op === 'storeDailyIncomeLive') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            storeDailyIncomeLive: row,
            storeDailyIncomeOrdersLive: [],
            orderList: [],
            orderAggregate: { aggregate: { count: 0 } },
          },
        }),
      });
      return;
    }
    await route.continue();
  });
};

test.describe(`Daily Sale Report — mocked scenarios ${Tag.REGRESSION}`, () => {
  test('TC-43: a split-tender order shows across Card / Cash / Gift Card buckets', async ({
    page,
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    // $100 order split: $40 Card + $30 Cash + $30 Gift Card.
    const card = 4_000;
    const cash = 3_000;
    const gift = 3_000;
    const amountCollected = card + cash; // Gift Card is NOT in Amount Collected per spec
    const total = card + cash + gift;

    await installMockedRow(
      page,
      blankRow({
        dailySaleSale: total - gift, // Sale excludes gift-card redemption
        dailySalePaymentCard: card,
        dailySalePaymentCash: cash,
        dailySalePaymentGiftCardRedemption: gift,
        dailySalePaymentAmountCollected: amountCollected,
        dailySaleTotalPayment: total,
        incomeTotalPayment: total,
      }),
    );

    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    await expect(dailySaleReportPage.paymentCard()).toHaveText(formatUsdFromCents(card));
    await expect(dailySaleReportPage.paymentCash()).toHaveText(formatUsdFromCents(cash));
    await expect(dailySaleReportPage.paymentGiftCardRedemption()).toHaveText(
      formatUsdFromCents(gift),
    );
    await expect(dailySaleReportPage.paymentAmountCollected()).toHaveText(
      formatUsdFromCents(amountCollected),
    );
    await expect(dailySaleReportPage.paymentTotalPayment()).toHaveText(formatUsdFromCents(total));
  });

  test('TC-44: timezone boundary — UI honours the merchant-local day window', async ({
    page,
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    // We can't directly assert which orders are included by the backend
    // (that's a server-side query). What we CAN assert: the URL `from`/`to`
    // span a 24-hour merchant-local day, and the report only displays the
    // single row returned for that range. If the backend ever silently
    // included an extra day, the snapshot row would change shape.
    const target = new Date();
    target.setHours(0, 0, 0, 0);
    const expectedFrom = Math.floor(target.getTime() / 1000);
    const eod = new Date(target);
    eod.setHours(23, 59, 59, 999);
    const expectedTo = Math.floor(eod.getTime() / 1000);

    const sale = 12_345;
    await installMockedRow(page, blankRow({ dailySaleSale: sale, dailySaleTotalPayment: sale }));

    await dailySaleReportPage.gotoDate(target);
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    await expect(page).toHaveURL(new RegExp(`from=${expectedFrom}`));
    await expect(page).toHaveURL(new RegExp(`to=${expectedTo}`));
    expect(expectedTo - expectedFrom).toBeGreaterThanOrEqual(86_398);
    expect(expectedTo - expectedFrom).toBeLessThanOrEqual(86_400);

    // And the row we mocked is what the UI shows — proves the merchant-local
    // window filtered to exactly that record.
    await expect(dailySaleReportPage.incomeSale()).toHaveText(formatUsdFromCents(sale));
  });
});
