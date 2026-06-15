import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import type { StoreDailyIncomeRow } from '@api/models/Report';

/**
 * API — Daily Sale Report (VP-1048).
 *
 * Exercises the four GraphQL "live today" report queries that back the Daily
 * Sale Report screen, hitting the endpoint directly (no browser):
 *
 *   1. storeDailyIncomeLive          — the aggregate row (Sale/Tip/Tax/Payment)
 *   2. storeDailyIncomeOrdersLive    — per-order breakdown for the store
 *   3. staffDailyIncomeListLive      — per-staff income
 *   4. staffDailyIncomeOrdersLive    — per-staff per-order lines
 *
 * The assertions are the backend invariants that hold for ANY data (see
 * `calculate_derived_fields` / `query_live_income_orders` in volt-pos
 * `src-tauri/src/graphql/report.rs`), so the suite is stable against whatever
 * the environment seeded for today. Reconciliations that need real money are
 * guarded with `test.skip` when today is empty.
 */

/** Every money value the report returns is an integer number of cents. */
const expectCents = (label: string, value: number): void => {
  expect(Number.isInteger(value), `${label} must be integer cents`).toBe(true);
};

const COMPENSATION_TYPES = ['commission', 'salary', 'commission_salary'];
const SALARY_SETTINGS = ['salary_by_period', 'wage_per_day', 'wage_per_hour'];

test.describe(`API — Daily Sale Report ${Tag.API} ${Tag.REGRESSION}`, () => {
  // ─── 1. storeDailyIncomeLive ──────────────────────────────────────────────
  test.describe('storeDailyIncomeLive (aggregate)', () => {
    test('returns a row whose money fields are all integer cents', async ({ reportService }) => {
      const row = await reportService.getDailyIncome();
      test.skip(row === null, 'No income row for today — seed data first');
      if (!row) return;

      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'number') expectCents(key, value);
      }
    });

    test('Payment Details sum to Amount Collected and Total Payment', async ({ reportService }) => {
      const row = await reportService.getDailyIncome();
      test.skip(row === null, 'No income row for today');
      if (!row) return;

      // dailySalePaymentAmountCollected = Card + Cash + Others (excludes Gift Card)
      expect(row.dailySalePaymentAmountCollected, 'Amount Collected = Card + Cash + Others').toBe(
        row.dailySalePaymentCard + row.dailySalePaymentCash + row.dailySalePaymentOthers,
      );

      // dailySaleTotalPayment = Amount Collected + Gift Card Redemption
      expect(row.dailySaleTotalPayment, 'Total Payment = Amount Collected + Gift Card').toBe(
        row.dailySalePaymentAmountCollected + row.dailySalePaymentGiftCardRedemption,
      );
    });

    test('Income Detail reconciles with Payment Detail (TC-21)', async ({ reportService }) => {
      const row = await reportService.getDailyIncome();
      test.skip(row === null, 'No income row for today');
      if (!row) return;

      // saleIncomeTaxAmount and incomeTaxAmount are the same Tax Collected value.
      expect(row.saleIncomeTaxAmount, 'Tax synonyms agree').toBe(row.incomeTaxAmount);

      // Income Detail total: Sale + Tip + Tax Collected.
      expect(row.saleIncomeTotalPayment, 'Sale Income Total = Sale + Tip + Tax').toBe(
        row.dailySaleSale + row.dailySaleTip + row.saleIncomeTaxAmount,
      );

      // The two "Total Payment" the report shows (Income side vs Payment side)
      // are designed to reconcile — this is the core VP-1048 invariant (TC-21).
      expect(row.saleIncomeTotalPayment, 'Income.TotalPayment === Payment.TotalPayment').toBe(
        row.dailySaleTotalPayment,
      );
    });

    test('computeTotals mirrors the raw row and reconciles', async ({ reportService }) => {
      const row = await reportService.getDailyIncome();
      test.skip(row === null, 'No income row for today');
      if (!row) return;

      const t = reportService.computeTotals(row as StoreDailyIncomeRow);

      expect(t.incomeSale).toBe(row.dailySaleSale);
      expect(t.incomeTip).toBe(row.dailySaleTip);
      expect(t.incomeTaxCollected).toBe(row.incomeTaxAmount);
      expect(t.paymentAmountCollected).toBe(row.dailySalePaymentAmountCollected);
      expect(t.paymentTotalPayment).toBe(row.dailySaleTotalPayment);
      // Reconciliation the UI relies on.
      expect(t.incomeTotalPayment).toBe(t.paymentTotalPayment);
    });
  });

  // ─── 2. storeDailyIncomeOrdersLive ────────────────────────────────────────
  test.describe('storeDailyIncomeOrdersLive (per-order)', () => {
    test('returns an array', async ({ reportService }) => {
      const orders = await reportService.getDailyIncomeOrders();
      expect(Array.isArray(orders)).toBe(true);
    });

    test('every row is a well-formed sale/refund line that obeys total = parts', async ({
      reportService,
    }) => {
      const orders = await reportService.getDailyIncomeOrders();
      test.skip(orders.length === 0, 'No orders today — seed data first');

      for (const o of orders) {
        expect(['sale', 'refund'], `${o.id} transactionType`).toContain(o.transactionType);
        expect(o.orderId, `${o.id} has orderId`).toBeTruthy();

        // Backend builds row id as `<orderId>-sale` / `<orderId>-refund`.
        expect(o.id).toBe(`${o.orderId}-${o.transactionType}`);

        for (const k of [
          'saleAmount',
          'refundAmount',
          'tipAmount',
          'taxAmount',
          'total',
        ] as const) {
          expectCents(`${o.id}.${k}`, o[k]);
        }

        // Exactly one side carries money: sale rows have refundAmount 0, refund rows saleAmount 0.
        if (o.transactionType === 'sale') {
          expect(o.refundAmount, `${o.id} sale row has no refund`).toBe(0);
        } else {
          expect(o.saleAmount, `${o.id} refund row has no sale`).toBe(0);
          expect(o.giftCardSaleRedemptionAmount, `${o.id} refund has no GC redemption`).toBe(0);
        }

        // Per-order invariant: total = sale + refund + tax + tip.
        expect(o.total, `${o.id}: total = sale + refund + tax + tip`).toBe(
          o.saleAmount + o.refundAmount + o.taxAmount + o.tipAmount,
        );

        expect(Number.isNaN(Date.parse(o.occurredAt)), `${o.id} occurredAt parses`).toBe(false);
      }
    });

    test('rows are sorted by occurredAt descending', async ({ reportService }) => {
      const orders = await reportService.getDailyIncomeOrders();
      test.skip(orders.length < 2, 'Need ≥2 orders to assert ordering');

      const times = orders.map((o) => Date.parse(o.occurredAt));
      const sorted = [...times].sort((a, b) => b - a);
      expect(times).toEqual(sorted);
    });
  });

  // ─── 3. staffDailyIncomeListLive ──────────────────────────────────────────
  test.describe('staffDailyIncomeListLive (per-staff)', () => {
    test('returns an array', async ({ reportService }) => {
      const staff = await reportService.getStaffDailyIncomeList();
      expect(Array.isArray(staff)).toBe(true);
    });

    test('every staff row is well-formed', async ({ reportService }) => {
      const staff = await reportService.getStaffDailyIncomeList();
      test.skip(staff.length === 0, 'No staff income today — seed data first');

      for (const s of staff) {
        expect(s.staffId, 'staffId present').toBeTruthy();
        expect(s.numberOfOrders, 'numberOfOrders ≥ 0').toBeGreaterThanOrEqual(0);

        for (const k of ['sale', 'refund', 'subtotal', 'tip', 'totalIncome', 'rate'] as const) {
          expectCents(`${s.staffId}.${k}`, s[k]);
        }

        if (s.compensationType) {
          expect(COMPENSATION_TYPES, `${s.staffId} compensationType`).toContain(s.compensationType);
        }
        if (s.salarySetting) {
          expect(SALARY_SETTINGS, `${s.staffId} salarySetting`).toContain(s.salarySetting);
        }
      }
    });

    test('staffId values are unique within the day', async ({ reportService }) => {
      const staff = await reportService.getStaffDailyIncomeList();
      test.skip(staff.length === 0, 'No staff income today');

      const ids = staff.map((s) => s.staffId);
      expect(new Set(ids).size, 'no duplicate staff rows').toBe(ids.length);
    });
  });

  // ─── 4. staffDailyIncomeOrdersLive ────────────────────────────────────────
  test.describe('staffDailyIncomeOrdersLive (per-staff per-order)', () => {
    test('returns an array', async ({ reportService }) => {
      const orders = await reportService.getStaffDailyIncomeOrders();
      expect(Array.isArray(orders)).toBe(true);
    });

    test('every row is a well-formed staff sale/refund line', async ({ reportService }) => {
      const orders = await reportService.getStaffDailyIncomeOrders();
      test.skip(orders.length === 0, 'No staff orders today — seed data first');

      for (const o of orders) {
        expect(['sale', 'refund'], `${o.id} transactionType`).toContain(o.transactionType);
        expect(o.staffId, `${o.id} has staffId`).toBeTruthy();
        expect(o.orderId, `${o.id} has orderId`).toBeTruthy();

        for (const k of ['saleAmount', 'refundAmount', 'supplyFee', 'tipAmount'] as const) {
          expectCents(`${o.id}.${k}`, o[k]);
        }

        expect(Number.isNaN(Date.parse(o.occurredAt)), `${o.id} occurredAt parses`).toBe(false);
      }
    });

    test('order-line ids are unique', async ({ reportService }) => {
      const orders = await reportService.getStaffDailyIncomeOrders();
      test.skip(orders.length === 0, 'No staff orders today');

      const ids = orders.map((o) => o.id);
      expect(new Set(ids).size, 'no duplicate staff order rows').toBe(ids.length);
    });
  });
});
