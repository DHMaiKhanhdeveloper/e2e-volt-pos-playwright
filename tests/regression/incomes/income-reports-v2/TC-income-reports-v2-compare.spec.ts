import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { DailySaleReportPage } from '@pages/pos/DailySaleReportPage';
import { IncomeSummaryPage } from '@pages/pos/IncomeSummaryPage';
import { IncomeStaffPage, type StaffIncomeRow } from '@pages/pos/IncomeStaffPage';

/**
 * V1 vs V2 parity for the 3 income-report screen pairs — automates the manual
 * scan in docs/screens/income-reports-v2/income-reports-v2-comparison.md.
 *
 * Route pairs:
 *   /incomes/income-daily   ↔ /incomes/income-daily-v2   — Daily Sale Report
 *   /incomes/income-summary ↔ /incomes/income-summary-v2 — Income Summary
 *   /incomes/income-staff   ↔ /incomes/income-staff-v2   — Staff Income
 *
 * Runs against "today" so it self-adapts to whatever data is live, rather than
 * pinning the doc's Jul 21, 2026 snapshot. All 3 pairs are expected to match
 * exactly — a failure here means a real V1/V2 data divergence, e.g. the
 * Sale Details (Service Sale/Refund) and Salon Earnings (Clean Up Fee/Staff
 * Salary) mismatch already found in Income Summary V2 (see the doc's
 * "Bug tìm thấy" section).
 */
test.describe(`Income Reports V2 — V1 vs V2 parity ${Tag.REGRESSION}`, () => {
  test('TC-IRV2-1: Daily Sale Report v1 vs v2 match', async ({
    dailySaleReportPage,
    passcodeDialog,
    page,
  }) => {
    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    const v1Cards = {
      totalOrder: await dailySaleReportPage.cardValue('Total Order').textContent(),
      sale: await dailySaleReportPage.cardValue('Sale').textContent(),
      totalPayment: await dailySaleReportPage.cardValue('Total Payment').textContent(),
    };
    const v1Income = await dailySaleReportPage.readIncomeDetailsPanel();
    const v1Payment = await dailySaleReportPage.readPaymentDetailsPanel();
    const v1Orders = await dailySaleReportPage.readAllOrderRows();

    const dailyV2 = new DailySaleReportPage(page, 'v2');
    await dailyV2.goto();
    await dailyV2.waitForReady();

    const v2Cards = {
      totalOrder: await dailyV2.cardValue('Total Order').textContent(),
      sale: await dailyV2.cardValue('Sale').textContent(),
      totalPayment: await dailyV2.cardValue('Total Payment').textContent(),
    };
    const v2Income = await dailyV2.readIncomeDetailsPanel();
    const v2Payment = await dailyV2.readPaymentDetailsPanel();
    const v2Orders = await dailyV2.readAllOrderRows();

    await test.step('stat cards match', () => {
      expect.soft(v2Cards).toEqual(v1Cards);
    });

    await test.step('Income Details panel matches', () => {
      expect.soft(v2Income).toEqual(v1Income);
    });

    await test.step('Payment Details panel matches', () => {
      expect.soft(v2Payment).toEqual(v1Payment);
    });

    await test.step('order rows match', () => {
      expect.soft(v2Orders).toEqual(v1Orders);
    });
  });

  test('TC-IRV2-2: Income Summary v1 vs v2 — Sale Details / Salon Earnings parity', async ({
    incomeSummaryPage,
    passcodeDialog,
    page,
  }) => {
    await incomeSummaryPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await incomeSummaryPage.waitForReady();
    await incomeSummaryPage.openPeriodDetail(0);
    const v1Sections = await incomeSummaryPage.readDetailSections();

    const summaryV2 = new IncomeSummaryPage(page, 'v2');
    await summaryV2.goto();
    await summaryV2.waitForReady();
    await summaryV2.openPeriodDetail(0);
    const v2Sections = await summaryV2.readDetailSections();

    const byTitle = (
      sections: Awaited<ReturnType<typeof incomeSummaryPage.readDetailSections>>,
      title: string,
    ) => sections.find((s) => s.title === title)?.rows ?? [];

    for (const title of ['Payment Details', 'Supply Fee', 'Staff Payout'] as const) {
      await test.step(`${title} matches`, () => {
        expect.soft(byTitle(v2Sections, title), title).toEqual(byTitle(v1Sections, title));
      });
    }

    // Known bug (docs/screens/income-reports-v2/income-reports-v2-comparison.md
    // §2 "Bug tìm thấy"): V2 loses Service Sale/Refund in Sale Details and
    // Clean Up Fee/Staff Salary in Salon Earnings, throwing off their totals.
    // These assertions are written as real equality checks — expected to FAIL
    // until the V2 binding is fixed, at which point they turn green.
    for (const title of ['Sale Details', 'Salon Earnings'] as const) {
      await test.step(`${title} matches (known bug — expected to fail until fixed)`, () => {
        expect.soft(byTitle(v2Sections, title), title).toEqual(byTitle(v1Sections, title));
      });
    }
  });

  test('TC-IRV2-3: Staff Income v1 vs v2 — stat bar + staff table match', async ({
    incomeStaffPage,
    passcodeDialog,
    page,
  }) => {
    await incomeStaffPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await incomeStaffPage.waitForReady();

    const statNames = [
      'Total staff',
      'Total orders',
      'Total subtotal',
      'Total supply fee',
      'Total tip',
      'Total staff income',
    ] as const;
    const v1Stats: Record<string, string> = {};
    for (const name of statNames) v1Stats[name] = await incomeStaffPage.readStatValue(name);
    const v1RowCount = await incomeStaffPage.rowCount();
    const v1Rows: StaffIncomeRow[] = [];
    for (let i = 0; i < v1RowCount; i++) v1Rows.push(await incomeStaffPage.readRow(i));

    const staffV2 = new IncomeStaffPage(page, 'v2');
    await staffV2.goto();
    await staffV2.waitForReady();

    const v2Stats: Record<string, string> = {};
    for (const name of statNames) v2Stats[name] = await staffV2.readStatValue(name);
    const v2RowCount = await staffV2.rowCount();
    const v2Rows: StaffIncomeRow[] = [];
    for (let i = 0; i < v2RowCount; i++) v2Rows.push(await staffV2.readRow(i));

    await test.step('stat bar matches', () => {
      expect.soft(v2Stats).toEqual(v1Stats);
    });

    await test.step('staff table rows match', () => {
      expect.soft(v2Rows).toEqual(v1Rows);
    });
  });
});
