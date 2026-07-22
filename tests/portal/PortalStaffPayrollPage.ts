import { type Locator, type Page, expect } from '@playwright/test';

/** A parsed staff listing row — same 6 columns as the Volt POS app's table. */
export interface PortalStaffPayrollRow {
  staff: string;
  orders: string;
  subtotal: string;
  supplyFee: string;
  tip: string;
  totalIncome: string;
}

/** Same two staff pay models as Volt POS — see `StaffPayType` in `StaffPayrollPage.ts`. */
export type PortalStaffPayType = 'salary' | 'commission';

/** The right-hand payroll detail panel (`<aside>`), shown after clicking a staff row. */
export interface PortalStaffPayrollDetail {
  payType: PortalStaffPayType;
  workingDays: string;
  // salary-only
  workingHours?: string;
  salaryAmount?: string;
  // commission-only
  sale?: string;
  refund?: string;
  subtotal?: string;
  supplyFee?: string;
  staffCommission?: string;
  cardChargeCommission?: string;
  discountCharge?: string;
  // common to both
  deduction: string;
  tip: string;
  cardChargeTip: string;
  totalIncome: string;
  pay1: string;
  pay2: string;
}

/**
 * FASTBOY Portal — Payroll > Staff Payroll tab
 * `/pos/:shopId/payroll?tab=staff-payroll&page=<n>&periodId=<uuid>`
 *
 * Same 6-column staff table as Volt POS's `/incomes/staff-payroll`, but
 * paginated ("Showing 1 to N of M results" + Previous/Next) instead of a
 * single scrollable list. Requires an authenticated session — see
 * `tests/portal/auth.setup.ts` (`npm run auth`).
 */
export class PortalStaffPayrollPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly periodDropdown: Locator;
  readonly table: Locator;
  readonly nextPageButton: Locator;
  readonly resultsCaption: Locator;

  constructor(public readonly page: Page) {
    this.heading = page.getByRole('tab', { name: 'Staff Payroll' });
    this.searchInput = page.getByPlaceholder('Search by staff name...');
    this.periodDropdown = page.getByRole('combobox');
    this.table = page.getByRole('table');
    this.nextPageButton = page.getByRole('button', { name: 'Next' });
    // The page renders one "Showing X to Y of Z results" caption per report
    // tab (most hidden/inactive) — scope to the one actually visible.
    this.resultsCaption = page
      .getByText(/Showing \d+ to \d+ of \d+ results/)
      .locator('visible=true');
  }

  async goto(shopId: string, periodId: string, page = 1): Promise<void> {
    const url = `/pos/${shopId}/payroll?tab=staff-payroll&page=${page}&periodId=${periodId}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
    await this.waitForTableSettled();
  }

  /** Land on the tab's default period, then pick periods via {@link selectPeriod} instead of a fixed `periodId`. */
  async gotoDefault(shopId: string, page = 1): Promise<void> {
    const url = `/pos/${shopId}/payroll?tab=staff-payroll&page=${page}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
    await this.waitForTableSettled();
  }

  async waitForReady(): Promise<void> {
    await expect(this.table).toBeVisible({ timeout: 15_000 });
  }

  private async captureTableSnapshot(): Promise<string> {
    return (
      await this.table
        .locator('tbody')
        .innerText()
        .catch(() => '')
    ).trim();
  }

  /**
   * The Portal keeps the `<table>` mounted while it re-fetches a new
   * period's rows (unlike a full unmount/remount), so `waitForReady()`
   * passing right after `selectPeriod()` does NOT mean the new period's data
   * has actually rendered yet. Two failure modes were observed:
   *  1. A transient empty/stale tbody right after the click (fixed by
   *     polling for stability).
   *  2. Some rows update in a first pass (e.g. to "0"/"$0.00" placeholders)
   *     and only settle to their real values in a SECOND, slightly later
   *     pass — a naive "stopped changing for one interval" check reports
   *     settled too early and permanently freezes that row at the wrong
   *     value. This caused false "Missing in POS" / "Mismatch" rows for
   *     staff that in fact match (e.g. Andy/Linda on the Jun 28–29 period,
   *     read as all-zero even though the real Portal UI shows their actual
   *     orders/subtotal/tip).
   * So: when a `beforeSnapshot` is given, first require the tbody content to
   * differ from it at least once (proof the re-fetch actually landed) before
   * counting stability — and require several consecutive stable reads, not
   * just one, to ride out any second-pass correction.
   */
  private async waitForTableSettled(beforeSnapshot?: string): Promise<void> {
    const REQUIRED_STABLE_READS = 3;
    const MAX_ATTEMPTS = 30;
    let previous: string | null = null;
    let stableStreak = 0;
    let sawChange = beforeSnapshot === undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const current = await this.captureTableSnapshot();
      if (!sawChange && current !== beforeSnapshot) sawChange = true;
      stableStreak = current !== '' && current === previous ? stableStreak + 1 : 0;
      if (sawChange && stableStreak >= REQUIRED_STABLE_READS) return;
      previous = current;
      await this.page.waitForTimeout(300);
    }
  }

  /** Every option label currently listed in the period dropdown. */
  async listPeriodLabels(): Promise<string[]> {
    await this.periodDropdown.click();
    const options = this.page.getByRole('option');
    const count = await options.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push(((await options.nth(i).textContent()) ?? '').trim());
    }
    await this.page.keyboard.press('Escape');
    return labels;
  }

  /** Pick a period preset by its exact dropdown label — must match the POS app's label text. */
  async selectPeriod(label: string): Promise<void> {
    const before = await this.captureTableSnapshot();
    await this.periodDropdown.click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
    await this.waitForReady();
    await this.waitForTableSettled(before);
  }

  tableRows(): Locator {
    return this.table.locator('tbody tr');
  }

  async rowCount(): Promise<number> {
    return this.tableRows().count();
  }

  async readRow(index: number): Promise<PortalStaffPayrollRow> {
    const cells = this.tableRows().nth(index).locator('td');
    const text = async (i: number): Promise<string> =>
      ((await cells.nth(i).textContent()) ?? '').trim();
    return {
      staff: (await text(0)).replace(/^[A-Za-z]\s*/, ''), // strip leading avatar-initial glyph
      orders: await text(1),
      subtotal: await text(2),
      supplyFee: await text(3),
      tip: await text(4),
      totalIncome: await text(5),
    };
  }

  /**
   * Like {@link readRow}, but retries a few times on failure — the Portal is
   * a remote dev deployment and occasionally hangs a single cell read
   * (network hiccup), which shouldn't abort the whole comparison run.
   */
  private async readRowResilient(index: number): Promise<PortalStaffPayrollRow> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.readRow(index);
      } catch (err) {
        lastError = err;
        await this.page.waitForTimeout(1_500);
      }
    }
    throw lastError;
  }

  /** Reads every row across ALL pages (follows "Next" until it's disabled). */
  async readAllRows(): Promise<PortalStaffPayrollRow[]> {
    const rows: PortalStaffPayrollRow[] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const count = await this.rowCount();
      for (let i = 0; i < count; i++) {
        rows.push(await this.readRowResilient(i));
      }
      if (await this.nextPageButton.isDisabled()) break;
      const before = await this.captureTableSnapshot();
      await this.nextPageButton.click();
      await this.waitForReady();
      await this.waitForTableSettled(before);
    }
    return rows;
  }

  // ------------------------------------------------------- detail panel

  /** Click a staff row (current page only); waits for its detail panel (name heading) to render. */
  async openStaffDetail(index: number): Promise<void> {
    await this.tableRows().nth(index).click();
    await expect(this.page.getByText('Working Days', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  }

  /**
   * Find a staff row by exact name across ALL pages, click it, and return its
   * row index within `readAllRows()` order — lets callers correlate the same
   * staff between the two apps without assuming identical row ordering.
   */
  async openStaffDetailByName(staff: string): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const count = await this.rowCount();
      for (let i = 0; i < count; i++) {
        const row = await this.readRowResilient(i);
        if (row.staff === staff) {
          await this.openStaffDetail(i);
          return;
        }
      }
      if (await this.nextPageButton.isDisabled()) {
        throw new Error(`Portal staff "${staff}" not found on any page`);
      }
      const before = await this.captureTableSnapshot();
      await this.nextPageButton.click();
      await this.waitForReady();
      await this.waitForTableSettled(before);
    }
  }

  /**
   * The detail `<aside>` itself. Several labels used below (`Tip`,
   * `Total Income`) also appear as table column headers on the same page, so
   * every detail lookup is scoped inside this element to avoid ambiguous
   * matches — unlike Volt POS, where the table and detail panel don't share
   * exact label text in a way that collides.
   */
  private detailPanel(): Locator {
    return this.page.locator('aside').filter({ hasText: 'Working Days' });
  }

  /** Whether the currently-open detail panel is the salary-based or commission-based layout. */
  private async detailPayType(): Promise<PortalStaffPayType> {
    const hasSalaryAmount =
      (await this.detailPanel().getByText('Salary Amount', { exact: true }).count()) > 0;
    return hasSalaryAmount ? 'salary' : 'commission';
  }

  private detailLabel(name: string): Locator {
    // For commission-type staff, the per-date breakdown table (also inside
    // this `<aside>`) reuses the exact same words as the summary rows below
    // it (Sale/Refund/Tip) — the summary row is always the LAST match since
    // the breakdown table renders first in the DOM.
    return this.detailPanel().getByText(name, { exact: true }).last();
  }

  /**
   * Value for a Working Days/Hours/Salary/Deduction/Tip/Card Charge Tip/Total
   * Income row. Unlike Volt POS (label wrapped in a nested `<span>`, value a
   * sibling of its *parent*), the Portal renders label and value as direct
   * sibling `<span>`s in the same row `<div>` — so no `../` hop is needed.
   */
  private detailValue(name: string): Locator {
    return this.detailLabel(name).locator('xpath=following-sibling::*[1]');
  }

  private async readDetailValue(name: string): Promise<string> {
    return ((await this.detailValue(name).textContent()) ?? '').trim();
  }

  /**
   * Value for a row whose label carries extra inline text (e.g. "Supply Fee
   * (incl. Sale & Refund)", "Pay 1 (Salary × 30% ...)") that varies per staff
   * or isn't part of the field name — match by substring instead of exact.
   */
  private async readValueBySubstring(labelSubstring: string): Promise<string> {
    return (
      (await this.detailPanel()
        .getByText(labelSubstring)
        .last()
        .locator('xpath=following-sibling::*[1]')
        .textContent()) ?? ''
    ).trim();
  }

  /** Read the right-hand payroll detail panel for the currently-selected staff row. */
  async readDetailPanel(): Promise<PortalStaffPayrollDetail> {
    const payType = await this.detailPayType();
    const common = {
      payType,
      workingDays: await this.readDetailValue('Working Days'),
      // Salary-type staff show "Deduction/Clean Up Fee"; commission-type
      // staff show "Clean Up Fee/Deduction" — same field, different word
      // order — so match on the substring both wordings share.
      deduction: await this.readValueBySubstring('Clean Up Fee'),
      tip: await this.readDetailValue('Tip'),
      cardChargeTip: await this.readValueBySubstring('Card Charge - Tip'),
      totalIncome: await this.readValueBySubstring('Total Income'),
      pay1: await this.readValueBySubstring('Pay 1'),
      pay2: await this.readValueBySubstring('Pay 2'),
    };
    if (payType === 'salary') {
      return {
        ...common,
        workingHours: await this.readDetailValue('Working Hours'),
        salaryAmount: await this.readDetailValue('Salary Amount'),
      };
    }
    return {
      ...common,
      sale: await this.readDetailValue('Sale'),
      refund: await this.readDetailValue('Refund'),
      subtotal: await this.readDetailValue('Subtotal'),
      supplyFee: await this.readValueBySubstring('Supply Fee'),
      staffCommission: await this.readDetailValue('Staff Commission'),
      cardChargeCommission: await this.readValueBySubstring('Card Charge - Commission'),
      discountCharge: await this.readDetailValue('Discount Charge'),
    };
  }
}
