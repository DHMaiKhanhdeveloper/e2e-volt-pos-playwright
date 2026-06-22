import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import type { IncomeSummaryDetailRow } from '@api/models/IncomeSummary';

/**
 * API — Income Summary (VP-1048).
 *
 * Hits the GraphQL endpoint directly (no browser) for the queries behind the
 * Income Summary screen:
 *
 *   getIncomeSummary / getIncomeSummaryLive             — overview row (table)
 *   getIncomeSummaryDetail / getIncomeSummaryDetailLive — 5-section detail panel
 *
 * Assertions are the VP-1048 reconciliation invariants that hold for ANY data:
 *   • Amount Collected = Cash + Card + Others
 *   • Total Payment    = Amount Collected + Gift Card Redemption          (TC-25)
 *   • Total Payment    = Net Total + Tax + Tip                            (TC-34)
 *   • Net Total        = Subtotal − Total Discount                        (TC-32)
 *   • Subtotal         = Total Sale − Total Refund                        (TC-30)
 *   • Total Sale/Refund = Σ parts                                         (TC-28/29)
 *   • Supply Fee Total = Staff Share + Salon Share                        (TC-36/37)
 *   • Staff Payout Total = Pay 1 + Pay 2                                  (TC-44/47)
 *   • Salon Net / Total earnings formulas (Total adds back Card Fee)      (TC-53/54)
 *   • Overview ↔ Detail Total Payment / Net Total agree                   (TC-56/57)
 *
 * Detail formulas are checked against the most recent SETTLED past day
 * (immutable), so the numbers can't drift mid-run like "today" does.
 */

/** Every money value the report returns is an integer number of cents. */
const expectCents = (label: string, value: number): void => {
  expect(Number.isInteger(value), `${label} must be integer cents`).toBe(true);
};

test.describe(`API — Income Summary ${Tag.API} ${Tag.REGRESSION}`, () => {
  // ─── Overview: getIncomeSummary / getIncomeSummaryLive ────────────────────
  test.describe('overview row (table)', () => {
    test('returns a row whose money fields are all integer cents', async ({
      incomeSummaryService,
    }) => {
      const row = await incomeSummaryService.getOverview();
      test.skip(row === null, 'No income row for today — seed data first');
      if (!row) return;

      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'number') expectCents(key, value);
      }
    });

    test('table Total Payment = Net Total + Tax + Tip (TC-17/34)', async ({
      incomeSummaryService,
    }) => {
      // Use a SETTLED day: on a live/unsettled day a gift-card redemption inflates
      // Total Payment without a matching Net Total term (the overview row carries
      // no GC field to add back), so the equality only holds once settled.
      const found = await incomeSummaryService.findRecentDetailDay();
      test.skip(found === null, 'No settled day with data');
      if (!found) return;
      const row = await incomeSummaryService.getOverview(found.date);
      expect(row, 'overview row exists for the settled day').not.toBeNull();
      if (!row) return;

      expect(row.incomeSummaryTotalPayment, 'Total Payment = Net Total + Tax + Tip').toBe(
        row.incomeNetTotal + row.incomeTaxAmount + row.incomeTip,
      );
    });

    test('Net Total = Subtotal − Total Discount (TC-32)', async ({ incomeSummaryService }) => {
      const row = await incomeSummaryService.getOverview();
      test.skip(row === null, 'No income row for today');
      if (!row) return;

      expect(row.incomeNetTotal, 'Net Total = Subtotal − Total Discount').toBe(
        row.incomeSubtotal - row.incomeTotalDiscount,
      );
    });
  });

  // ─── Detail: getIncomeSummaryDetail (settled past day) ────────────────────
  test.describe('detail panel (settled day, 5 sections)', () => {
    const getSettled = async (incomeSummaryService: {
      findRecentDetailDay: () => Promise<{ date: Date; row: IncomeSummaryDetailRow } | null>;
    }): Promise<IncomeSummaryDetailRow | null> => {
      const found = await incomeSummaryService.findRecentDetailDay();
      return found?.row ?? null;
    };

    test('all money fields are integer cents', async ({ incomeSummaryService }) => {
      const row = await getSettled(incomeSummaryService);
      test.skip(row === null, 'No settled day with data in the last 30 days');
      if (!row) return;

      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'number') expectCents(key, value);
      }
    });

    test('Payment Details: per-tender total = Sale + Refund + Tip + Tax (TC-20/21/22)', async ({
      incomeSummaryService,
    }) => {
      const row = await getSettled(incomeSummaryService);
      test.skip(row === null, 'No settled day with data');
      if (!row) return;

      // Refund is stored as a positive magnitude and subtracted.
      expect(row.incomeSummaryPaymentTotalCash, 'Cash = Sale − Refund + Tip + Tax').toBe(
        row.incomeSummaryPaymentCashSale -
          row.incomeSummaryPaymentCashRefund +
          row.incomeSummaryPaymentCashTip +
          row.paymentTaxCash,
      );
      expect(row.incomeSummaryPaymentTotalCard, 'Card = Sale − Refund + Tip + Tax').toBe(
        row.incomeSummaryPaymentCardSale -
          row.incomeSummaryPaymentCardRefund +
          row.incomeSummaryPaymentCardTip +
          row.paymentTaxCard,
      );
      expect(row.incomeSummaryPaymentTotalOthers, 'Others = Sale − Refund + Tip + Tax').toBe(
        row.incomeSummaryPaymentOthersSale -
          row.incomeSummaryPaymentOthersRefund +
          row.incomeSummaryPaymentOthersTip +
          row.paymentTaxOthers,
      );
    });

    test('Payment Details: Amount Collected = Cash + Card + Others (TC-23)', async ({
      incomeSummaryService,
    }) => {
      const row = await getSettled(incomeSummaryService);
      test.skip(row === null, 'No settled day with data');
      if (!row) return;

      expect(row.incomeSummaryPaymentAmountCollected, 'Amount Collected = Cash+Card+Others').toBe(
        row.incomeSummaryPaymentTotalCash +
          row.incomeSummaryPaymentTotalCard +
          row.incomeSummaryPaymentTotalOthers,
      );
    });

    test('Payment Details: Total Payment = Amount Collected + Gift Card Redemption (TC-25)', async ({
      incomeSummaryService,
    }) => {
      const row = await getSettled(incomeSummaryService);
      test.skip(row === null, 'No settled day with data');
      if (!row) return;

      expect(
        row.incomeSummaryTotalPayment,
        'Total Payment = Amount Collected + GC Redemption',
      ).toBe(row.incomeSummaryPaymentAmountCollected + row.incomeSummaryPaymentGiftCardRedemption);
    });

    test('Sale Details: Total Sale / Total Refund / Subtotal / Discount / Net Total (TC-28…32)', async ({
      incomeSummaryService,
    }) => {
      const row = await getSettled(incomeSummaryService);
      test.skip(row === null, 'No settled day with data');
      if (!row) return;

      expect(row.incomeTotalSale, 'Total Sale = Service + Product + Gift Card').toBe(
        row.incomeServiceSale + row.incomeProductSale + row.incomeGiftCardSale,
      );
      expect(row.incomeTotalRefund, 'Total Refund = Service Refund + Product Refund').toBe(
        row.incomeServiceRefund + row.incomeProductRefund,
      );
      expect(row.incomeSubtotal, 'Subtotal = Total Sale − Total Refund').toBe(
        row.incomeTotalSale - row.incomeTotalRefund,
      );
      expect(row.incomeTotalDiscount, 'Total Discount = Discount − Discount Reversed').toBe(
        row.incomeDiscount - row.incomeDiscountReversed,
      );
      expect(row.incomeNetTotal, 'Net Total = Subtotal − Total Discount').toBe(
        row.incomeSubtotal - row.incomeTotalDiscount,
      );
    });

    test('Sale Details: Total Payment = Net Total + Tax + Tip (TC-34)', async ({
      incomeSummaryService,
    }) => {
      const row = await getSettled(incomeSummaryService);
      test.skip(row === null, 'No settled day with data');
      if (!row) return;

      expect(row.saleIncomeTotalPayment, 'Sale-side Total Payment = Net Total + Tax + Tip').toBe(
        row.incomeNetTotal + row.incomeTaxAmount + row.incomeTip,
      );
    });

    test('Supply Fee: Total = Staff Share + Salon Share (TC-36/37)', async ({
      incomeSummaryService,
    }) => {
      const row = await getSettled(incomeSummaryService);
      test.skip(row === null, 'No settled day with data');
      if (!row) return;

      expect(row.supplyFeeTotal, 'Supply Fee Total = Staff + Salon Share').toBe(
        row.supplyFeeStaffShare + row.supplyFeeSalonShare,
      );
    });

    test('Staff Payout: Total = Pay 1 + Pay 2 (TC-44/47)', async ({ incomeSummaryService }) => {
      const row = await getSettled(incomeSummaryService);
      test.skip(row === null, 'No settled day with data');
      if (!row) return;

      // The backend splits the payout into Pay 1 / Pay 2; their sum IS the total.
      // (Commission + Tip − CleanUp + Salary doesn't reconcile exactly once the
      // card-fee charge + per-staff rounding are applied — see VP-1048 ⚠️.)
      expect(row.staffPayoutPay1 + row.staffPayoutPay2, 'Pay 1 + Pay 2 = Total').toBe(
        row.staffPayoutTotal,
      );
    });

    test('Salon Earnings: Net & Total earnings formulas (TC-53/54)', async ({
      incomeSummaryService,
    }) => {
      const found = await incomeSummaryService.findRecentDetailDay();
      test.skip(found === null, 'No settled day with data');
      if (!found) return;
      const { date, row } = found;
      // The card-fee charge deducted from staff is recouped by the salon, so it
      // adds back into the Salon Total (fetched separately — see service).
      const cardFee = await incomeSummaryService.getStaffCardFeeCharge(date);

      expect(
        row.salonEarningsNet,
        'Net = Commission + ProductSale − ProductRefund − Discount',
      ).toBe(
        row.salonEarningsCommission +
          row.salonEarningsProductSale -
          row.salonEarningsProductRefund -
          row.salonEarningsTotalDiscount,
      );
      expect(
        row.salonEarningsTotal,
        'Total = Net + StaffSupplyShare + CleanUp − StaffSalary + CardFee',
      ).toBe(
        row.salonEarningsNet +
          row.salonEarningsStaffSupplyShare +
          row.salonEarningsCleanUpFee -
          row.salonEarningsStaffSalary +
          cardFee,
      );
    });
  });

  // ─── Overview ↔ Detail consistency, and the range query ───────────────────
  test.describe('cross-query consistency & range', () => {
    test('overview and detail agree on Total Payment & Net Total for the same day (TC-56/57)', async ({
      incomeSummaryService,
    }) => {
      const found = await incomeSummaryService.findRecentDetailDay();
      test.skip(found === null, 'No settled day with data');
      if (!found) return;

      const overview = await incomeSummaryService.getOverview(found.date);
      expect(overview, 'overview row exists for the same day').not.toBeNull();
      if (!overview) return;

      expect(overview.incomeSummaryTotalPayment, 'Total Payment matches detail').toBe(
        found.row.incomeSummaryTotalPayment,
      );
      expect(overview.incomeNetTotal, 'Net Total matches detail').toBe(found.row.incomeNetTotal);
      // The two Total Payment sides reconcile (Sale side === Payment side).
      expect(found.row.saleIncomeTotalPayment, 'Sale-side TP === Payment-side TP').toBe(
        found.row.incomeSummaryTotalPayment,
      );
    });

    test('range query returns rows sorted by date descending', async ({ incomeSummaryService }) => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);

      const rows = await incomeSummaryService.getOverviewRange(from, to);
      expect(Array.isArray(rows)).toBe(true);
      test.skip(rows.length < 2, 'Need ≥2 settled days in range to assert ordering');

      const dates = rows.map((r) => r.date);
      const sorted = [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
      expect(dates, 'rows are newest-first').toEqual(sorted);
    });
  });
});
