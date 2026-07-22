import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { DailySaleReportPage } from '@pages/pos/DailySaleReportPage';
import { IncomeSummaryPage } from '@pages/pos/IncomeSummaryPage';
import { IncomeStaffPage, type StaffIncomeRow } from '@pages/pos/IncomeStaffPage';
import type { PasscodeDialog } from '@components/modal/PasscodeDialog';
import {
  type CaseReport,
  type CompareSection,
  type DayReport,
  compareFlat,
  compareRowsList,
  renderCalendarReport,
  section,
} from './reportBuilder';

/**
 * The passcode gate's "stay unlocked" grant is time-based, not tied to a
 * single navigation — a v2 route visited soon after v1 can occasionally find
 * itself still inside the grant window and never show the dialog. Enter the
 * passcode only if it actually appears, instead of assuming it always will.
 */
async function unlockIfPrompted(passcodeDialog: PasscodeDialog, code: string): Promise<void> {
  const appeared = await passcodeDialog.dialog
    .waitFor({ state: 'visible', timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) await passcodeDialog.enterPasscode(code);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * V1 vs V2 parity for the 3 income-report screen pairs — automates the manual
 * scan in docs/screens/income-reports-v2/income-reports-v2-comparison.md.
 *
 * Route pairs:
 *   /incomes/income-daily   ↔ /incomes/income-daily-v2   — Daily Sale Report
 *   /incomes/income-summary ↔ /incomes/income-summary-v2 — Income Summary
 *   /incomes/income-staff   ↔ /incomes/income-staff-v2   — Staff Income
 *
 * Compares DAY BY DAY over a rolling ~30-day window (today and the 29 days
 * before it) rather than one aggregated range — a per-day breakdown is what
 * makes a "missing in V2" gap traceable to a specific date instead of getting
 * absorbed into a 30-day total. Each screen pair is re-checked once per day
 * in the window (single-day gotoRange), all 3 pairs still expected to match
 * exactly outside the known Income Summary V2 bug (see below).
 *
 * Every run — pass or fail — writes ONE self-contained HTML report to
 * reports/income-reports-v2/compare-<ISO date>.html and a `-latest.html`
 * alias: a clickable day-chip calendar (green = matched, red = N issues)
 * with one hidden panel per day, toggled client-side — no rebuild needed to
 * inspect a different day, same self-contained-report pattern as
 * tests/portal/staff-payroll-compare.spec.ts.
 *
 * Playwright always discards and restarts the worker process after a failing
 * test (TC-IRV2-2 is EXPECTED to fail — it asserts a known app bug — so this
 * happens on every run). A worker restart wipes module-scope state, so an
 * in-memory results array would only ever survive to the final `afterAll`
 * for whichever test happened to run in the LAST (post-restart) worker,
 * silently dropping the other cases. Each test instead writes one JSON part
 * per (day, case) pair to `.parts/`, which — unlike module state — survives
 * worker restarts; the final `afterEach` reads whatever landed on disk and
 * re-renders the combined calendar report.
 */
const outDir = path.resolve(__dirname, '../../../../reports/income-reports-v2');
const partsDir = path.join(outDir, '.parts');

/** Rolling ~30-day window: today and the 29 days before it. */
const RANGE_DAYS = 30;
const today = new Date();
const days: Date[] = Array.from({ length: RANGE_DAYS }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  return d;
});

function writePart(caseReport: CaseReport, date: string, slug: string): void {
  fs.mkdirSync(partsDir, { recursive: true });
  fs.writeFileSync(
    path.join(partsDir, `${date}__${slug}.json`),
    JSON.stringify(caseReport),
    'utf-8',
  );
}

test.describe(`Income Reports V2 — V1 vs V2 parity ${Tag.REGRESSION}`, () => {
  test('TC-IRV2-1: Daily Sale Report v1 vs v2 match (day by day)', async ({
    dailySaleReportPage,
    passcodeDialog,
    page,
  }) => {
    // 30 days × 2 SPA reloads (v1 then v2) × a full order-row scrape each —
    // much slower than a single aggregated range, so give it a wide ceiling.
    test.setTimeout(20 * 60_000);
    // Clear any stale parts from a previous run — this test always runs
    // first in a full-suite invocation, so it's the right place to reset.
    fs.rmSync(partsDir, { recursive: true, force: true });

    const dailyV2 = new DailySaleReportPage(page, 'v2');

    for (const date of days) {
      const dateStr = isoDate(date);

      await dailySaleReportPage.gotoRange(date, date);
      await unlockIfPrompted(passcodeDialog, OWNER_PASSCODE);
      await dailySaleReportPage.waitForReady();

      const v1Cards = {
        totalOrder: await dailySaleReportPage.cardValue('Total Order').textContent(),
        sale: await dailySaleReportPage.cardValue('Sale').textContent(),
        totalPayment: await dailySaleReportPage.cardValue('Total Payment').textContent(),
      };
      const v1Income = await dailySaleReportPage.readIncomeDetailsPanel();
      const v1Payment = await dailySaleReportPage.readPaymentDetailsPanel();
      const v1OrdersRaw = await dailySaleReportPage.readAllOrderRowsRaw();

      await dailyV2.gotoRange(date, date);
      await unlockIfPrompted(passcodeDialog, OWNER_PASSCODE);
      await dailyV2.waitForReady();

      const v2Cards = {
        totalOrder: await dailyV2.cardValue('Total Order').textContent(),
        sale: await dailyV2.cardValue('Sale').textContent(),
        totalPayment: await dailyV2.cardValue('Total Payment').textContent(),
      };
      const v2Income = await dailyV2.readIncomeDetailsPanel();
      const v2Payment = await dailyV2.readPaymentDetailsPanel();
      const v2OrdersRaw = await dailyV2.readAllOrderRowsRaw();

      await test.step(`${dateStr}: stat cards + panels + order rows match`, () => {
        expect.soft(v2Cards, dateStr).toEqual(v1Cards);
        expect.soft(v2Income, dateStr).toEqual(v1Income);
        expect.soft(v2Payment, dateStr).toEqual(v1Payment);
      });

      writePart(
        {
          name: 'TC-IRV2-1: Daily Sale Report',
          sections: [
            section('Stat cards', compareFlat('Stat cards', v1Cards, v2Cards)),
            section('Income Details panel', compareFlat('Income Details', v1Income, v2Income)),
            section('Payment Details panel', compareFlat('Payment Details', v1Payment, v2Payment)),
            compareRowsList('Order rows', v1OrdersRaw, v2OrdersRaw, (r) => r.orderCode, [
              'sale',
              'tip',
              'tax',
              'total',
            ]),
          ],
        },
        dateStr,
        '1-daily-sale-report',
      );
    }
  });

  test('TC-IRV2-2: Income Summary v1 vs v2 — Sale Details / Salon Earnings parity (day by day)', async ({
    incomeSummaryPage,
    passcodeDialog,
    page,
  }) => {
    test.setTimeout(20 * 60_000);

    const summaryV2 = new IncomeSummaryPage(page, 'v2');

    for (const date of days) {
      const dateStr = isoDate(date);

      await incomeSummaryPage.gotoRange(date, date, 'Day');
      await unlockIfPrompted(passcodeDialog, OWNER_PASSCODE);
      await incomeSummaryPage.waitForReady();
      await incomeSummaryPage.openPeriodDetail(0);
      const v1Sections = await incomeSummaryPage.readDetailSections();

      await summaryV2.gotoRange(date, date, 'Day');
      await unlockIfPrompted(passcodeDialog, OWNER_PASSCODE);
      await summaryV2.waitForReady();
      await summaryV2.openPeriodDetail(0);
      const v2Sections = await summaryV2.readDetailSections();

      const byTitle = (
        sections: Awaited<ReturnType<typeof incomeSummaryPage.readDetailSections>>,
        title: string,
      ) => sections.find((s) => s.title === title)?.rows ?? [];

      for (const title of ['Payment Details', 'Supply Fee', 'Staff Payout'] as const) {
        await test.step(`${dateStr}: ${title} matches`, () => {
          expect
            .soft(byTitle(v2Sections, title), `${dateStr} ${title}`)
            .toEqual(byTitle(v1Sections, title));
        });
      }

      // Known bug (docs/screens/income-reports-v2/income-reports-v2-comparison.md
      // §2 "Bug tìm thấy"): V2 loses Service Sale/Refund in Sale Details and
      // Clean Up Fee/Staff Salary in Salon Earnings, throwing off their totals.
      // These assertions are written as real equality checks — expected to FAIL
      // until the V2 binding is fixed, at which point they turn green.
      for (const title of ['Sale Details', 'Salon Earnings'] as const) {
        await test.step(`${dateStr}: ${title} matches (known bug — expected to fail until fixed)`, () => {
          expect
            .soft(byTitle(v2Sections, title), `${dateStr} ${title}`)
            .toEqual(byTitle(v1Sections, title));
        });
      }

      writePart(
        {
          name: 'TC-IRV2-2: Income Summary',
          sections: (
            [
              'Payment Details',
              'Supply Fee',
              'Staff Payout',
              'Sale Details',
              'Salon Earnings',
            ] as const
          ).map((title) =>
            compareRowsList(
              title,
              byTitle(v1Sections, title),
              byTitle(v2Sections, title),
              (r) => r.label,
              ['value'],
            ),
          ),
        },
        dateStr,
        '2-income-summary',
      );
    }
  });

  test('TC-IRV2-3: Staff Income v1 vs v2 — stat bar + staff table match (day by day)', async ({
    incomeStaffPage,
    passcodeDialog,
    page,
  }) => {
    test.setTimeout(20 * 60_000);

    const statNames = [
      'Total staff',
      'Total orders',
      'Total subtotal',
      'Total supply fee',
      'Total tip',
      'Total staff income',
    ] as const;

    const staffV2 = new IncomeStaffPage(page, 'v2');

    for (const date of days) {
      const dateStr = isoDate(date);

      await incomeStaffPage.gotoRange(date, date);
      await unlockIfPrompted(passcodeDialog, OWNER_PASSCODE);
      await incomeStaffPage.waitForReady();

      const v1Stats: Record<string, string> = {};
      for (const name of statNames) v1Stats[name] = await incomeStaffPage.readStatValue(name);
      const v1RowCount = await incomeStaffPage.rowCount();
      const v1Rows: StaffIncomeRow[] = [];
      for (let i = 0; i < v1RowCount; i++) v1Rows.push(await incomeStaffPage.readRow(i));

      await staffV2.gotoRange(date, date);
      await unlockIfPrompted(passcodeDialog, OWNER_PASSCODE);
      await staffV2.waitForReady();

      const v2Stats: Record<string, string> = {};
      for (const name of statNames) v2Stats[name] = await staffV2.readStatValue(name);
      const v2RowCount = await staffV2.rowCount();
      const v2Rows: StaffIncomeRow[] = [];
      for (let i = 0; i < v2RowCount; i++) v2Rows.push(await staffV2.readRow(i));

      await test.step(`${dateStr}: stat bar + staff table match`, () => {
        expect.soft(v2Stats, dateStr).toEqual(v1Stats);
        expect.soft(v2Rows, dateStr).toEqual(v1Rows);
      });

      // Per-staff detail-panel drill-down (§3 C1 "salary" layout / C2
      // "commission" layout) — open every staff row that actually has orders
      // that day on both v1 and v2, and diff their whole detail panel
      // (order sub-table + every label/value field) field by field.
      const detailSections: CompareSection[] = [];
      for (let i = 0; i < v1RowCount; i++) {
        const staffName = v1Rows[i].staff;
        const v2Index = v2Rows.findIndex((r) => r.staff === staffName);
        if (v2Index < 0) continue;

        await incomeStaffPage.openStaffDetail(i);
        const v1Detail = await incomeStaffPage.readStaffDetailPanel();

        await staffV2.openStaffDetail(v2Index);
        const v2Detail = await staffV2.readStaffDetailPanel();

        await test.step(`${dateStr}: ${staffName} detail panel matches`, () => {
          expect.soft(v2Detail, `${dateStr} ${staffName}`).toEqual(v1Detail);
        });

        detailSections.push(
          compareRowsList(
            `${staffName} — orders`,
            v1Detail.orders,
            v2Detail.orders,
            (r) => r['Order #'] ?? JSON.stringify(r),
            [...new Set([...v1Detail.orders, ...v2Detail.orders].flatMap((r) => Object.keys(r)))],
          ),
        );
        detailSections.push(
          section(
            `${staffName} — fields`,
            compareFlat(
              `${staffName} — fields`,
              Object.fromEntries(v1Detail.fields.map((f) => [f.label, f.value])),
              Object.fromEntries(v2Detail.fields.map((f) => [f.label, f.value])),
            ),
          ),
        );
      }

      writePart(
        {
          name: 'TC-IRV2-3: Staff Income',
          sections: [
            section('Stat bar', compareFlat('Stat bar', v1Stats, v2Stats)),
            compareRowsList('Staff table rows', v1Rows, v2Rows, (r) => r.staff, [
              'orders',
              'subtotal',
              'supplyFee',
              'tip',
              'totalIncome',
            ]),
            ...detailSections,
          ],
        },
        dateStr,
        '3-staff-income',
      );
    }
  });

  // Runs after EVERY test in this file (not just the last worker's), since
  // each day/case part is written to disk independently — reads whatever
  // landed in `.parts/` so far, groups it by date, and re-renders the
  // combined calendar report. The final call (from whichever worker runs
  // last) leaves the complete, up-to-date file behind.
  test.afterEach(() => {
    if (!fs.existsSync(partsDir)) return;
    const partFiles = fs.readdirSync(partsDir).filter((f) => f.endsWith('.json'));
    if (partFiles.length === 0) return;

    const byDate = new Map<string, CaseReport[]>();
    for (const f of partFiles) {
      const date = f.split('__')[0];
      const caseReport = JSON.parse(fs.readFileSync(path.join(partsDir, f), 'utf-8')) as CaseReport;
      const existing = byDate.get(date) ?? [];
      existing.push(caseReport);
      byDate.set(date, existing);
    }
    const dayReports: DayReport[] = [...byDate.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, cases]) => ({ date, cases }));

    const generatedAt = new Date().toISOString();
    const html = renderCalendarReport(dayReports, generatedAt);
    const dateStamp = generatedAt.slice(0, 10);
    fs.writeFileSync(path.join(outDir, `compare-${dateStamp}.html`), html, 'utf-8');
    fs.writeFileSync(path.join(outDir, 'compare-latest.html'), html, 'utf-8');
    // eslint-disable-next-line no-console
    console.log(`Income Reports V2 compare report: ${path.join(outDir, 'compare-latest.html')}`);
  });
});
