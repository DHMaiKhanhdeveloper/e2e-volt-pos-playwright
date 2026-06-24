/**
 * Structured data scraped from a Daily Sale Report "Order Details" dialog —
 * the per-order breakdown (staff, services, tips, refund) behind each row.
 * All amounts are integer cents; negative = refund/discount.
 */

export interface OrderService {
  staff: string;
  service: string;
  priceCents: number;
}

export interface OrderTip {
  staff: string;
  tipCents: number;
}

export interface OrderRefund {
  byStaff: string | null;
  method: string | null;
  reason: string | null;
}

export interface OrderDetail {
  orderCode: string;
  status: string | null;
  orderId: string | null;
  cashier: string | null;
  orderDate: string | null;
  customer: string | null;
  phone: string | null;
  summary: {
    subtotalCents: number;
    totalDiscountCents: number;
    taxCents: number;
    tipCents: number;
    totalCents: number;
  };
  /** Distinct staff that worked the order (from services + tips). */
  staff: string[];
  services: OrderService[];
  tips: OrderTip[];
  refund: OrderRefund | null;
}

/**
 * Parse an order's detail `innerText` (same layout in the Daily Sale Report
 * dialog and the Order History detail page) into a structured {@link OrderDetail}.
 * Sections: Order Information · Order Summary · Service Details (staff groups +
 * service lines, then per-staff tips) · Refund information.
 */
export const parseOrderDetailFromText = (text: string, orderCode: string): OrderDetail => {
  const parseUsd = (s: string | null): number => {
    if (!s) return 0;
    const neg = /-/.test(s);
    const n = parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
    return Math.round((neg ? -n : n) * 100);
  };
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

  const tipIdx = svc.search(/\nTip\nLast updated/);
  const servicesPart = tipIdx >= 0 ? svc.slice(0, tipIdx) : svc;
  const tipsPart = tipIdx >= 0 ? svc.slice(tipIdx) : '';

  const services: OrderService[] = [];
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

  const tips: OrderTip[] = [];
  const tipRe = /([^\n]+?)\s-\s(-?\$[\d.,]+)/g;
  let t: RegExpExecArray | null;
  while ((t = tipRe.exec(tipsPart)) !== null) {
    const name = t[1].trim();
    if (/^Last updated/.test(name) || name === 'Tip') continue;
    tips.push({ staff: name, tipCents: parseUsd(t[2]) });
    staffSet.add(name);
  }

  return {
    orderCode,
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
};

export interface StaffSummaryRow {
  staff: string;
  orders: string[];
  serviceCount: number;
  serviceTotalCents: number;
  tipTotalCents: number;
}

/** Roll the per-order details up per staff member, across all orders. */
export const summarizeStaff = (orders: OrderDetail[]): StaffSummaryRow[] => {
  const byStaff = new Map<string, StaffSummaryRow>();
  const get = (staff: string): StaffSummaryRow => {
    let row = byStaff.get(staff);
    if (!row) {
      row = { staff, orders: [], serviceCount: 0, serviceTotalCents: 0, tipTotalCents: 0 };
      byStaff.set(staff, row);
    }
    return row;
  };

  for (const o of orders) {
    for (const s of o.services) {
      const row = get(s.staff);
      if (!row.orders.includes(o.orderCode)) row.orders.push(o.orderCode);
      row.serviceCount += 1;
      row.serviceTotalCents += s.priceCents;
    }
    for (const t of o.tips) {
      const row = get(t.staff);
      if (!row.orders.includes(o.orderCode)) row.orders.push(o.orderCode);
      row.tipTotalCents += t.tipCents;
    }
  }

  return [...byStaff.values()];
};
