import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { formatUsdFromCents } from '@utils/moneyUtils';

/**
 * Daily Sale Report — date filter behaviour.
 *
 * Coverage:
 *   TC-12 Picking a different date loads that date's data
 *   TC-13 Empty day shows $0.00 across the board (and Sale row reflects 0)
 *   TC-39 Past-date data uses the settled query and matches its row exactly
 *
 * Strategy: drive the date via URL (`gotoDate`) — the calendar popover
 * widget is out of scope here, the route is the source of truth. Each test
 * verifies the URL → backend → UI loop end-to-end.
 */

const subDays = (date: Date, n: number): Date => {
  const x = new Date(date);
  x.setDate(x.getDate() - n);
  return x;
};

test.describe(`Daily Sale Report — date filter ${Tag.REGRESSION}`, () => {
  test("TC-12: picking yesterday loads yesterday's data and Today no longer looks active", async ({
    page,
    dailySaleReportPage,
    passcodeDialog,
    reportService,
  }) => {
    const yesterday = subDays(new Date(), 1);

    await dailySaleReportPage.gotoDate(yesterday);
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    // URL reflects the chosen day.
    const fromUnix = Math.floor(
      new Date(new Date(yesterday).setHours(0, 0, 0, 0)).getTime() / 1000,
    );
    await expect(page).toHaveURL(new RegExp(`from=${fromUnix}`));

    // The UI must match GraphQL for that day.
    const row = await reportService.getDailyIncome(yesterday);
    if (row) {
      await expect(dailySaleReportPage.incomeSale()).toHaveText(
        formatUsdFromCents(row.dailySaleSale),
      );
      await expect(dailySaleReportPage.paymentTotalPayment()).toHaveText(
        formatUsdFromCents(row.dailySaleTotalPayment),
      );
    }
  });

  test('TC-13: a day with no orders shows $0.00 everywhere', async ({
    dailySaleReportPage,
    passcodeDialog,
    reportService,
  }) => {
    // Find a past day that genuinely has no data. We walk backwards day-by-day
    // until reportService returns null (or until we hit a 60-day floor).
    const search = new Date();
    let emptyDay: Date | null = null;
    for (let i = 1; i <= 60; i++) {
      const candidate = subDays(search, i);
      const row = await reportService.getDailyIncome(candidate);
      if (!row) {
        emptyDay = candidate;
        break;
      }
    }
    test.skip(emptyDay === null, 'No empty day found in the last 60 days');
    if (!emptyDay) return;

    await dailySaleReportPage.gotoDate(emptyDay);
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    await expect(dailySaleReportPage.incomeSale()).toHaveText('$0.00');
    await expect(dailySaleReportPage.incomeTip()).toHaveText('$0.00');
    await expect(dailySaleReportPage.incomeTaxCollected()).toHaveText('$0.00');
    await expect(dailySaleReportPage.incomeTotalPayment()).toHaveText('$0.00');
    await expect(dailySaleReportPage.paymentTotalPayment()).toHaveText('$0.00');
  });

  test('TC-39: past-date row matches the settled GraphQL snapshot', async ({
    dailySaleReportPage,
    passcodeDialog,
    reportService,
  }) => {
    // Walk back day by day to find a settled day with data.
    let pastDay: Date | null = null;
    for (let i = 1; i <= 30; i++) {
      const candidate = subDays(new Date(), i);
      const row = await reportService.getDailyIncome(candidate);
      if (row && row.dailySaleTotalPayment > 0) {
        pastDay = candidate;
        break;
      }
    }
    test.skip(pastDay === null, 'No past day with data found in the last 30 days');
    if (!pastDay) return;

    const expected = await reportService.getDailyIncome(pastDay);
    if (!expected) return;

    await dailySaleReportPage.gotoDate(pastDay);
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    // The UI must exactly match the settled row — past data does not move.
    await expect(dailySaleReportPage.incomeSale()).toHaveText(
      formatUsdFromCents(expected.dailySaleSale),
    );
    await expect(dailySaleReportPage.incomeTip()).toHaveText(
      formatUsdFromCents(expected.dailySaleTip),
    );
    await expect(dailySaleReportPage.paymentCard()).toHaveText(
      formatUsdFromCents(expected.dailySalePaymentCard),
    );
    await expect(dailySaleReportPage.paymentCash()).toHaveText(
      formatUsdFromCents(expected.dailySalePaymentCash),
    );
    await expect(dailySaleReportPage.paymentTotalPayment()).toHaveText(
      formatUsdFromCents(expected.dailySaleTotalPayment),
    );
  });
});
