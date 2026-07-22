import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

/** The 6 aggregate stat labels on the header bar. */
export type StaffPayrollStat =
  | 'Total staff'
  | 'Total orders'
  | 'Total subtotal'
  | 'Total supply fee'
  | 'Total tip'
  | 'Total staff income';

/** A parsed staff listing row. */
export interface StaffPayrollRow {
  staff: string;
  orders: string;
  subtotal: string;
  supplyFee: string;
  tip: string;
  totalIncome: string;
}

/**
 * Two staff pay models drive two different detail-panel layouts:
 * - `salary`: Working Hours + Salary Amount as the base, Total Income =
 *   Salary Amount − Clean Up Fee + Tip − Card Charge Tip.
 * - `commission`: a per-date Sale/Refund/Supply Fee/Tip breakdown table plus
 *   Sale/Refund/Subtotal/Supply Fee/Staff Commission/Card Charge
 *   Commission/Discount Charge, Total Income = Staff Commission − Clean Up
 *   Fee + Tip − Card Charge Commission − Card Charge Tip − Discount Charge.
 */
export type StaffPayType = 'salary' | 'commission';

/** The right-hand payroll detail panel, shown after clicking a staff row. */
export interface StaffPayrollDetail {
  payType: StaffPayType;
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
 * Staff Payroll — `/incomes/staff-payroll`
 *
 * Mirrors {@link IncomeStaffPage}'s layout: a search + period filter, a
 * 6-metric aggregate bar, and a staff listing table on the left; a per-staff
 * payroll detail panel (Working Days/Hours, Salary, Deduction, Tip, split
 * Pay 1/Pay 2) on the right. Passcode-gated like the other Income screens.
 */
export class StaffPayrollPage extends BasePage {
  protected readonly path = '/incomes/staff-payroll';

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly periodDropdown: Locator;
  readonly table: Locator;
  readonly noDetail: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText('Staff Payroll', { exact: true });
    this.searchInput = page.getByRole('textbox', { name: 'Search staff' });
    this.periodDropdown = page.getByRole('combobox').first();
    this.table = page.getByRole('table');
    this.noDetail = page.getByRole('heading', { name: 'No detail to show', exact: true });
  }

  /** Gated route — navigate without waiting; caller unlocks the passcode first. */
  async goto(): Promise<void> {
    this.logger.info(`Navigate to ${this.path}`);
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    // Intentionally NOT calling waitForReady() — caller unlocks the passcode.
  }

  /** Readiness: title + the aggregate stat bar (mounts after permission granted). */
  async waitForReady(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
    await expect(this.statLabel('Total staff income')).toBeVisible({ timeout: 15_000 });
  }

  // ----------------------------------------------------------- stat bar

  statLabel(name: StaffPayrollStat): Locator {
    return this.page.getByText(name, { exact: true });
  }

  statValue(name: StaffPayrollStat): Locator {
    return this.statLabel(name).locator('xpath=following-sibling::*[1]');
  }

  async readStatValue(name: StaffPayrollStat): Promise<string> {
    return ((await this.statValue(name).textContent()) ?? '').trim();
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

  /** Pick a period preset by its exact dropdown label (e.g. "Jul 9, 2026 - Jul 13, 2026"). */
  async selectPeriod(label: string): Promise<void> {
    const before = await this.captureTableSnapshot();
    await this.periodDropdown.click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
    await this.waitForTableSettled(before);
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
   * Switching periods re-fetches the roster asynchronously; the table can
   * sit briefly empty, or still show the PREVIOUS period's rows, before the
   * new period's data lands. Reading during either window silently produces
   * a phantom "every staff missing in POS" comparison (this exact bug was
   * already hit and fixed on the Portal side — see
   * `PortalStaffPayrollPage.waitForTableSettled`). Mirror that fix here:
   * require the tbody content to actually change from `before`, then hold
   * steady for several consecutive reads, before considering it safe to
   * read.
   */
  private async waitForTableSettled(before: string): Promise<void> {
    const REQUIRED_STABLE_READS = 3;
    const MAX_ATTEMPTS = 40;
    let previous: string | null = null;
    let stableStreak = 0;
    let sawChange = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const current = await this.captureTableSnapshot();
      // This screen's roster is never legitimately empty (see `rowCountSettled`),
      // so a momentary "no rows yet" flash with placeholder/empty tbody text can
      // otherwise look "stable" for 3 reads before the real roster lands — only
      // count a read as stable once the table actually holds rows.
      const rowCount = await this.tableRows().count();
      if (!sawChange && current !== before) sawChange = true;
      stableStreak = current !== '' && rowCount > 0 && current === previous ? stableStreak + 1 : 0;
      if (sawChange && stableStreak >= REQUIRED_STABLE_READS) return;
      previous = current;
      await this.page.waitForTimeout(300);
    }
  }

  async readAllStats(): Promise<Record<StaffPayrollStat, string>> {
    const names: StaffPayrollStat[] = [
      'Total staff',
      'Total orders',
      'Total subtotal',
      'Total supply fee',
      'Total tip',
      'Total staff income',
    ];
    const entries = await Promise.all(
      names.map(async (name) => [name, await this.readStatValue(name)] as const),
    );
    return Object.fromEntries(entries) as Record<StaffPayrollStat, string>;
  }

  // --------------------------------------------------------------- table

  tableRows(): Locator {
    return this.table.locator('tbody tr');
  }

  async rowCount(): Promise<number> {
    if (!(await this.table.isVisible().catch(() => false))) return 0;
    return this.tableRows().count();
  }

  /**
   * `rowCount()`, but polls for a few seconds if it comes back empty —
   * switching periods re-fetches the staff list asynchronously and
   * `waitForReady()` only confirms the stat bar mounted, not that the table
   * has finished (re-)rendering rows. This screen always has a full staff
   * roster (never legitimately empty), so a 0 immediately after a period
   * switch is a loading race, not real data.
   */
  private async rowCountSettled(): Promise<number> {
    let count = await this.rowCount();
    for (let attempt = 0; attempt < 20 && count === 0; attempt++) {
      await this.page.waitForTimeout(300);
      count = await this.rowCount();
    }
    return count;
  }

  /** Read a staff listing row's 6 cells by index. */
  async readRow(index: number): Promise<StaffPayrollRow> {
    const cells = this.tableRows().nth(index).locator('td, [role="cell"]');
    const count = await cells.count();
    if (count < 6) {
      throw new Error(`Staff row ${index} has ${count} cells, expected 6`);
    }
    const text = async (i: number): Promise<string> =>
      ((await cells.nth(i).textContent()) ?? '').trim();
    // The name cell renders an avatar-initial `<span>` immediately followed
    // by the name `<span>` with no separating whitespace in the DOM, so
    // `textContent()` alone yields e.g. "WWendy" — use `innerText()` (which
    // inserts a line break between block-rendered siblings) and strip the
    // leading initial, same as the Portal's row parsing.
    const staffName = ((await cells.nth(0).innerText()) ?? '').replace(/^[A-Za-z]\s*/, '').trim();
    return {
      staff: staffName,
      orders: await text(1),
      subtotal: await text(2),
      supplyFee: await text(3),
      tip: await text(4),
      totalIncome: await text(5),
    };
  }

  /** Every row on the current page, in display order. */
  async readAllRows(): Promise<StaffPayrollRow[]> {
    const count = await this.rowCountSettled();
    const rows: StaffPayrollRow[] = [];
    for (let i = 0; i < count; i++) {
      rows.push(await this.readRow(i));
    }
    return rows;
  }

  // ------------------------------------------------------- detail panel

  /**
   * The right-hand detail panel wrapper. Scoping all detail lookups to this
   * element is required because several labels used below (`Tip`,
   * `Total Income`) also appear as staff-list table column headers on the
   * same page.
   */
  private panel(): Locator {
    return this.page.locator('[data-slot="income-layout-right"]');
  }

  /** Click a staff row; waits for its detail panel (name heading + Total Income row) to render. */
  async openStaffDetail(index: number): Promise<void> {
    await this.tableRows().nth(index).click();
    await expect(this.panel().getByText('Total Income', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  }

  /**
   * Find a staff row by exact displayed name (first match) and open its
   * detail panel. Polls for a few seconds before giving up — the app appears
   * to run a periodic background refetch of the staff list (observed
   * alongside an "Internet connection restored" toast), which can
   * transiently reorder/blank a row while a slower caller (e.g. driving the
   * Portal in between POS candidates) is mid-loop.
   */
  async openStaffDetailByName(staff: string): Promise<void> {
    let index = -1;
    for (let attempt = 0; attempt < 6 && index === -1; attempt++) {
      if (attempt > 0) await this.page.waitForTimeout(1_000);
      const rows = await this.readAllRows();
      index = rows.findIndex((r) => r.staff === staff);
    }
    if (index === -1) throw new Error(`Volt POS staff "${staff}" not found in current period`);
    await this.openStaffDetail(index);
  }

  /** Whether the currently-open detail panel is the salary-based or commission-based layout. */
  private async detailPayType(): Promise<StaffPayType> {
    const hasSalaryAmount =
      (await this.panel().getByText('Salary Amount', { exact: true }).count()) > 0;
    return hasSalaryAmount ? 'salary' : 'commission';
  }

  private detailLabel(name: string): Locator {
    // For commission-type staff, the per-date breakdown table columns reuse
    // the exact same words as the summary rows below it (Sale/Refund/Supply
    // Fee/Tip) — the summary row is always the LAST match since the
    // breakdown table renders first in the DOM.
    return this.panel().getByText(name, { exact: true }).last();
  }

  private detailValue(name: string): Locator {
    // Label text sits in a nested <span>; the value is a sibling of its
    // *parent* span (`<span class="flex-1"><span>Label</span></span><span>Value</span>`).
    return this.detailLabel(name).locator('xpath=../following-sibling::*[1]');
  }

  private async readDetailValue(name: string): Promise<string> {
    return ((await this.detailValue(name).textContent()) ?? '').trim();
  }

  /**
   * Like {@link readDetailValue}, but for labels that carry nested
   * explanatory subtext (e.g. "Supply Fee(incl. Sale & Refund)") — an exact
   * match on just the label would never match the parent span's full text,
   * so match by substring instead. `.last()` for the same reason as
   * {@link detailLabel}: the breakdown table's plain "Supply Fee" header
   * matches this substring too and renders first in the DOM.
   */
  private async readDetailValueBySubstring(labelSubstring: string): Promise<string> {
    return (
      (await this.panel()
        .getByText(labelSubstring)
        .last()
        .locator('xpath=../following-sibling::*[1]')
        .textContent()) ?? ''
    ).trim();
  }

  /**
   * "Working Days" renders as a plain label/value row for salary-type staff,
   * but as one combined text node ("Working Days: N days") above the
   * per-date breakdown table for commission-type staff — normalize both to
   * just the numeric string, matching the Portal's plain-row format.
   */
  private async readWorkingDays(payType: StaffPayType): Promise<string> {
    if (payType === 'salary') return this.readDetailValue('Working Days');
    const combined =
      (await this.panel()
        .getByText(/Working Days:/)
        .textContent()) ?? '';
    return combined.match(/Working Days:\s*(\d+)/)?.[1] ?? '';
  }

  /**
   * The "Total Income / Pay 1 / Pay 2" block: a `<hr>` divider followed by a
   * sibling container, distinct from the Working Days/Salary block above it.
   */
  private payoutSection(): Locator {
    return this.panel().locator('hr.border-dashed').locator('xpath=following-sibling::*[1]');
  }

  /**
   * Value for a payout-section row. The split % (e.g. Pay 1's "x 50%") varies
   * per staff, so the label text itself isn't exact-matchable for Pay 1/2 —
   * use a plain substring match instead, scoped to {@link payoutSection} to
   * avoid colliding with the "Total Income" table column header elsewhere on
   * the page.
   */
  private async readPayoutValue(labelSubstring: string): Promise<string> {
    return (
      (await this.payoutSection()
        .getByText(labelSubstring)
        .first()
        .locator('xpath=../following-sibling::*[1]')
        .textContent()) ?? ''
    ).trim();
  }

  /** Read the right-hand payroll detail panel for the currently-selected staff row. */
  async readDetailPanel(): Promise<StaffPayrollDetail> {
    const payType = await this.detailPayType();
    const common = {
      payType,
      workingDays: await this.readWorkingDays(payType),
      deduction: await this.readDetailValue('Clean Up Fee/Deduction'),
      tip: await this.readDetailValue('Tip'),
      cardChargeTip: await this.readDetailValue('Card Charge Tip'),
      totalIncome: await this.readPayoutValue('Total Income'),
      pay1: await this.readPayoutValue('Pay 1'),
      pay2: await this.readPayoutValue('Pay 2'),
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
      supplyFee: await this.readDetailValueBySubstring('Supply Fee'),
      staffCommission: await this.readDetailValue('Staff Commission'),
      cardChargeCommission: await this.readDetailValue('Card Charge Commission'),
      discountCharge: await this.readDetailValue('Discount Charge'),
    };
  }
}
