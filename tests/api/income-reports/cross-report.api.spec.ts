import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import type { ReportService } from '@api/services/ReportService';
import type { IncomeSummaryService } from '@api/services/IncomeSummaryService';
import type { StoreDailyIncomeRow } from '@api/models/Report';
import type { StaffDailyIncomeSettledRow } from '@api/models/Report';
import type { IncomeSummaryDetailRow, IncomeSummaryOverviewRow } from '@api/models/IncomeSummary';

/**
 * API — Income Reports cross-report integration (VP-1048 / VP-1402, AC6).
 *
 * Verifies the three income reports agree where they overlap, hitting GraphQL
 * directly on the same SETTLED past day (immutable → deterministic):
 *
 *   • Daily Sale Report ↔ Income Summary  — same day, same source row, so the
 *     shared Sale / Tax / Total Payment values must be identical.
 *   • Staff Income → Income Summary Staff Payout — the store-level Staff Payout
 *     is the sum of the per-staff payout rows (Commission / Tip / Clean Up /
 *     Salary / Pay 1 / Pay 2 / Card Fee).
 *
 * See docs/test-cases/income-reports/README.md (cross-report invariants).
 */

interface CrossContext {
  date: Date;
  dsr: StoreDailyIncomeRow;
  isOverview: IncomeSummaryOverviewRow;
  isDetail: IncomeSummaryDetailRow;
  staff: StaffDailyIncomeSettledRow[];
  cardFee: number;
}

/**
 * Anchor on the most recent settled day that has Income Summary data, then pull
 * the same day's Daily Sale Report row + per-staff settled rows. Returns null
 * when no settled day with data exists (suite then self-skips).
 */
const loadCrossContext = async (
  reportService: ReportService,
  incomeSummaryService: IncomeSummaryService,
): Promise<CrossContext | null> => {
  const found = await incomeSummaryService.findRecentDetailDay();
  if (!found) return null;
  const { date, row: isDetail } = found;

  const [dsr, isOverview, staff, cardFee] = await Promise.all([
    reportService.getDailyIncome(date),
    incomeSummaryService.getOverview(date),
    reportService.getStaffDailyIncomeListSettled(date),
    incomeSummaryService.getStaffCardFeeCharge(date),
  ]);
  if (!dsr || !isOverview) return null;
  return { date, dsr, isOverview, isDetail, staff, cardFee };
};

const sumBy = (
  rows: StaffDailyIncomeSettledRow[],
  pick: (r: StaffDailyIncomeSettledRow) => number,
): number => rows.reduce((acc, r) => acc + pick(r), 0);

test.describe(`API — Income Reports cross-report integration ${Tag.API} ${Tag.REGRESSION}`, () => {
  // ─── Daily Sale Report ↔ Income Summary (same settled day) ────────────────
  test.describe('Daily Sale Report ↔ Income Summary', () => {
    test('Sale & Tax are identical across both reports (AC6)', async ({
      reportService,
      incomeSummaryService,
    }) => {
      const ctx = await loadCrossContext(reportService, incomeSummaryService);
      test.skip(ctx === null, 'No settled day with data in the last 30 days');
      if (!ctx) return;

      // Both reports read the same settled `reportStoreDailyIncomeList` row, so
      // the shared fields must match to the cent.
      expect(ctx.dsr.dailySaleSale, 'Sale matches DSR ↔ Income Summary overview').toBe(
        ctx.isOverview.dailySaleSale,
      );
      expect(ctx.dsr.incomeTaxAmount, 'Tax matches DSR ↔ Income Summary overview').toBe(
        ctx.isOverview.incomeTaxAmount,
      );
      expect(ctx.dsr.incomeTaxAmount, 'Tax matches DSR ↔ Income Summary detail').toBe(
        ctx.isDetail.incomeTaxAmount,
      );
    });

    test('Total Payment reconciles across both reports (AC6)', async ({
      reportService,
      incomeSummaryService,
    }) => {
      const ctx = await loadCrossContext(reportService, incomeSummaryService);
      test.skip(ctx === null, 'No settled day with data');
      if (!ctx) return;

      // DSR Total Payment (Amount Collected + Gift Card) == Income Summary's
      // Payment-side Total Payment for the same day.
      expect(ctx.dsr.dailySaleTotalPayment, 'DSR Total Payment == IS Total Payment').toBe(
        ctx.isDetail.incomeSummaryTotalPayment,
      );
      // Sale-side Total Payment is the very same field in both rows.
      expect(ctx.dsr.saleIncomeTotalPayment, 'Sale-side Total Payment shared field').toBe(
        ctx.isDetail.saleIncomeTotalPayment,
      );
    });
  });

  // ─── Staff Income → Income Summary Staff Payout ───────────────────────────
  test.describe('Staff Income → Income Summary Staff Payout', () => {
    test('store Staff Payout components = Σ per-staff settled rows', async ({
      reportService,
      incomeSummaryService,
    }) => {
      const ctx = await loadCrossContext(reportService, incomeSummaryService);
      test.skip(ctx === null, 'No settled day with data');
      if (!ctx) return;
      test.skip(ctx.staff.length === 0, 'No per-staff settled income for that day');

      const sp = ctx.isDetail;
      expect(
        sumBy(ctx.staff, (s) => s.staffCommission),
        'Σ Commission',
      ).toBe(sp.staffPayoutCommission);
      expect(
        sumBy(ctx.staff, (s) => s.tip),
        'Σ Tip',
      ).toBe(sp.staffPayoutTip);
      expect(
        sumBy(ctx.staff, (s) => s.cleanUpFee),
        'Σ Clean Up Fee',
      ).toBe(sp.staffPayoutCleanUpFee);
      expect(
        sumBy(ctx.staff, (s) => s.staffSalary),
        'Σ Staff Salary',
      ).toBe(sp.staffPayoutSalary);
      expect(
        sumBy(ctx.staff, (s) => s.pay1),
        'Σ Pay 1',
      ).toBe(sp.staffPayoutPay1);
      expect(
        sumBy(ctx.staff, (s) => s.pay2),
        'Σ Pay 2',
      ).toBe(sp.staffPayoutPay2);
    });

    test('store Staff Payout Total = Σ per-staff (Pay 1 + Pay 2)', async ({
      reportService,
      incomeSummaryService,
    }) => {
      const ctx = await loadCrossContext(reportService, incomeSummaryService);
      test.skip(ctx === null, 'No settled day with data');
      if (!ctx) return;
      test.skip(ctx.staff.length === 0, 'No per-staff settled income for that day');

      const perStaffTotal = sumBy(ctx.staff, (s) => s.pay1 + s.pay2);
      expect(perStaffTotal, 'Σ(Pay 1 + Pay 2) == store Total Staff Payout').toBe(
        ctx.isDetail.staffPayoutTotal,
      );
    });

    test('store Staff card-fee charge = Σ per-staff card fee', async ({
      reportService,
      incomeSummaryService,
    }) => {
      const ctx = await loadCrossContext(reportService, incomeSummaryService);
      test.skip(ctx === null, 'No settled day with data');
      if (!ctx) return;
      test.skip(ctx.staff.length === 0, 'No per-staff settled income for that day');

      expect(
        sumBy(ctx.staff, (s) => s.cardFeeCharge),
        'Σ Card Fee Charge == store card fee',
      ).toBe(ctx.cardFee);
    });
  });
});
