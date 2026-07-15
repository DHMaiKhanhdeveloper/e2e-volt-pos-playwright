import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { formatUsdFromCents } from '@utils/moneyUtils';
import { splitSections, valueAfterLabel } from '@domains/income/incomeSummaryDetail';
import type { IncomeSummaryPage } from '@pages/pos/IncomeSummaryPage';
import type { PasscodeDialog } from '@components/modal/PasscodeDialog';
import type { IncomeSummaryService } from '@api/services/IncomeSummaryService';
import type { IncomeSummaryDetailRow } from '@api/models/IncomeSummary';

/**
 * Income Summary — Sale Details (VP-1048 TC-28…34).
 *
 * Anchors on the most recent SETTLED past day (immutable), reads the row from
 * GraphQL, and verifies the section's formulas on the displayed values:
 *   Total Sale     = Service + Product + Gift Card Sale
 *   Total Refund   = Service Refund + Product Refund
 *   Subtotal       = Total Sale − Total Refund
 *   Total Discount = Discount − Discount Reversed
 *   Net Total      = Subtotal − Total Discount
 *   Total Payment  = Net Total + Tax Collected + Tip
 */

const usd = formatUsdFromCents;

interface DayDetail {
  row: IncomeSummaryDetailRow;
  sale: string;
}

const openRecentSale = async (
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
  const sale = splitSections(await incomeSummaryPage.detailBodyText())['Sale Details'];
  return { row, sale };
};

/** First money value (cents) after `label` in the Sale Details slice; asserts presence. */
const v = (text: string, label: string): number => {
  const value = valueAfterLabel(text, label);
  expect(value, `"${label}" present in Sale Details`).not.toBeNull();
  return value as number;
};

test.describe(`Income Summary — Sale Details (real data) ${Tag.REGRESSION}`, () => {
  test('TC-28 + TC-29: Total Sale = Service+Product+GC; Total Refund = Service+Product', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentSale(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, sale } = d;

    expect(v(sale, 'Total Sale')).toBe(row.incomeTotalSale);
    expect(v(sale, 'Service Sale')).toBe(row.incomeServiceSale);
    expect(v(sale, 'Product Sale')).toBe(row.incomeProductSale);
    expect(v(sale, 'Gift Card Sale')).toBe(row.incomeGiftCardSale);
    expect(v(sale, 'Total Refund')).toBe(row.incomeTotalRefund);

    expect(v(sale, 'Total Sale'), 'Total Sale = Service + Product + GC').toBe(
      v(sale, 'Service Sale') + v(sale, 'Product Sale') + v(sale, 'Gift Card Sale'),
    );
    expect(v(sale, 'Total Refund'), 'Total Refund = Service + Product Refund').toBe(
      v(sale, 'Service Refund') + v(sale, 'Product Refund'),
    );
  });

  test('TC-30 + TC-31 + TC-32: Subtotal, Total Discount, Net Total math', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentSale(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, sale } = d;

    expect(v(sale, 'Subtotal')).toBe(row.incomeSubtotal);
    expect(v(sale, 'Net Total')).toBe(row.incomeNetTotal);

    expect(v(sale, 'Subtotal'), 'Subtotal = Total Sale − Total Refund').toBe(
      v(sale, 'Total Sale') - v(sale, 'Total Refund'),
    );
    expect(v(sale, 'Total Discount'), 'Total Discount = Discount − Discount Reversed').toBe(
      v(sale, 'Discount') - v(sale, 'Discount Reversed'),
    );
    expect(v(sale, 'Net Total'), 'Net Total = Subtotal − Total Discount').toBe(
      v(sale, 'Subtotal') - v(sale, 'Total Discount'),
    );
  });

  test('TC-33 + TC-34: Tax Collected matches DB; Total Payment = Net Total + Tax + Tip', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentSale(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, sale } = d;

    expect(v(sale, 'Tax Collected'), 'Tax Collected matches DB').toBe(row.incomeTaxAmount);

    expect(v(sale, 'Total Payment'), 'Total Payment = Net Total + Tax + Tip').toBe(
      v(sale, 'Net Total') + v(sale, 'Tax Collected') + v(sale, 'Tip'),
    );
    expect(v(sale, 'Total Payment'), 'Sale Details Total Payment matches report total').toBe(
      row.incomeSummaryTotalPayment,
    );
  });
});
