import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { parseCentsFromUsd } from '@utils/moneyUtils';
import { valueAfterLabel, MONEY_RE } from '@utils/incomeSummaryDetail';
import { openRecentDetail } from './incomeSummary.helpers';

/**
 * Income Summary — within-report reconciliation (VP-1048 TC-56…58).
 *
 * On a single settled day every shared figure must agree across the places it
 * appears:
 *   TC-56 Total Payment  : table = Payment Details = Sale Details
 *   TC-57 Net            : table Sale = Sale Details Net Total = Total Income
 *   TC-58 Tax            : table = Sale Details Tax Collected = Σ payment taxes
 */

/** Last "Total Payment" money value in a section slice. */
const lastTotalPayment = (sectionText: string): number | null => {
  const lines = sectionText.split('\n').map((s) => s.trim());
  const hits = lines
    .map((line, i) => (line === 'Total Payment' ? lines[i + 1] : null))
    .filter((x): x is string => !!x && MONEY_RE.test(x));
  return hits.length ? parseCentsFromUsd(hits[hits.length - 1]) : null;
};

test.describe(`Income Summary — reconciliation (real data) ${Tag.REGRESSION}`, () => {
  test('TC-56: Total Payment agrees across table, Payment Details & Sale Details', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, sections } = d;

    const tableTP = parseCentsFromUsd((await incomeSummaryPage.readRow(0)).totalPayment);
    const paymentTP = lastTotalPayment(sections['Payment Details']);
    const saleTP = valueAfterLabel(sections['Sale Details'], 'Total Payment');

    expect(tableTP, 'table = API').toBe(row.incomeSummaryTotalPayment);
    expect(paymentTP, 'Payment Details = API').toBe(row.incomeSummaryTotalPayment);
    expect(saleTP, 'Sale Details = API').toBe(row.incomeSummaryTotalPayment);
  });

  test('TC-57: Net agrees — table Sale = Sale Details Net Total = Total Income', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, sections } = d;

    const tableSale = parseCentsFromUsd((await incomeSummaryPage.readRow(0)).sale);
    const netTotal = valueAfterLabel(sections['Sale Details'], 'Net Total');
    const totalIncome = parseCentsFromUsd(
      (await incomeSummaryPage.totalIncomeValue().textContent()) ?? '',
    );

    expect(netTotal, 'Sale Details Net Total = API').toBe(row.incomeNetTotal);
    expect(tableSale, 'table Sale = Net Total').toBe(netTotal);
    expect(totalIncome, 'Total Income = Net Total').toBe(netTotal);
  });

  test('TC-58: Tax agrees — table = Tax Collected = Σ payment-method taxes', async ({
    incomeSummaryPage,
    passcodeDialog,
    incomeSummaryService,
  }) => {
    const d = await openRecentDetail(incomeSummaryService, incomeSummaryPage, passcodeDialog);
    test.skip(d === null, 'No settled day with data in the last 30 days');
    if (!d) return;
    const { row, sections } = d;

    const tableTax = parseCentsFromUsd((await incomeSummaryPage.readRow(0)).tax);
    const taxCollected = valueAfterLabel(sections['Sale Details'], 'Tax Collected');
    const sumPaymentTax =
      row.paymentTaxCash +
      row.paymentTaxCard +
      row.paymentTaxOthers +
      row.paymentTaxGiftCardRedemption;

    expect(tableTax, 'table Tax = API').toBe(row.incomeTaxAmount);
    expect(taxCollected, 'Tax Collected = API').toBe(row.incomeTaxAmount);
    expect(sumPaymentTax, 'Σ payment taxes = Tax Collected').toBe(row.incomeTaxAmount);
  });
});
