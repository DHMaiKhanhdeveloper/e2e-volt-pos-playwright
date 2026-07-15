import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { computeIncomeFromOrders, type OrderMoneyRow } from '@domains/income/incomeFromOrders';
import { computeStaffPayout, type StaffIncomeLike } from '@domains/income/staffPayout';

/**
 * Daily Sale Report → JSON → Income Summary (VP-1048 recon).
 *
 * Each run does three distinct steps, so the JSON file is the single source of
 * truth for the calculation:
 *   1. SCRAPE the Daily Sale Report (order rows + per-order staff detail + the
 *      Income/Payment panels) and UPDATE `reports/income-summary/*.json`.
 *   2. READ the data back FROM that JSON file and apply the Income Summary
 *      formula to it — `computeIncomeFromOrders`:
 *          netSale = Σ saleCents · tip = Σ tipCents · tax = Σ taxCents
 *          totalPayment = netSale + tip + tax
 *   3. Write the computed Income Summary + reconciliation back into the JSON and
 *      assert it equals the app's Income Details panel.
 *
 * Runs on the date the report currently shows (default: today). Empty days skip.
 */
test.describe(`Daily Sale Report — Income Summary from JSON ${Tag.REGRESSION}`, () => {
  test.beforeEach(async ({ page, dailySaleReportPage, passcodeDialog }) => {
    await dailySaleReportPage.goto();
    try {
      await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    } catch (err) {
      // The passcode is verified against the backend `staffList`. When that list
      // is empty/reset the dialog shows "Failed to verify staff code" and never
      // dismisses — an environment/data issue, not a test failure. Skip cleanly.
      const verifyFailed = await page
        .getByText(/Failed to verify staff code/i)
        .isVisible()
        .catch(() => false);
      test.skip(
        verifyFailed,
        'App could not verify the passcode (staffList empty/reset) — seed staff',
      );
      throw err;
    }
    await dailySaleReportPage.waitForReady();
  });

  test('TC-RECON: scrape DSR → update JSON → compute Income Summary from the JSON', async ({
    dailySaleReportPage,
    reportService,
  }) => {
    // Opening every order's detail dialog + the settled fallback is slow; give
    // this data-heavy scrape room beyond the default per-test timeout.
    test.setTimeout(180_000);

    const orders = await dailySaleReportPage.readAllOrderRows();
    test.skip(orders.length === 0, 'No orders for the selected day — seed data first');

    const income = await dailySaleReportPage.readIncomeDetailsPanel();
    const payment = await dailySaleReportPage.readPaymentDetailsPanel();

    const reportDate = new Date().toISOString().slice(0, 10);

    // Approach B — pull each staff's applied compensation (rate / type / salary
    // setting) + payout components from the per-staff income API. The live
    // query isn't available on every backend, and "today" isn't settled yet, so
    // fall back to the most recent SETTLED day and record which day it was.
    let staffIncomeRows: StaffIncomeLike[] = [];
    let staffIncomeDate = reportDate;
    let staffIncomeSource: 'live' | 'settled' = 'live';
    try {
      staffIncomeRows = await reportService.getStaffDailyIncomeList();
    } catch {
      staffIncomeRows = [];
    }
    if (staffIncomeRows.length === 0) {
      staffIncomeSource = 'settled';
      for (let i = 1; i <= 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const rows = await reportService.getStaffDailyIncomeListSettled(d);
        if (rows.length > 0) {
          staffIncomeRows = rows;
          staffIncomeDate = d.toISOString().slice(0, 10);
          break;
        }
      }
    }
    const staffPayout = {
      source: staffIncomeSource,
      date: staffIncomeDate,
      ...computeStaffPayout(staffIncomeRows),
    };

    const outDir = path.resolve('reports', 'income-summary');
    mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, `dsr-income-summary-${reportDate}.json`);
    const latestPath = path.join(outDir, 'latest.json');

    // STEP 1 — update the JSON file with the freshly scraped Daily Sale Report.
    const scraped = {
      meta: {
        source: 'Daily Sale Report (UI scrape via Playwright)',
        url: 'http://localhost:1420/incomes/income-daily',
        reportDate,
        scrapedAt: new Date().toISOString(),
        amountsIn: 'cents (USD); negative = refund/discount',
      },
      appIncomeDetails: income,
      appPaymentDetails: payment,
      staffPayout,
      orders,
    };
    writeFileSync(jsonPath, JSON.stringify(scraped, null, 2), 'utf8');
    writeFileSync(latestPath, JSON.stringify(scraped, null, 2), 'utf8');

    // STEP 2 — read the data back FROM the JSON file and apply the Income
    // Summary formula to it (the file is the source of truth, not the scrape).
    const fromFile = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
      appIncomeDetails: typeof income;
      orders: OrderMoneyRow[];
    };
    const incomeSummary = computeIncomeFromOrders(fromFile.orders);
    const app = fromFile.appIncomeDetails;

    // STEP 3 — write the computed Income Summary + reconciliation back, then assert.
    const reconciliation = {
      netSale_matches: incomeSummary.netSaleCents === app.saleCents,
      tip_matches: incomeSummary.tipCents === app.tipCents,
      tax_matches: incomeSummary.taxCents === app.taxCents,
      totalPayment_matches: incomeSummary.totalPaymentCents === app.totalPaymentCents,
    };
    const finalJson = { ...scraped, incomeSummary, reconciliation };
    const body = JSON.stringify(finalJson, null, 2);
    writeFileSync(jsonPath, body, 'utf8');
    writeFileSync(latestPath, body, 'utf8');
    // eslint-disable-next-line no-console
    console.log(
      `JSON updated: ${jsonPath} (${fromFile.orders.length} orders) · ` +
        `Income Summary from JSON → Total Payment ${incomeSummary.totalPaymentCents} cents · ` +
        `Staff Payout (API ${staffPayout.source} ${staffPayout.date}): ${staffPayout.staffCount} staff, ` +
        `Total Service ${staffPayout.totals.totalServiceCents} cents`,
    );
    await test.info().attach('dsr-income-summary.json', { body, contentType: 'application/json' });

    expect(incomeSummary.netSaleCents, 'Σ Sale (from JSON) == Income Details Sale').toBe(
      app.saleCents,
    );
    expect(incomeSummary.tipCents, 'Σ Tip (from JSON) == Income Details Tip').toBe(app.tipCents);
    expect(incomeSummary.taxCents, 'Σ Tax (from JSON) == Income Details Tax Collected').toBe(
      app.taxCents,
    );
    expect(
      incomeSummary.totalPaymentCents,
      'netSale + tip + tax (from JSON) == Income Details Total Payment',
    ).toBe(app.totalPaymentCents);
  });

  test('TC-RECON: every order row satisfies Total = Sale + Tip + Tax', async ({
    dailySaleReportPage,
  }) => {
    const orders = await dailySaleReportPage.readAllOrderRows();
    test.skip(orders.length === 0, 'No orders for the selected day — seed data first');

    for (const o of orders) {
      expect(o.totalCents, `${o.orderCode}: Total = Sale + Tip + Tax`).toBe(
        o.saleCents + o.tipCents + o.taxCents,
      );
    }
  });
});
