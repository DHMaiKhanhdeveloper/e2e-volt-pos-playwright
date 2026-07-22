import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { shopTimezone } from '@data/static/shops';
import { zonedDayStartUnix, zonedDayEndUnix } from '@utils/dateUtils';

export type GroupBy = 'Day' | 'Week' | 'Month';

export type DetailSection =
  | 'Payment Details'
  | 'Sale Details'
  | 'Supply Fee'
  | 'Staff Payout'
  | 'Salon Earnings';

/** A parsed orders/summary table row (the Total Income table). */
export interface SummaryRow {
  date: string;
  sale: string;
  tip: string;
  tax: string;
  totalPayment: string;
}

// Volt POS groups days by the SHOP's timezone (each merchant keeps its own
// books), not the test runner's machine TZ. Build the URL range on the shop's
// day boundaries — driven by `SHOP`/`TZ_ID` via `shopTimezone` — so a window
// never spills onto an extra day when the machine TZ differs from the shop's.
const SHOP_TZ = shopTimezone(process.env.SHOP);

/**
 * Income Summary — `/incomes/income-summary`
 *
 * A two-panel report. LEFT: period filter (preset/year dropdown + date picker +
 * Day/Week/Month tabs), Total Income + period-over-period comparison, a 3-series
 * chart (Gross / Net / Tip), and a table `Date | Sale | Tip | Tax | Total Payment`
 * (one row per period). RIGHT: detail for the selected period — Payment Details,
 * Sale Details, Supply Fee, Staff Payout (Show more/less), Salon Earnings + Print.
 *
 * Like the Daily Sale Report, the route is passcode-gated and selectors lean on
 * visible text because Volt POS hasn't adopted `data-testid`.
 */
/** `'v1'` is `/incomes/income-summary`; `'v2'` is the parallel `-v2` route under evaluation. */
export type ReportVariant = 'v1' | 'v2';

export class IncomeSummaryPage extends BasePage {
  protected readonly path: string;

  readonly heading: Locator;
  readonly periodDropdown: Locator;
  readonly groupByTabs: Locator;
  readonly totalIncomeHeading: Locator;
  readonly table: Locator;
  readonly printButton: Locator;

  constructor(page: Page, variant: ReportVariant = 'v1') {
    super(page);
    this.path = variant === 'v2' ? '/incomes/income-summary-v2' : '/incomes/income-summary';
    this.heading = page.getByText(variant === 'v2' ? 'Income Summary V2' : 'Income Summary', {
      exact: true,
    });
    // The preset/year dropdown is the first combobox in the filter bar.
    this.periodDropdown = page.getByRole('combobox').first();
    this.groupByTabs = page.getByRole('tablist');
    // "Total Income <range>" — the only h2 on the page.
    this.totalIncomeHeading = page.getByRole('heading', { name: /^Total Income/ });
    this.table = page.getByRole('table');
    this.printButton = page.getByRole('button', { name: 'Print' });
  }

  /** Gated route — navigate without waiting; caller unlocks the passcode first. */
  async goto(): Promise<void> {
    this.logger.info(`Navigate to ${this.path}`);
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
  }

  async waitForReady(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
    await expect(this.totalIncomeHeading).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Navigate straight to a date range + grouping via the URL, bypassing the
   * calendar popover (same rationale as DailySaleReportPage.gotoDate). Caller
   * unlocks the passcode afterwards.
   */
  async gotoRange(from: Date, to: Date, groupBy: GroupBy = 'Day'): Promise<void> {
    const f = zonedDayStartUnix(from, SHOP_TZ);
    const t = zonedDayEndUnix(to, SHOP_TZ);
    this.logger.info(`Navigate to ${this.path} range ${f}-${t} groupBy=${groupBy}`);
    await this.page.goto(`${this.path}?from=${f}&to=${t}&groupBy=${groupBy.toLowerCase()}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  // ---------------------------------------------------------------- filters

  groupByTab(name: GroupBy): Locator {
    return this.groupByTabs.getByRole('tab', { name, exact: true });
  }

  /** Switch Day/Week/Month grouping; waits for the URL to reflect it. */
  async selectGroupBy(name: GroupBy): Promise<void> {
    await this.groupByTab(name).click();
    await expect(this.page).toHaveURL(new RegExp(`groupBy=${name.toLowerCase()}`));
  }

  /** The grouping currently encoded in the URL. */
  groupByFromUrl(): GroupBy | null {
    const value = new URL(this.page.url()).searchParams.get('groupBy');
    if (value === 'day') return 'Day';
    if (value === 'week') return 'Week';
    if (value === 'month') return 'Month';
    return null;
  }

  async isGroupBySelected(name: GroupBy): Promise<boolean> {
    return (await this.groupByTab(name).getAttribute('aria-selected')) === 'true';
  }

  /** Open the preset/year dropdown and pick an option by visible label. */
  async selectPeriodPreset(label: string): Promise<void> {
    await this.periodDropdown.click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  /** Current text shown in the preset/year dropdown (e.g. "Today", "2026"). */
  async periodDropdownText(): Promise<string> {
    return (await this.periodDropdown.textContent())?.trim() ?? '';
  }

  // --------------------------------------------------------- total income

  /** Big Total Income money value (sits right after the "Total Income …" heading). */
  totalIncomeValue(): Locator {
    return this.totalIncomeHeading.locator('xpath=following-sibling::*[1]');
  }

  /** The period-over-period comparison label, e.g. "vs. Previous period". */
  comparisonLabel(): Locator {
    return this.page.getByText(
      /vs\.\s+(Previous period|Previous 7 days|Same day last week|Last year)/,
    );
  }

  /** The comparison percentage badge (e.g. "2707.95%"). */
  comparisonPercent(): Locator {
    return this.page.getByText(/^\d[\d,]*\.?\d*%$/).first();
  }

  // ------------------------------------------------------- chart legend

  legendItem(name: 'Gross Income' | 'Net Income' | 'Total Tip'): Locator {
    return this.page.getByText(name, { exact: true });
  }

  // --------------------------------------------------------------- table

  tableRows(): Locator {
    return this.table.locator('tbody tr');
  }

  async rowCount(): Promise<number> {
    return this.tableRows().count();
  }

  /** Column header labels in order — e.g. ["Date","Sale","Tip","Tax","Total Payment"]. */
  async headerLabels(): Promise<string[]> {
    const headers = this.table.locator('thead th, thead [role="columnheader"]');
    const count = await headers.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push(((await headers.nth(i).textContent()) ?? '').trim());
    }
    return labels;
  }

  /** Read a table row's 5 cells by row index. */
  async readRow(index: number): Promise<SummaryRow> {
    const cells = this.tableRows().nth(index).locator('td, [role="cell"]');
    const count = await cells.count();
    if (count < 5) {
      throw new Error(`Summary row ${index} has ${count} cells, expected 5`);
    }
    return {
      date: ((await cells.nth(0).textContent()) ?? '').trim(),
      sale: ((await cells.nth(1).textContent()) ?? '').trim(),
      tip: ((await cells.nth(2).textContent()) ?? '').trim(),
      tax: ((await cells.nth(3).textContent()) ?? '').trim(),
      totalPayment: ((await cells.nth(4).textContent()) ?? '').trim(),
    };
  }

  /** Click a period row; waits for the detail panel to load (`detailId` in URL). */
  async openPeriodDetail(index = 0): Promise<void> {
    await this.tableRows().nth(index).click();
    await expect(this.page).toHaveURL(/detailId=/);
    await expect(this.sectionHeading('Payment Details')).toBeVisible();
  }

  /**
   * The detail sections render `$0.00` placeholders before the GraphQL detail
   * query resolves. Wait for a known value (e.g. the period's Total Payment,
   * computed from the API row) to appear so reads don't catch placeholders.
   *
   * Scoped to the detail panel: the same money value also appears in the LEFT
   * summary table, so a page-wide match would resolve early (while the panel is
   * still showing `$0.00`) and reads would catch placeholders.
   */
  async waitForDetailLoaded(expectedValueText: string): Promise<void> {
    const detail = this.page
      .getByText('Payment Details', { exact: true })
      .locator('xpath=ancestor::*[.//*[normalize-space()="Salon Earnings"]][1]');
    await expect(detail.getByText(expectedValueText).first()).toBeVisible({ timeout: 10_000 });
  }

  // ------------------------------------------------------- detail panel

  /** Header of the detail panel — the selected period's date range. */
  detailHeading(): Locator {
    // The detail header sits in the same row as the Print button.
    return this.printButton.locator('xpath=preceding-sibling::*[1]');
  }

  sectionHeading(section: DetailSection): Locator {
    return this.page.getByRole('heading', { name: section, exact: true });
  }

  /**
   * The whole detail-panel body as innerText (Section / Label / Value lines).
   * Anchored on "Payment Details" and climbing to the container that also holds
   * "Salon Earnings" — robust for reconciliation parsing in tests.
   */
  async detailBodyText(): Promise<string> {
    const body = this.page
      .getByText('Payment Details', { exact: true })
      .locator('xpath=ancestor::*[.//*[normalize-space()="Salon Earnings"]][1]');
    return (await body.innerText()).trim();
  }

  /** Staff Payout "Show more"/"Show less" toggle. */
  showMoreToggle(): Locator {
    return this.page.getByText(/^Show (more|less)$/);
  }

  /**
   * Expand every "Show more" section, then scrape the detail panel into ordered
   * sections (Payment Details / Sale Details / Supply Fee / Staff Payout / Salon
   * Earnings). Each row keeps the app's bold flag (font-weight ≥ 600 marks the
   * category rows; sub-rows are lighter). The caller must have the detail panel
   * open (see {@link openPeriodDetail}).
   */
  async readDetailSections(): Promise<
    Array<{ title: string; rows: Array<{ label: string; value: string; bold: boolean }> }>
  > {
    const flat = await this.page.evaluate(() => {
      const SECTIONS = [
        'Payment Details',
        'Sale Details',
        'Supply Fee',
        'Staff Payout',
        'Salon Earnings',
      ];
      document.querySelectorAll('button, [role="button"], span, div').forEach((el) => {
        if ((el.textContent || '').trim() === 'Show more') (el as HTMLElement).click();
      });
      const panel =
        Array.from(document.querySelectorAll('div')).find(
          (d) =>
            /Payment Details/.test(d.textContent || '') &&
            /Salon Earnings/.test(d.textContent || '') &&
            d.querySelectorAll('*').length < 600,
        ) ?? document.body;

      const out: Array<{
        kind: 'section' | 'row';
        title?: string;
        label?: string;
        value?: string;
        bold?: boolean;
      }> = [];
      const seen = new Set<Element>();
      for (const el of Array.from(panel.querySelectorAll('*'))) {
        const txt = (el.textContent || '').trim();
        if (el.childElementCount === 0 && SECTIONS.includes(txt)) {
          out.push({ kind: 'section', title: txt });
          continue;
        }
        if (/justify-between/.test((el as HTMLElement).className || '')) {
          const kids = el.children;
          if (kids.length < 2) continue;
          const value = (kids[kids.length - 1].textContent || '').trim();
          if (!/^-?\$/.test(value)) continue;
          if (el.querySelector('[class*="justify-between"]')) continue;
          if (seen.has(el)) continue;
          seen.add(el);
          const label = (kids[0].textContent || '').replace(/\s+/g, ' ').trim();
          if (!label || /\$/.test(label)) continue;
          const bold = parseInt(getComputedStyle(kids[0] as HTMLElement).fontWeight, 10) >= 600;
          out.push({ kind: 'row', label, value, bold });
        }
      }
      return out;
    });

    const sections: Array<{
      title: string;
      rows: Array<{ label: string; value: string; bold: boolean }>;
    }> = [];
    for (const item of flat) {
      if (item.kind === 'section') sections.push({ title: item.title as string, rows: [] });
      else if (sections.length)
        sections[sections.length - 1].rows.push({
          label: item.label as string,
          value: item.value as string,
          bold: !!item.bold,
        });
    }
    return sections;
  }
}
