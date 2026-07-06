import { formatUsdFromCents } from '@utils/moneyUtils';
import type { SectionsFromScrape } from '@utils/sectionsFromScrape';

const usd = formatUsdFromCents;
const money = (c: number): string => `<span class="money${c < 0 ? ' neg' : ''}">${usd(c)}</span>`;
const drow = (label: string, c: number, strong = false): string =>
  `<div class="drow${strong ? ' strong' : ''}"><span>${label}</span>${money(c)}</div>`;

/** Shared, self-contained CSS for the standalone report pages. */
const BASE_CSS = `
  :root{--primary:#4f46e5;--ink:#1f2330;--muted:#6b7280;--line:#eef0f3;--red:#c0392b;--bg:#f4f5f7}
  *{box-sizing:border-box}
  body{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:var(--bg);color:var(--ink)}
  .wrap{max-width:1080px;margin:24px auto;padding:0 16px}
  .page-title{font-size:24px;font-weight:800;margin:0}
  .date-badge{display:inline-block;border:1px solid #d1d5db;border-radius:8px;padding:6px 14px;font-weight:600;color:#374151;background:#fff;margin-left:12px;font-size:14px;vertical-align:middle}
  .sub{color:var(--muted);font-size:13px;margin:6px 0 18px}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}
  .stat{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px}
  .stat.active{border:2px solid var(--primary);background:#eef0ff}
  .stat-head{font-size:15px;font-weight:700}.stat-desc{font-size:11px;color:var(--muted);margin:4px 0 10px;min-height:28px}
  .stat-value{font-size:26px;font-weight:800}
  .cols{display:grid;grid-template-columns:1.3fr 1fr;gap:16px}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin-bottom:16px}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:0 0 12px}
  table{width:100%;border-collapse:collapse}
  th,td{padding:8px 10px;text-align:left;border-bottom:1px solid var(--line)}
  th{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.03em;background:#fafbff}
  td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
  .code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px}
  .money{font-variant-numeric:tabular-nums}.money.neg{color:var(--red)}
  td.strong-cell{font-weight:800;background:#fafbff}
  tr.strong td{font-weight:800;border-top:2px solid #d1d5db}
  .drow{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)}
  .drow.strong{font-weight:800;border-bottom:none;border-top:2px solid #d1d5db;margin-top:4px}
  .scroll{overflow-x:auto}
  table.vtop td{vertical-align:top}
  .dim{color:var(--muted)}
  .pin{font-size:10px;font-weight:700;background:#eef0ff;color:#4f46e5;border-radius:6px;padding:1px 6px;vertical-align:middle}
  .pin.warn{background:#fef3c7;color:#b45309}
  @media(max-width:900px){.stats{grid-template-columns:1fr 1fr}.cols{grid-template-columns:1fr}}
`;

const page = (title: string, body: string): string =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"/>` +
  `<meta name="viewport" content="width=device-width, initial-scale=1"/>` +
  `<title>${title}</title><style>${BASE_CSS}</style></head><body><div class="wrap">${body}</div></body></html>`;

// ───────────────────────────── Daily Sale Report ─────────────────────────────

export interface DailySaleReportData {
  reportDate: string;
  generatedAt: string;
  shop?: string;
  orders: Array<{
    orderCode: string;
    saleCents: number;
    tipCents: number;
    taxCents: number;
    totalCents: number;
  }>;
  stat: { totalOrderCount: number; saleCents: number; tipCents: number; totalPaymentCents: number };
  incomeDetails: {
    saleCents: number;
    tipCents: number;
    taxCents: number;
    totalPaymentCents: number;
  };
  paymentDetails: {
    cardCents: number;
    cashCents: number;
    othersCents: number;
    amountCollectedCents: number;
    giftCardRedemptionCents: number;
    totalPaymentCents: number;
  };
}

export const renderDailySaleReportPage = (d: DailySaleReportData): string => {
  const orderRows = d.orders
    .map(
      (o) =>
        `<tr><td class="code">${o.orderCode}</td><td class="num">${money(o.saleCents)}</td>` +
        `<td class="num">${money(o.tipCents)}</td><td class="num">${money(o.taxCents)}</td>` +
        `<td class="num">${money(o.totalCents)}</td></tr>`,
    )
    .join('');
  const stat = (label: string, value: string, desc: string, active = false): string =>
    `<div class="stat${active ? ' active' : ''}"><div class="stat-head">${label}</div><div class="stat-desc">${desc}</div><div class="stat-value">${value}</div></div>`;

  return page(
    `Daily Sale Report — ${d.reportDate}`,
    `<div><span class="page-title">Daily Sale Report</span><span class="date-badge">${d.reportDate}</span></div>
  <div class="sub">${d.shop ? `<b>${d.shop}</b> · ` : ''}${d.orders.length} orders · generated ${d.generatedAt}</div>
  <div class="stats">
    ${stat('Total Order', String(d.stat.totalOrderCount), 'Total number of order, excluding cancel/refunds/manual refunds')}
    ${stat('Sale', usd(d.stat.saleCents), 'Total sale amount, after discount, excluding Tax and Tip', true)}
    ${stat('Total tip', usd(d.stat.tipCents), 'Total tips received, not included in sales revenue')}
    ${stat('Total Payment', usd(d.stat.totalPaymentCents), 'The final revenue including Gift Card Redemption')}
  </div>
  <div class="cols">
    <div class="card"><h2>Orders</h2><div class="scroll"><table>
      <thead><tr><th>Order #</th><th class="num">Sale/Refund</th><th class="num">Tip</th><th class="num">Tax</th><th class="num">Total</th></tr></thead>
      <tbody>${orderRows}</tbody>
    </table></div></div>
    <div>
      <div class="card"><h2>Income Details</h2>
        ${drow('Sale', d.incomeDetails.saleCents)}${drow('Tip', d.incomeDetails.tipCents)}
        ${drow('Tax Collected', d.incomeDetails.taxCents)}${drow('Total Payment', d.incomeDetails.totalPaymentCents, true)}
      </div>
      <div class="card"><h2>Payment Details</h2>
        ${drow('Card', d.paymentDetails.cardCents)}${drow('Cash', d.paymentDetails.cashCents)}
        ${drow('Others', d.paymentDetails.othersCents)}${drow('Amount Collected', d.paymentDetails.amountCollectedCents, true)}
        ${drow('Gift Card Redemption', d.paymentDetails.giftCardRedemptionCents)}${drow('Total Payment', d.paymentDetails.totalPaymentCents, true)}
      </div>
    </div>
  </div>`,
  );
};

// ───────────────────────────── Data Input (raw scraped data) ─────────────────────────────

export interface DataInputData {
  reportDate: string;
  generatedAt: string;
  shop?: string;
  orders: Array<{
    orderCode: string;
    status: string | null;
    items: Array<{
      staff: string;
      name: string;
      priceCents: number;
      supplyFeeCents: number;
      product: unknown;
    }>;
    /** Per-order money breakdown (from the scraped Order Summary + DSR row). */
    summary: {
      supplyFeeCents: number;
      subtotalCents: number;
      discountCents: number;
      netSaleCents: number;
      saleCents: number;
      taxCents: number;
      tipCents: number;
      totalCents: number;
    };
  }>;
  compensation: Array<{
    staff: string;
    found: boolean;
    compensationType: string;
    serviceStaffPct: number | null;
    productStaffPct: number | null;
    giftCardStaffPct: number | null;
    cardFeeOnCommissionPct: number | null;
    cardFeeOnTipPct: number | null;
  }>;
  products: Array<{
    name: string;
    qty: number;
    revenueCents: number;
    unitSupplyFeeCents: number;
    totalSupplyCents: number;
    found: boolean;
  }>;
}

const pct = (v: number | null): string => (v === null ? '—' : `${v}%`);

export const renderDataInputPage = (d: DataInputData): string => {
  const orderRows = d.orders
    .map((o) => {
      const lineItems = (
        o.items.length
          ? o.items.map(
              (it) =>
                `${it.staff} · ${it.name} <b>${usd(it.priceCents)}</b>` +
                `${it.product ? ' <span class="pin">product</span>' : ''}`,
            )
          : ['<span class="dim">(no items)</span>']
      ).join('<br>');
      const supplyLines = (
        o.items.length
          ? o.items.map((it) => (it.supplyFeeCents ? money(it.supplyFeeCents) : '—'))
          : ['—']
      ).join('<br>');
      const s = o.summary;
      const disc = s.discountCents ? money(s.discountCents) : '—';
      return (
        `<tr><td class="code">${o.orderCode}</td><td>${o.status ?? ''}</td>` +
        `<td>${lineItems}</td><td class="num">${supplyLines}</td>` +
        `<td class="num">${money(s.subtotalCents)}</td><td class="num">${disc}</td>` +
        `<td class="num">${money(s.netSaleCents)}</td><td class="num strong-cell">${money(s.saleCents)}</td>` +
        `<td class="num">${money(s.taxCents)}</td><td class="num">${money(s.tipCents)}</td>` +
        `<td class="num strong-cell">${money(s.totalCents)}</td></tr>`
      );
    })
    .join('');

  const compRows = d.compensation
    .map(
      (c) =>
        `<tr><td>${c.staff}${c.found ? '' : ' <span class="pin warn">not found</span>'}</td>` +
        `<td>${c.compensationType}</td><td class="num">${pct(c.serviceStaffPct)}</td>` +
        `<td class="num">${pct(c.productStaffPct)}</td><td class="num">${pct(c.giftCardStaffPct)}</td>` +
        `<td class="num">${pct(c.cardFeeOnCommissionPct)}</td><td class="num">${pct(c.cardFeeOnTipPct)}</td></tr>`,
    )
    .join('');

  const prodRows = d.products
    .map(
      (p) =>
        `<tr><td>${p.name}${p.found ? '' : ' <span class="pin warn">no supply</span>'}</td>` +
        `<td class="num">${p.qty}</td><td class="num">${money(p.revenueCents)}</td>` +
        `<td class="num">${money(p.unitSupplyFeeCents)}</td><td class="num">${money(p.totalSupplyCents)}</td></tr>`,
    )
    .join('');

  return page(
    `Data Input — ${d.reportDate}`,
    `<div><span class="page-title">Data Input</span><span class="date-badge">${d.reportDate}</span></div>
  <div class="sub">${d.shop ? `<b>${d.shop}</b> · ` : ''}${d.orders.length} orders · ${d.compensation.length} staff · ${d.products.length} products · generated ${d.generatedAt}</div>

  <div class="card"><h2>Orders &amp; Items (scraped)</h2><div class="scroll"><table class="vtop">
    <thead><tr><th>Order #</th><th>Status</th><th>Line Items</th><th class="num">Supply Fee</th><th class="num">Subtotal</th><th class="num">Discount</th><th class="num">Net Sale</th><th class="num">Sale</th><th class="num">Tax</th><th class="num">Tip</th><th class="num">Order Total</th></tr></thead>
    <tbody>${orderRows}</tbody>
  </table></div></div>

  <div class="card"><h2>Staff Compensation (Settings)</h2><div class="scroll"><table>
    <thead><tr><th>Staff</th><th>Type</th><th class="num">Service%</th><th class="num">Product%</th><th class="num">GiftCard%</th><th class="num">Card·Comm%</th><th class="num">Card·Tip%</th></tr></thead>
    <tbody>${compRows}</tbody>
  </table></div></div>

  <div class="card"><h2>Products / Services (supply fee by name)</h2><div class="scroll"><table>
    <thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Revenue</th><th class="num">Unit Supply</th><th class="num">Total Supply</th></tr></thead>
    <tbody>${prodRows}</tbody>
  </table></div></div>`,
  );
};

// ───────────────────────────── Staff Income ─────────────────────────────

export interface StaffIncomeData {
  reportDate: string;
  generatedAt: string;
  shop?: string;
  sections: SectionsFromScrape;
}

export const renderStaffIncomePage = (d: StaffIncomeData): string => {
  const sp = d.sections.staffPayout;
  const rows = d.sections.perStaff
    .map(
      (s) =>
        `<tr><td>${s.staff}</td><td>${s.compensationType}</td>` +
        `<td class="num">${s.serviceRatePct === null ? '—' : s.serviceRatePct + '%'}</td>` +
        `<td class="num">${money(s.serviceRevenueCents)}</td><td class="num">${money(s.supplyFeeCents)}</td>` +
        `<td class="num">${money(s.netServiceCents)}</td><td class="num">${money(s.commissionCents)}</td>` +
        `<td class="num">${money(s.tipCents)}</td><td class="num strong-cell">${money(s.commissionCents + s.tipCents)}</td></tr>`,
    )
    .join('');

  return page(
    `Staff Income — ${d.reportDate}`,
    `<div><span class="page-title">Staff Income</span><span class="date-badge">${d.reportDate}</span></div>
  <div class="sub">${d.shop ? `<b>${d.shop}</b> · ` : ''}${d.sections.perStaff.length} staff · generated ${d.generatedAt}</div>
  <div class="stats">
    <div class="stat"><div class="stat-head">Total Service</div><div class="stat-value">${usd(sp.totalServiceCents)}</div></div>
    <div class="stat active"><div class="stat-head">Commission</div><div class="stat-value">${usd(sp.commissionCents)}</div></div>
    <div class="stat"><div class="stat-head">Tip</div><div class="stat-value">${usd(sp.tipCents)}</div></div>
    <div class="stat"><div class="stat-head">Total Income</div><div class="stat-value">${usd(sp.totalCents)}</div></div>
  </div>
  <div class="card"><h2>Per staff — income = Commission + Tip · commission = (Service − Supply) × Rate%</h2>
    <div class="scroll"><table>
      <thead><tr><th>Staff</th><th>Type</th><th class="num">Rate</th><th class="num">Service</th><th class="num">Supply</th><th class="num">Net</th><th class="num">Commission</th><th class="num">Tip</th><th class="num">Income</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`,
  );
};
