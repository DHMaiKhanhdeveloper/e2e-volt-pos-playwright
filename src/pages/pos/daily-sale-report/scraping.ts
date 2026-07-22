import type { Locator } from '@playwright/test';
import { parseCentsFromUsd } from '@utils/moneyUtils';
import type { OrderMoneyRow } from '@domains/income/incomeFromOrders';
import type { OrderDetail } from '@domains/orders/orderDetail';

/**
 * Parses the Order Details dialog's `innerText` into a typed breakdown:
 * Order Information, Order Summary, the Service Details grouped by staff (a
 * staff can have several service lines), per-staff tips, and refund info.
 */
export async function scrapeOrderDetail(dialog: Locator, orderCode: string): Promise<OrderDetail> {
  return dialog.evaluate((dlg, code): OrderDetail => {
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
      const re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\n\\s*([^\\n]+)');
      const m = block.match(re);
      return m ? m[1].trim() : null;
    };

    const info = between('Order Information', ['Order Summary']);
    const sum = between('Order Summary', ['Service Details', 'Payment Details']);
    const svc = between('Service Details', ['Payment Details', 'Order Note', 'Refund information']);
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
}

/**
 * Reads a row's 5 displayed cells as their raw text — Order#, Sale/Refund,
 * Tip, Tax, Total. Use `parseCentsFromUsd` to compare to math.
 */
export async function scrapeOrderRow(row: Locator): Promise<{
  orderCode: string;
  sale: string;
  tip: string;
  tax: string;
  total: string;
}> {
  const cells = row.locator('td, [role="cell"]');
  const count = await cells.count();
  if (count < 5) {
    throw new Error(`Row has ${count} cells, expected 5`);
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
 * Reads every row's 5 cells in a single DOM pass. A per-row `textContent()`
 * loop (one round-trip per cell per row) is fine for a single day's orders
 * but far too slow once the table holds a month's worth — this scrapes the
 * whole `tbody` in one `evaluate` call instead.
 */
export async function scrapeAllOrderRows(
  table: Locator,
): Promise<Array<{ orderCode: string; sale: string; tip: string; tax: string; total: string }>> {
  const isVisible = await table.isVisible().catch(() => false);
  if (!isVisible) return [];
  return table.evaluate((tableEl) => {
    const rows = Array.from(tableEl.querySelectorAll('tbody tr'));
    return rows.map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td, [role="cell"]')).map((c) =>
        (c.textContent ?? '').trim(),
      );
      return {
        orderCode: cells[0] ?? '',
        sale: cells[1] ?? '',
        tip: cells[2] ?? '',
        tax: cells[3] ?? '',
        total: cells[4] ?? '',
      };
    });
  });
}

/** Converts a raw scraped row into typed cents, matching the orderCode format. */
export function toOrderMoneyRow(
  orderCode: string,
  raw: { orderCode: string; sale: string; tip: string; tax: string; total: string },
): OrderMoneyRow {
  return {
    orderCode: raw.orderCode.match(/OD\d{6}-\d+/)?.[0] ?? orderCode,
    saleCents: parseCentsFromUsd(raw.sale),
    tipCents: parseCentsFromUsd(raw.tip),
    taxCents: parseCentsFromUsd(raw.tax),
    totalCents: parseCentsFromUsd(raw.total),
  };
}

/** The Income Details panel the app rendered, parsed to cents. */
export async function scrapeIncomeDetailsPanel(locators: {
  sale: Locator;
  tip: Locator;
  taxCollected: Locator;
  totalPayment: Locator;
}): Promise<{ saleCents: number; tipCents: number; taxCents: number; totalPaymentCents: number }> {
  const cents = async (loc: Locator): Promise<number> =>
    parseCentsFromUsd((await loc.textContent()) ?? '');
  return {
    saleCents: await cents(locators.sale),
    tipCents: await cents(locators.tip),
    taxCents: await cents(locators.taxCollected),
    totalPaymentCents: await cents(locators.totalPayment),
  };
}

/** The Payment Details panel the app rendered, parsed to cents. */
export async function scrapePaymentDetailsPanel(locators: {
  card: Locator;
  cash: Locator;
  others: Locator;
  amountCollected: Locator;
  giftCardRedemption: Locator;
  totalPayment: Locator;
}): Promise<{
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
    cardCents: await cents(locators.card),
    cashCents: await cents(locators.cash),
    othersCents: await cents(locators.others),
    amountCollectedCents: await cents(locators.amountCollected),
    giftCardRedemptionCents: await cents(locators.giftCardRedemption),
    totalPaymentCents: await cents(locators.totalPayment),
  };
}
