import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { formatUsdFromCents } from '@utils/moneyUtils';
import { splitSections, block, valueAfterLabel, MONEY_RE } from '@utils/incomeSummaryDetail';
import type { IncomeSummaryPage } from '@pages/pos/IncomeSummaryPage';
import type { PasscodeDialog } from '@components/modal/PasscodeDialog';
import type { IncomeSummaryService } from '@api/services/IncomeSummaryService';
import type { IncomeSummaryDetailRow } from '@api/models/IncomeSummary';

/**
 * Income Summary — Payment Details (VP-1048 TC-20…27).
 *
 * Strategy: anchor on the most recent SETTLED past day (immutable, so the API
 * detail row matches the UI exactly — today's live totals drift). Read the row
 * from GraphQL, render its detail panel, and assert the UI shows those exact
 * values plus the spec formulas:
 *   <method> total = Sale − |Refund| + Tip + Tax
 *   Amount Collected = Cash + Card + Others
 *   Total Payment    = Amount Collected + Gift Card Redemption
 *
 * Refund sign: the settled list API (`reportStoreDailyIncomeList`) returns the
 * refund as a positive MAGNITUDE while the UI renders it negative, so we compare
 * magnitudes and reconcile by subtraction (works regardless of the API's sign).
 */

const usd = formatUsdFromCents;

/** Money value after `label`, or 0 if the line is absent. */
const num = (text: string, label: string): number => valueAfterLabel(text, label) ?? 0;

interface DayDetail {
  row: IncomeSummaryDetailRow;
  payment: string;
}

/** Open the detail panel for the most recent past day with data; `null` if none. */
const openRecentPayment = async (
  incomeSummaryService: IncomeSummaryService,
  incomeSummaryPage: IncomeSummaryPage,
  passcodeDialog: PasscodeDialog,
): Promise<DayDetail | null> => {
  const found = await incomeSummaryService.findRecentDetailDay();
  if (!found) return null;
  const { date, row } = found;
  await incomeSummaryPage.gotoRange(date, date, 'Day');
  await passcodeDialog.enterPasscode(OWNER_PASSCODE);
  await incomeSummaryPage.waitForReady();
  await incomeSummaryPage.openPeriodDetail(0);
  await incomeSummaryPage.waitForDetailLoaded(usd(row.incomeSummaryTotalPayment));
  const payment = splitSections(await incomeSummaryPage.detailBodyText())['Payment Details'];
  return { row, payment };
};

test.describe(`Income Summary — Payment Details (real data) ${Tag.REGRESSION}`, () => {
  test('TC-20 + TC-22: Card & Others = Sale + Refund + Tip + Tax (with sub-rows)', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentPayment(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, payment } = d;

    // TC-20 Card
    const card = block(payment, 'Card', 'Others');
    expect(valueAfterLabel(card, 'Card'), 'Card total').toBe(row.incomeSummaryPaymentTotalCard);
    expect(num(card, 'Sale')).toBe(row.incomeSummaryPaymentCardSale);
    expect(Math.abs(num(card, 'Refund')), 'Card refund magnitude').toBe(
      Math.abs(row.incomeSummaryPaymentCardRefund),
    );
    expect(num(card, 'Tip')).toBe(row.incomeSummaryPaymentCardTip);
    expect(num(card, 'Tax')).toBe(row.paymentTaxCard);
    expect(row.incomeSummaryPaymentTotalCard, 'Card = Sale − |Refund| + Tip + Tax').toBe(
      row.incomeSummaryPaymentCardSale -
        Math.abs(row.incomeSummaryPaymentCardRefund) +
        row.incomeSummaryPaymentCardTip +
        row.paymentTaxCard,
    );

    // TC-22 Others
    const others = block(payment, 'Others', 'Amount Collected');
    expect(valueAfterLabel(others, 'Others'), 'Others total').toBe(
      row.incomeSummaryPaymentTotalOthers,
    );
    expect(row.incomeSummaryPaymentTotalOthers, 'Others = Sale − |Refund| + Tip + Tax').toBe(
      row.incomeSummaryPaymentOthersSale -
        Math.abs(row.incomeSummaryPaymentOthersRefund) +
        row.incomeSummaryPaymentOthersTip +
        row.paymentTaxOthers,
    );
  });

  test('TC-21 + TC-26: Cash = Sale + Refund + Tip + Tax, sub-rows keep their sign', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentPayment(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, payment } = d;

    const cash = block(payment, 'Cash', 'Card');
    expect(valueAfterLabel(cash, 'Cash'), 'Cash total').toBe(row.incomeSummaryPaymentTotalCash);
    expect(num(cash, 'Sale')).toBe(row.incomeSummaryPaymentCashSale);
    // TC-26: refund renders with its sign (≤ 0); the settled API row holds the magnitude.
    const cashRefund = num(cash, 'Refund');
    expect(cashRefund, 'Cash refund shown signed (≤ 0)').toBeLessThanOrEqual(0);
    expect(Math.abs(cashRefund), 'Cash refund magnitude matches API').toBe(
      Math.abs(row.incomeSummaryPaymentCashRefund),
    );
    expect(num(cash, 'Tip')).toBe(row.incomeSummaryPaymentCashTip);
    expect(num(cash, 'Tax')).toBe(row.paymentTaxCash);

    expect(row.incomeSummaryPaymentTotalCash, 'Cash = Sale − |Refund| + Tip + Tax').toBe(
      row.incomeSummaryPaymentCashSale -
        Math.abs(row.incomeSummaryPaymentCashRefund) +
        row.incomeSummaryPaymentCashTip +
        row.paymentTaxCash,
    );
  });

  test('TC-23: Amount Collected = Cash + Card + Others', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentPayment(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, payment } = d;

    expect(valueAfterLabel(payment, 'Amount Collected'), 'UI Amount Collected').toBe(
      row.incomeSummaryPaymentAmountCollected,
    );
    expect(row.incomeSummaryPaymentAmountCollected, 'Cash + Card + Others').toBe(
      row.incomeSummaryPaymentTotalCash +
        row.incomeSummaryPaymentTotalCard +
        row.incomeSummaryPaymentTotalOthers,
    );
  });

  test('TC-24: Gift Card Redemption groups Tip / Tax', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentPayment(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, payment } = d;

    const gc = block(payment, 'Gift Card Redemption', 'Total Payment');
    expect(valueAfterLabel(gc, 'Gift Card Redemption'), 'GC Redemption total').toBe(
      row.incomeSummaryPaymentGiftCardRedemption,
    );
    expect(valueAfterLabel(gc, 'Tip')).toBe(row.incomeSummaryPaymentGiftCardTip);
    expect(valueAfterLabel(gc, 'Tax')).toBe(row.paymentTaxGiftCardRedemption);
  });

  test('TC-25: TOTAL PAYMENT = Amount Collected + Gift Card Redemption', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentPayment(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, payment } = d;

    // The Payment Details "Total Payment" is the last value in the section.
    const lines = payment.split('\n').map((s) => s.trim());
    const lastTotal = lines
      .map((line, i) => (line === 'Total Payment' ? lines[i + 1] : null))
      .filter((x): x is string => !!x && MONEY_RE.test(x))
      .pop();

    expect(row.incomeSummaryTotalPayment, 'Total = Amount Collected + GC Redemption').toBe(
      row.incomeSummaryPaymentAmountCollected + row.incomeSummaryPaymentGiftCardRedemption,
    );
    expect(lastTotal, 'UI Total Payment').toBe(usd(row.incomeSummaryTotalPayment));
  });

  test('TC-27: the fifth header reads "Total Payment", not "Amount Collected"', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    // Load via an explicit range (same reliable pattern as the data tests) so the
    // table is rendered before we read its header labels.
    const today = new Date();
    await incomeSummaryPage.gotoRange(today, today, 'Day');
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await incomeSummaryPage.waitForReady();
    const headers = await incomeSummaryPage.headerLabels();
    expect(headers[headers.length - 1]).toBe('Total Payment');
    expect(headers).not.toContain('Amount Collected');
  });
});
