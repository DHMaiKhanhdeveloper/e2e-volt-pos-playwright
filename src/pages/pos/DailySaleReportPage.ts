import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { parseCentsFromUsd } from '@utils/moneyUtils';
import { shopTimezone } from '@data/static/shops';
import { zonedDayStartUnix, zonedDayEndUnix } from '@utils/dateUtils';
import type { OrderMoneyRow } from '@utils/incomeFromOrders';
import type { OrderDetail } from '@utils/orderDetail';

export type ChartCard = 'Total Order' | 'Sale' | 'Total Tip' | 'Total Payment';

export type ChartKey = 'totalOrder' | 'sale' | 'totalTip' | 'totalPayment';

const cardToChartKey: Record<ChartCard, ChartKey> = {
  'Total Order': 'totalOrder',
  Sale: 'sale',
  'Total Tip': 'totalTip',
  'Total Payment': 'totalPayment',
};

/**
 * Daily Sale Report — `/incomes/income-daily`
 *
 * Selectors lean on visible text + headings because Volt POS hasn't yet
 * adopted `data-testid`. The page splits into two columns:
 *   left  — header + 4 statistics cards + bar chart
 *   right — date + Print + Orders table + Income/Payment details
 */
export class DailySaleReportPage extends BasePage {
  protected readonly path = '/incomes/income-daily';

  readonly heading: Locator;
  readonly todayButton: Locator;
  readonly printButton: Locator;
  readonly chartHeading: Locator;
  readonly ordersTable: Locator;
  readonly orderDetailDialog: Locator;
  readonly orderDetailDialogTitle: Locator;
  readonly orderDetailDialogClose: Locator;

  constructor(page: Page) {
    super(page);
    // The page title "Daily Sale Report" is rendered as a plain <div>, not a
    // semantic <heading> — use text selector to find it reliably.
    this.heading = page.getByText('Daily Sale Report', { exact: true });
    this.todayButton = page.getByRole('button', { name: 'Today', exact: true });
    this.printButton = page.getByRole('button', { name: 'Print' });
    // Chart label `<h3>` directly above the bar chart — reflects the active card.
    this.chartHeading = page.locator('h3').filter({
      hasText: /^(Sale|Total Order|Total Tip|Total Payment|Net Income|Total Refund)$/,
    });
    this.ordersTable = page.getByRole('table');
    this.orderDetailDialog = page.getByRole('dialog', { name: 'Order Details' });
    this.orderDetailDialogTitle = this.orderDetailDialog.getByRole('heading', {
      name: 'Order Details',
    });
    // shadcn DialogHeaderClose renders the (×) button as the first button in the dialog header.
    this.orderDetailDialogClose = this.orderDetailDialog.getByRole('button').first();
  }

  /**
   * The route is gated by `PermissionProtectedRoute` — the passcode dialog
   * is shown ON TOP of the layout, but the heading is still rendered behind
   * it. `BasePage.goto()`'s default `waitForReady` would happily pass before
   * the gate is unlocked. We override `goto` to skip that wait so the caller
   * can drive the passcode dialog first, then call `waitForReady` explicitly.
   */
  async goto(): Promise<void> {
    this.logger.info(`Navigate to ${this.path}`);
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    // Intentionally NOT calling waitForReady() here — caller unlocks first.
  }

  /**
   * Real readiness signal: the 4 stat cards only mount AFTER permission
   * is granted (the inner `IncomeDaily` component lives inside the gate).
   * Heading alone is not a reliable indicator on this page.
   */
  async waitForReady(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.card('Sale')).toBeVisible({ timeout: 15_000 });
  }

  // ---------------------------------------------------------- stats cards

  /** Locator for a stat card by its heading text. Scope all sub-queries to this. */
  card(name: ChartCard): Locator {
    // The page has TWO "Sale" headings:
    //   - level=4 inside the stats card
    //   - level=3 as the chart label above the bar chart
    // Pin to level=4 so we only ever land inside the card.
    return this.page
      .getByRole('heading', { name, level: 4, exact: true })
      .locator('xpath=ancestor::*[.//*[contains(text(),"vs Yesterday")]][1]');
  }

  /** Numeric/money text inside a stat card (the big bold value). */
  cardValue(name: ChartCard): Locator {
    // The value sits between the heading and the "vs Yesterday" line.
    // Pull the first LEAF div/span that holds the value — wrap in ( ) so [1]
    // selects a single node document-wide (an unparenthesised `//*[…][1]`
    // matches the first leaf in EVERY branch, so it also grabs the "68%"
    // badge → strict-mode violation). Exclude the "%" badge explicitly too.
    return this.card(name).locator(
      'xpath=(.//*[self::div or self::span][normalize-space()][not(.//*)][not(contains(normalize-space(),"%"))])[1]',
    );
  }

  /** "vs Yesterday" percentage label inside a stat card. */
  cardPercentage(name: ChartCard): Locator {
    return this.card(name).locator(
      'xpath=.//*[self::div or self::span][contains(normalize-space(.), "%") and not(.//*[contains(normalize-space(.), "%")])]',
    );
  }

  async clickCard(name: ChartCard): Promise<void> {
    await this.card(name).click();
    // The URL is the source of truth for the active chart; wait for it.
    await expect(this.page).toHaveURL(new RegExp(`activeChart=${cardToChartKey[name]}`));
  }

  /**
   * The card's helper text. Volt POS renders the description as an
   * always-visible `<p>` directly under the card heading — it is NOT a
   * hover tooltip and there is no ⓘ info button. The paragraph is the only
   * `<p>` inside the card, so scope to it.
   */
  cardDescription(name: ChartCard): Locator {
    return this.card(name).getByRole('paragraph').first();
  }

  /** Reads the current `activeChart` value from the URL. Returns `null` if absent. */
  activeChartFromUrl(): ChartKey | null {
    const url = new URL(this.page.url());
    const value = url.searchParams.get('activeChart');
    return value && (Object.values(cardToChartKey) as string[]).includes(value)
      ? (value as ChartKey)
      : null;
  }

  /**
   * `true` if the card's root element has the "selected" Tailwind classes
   * the variants file applies (`border-2 border-primary bg-primary-50`).
   * Falls back gracefully if Volt POS later swaps to a different marker.
   */
  async isCardSelected(name: ChartCard): Promise<boolean> {
    const classAttr = (await this.card(name).getAttribute('class')) ?? '';
    return /border-primary/.test(classAttr) && /bg-primary-50/.test(classAttr);
  }

  // ---------------------------------------------------- orders table & dialog

  /** Row in the orders table that contains the given orderCode (`OD…`). */
  orderRow(orderCode: string): Locator {
    return this.ordersTable.getByRole('row', { name: new RegExp(orderCode) });
  }

  /** Returns the orderCode of the first order row currently rendered (or `null`). */
  async firstOrderCode(): Promise<string | null> {
    const firstRowText = await this.ordersTable
      .locator('tbody tr')
      .first()
      .textContent()
      .catch(() => null);
    const match = firstRowText?.match(/OD\d{6}-\d+/);
    return match?.[0] ?? null;
  }

  /** Click a row by orderCode; waits for the dialog to open. */
  async openOrderDetail(orderCode: string): Promise<void> {
    await this.orderRow(orderCode).click();
    await expect(this.orderDetailDialog).toBeVisible();
    // App also adds the orderId to the URL — wait for it so reload-after-open works.
    await expect(this.page).toHaveURL(/orderId=/);
  }

  async closeOrderDetailViaButton(): Promise<void> {
    await this.orderDetailDialogClose.click();
    await expect(this.orderDetailDialog).toBeHidden();
  }

  async closeOrderDetailViaEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.orderDetailDialog).toBeHidden();
  }

  /**
   * Open one order's detail dialog and scrape the full per-order breakdown:
   * Order Information, Order Summary, the Service Details grouped by staff (a
   * staff can have several service lines), per-staff tips, and refund info. Then
   * close the dialog. The dialog renders sections as label/value text, so we
   * parse its `innerText` by the section headings.
   */
  async readOrderDetail(orderCode: string): Promise<OrderDetail> {
    await this.openOrderDetail(orderCode);
    // The dialog mounts before its async detail query resolves — wait for the
    // Order Summary section so we never parse a half-rendered dialog.
    await expect(this.orderDetailDialog.getByText('Order Summary')).toBeVisible({
      timeout: 10_000,
    });

    const detail = await this.orderDetailDialog.evaluate((dlg, code): OrderDetail => {
      const parseUsd = (s: string | null): number => {
        if (!s) return 0;
        const neg = /-/.test(s);
        const n = parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
        return Math.round((neg ? -n : n) * 100);
      };
      const text = (dlg as HTMLElement).innerText;
      const between = (start: string, ends: string[]): string => {
        const i = text.indexOf(start);
        if (i < 0) return '';
        let j = text.length;
        for (const e of ends) {
          const k = text.indexOf(e, i + start.length);
          if (k >= 0 && k < j) j = k;
        }
        return text.slice(i + start.length, j);
      };
      const kv = (block: string, label: string): string | null => {
        const re = new RegExp(
          label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\n\\s*([^\\n]+)',
        );
        const m = block.match(re);
        return m ? m[1].trim() : null;
      };

      const info = between('Order Information', ['Order Summary']);
      const sum = between('Order Summary', ['Service Details', 'Payment Details']);
      const svc = between('Service Details', [
        'Payment Details',
        'Order Note',
        'Refund information',
      ]);
      const ref = between('Refund information', []);

      // Service Details = staff groups (each with N service lines), then a Tip
      // sub-section listing "<staff> - $amount".
      const tipIdx = svc.search(/\nTip\nLast updated/);
      const servicesPart = tipIdx >= 0 ? svc.slice(0, tipIdx) : svc;
      const tipsPart = tipIdx >= 0 ? svc.slice(tipIdx) : '';

      const services: OrderDetail['services'] = [];
      const staffSet = new Set<string>();
      const groupRe = /Staff:\s*([^\n]+)([\s\S]*?)(?=Staff:|$)/g;
      let g: RegExpExecArray | null;
      while ((g = groupRe.exec(servicesPart)) !== null) {
        const staffName = g[1].trim();
        staffSet.add(staffName);
        const itemRe = /([^\n]+)\n(-?\$[\d.,]+)/g;
        let it: RegExpExecArray | null;
        while ((it = itemRe.exec(g[2])) !== null) {
          const name = it[1].trim();
          if (!name || /^Last updated/.test(name)) continue;
          services.push({ staff: staffName, service: name, priceCents: parseUsd(it[2]) });
        }
      }

      const tips: OrderDetail['tips'] = [];
      const tipRe = /([^\n]+?)\s-\s(-?\$[\d.,]+)/g;
      let t: RegExpExecArray | null;
      while ((t = tipRe.exec(tipsPart)) !== null) {
        const name = t[1].trim();
        if (/^Last updated/.test(name) || name === 'Tip') continue;
        tips.push({ staff: name, tipCents: parseUsd(t[2]) });
        staffSet.add(name);
      }

      return {
        orderCode: code,
        status: kv(info, 'Status'),
        orderId: kv(info, 'Order ID'),
        cashier: kv(info, 'Cashier'),
        orderDate: kv(info, 'Order Date'),
        customer: kv(info, 'Customer'),
        phone: kv(info, 'Phone'),
        summary: {
          subtotalCents: parseUsd(kv(sum, 'Subtotal')),
          totalDiscountCents: parseUsd(kv(sum, 'Total Discount')),
          taxCents: parseUsd(kv(sum, 'Tax')),
          tipCents: parseUsd(kv(sum, 'Tip')),
          totalCents: parseUsd(kv(sum, 'Total')),
        },
        staff: [...staffSet],
        services,
        tips,
        refund: ref
          ? { byStaff: kv(ref, 'By Staff'), method: kv(ref, 'Method'), reason: kv(ref, 'Reason') }
          : null,
      };
    }, orderCode);

    await this.closeOrderDetailViaButton();
    return detail;
  }

  /**
   * Scrape the detail dialog of every order in the table, in display order.
   * Resilient: on live data a row can vanish between listing and opening, so a
   * failed order is skipped (with its dialog force-closed) rather than failing
   * the whole scrape.
   */
  async readAllOrderDetails(): Promise<OrderDetail[]> {
    await this.scrollOrdersTableToEnd();
    const codes = await this.allOrderCodes();
    const details: OrderDetail[] = [];
    for (const code of codes) {
      try {
        details.push(await this.readOrderDetail(code));
      } catch {
        // Make sure no dialog is left open before the next order.
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.orderDetailDialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      }
    }
    return details;
  }

  /**
   * Reads a row's 5 displayed cells as their raw text — Order#, Sale/Refund,
   * Tip, Tax, Total. Use `parseCentsFromUsd` to compare to math.
   */
  async readOrderRow(orderCode: string): Promise<{
    orderCode: string;
    sale: string;
    tip: string;
    tax: string;
    total: string;
  }> {
    const row = this.orderRow(orderCode);
    const cells = row.locator('td, [role="cell"]');
    const count = await cells.count();
    if (count < 5) {
      throw new Error(`Row "${orderCode}" has ${count} cells, expected 5`);
    }
    return {
      orderCode: ((await cells.nth(0).textContent()) ?? '').trim(),
      sale: ((await cells.nth(1).textContent()) ?? '').trim(),
      tip: ((await cells.nth(2).textContent()) ?? '').trim(),
      tax: ((await cells.nth(3).textContent()) ?? '').trim(),
      total: ((await cells.nth(4).textContent()) ?? '').trim(),
    };
  }

  /**
   * Navigate the report to a specific date by updating the URL search params
   * directly. We bypass the calendar popover UI because:
   *   - the date picker DOM changes month-to-month, and
   *   - the route is single-source-of-truth — same effect.
   */
  async gotoDate(date: Date, activeChart: ChartKey = 'sale'): Promise<void> {
    // Day boundaries in the SHOP's timezone (not the machine's) so the window is
    // correct regardless of where the test runs.
    const tz = shopTimezone(process.env.SHOP);
    const from = zonedDayStartUnix(date, tz);
    const to = zonedDayEndUnix(date, tz);
    await this.page.goto(`${this.path}?from=${from}&to=${to}&activeChart=${activeChart}`);
  }

  /** True if the "Today" button currently looks active (filled variant). */
  async isTodayActive(): Promise<boolean> {
    const classAttr = (await this.todayButton.getAttribute('class')) ?? '';
    // shadcn `default` variant fills with primary; `outline` keeps the
    // primary border. We treat "no `border-primary text-primary`" as active.
    return !/border-primary[\s$]/.test(classAttr) || /bg-primary/.test(classAttr);
  }

  /** All orderCodes currently rendered in the table body, in display order. */
  async allOrderCodes(): Promise<string[]> {
    const rows = this.ordersTable.locator('tbody tr');
    const count = await rows.count();
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).textContent()) ?? '';
      const match = text.match(/OD\d{6}-\d+/);
      if (match) codes.push(match[0]);
    }
    return codes;
  }

  /**
   * Scroll the orders table's scroll container fully, in steps, so every row is
   * materialized in the DOM before we read.
   *
   * Today the table is a plain CSS-overflow list (all rows are present
   * regardless of scroll position), so this is belt-and-suspenders. But if Volt
   * POS later windows the list, only the rows near the viewport would be in the
   * DOM — scrolling to the end first keeps {@link allOrderCodes} complete. We
   * step by ~viewport height and stop once the row count stops growing.
   */
  async scrollOrdersTableToEnd(maxSteps = 50): Promise<void> {
    let previous = -1;
    for (let step = 0; step < maxSteps; step++) {
      const count = await this.ordersTable.evaluate((tableEl) => {
        let s: HTMLElement | null = tableEl as HTMLElement;
        while (s && s !== document.body) {
          const oy = getComputedStyle(s).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && s.scrollHeight > s.clientHeight) break;
          s = s.parentElement;
        }
        if (s) s.scrollTop += s.clientHeight;
        return tableEl.querySelectorAll('tbody tr').length;
      });
      // No scroll container, or reached the end and no new rows appeared.
      if (count === previous) break;
      previous = count;
      // Let any lazily-rendered rows mount before the next measurement.
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Scrape every order row into typed cents — the input the Income Details panel
   * is a column-wise sum of. Scrolls the table to the end first (see
   * {@link scrollOrdersTableToEnd}) so no rows are missed, then reuses
   * {@link allOrderCodes} + {@link readOrderRow}.
   */
  async readAllOrderRows(): Promise<OrderMoneyRow[]> {
    await this.scrollOrdersTableToEnd();
    const codes = await this.allOrderCodes();
    const rows: OrderMoneyRow[] = [];
    for (const code of codes) {
      const r = await this.readOrderRow(code);
      rows.push({
        orderCode: r.orderCode.match(/OD\d{6}-\d+/)?.[0] ?? r.orderCode,
        saleCents: parseCentsFromUsd(r.sale),
        tipCents: parseCentsFromUsd(r.tip),
        taxCents: parseCentsFromUsd(r.tax),
        totalCents: parseCentsFromUsd(r.total),
      });
    }
    return rows;
  }

  // ---------------------------------------------------- income/payment details

  /**
   * Find the money value in the same row as a label like "Sale", "Tip", "Card"…
   *
   * Each detail row is a `div.justify-between` with two children — a left block
   * holding the label (+ optional helper text) and the money value as the last
   * child. We anchor on the exact label, climb to the row, then take its last
   * element. Scoped to the section so "Total Payment" (in both Income & Payment
   * Details) resolves to the right one.
   */
  private detailValue(section: 'Income Details' | 'Payment Details', label: string): Locator {
    return this.page
      .getByRole('heading', { name: section })
      .locator('..')
      .getByText(label, { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"justify-between")][1]/*[last()]');
  }

  // Income Details rows
  incomeSale(): Locator {
    return this.detailValue('Income Details', 'Sale');
  }
  incomeTip(): Locator {
    return this.detailValue('Income Details', 'Tip');
  }
  incomeTaxCollected(): Locator {
    return this.detailValue('Income Details', 'Tax Collected');
  }
  incomeTotalPayment(): Locator {
    return this.detailValue('Income Details', 'Total Payment');
  }

  // Payment Details rows
  paymentCard(): Locator {
    return this.detailValue('Payment Details', 'Card');
  }
  paymentCash(): Locator {
    return this.detailValue('Payment Details', 'Cash');
  }
  paymentOthers(): Locator {
    return this.detailValue('Payment Details', 'Others');
  }
  paymentAmountCollected(): Locator {
    return this.detailValue('Payment Details', 'Amount Collected');
  }
  paymentGiftCardRedemption(): Locator {
    return this.detailValue('Payment Details', 'Gift Card Redemption');
  }
  paymentTotalPayment(): Locator {
    return this.detailValue('Payment Details', 'Total Payment');
  }

  /** The Income Details panel the app rendered, parsed to cents. */
  async readIncomeDetailsPanel(): Promise<{
    saleCents: number;
    tipCents: number;
    taxCents: number;
    totalPaymentCents: number;
  }> {
    const cents = async (loc: Locator): Promise<number> =>
      parseCentsFromUsd((await loc.textContent()) ?? '');
    return {
      saleCents: await cents(this.incomeSale()),
      tipCents: await cents(this.incomeTip()),
      taxCents: await cents(this.incomeTaxCollected()),
      totalPaymentCents: await cents(this.incomeTotalPayment()),
    };
  }

  /** The Payment Details panel the app rendered, parsed to cents. */
  async readPaymentDetailsPanel(): Promise<{
    cardCents: number;
    cashCents: number;
    othersCents: number;
    amountCollectedCents: number;
    giftCardRedemptionCents: number;
    totalPaymentCents: number;
  }> {
    const cents = async (loc: Locator): Promise<number> =>
      parseCentsFromUsd((await loc.textContent()) ?? '');
    return {
      cardCents: await cents(this.paymentCard()),
      cashCents: await cents(this.paymentCash()),
      othersCents: await cents(this.paymentOthers()),
      amountCollectedCents: await cents(this.paymentAmountCollected()),
      giftCardRedemptionCents: await cents(this.paymentGiftCardRedemption()),
      totalPaymentCents: await cents(this.paymentTotalPayment()),
    };
  }

  // ----------------------------------------------------- loading / error / empty

  /**
   * Skeleton placeholders. The app uses `<div role="status">` from shadcn `<Skeleton/>`,
   * but Volt POS may render plain animated divs — fall back to a class hint.
   */
  skeleton(): Locator {
    return this.page.locator('[data-slot="skeleton"], [role="status"], .animate-pulse').first();
  }

  errorMessage(): Locator {
    // On a failed load Volt POS renders one paragraph per broken query
    // (e.g. "Failed to load store daily income data!" plus a "...detail
    // data!" sibling), so match the first to avoid a strict-mode violation.
    return this.page.getByText(/Failed to load|Something went wrong/i).first();
  }
}
