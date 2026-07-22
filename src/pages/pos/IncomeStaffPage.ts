import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { shopTimezone } from '@data/static/shops';
import { zonedDayStartUnix, zonedDayEndUnix } from '@utils/dateUtils';

/** The 6 aggregate stat labels on the header bar. */
export type StaffIncomeStat =
  | 'Total staff'
  | 'Total orders'
  | 'Total subtotal'
  | 'Total supply fee'
  | 'Total tip'
  | 'Total staff income';

/** A parsed staff listing row. */
export interface StaffIncomeRow {
  staff: string;
  orders: string;
  subtotal: string;
  supplyFee: string;
  tip: string;
  totalIncome: string;
}

// Volt POS groups days by the SHOP's timezone (each merchant keeps its own
// books), not the runner's machine TZ — build URL ranges on the shop's day
// boundaries so a window never spills onto an extra day. Same rationale as
// DailySaleReportPage / IncomeSummaryPage.
const SHOP_TZ = shopTimezone(process.env.SHOP);

/**
 * Staff Income — `/incomes/income-staff`
 *
 * A two-panel report. LEFT: search-by-nickname + period filter (preset dropdown
 * + date picker), a 6-metric aggregate bar (Total staff / orders / subtotal /
 * supply fee / tip / staff income), and a staff listing table. RIGHT: per-staff
 * income detail (Commission or Salary variant) + Print.
 *
 * Like the other Income reports the route is passcode-gated and selectors lean
 * on visible text because Volt POS hasn't adopted `data-testid`.
 */
/** `'v1'` is `/incomes/income-staff`; `'v2'` is the parallel `-v2` route under evaluation. */
export type ReportVariant = 'v1' | 'v2';

export class IncomeStaffPage extends BasePage {
  protected readonly path: string;

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly periodDropdown: Locator;
  readonly table: Locator;
  readonly printButton: Locator;
  readonly emptyResults: Locator;
  readonly noDetail: Locator;

  constructor(page: Page, variant: ReportVariant = 'v1') {
    super(page);
    this.path = variant === 'v2' ? '/incomes/income-staff-v2' : '/incomes/income-staff';
    // "Staff Income[ V2]" title renders as a plain <div>, not a semantic heading.
    this.heading = page.getByText(variant === 'v2' ? 'Staff Income V2' : 'Staff Income', {
      exact: true,
    });
    this.searchInput = page.getByRole('textbox', { name: 'Search staff' });
    // The preset/period dropdown is the first combobox in the filter bar.
    this.periodDropdown = page.getByRole('combobox').first();
    this.table = page.getByRole('table');
    this.printButton = page.getByRole('button', { name: 'Print' });
    this.emptyResults = page.getByRole('heading', { name: 'No results found.' });
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

  /**
   * Navigate straight to a date range via the URL, bypassing the calendar
   * popover (same rationale as the sibling report pages). Caller unlocks the
   * passcode afterwards.
   */
  async gotoRange(from: Date, to: Date): Promise<void> {
    const f = zonedDayStartUnix(from, SHOP_TZ);
    const t = zonedDayEndUnix(to, SHOP_TZ);
    this.logger.info(`Navigate to ${this.path} range ${f}-${t}`);
    await this.page.goto(`${this.path}?from=${f}&to=${t}`, { waitUntil: 'domcontentloaded' });
  }

  /** Single-day helper — from/to both resolve to that day's shop-local window. */
  async gotoDate(date: Date): Promise<void> {
    await this.gotoRange(date, date);
  }

  // --------------------------------------------------------------- filters

  /** Search staff by nickname (types into the search box). */
  async searchStaff(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  /** Current text shown in the period preset dropdown (e.g. "Today"). */
  async periodDropdownText(): Promise<string> {
    return (await this.periodDropdown.textContent())?.trim() ?? '';
  }

  // ----------------------------------------------------------- stat bar

  /** The label element of an aggregate stat (e.g. "Total tip"). */
  statLabel(name: StaffIncomeStat): Locator {
    return this.page.getByText(name, { exact: true });
  }

  /** The value shown next to a stat label (the immediately-following sibling). */
  statValue(name: StaffIncomeStat): Locator {
    return this.statLabel(name).locator('xpath=following-sibling::*[1]');
  }

  async readStatValue(name: StaffIncomeStat): Promise<string> {
    return ((await this.statValue(name).textContent()) ?? '').trim();
  }

  // --------------------------------------------------------------- table

  tableRows(): Locator {
    return this.table.locator('tbody tr');
  }

  async rowCount(): Promise<number> {
    // The table only renders once at least one staff exists for the period.
    if (!(await this.table.isVisible().catch(() => false))) return 0;
    return this.tableRows().count();
  }

  /** Column header labels in order, e.g. ["Staff","Orders","Subtotal",...]. */
  async headerLabels(): Promise<string[]> {
    const headers = this.table.locator('thead th, thead [role="columnheader"]');
    const count = await headers.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push(((await headers.nth(i).textContent()) ?? '').trim());
    }
    return labels;
  }

  /** Read a staff listing row's 6 cells by index. */
  async readRow(index: number): Promise<StaffIncomeRow> {
    const cells = this.tableRows().nth(index).locator('td, [role="cell"]');
    const count = await cells.count();
    if (count < 6) {
      throw new Error(`Staff row ${index} has ${count} cells, expected 6`);
    }
    const text = async (i: number): Promise<string> =>
      ((await cells.nth(i).textContent()) ?? '').trim();
    return {
      staff: await text(0),
      orders: await text(1),
      subtotal: await text(2),
      supplyFee: await text(3),
      tip: await text(4),
      totalIncome: await text(5),
    };
  }

  /** Click a staff row; waits for the detail panel (Print button) to render. */
  async openStaffDetail(index = 0): Promise<void> {
    await this.tableRows().nth(index).click();
    await expect(this.printButton).toBeVisible({ timeout: 10_000 });
  }

  // ------------------------------------------------------- detail panel

  /**
   * Reads the per-staff detail panel (right side, opened via {@link openStaffDetail}):
   * the staff's own order table (columns vary — Commission layout has
   * Order #/Sale-Refund/Supply/Tip, Salary layout has Order #/Sale-Refund/Tip)
   * plus every label/value row below it (Clock In/Working Days/Sale/Subtotal/
   * Salary Type/Rate/Gross Income/Staff Commission/Commission Rate/Clean Up
   * Fee/Tip/Card Charge.../Total Income/Pay 1/Pay 2, ...). Generic scraping (no
   * fixed field list) so it works unmodified for BOTH the salary and
   * commission layouts described in
   * docs/screens/income-reports-v2/income-reports-v2-comparison.md §3.
   */
  async readStaffDetailPanel(): Promise<{
    orders: Array<Record<string, string>>;
    fields: Array<{ label: string; value: string }>;
  }> {
    return this.page.evaluate(() => {
      const panel =
        Array.from(document.querySelectorAll('div')).find(
          (d) =>
            /Print/.test(d.textContent || '') &&
            /Total Income/.test(d.textContent || '') &&
            d.querySelectorAll('*').length < 800,
        ) ?? document.body;

      const orderTable = panel.querySelector('table');
      const orders: Array<Record<string, string>> = [];
      if (orderTable) {
        const headers = Array.from(
          orderTable.querySelectorAll('thead th, thead [role="columnheader"]'),
        ).map((h) => (h.textContent || '').trim());
        const rows = Array.from(orderTable.querySelectorAll('tbody tr'));
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td, [role="cell"]')).map((c) =>
            (c.textContent || '').trim(),
          );
          const rec: Record<string, string> = {};
          headers.forEach((h, i) => {
            rec[h || `col${i}`] = cells[i] ?? '';
          });
          orders.push(rec);
        }
      }

      const fields: Array<{ label: string; value: string }> = [];
      const seen = new Set<Element>();
      for (const el of Array.from(panel.querySelectorAll('*'))) {
        if (el.tagName === 'TABLE' || el.closest('table')) continue;
        if (!/justify-between/.test((el as HTMLElement).className || '')) continue;
        const kids = el.children;
        if (kids.length < 2) continue;
        const value = (kids[kids.length - 1].textContent || '').trim();
        if (!/^-?\$/.test(value)) continue;
        if (el.querySelector('[class*="justify-between"]')) continue;
        if (seen.has(el)) continue;
        seen.add(el);
        const label = (kids[0].textContent || '').replace(/\s+/g, ' ').trim();
        if (!label || /\$/.test(label)) continue;
        fields.push({ label, value });
      }
      return { orders, fields };
    });
  }

  // ----------------------------------------------------- loading / error / empty

  /** True when the "No results found." empty state is shown. */
  async isEmpty(): Promise<boolean> {
    return this.emptyResults.isVisible().catch(() => false);
  }

  skeleton(): Locator {
    return this.page.locator('[data-slot="skeleton"], [role="status"], .animate-pulse').first();
  }

  errorMessage(): Locator {
    return this.page.getByText(/Failed to load|Something went wrong/i).first();
  }
}
