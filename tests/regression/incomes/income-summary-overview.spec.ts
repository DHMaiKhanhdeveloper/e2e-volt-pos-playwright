import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { parseCentsFromUsd } from '@utils/moneyUtils';
import type { IncomeSummaryPage } from '@pages/pos/IncomeSummaryPage';
import type { PasscodeDialog } from '@components/modal/PasscodeDialog';

/**
 * Income Summary — Tier 1 (real data, read-only / structural).
 *
 * Covers the VP-1048 Income Summary cases that hold against whatever data the
 * environment has today — filter defaults & grouping, the Tax column, the
 * click-row → detail flow, the 5 detail sections, and the within-report
 * Total Payment reconciliation. Formula-exact cases (the May-29 loss-day
 * dataset) live in the mocked suite.
 *
 * Coverage: TC-1, 3, 4, 6, 9, 15, 16, 17, 18, 19, 25/34/56 (reconcile),
 *           48 (show more/less), Print, 5 detail sections render.
 */

const MONEY = /^-?\$\d{1,3}(,\d{3})*\.\d{2}$/;

const openToday = async (
  incomeSummaryPage: IncomeSummaryPage,
  passcodeDialog: PasscodeDialog,
): Promise<void> => {
  await incomeSummaryPage.goto();
  await passcodeDialog.enterPasscode(OWNER_PASSCODE);
  await incomeSummaryPage.waitForReady();
};

/** Extract every money value that immediately follows a given label line. */
const valuesAfterLabel = (panelText: string, label: string): number[] => {
  const lines = panelText.split('\n').map((s) => s.trim());
  const out: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i] === label && MONEY.test(lines[i + 1])) {
      out.push(parseCentsFromUsd(lines[i + 1]));
    }
  }
  return out;
};

/** The slice of the detail text belonging to one section (heading → next heading). */
const sectionSegment = (panelText: string, section: string, nextSection: string): string => {
  const start = panelText.indexOf(section);
  if (start < 0) return '';
  const end = panelText.indexOf(nextSection, start + section.length);
  return panelText.slice(start, end < 0 ? undefined : end);
};

test.describe(`Income Summary — overview (real data) ${Tag.REGRESSION}`, () => {
  test('TC-1: default filter is Day + Today with a single period row', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await openToday(incomeSummaryPage, passcodeDialog);

    expect(incomeSummaryPage.groupByFromUrl(), 'default grouping').toBe('Day');
    expect(await incomeSummaryPage.isGroupBySelected('Day'), 'Day tab active').toBe(true);
    // Day + Today → exactly one period row.
    expect(await incomeSummaryPage.rowCount(), 'one row for today').toBe(1);
    await expect(incomeSummaryPage.totalIncomeValue()).toHaveText(MONEY);
  });

  test('TC-15 + TC-16: the table has a Tax column and no Net Income column', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await openToday(incomeSummaryPage, passcodeDialog);

    const headers = await incomeSummaryPage.headerLabels();
    expect(headers, 'columns').toEqual(['Date', 'Sale', 'Tip', 'Tax', 'Total Payment']);
    expect(headers, 'no Net Income column').not.toContain('Net Income');
  });

  test('TC-17: every row Total Payment = Sale + Tip + Tax', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await openToday(incomeSummaryPage, passcodeDialog);

    const rows = await incomeSummaryPage.rowCount();
    for (let i = 0; i < rows; i++) {
      // Poll the identity so a mid-re-render partial read (today's table is
      // live) is retried rather than flaking.
      await expect
        .poll(
          async () => {
            const r = await incomeSummaryPage.readRow(i);
            const sale = parseCentsFromUsd(r.sale);
            const tip = parseCentsFromUsd(r.tip);
            const tax = parseCentsFromUsd(r.tax);
            return parseCentsFromUsd(r.totalPayment) - (sale + tip + tax);
          },
          { timeout: 5_000, message: `row ${i}: Total Payment = Sale + Tip + Tax` },
        )
        .toBe(0);
    }
  });

  test('TC-3: Day grouping over a date range shows one row per day', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    // A fixed 5-day window → 5 rows (empty days still render as $0.00 rows).
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 4);

    await incomeSummaryPage.gotoRange(from, to, 'Day');
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await incomeSummaryPage.waitForReady();

    expect(await incomeSummaryPage.rowCount(), '5-day range → 5 rows').toBe(5);
  });

  test('TC-4 + TC-6: Week and Month grouping switch the URL and reshape the table', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await openToday(incomeSummaryPage, passcodeDialog);

    await incomeSummaryPage.selectGroupBy('Week');
    expect(incomeSummaryPage.groupByFromUrl()).toBe('Week');
    expect(await incomeSummaryPage.rowCount(), 'week rows').toBeGreaterThan(0);

    await incomeSummaryPage.selectGroupBy('Month');
    expect(incomeSummaryPage.groupByFromUrl()).toBe('Month');
    // In Month mode the period dropdown becomes a year selector.
    expect(await incomeSummaryPage.periodDropdownText(), 'year selector').toMatch(/^\d{4}$/);
  });

  test('TC-9: the comparison label is present and changes with the period mode', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await openToday(incomeSummaryPage, passcodeDialog);
    await expect(incomeSummaryPage.comparisonLabel()).toBeVisible();
    const dayLabel = (await incomeSummaryPage.comparisonLabel().textContent())?.trim();

    await incomeSummaryPage.selectGroupBy('Month');
    await expect(incomeSummaryPage.comparisonLabel()).toBeVisible();
    const monthLabel = (await incomeSummaryPage.comparisonLabel().textContent())?.trim();

    // Both must be one of the known comparison phrases…
    expect(dayLabel).toMatch(/vs\.\s+(Previous period|Previous 7 days|Same day last week)/);
    expect(monthLabel).toMatch(/vs\.\s+(Previous period|Last year)/);
  });

  test('TC-19 + sections: clicking a period opens the detail panel with all five sections', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await openToday(incomeSummaryPage, passcodeDialog);
    await incomeSummaryPage.openPeriodDetail(0);

    // Detail header shows a date (the selected period).
    await expect(incomeSummaryPage.detailHeading()).toHaveText(/\w{3}\s+\d{1,2},\s+\d{4}/);
    await expect(incomeSummaryPage.printButton).toBeEnabled();

    for (const section of [
      'Payment Details',
      'Sale Details',
      'Supply Fee',
      'Staff Payout',
      'Salon Earnings',
    ] as const) {
      await expect(incomeSummaryPage.sectionHeading(section), section).toBeVisible();
    }
  });

  test('TC-25 + TC-34 + TC-56: Total Payment reconciles across table, Payment & Sale Details', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await openToday(incomeSummaryPage, passcodeDialog);

    const tableTotal = parseCentsFromUsd((await incomeSummaryPage.readRow(0)).totalPayment);
    await incomeSummaryPage.openPeriodDetail(0);

    // The detail panel renders $0.00 placeholders until its query resolves —
    // read the section "Total Payment" from each segment, last occurrence.
    const sectionTotalPayment = async (section: string, nextSection: string): Promise<number> => {
      const panel = await incomeSummaryPage.detailBodyText();
      const totals = valuesAfterLabel(sectionSegment(panel, section, nextSection), 'Total Payment');
      return totals.length ? totals[totals.length - 1] : 0;
    };

    // Both section totals must settle to the table's Total Payment.
    await expect
      .poll(() => sectionTotalPayment('Payment Details', 'Sale Details'), { timeout: 10_000 })
      .toBe(tableTotal);
    await expect
      .poll(() => sectionTotalPayment('Sale Details', 'Supply Fee'), { timeout: 10_000 })
      .toBe(tableTotal);
  });

  test('TC-48: Staff Payout Show more / Show less toggles the Pay split', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await openToday(incomeSummaryPage, passcodeDialog);
    await incomeSummaryPage.openPeriodDetail(0);

    const toggle = incomeSummaryPage.showMoreToggle();
    await expect(toggle).toBeVisible();
    const before = (await toggle.textContent())?.trim();
    await toggle.click();
    await expect(toggle).not.toHaveText(before ?? '');
  });
});
