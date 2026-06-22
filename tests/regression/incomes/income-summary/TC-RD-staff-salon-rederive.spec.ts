import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { VoltPosDb } from '@db/VoltPosDb';
import { rederiveIncomeSummary, type RederivedIncomeSummary } from '@reports/IncomeSummaryRederive';

/**
 * Income Summary — Staff Payout & Salon Earnings RE-DERIVED from the raw DB
 * ("Cách 2", ported from `volt-pos/.dbwork/report-tool.cjs` → backend `report.rs`).
 *
 * LOCAL-ONLY: reads the desktop app's SQLite DB under `%APPDATA%/VoltPOS`. On CI
 * (no app/DB) `VoltPosDb.tryOpen()` returns null and every test skips.
 *
 * Re-derive uses the HISTORICAL `%service` snapshot frozen in
 * `report_staff_daily_income.compensation`, so it is the correct basis for the
 * settled day. Known app inconsistency (documented by report-tool): the store
 * `report_store_daily_income` table computes Commission / Pay / Totals with a
 * `%service` that does NOT match the day's settings, so those diverge from the
 * re-derive — the re-derived value is the correct one. We therefore assert
 * internal consistency + the fields the app gets right, and REPORT (not assert)
 * the divergences as annotations for QC.
 */

const merchantYmd = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

const sumStaff = (
  r: RederivedIncomeSummary,
  pick: (s: RederivedIncomeSummary['staff'][number]) => number,
): number => r.staff.reduce((a, s) => a + pick(s), 0);

test.describe(`Income Summary — Staff Payout & Salon re-derived from DB (Cách 2) ${Tag.REGRESSION}`, () => {
  test('TC-RD1: re-derived Staff Payout & Salon Earnings are internally consistent', async ({
    incomeSummaryService,
  }) => {
    const db = VoltPosDb.tryOpen();
    test.skip(db === null, 'VoltPOS DB not available (CI / no desktop app)');
    if (!db) return;
    try {
      const found = await incomeSummaryService.findRecentDetailDay();
      test.skip(found === null, 'No settled day with data in the last 30 days');
      if (!found) return;
      const r = rederiveIncomeSummary(db, merchantYmd(found.date));
      test.skip(r.staff.length === 0, 'No per-staff rows for that day');

      // Sale side
      expect(r.totalService, 'Total Service = Service Sale − Service Refund').toBe(
        r.serviceSale - r.serviceRefund,
      );
      // Supply split
      expect(r.salonSupplyShare, 'Salon Supply Share = Supply Total − Staff Supply Share').toBe(
        r.supplyTotal - r.staffSupplyShare,
      );
      expect(r.staffSupplyShare, 'Staff Supply Share = Σ per-staff supply share').toBe(
        sumStaff(r, (s) => s.supplyShare),
      );
      // Staff Payout = Σ per-staff
      expect(r.commission, 'Commission = Σ per-staff commission').toBe(
        sumStaff(r, (s) => s.commission),
      );
      expect(r.payoutTip, 'Tip = Σ per-staff tip').toBe(sumStaff(r, (s) => s.tip));
      expect(r.cleanUp, 'Clean Up = Σ per-staff clean up').toBe(sumStaff(r, (s) => s.cleanUp));
      expect(r.cardCharge, 'Card Charge = Σ per-staff card fee').toBe(
        sumStaff(r, (s) => s.cardFee),
      );
      expect(r.payoutTotal, 'Total Payout = Σ per-staff total').toBe(sumStaff(r, (s) => s.total));
      expect(r.pay1 + r.pay2, 'Pay 1 + Pay 2 = Total Payout').toBe(r.payoutTotal);
      // Salon Earnings
      expect(r.salonCommission, 'Salon Commission = Σ salon comm − Salon Supply Share').toBe(
        sumStaff(r, (s) => s.salonCommission) - r.salonSupplyShare,
      );
      expect(
        r.netEarnings,
        'Net Earnings = Salon Comm + Product Sale − Product Refund − Discount',
      ).toBe(r.salonCommission + r.productSale - r.productRefund - r.totalDiscount);
      expect(
        r.totalEarning,
        'Total Earning = Net + Staff Supply Share + Clean Up − Salary + Card Charge',
      ).toBe(r.netEarnings + r.staffSupplyShare + r.cleanUp - r.salary + r.cardCharge);
    } finally {
      db.close();
    }
  });

  test('TC-RD2: re-derive reproduces the app on sale/supply/tip; divergences reported', async ({
    incomeSummaryService,
  }) => {
    const db = VoltPosDb.tryOpen();
    test.skip(db === null, 'VoltPOS DB not available (CI / no desktop app)');
    if (!db) return;
    try {
      const found = await incomeSummaryService.findRecentDetailDay();
      test.skip(found === null, 'No settled day with data in the last 30 days');
      if (!found) return;
      const is = found.row;
      const r = rederiveIncomeSummary(db, merchantYmd(found.date));
      test.skip(r.staff.length === 0, 'No per-staff rows for that day');

      // Fields the app computes correctly — re-derive must reproduce them.
      // (Service Sale can rarely differ if items are batch-locked AFTER the
      // nightly snapshot — report-tool documents this; treat a failure here as a
      // real signal, not flakiness.)
      expect(r.serviceSale, 'Service Sale').toBe(is.incomeServiceSale);
      expect(r.serviceRefund, 'Service Refund').toBe(is.incomeServiceRefund);
      expect(r.productSale, 'Product Sale').toBe(is.incomeProductSale);
      expect(r.totalService, 'Total Service').toBe(is.staffPayoutTotalService);
      expect(r.supplyTotal, 'Supply Total').toBe(is.supplyFeeTotal);
      expect(r.payoutTip, 'Staff Payout Tip').toBe(is.staffPayoutTip);
      expect(r.cleanUp, 'Staff Payout Clean Up').toBe(is.staffPayoutCleanUpFee);

      // Known app divergences (re-derive is correct, app store table uses an
      // inconsistent %service). Reported as annotations — NOT asserted equal.
      const divergences: Array<[string, number, number]> = [
        ['Staff Supply Share', r.staffSupplyShare, is.supplyFeeStaffShare],
        ['Salon Supply Share', r.salonSupplyShare, is.supplyFeeSalonShare],
        ['Staff Commission', r.commission, is.staffPayoutCommission],
        ['Staff Salary', r.salary, is.staffPayoutSalary],
        ['Total Staff Payout', r.payoutTotal, is.staffPayoutTotal],
        ['Pay 1', r.pay1, is.staffPayoutPay1],
        ['Pay 2', r.pay2, is.staffPayoutPay2],
        ['Salon Commission', r.salonCommission, is.salonEarningsCommission],
        ['Salon Net Earnings', r.netEarnings, is.salonEarningsNet],
        ['Salon Total Earning', r.totalEarning, is.salonEarningsTotal],
      ];
      for (const [label, derived, app] of divergences) {
        if (Math.abs(derived - app) >= 1) {
          test.info().annotations.push({
            type: 'app-divergence',
            description: `${label}: re-derive=${derived} app=${app} diff=${derived - app}`,
          });
        }
      }
    } finally {
      db.close();
    }
  });
});
