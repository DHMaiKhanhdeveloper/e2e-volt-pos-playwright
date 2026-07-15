import { formatUsdFromCents } from '@utils/moneyUtils';
import type { SectionsFromScrape } from '@domains/income/sectionsFromScrape';

export interface AppReportData {
  reportDate: string;
  generatedAt: string;
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
  /** Distinct products/services sold, with the supply fee looked up by name. */
  products: Array<{
    name: string;
    qty: number;
    revenueCents: number;
    unitSupplyFeeCents: number;
    totalSupplyCents: number;
    found: boolean;
  }>;
  /** Computed-vs-app comparison (null app = not found on the app screen). */
  comparison?: Array<{ metric: string; computedCents: number; appCents: number | null }>;
  sections: SectionsFromScrape;
}

const usd = formatUsdFromCents;
const money = (c: number): string => `<span class="money${c < 0 ? ' neg' : ''}">${usd(c)}</span>`;

/** A label-left / value-right detail row, like the app's Income/Payment panels. */
const detailRow = (label: string, c: number, strong = false): string =>
  `<div class="drow${strong ? ' strong' : ''}"><span>${label}</span>${money(c)}</div>`;

/**
 * Render today's scrape in the visual format of the app's two pages:
 * Daily Sale Report (stat cards + orders table + Income/Payment Details) and
 * Income Summary (Supply Fee / Staff Payout / Salon Earnings). All cents.
 */
export const renderAppStyleReport = (d: AppReportData): string => {
  const orderRows = d.orders
    .map(
      (o) =>
        `<tr><td class="code">${o.orderCode}</td><td class="num">${money(o.saleCents)}</td>` +
        `<td class="num">${money(o.tipCents)}</td><td class="num">${money(o.taxCents)}</td>` +
        `<td class="num">${money(o.totalCents)}</td></tr>`,
    )
    .join('');

  const sp = d.sections.staffPayout;
  const se = d.sections.salonEarnings;
  const sf = d.sections.supplyFee;

  const staffRows = d.sections.perStaff
    .map(
      (s) =>
        `<tr><td>${s.staff}</td><td>${s.compensationType}</td>` +
        `<td class="num">${s.serviceRatePct === null ? '—' : s.serviceRatePct + '%'}</td>` +
        `<td class="num">${money(s.serviceRevenueCents)}</td><td class="num">${money(s.supplyFeeCents)}</td>` +
        `<td class="num">${money(s.netServiceCents)}</td><td class="num">${money(s.commissionCents)}</td>` +
        `<td class="num">${money(s.tipCents)}</td><td class="num strong-cell">${money(s.commissionCents + s.tipCents)}</td>` +
        `<td class="num">${money(s.salonCommissionCents)}</td></tr>`,
    )
    .join('');

  const productRows = d.products
    .map(
      (p) =>
        `<tr><td>${p.name}${p.found ? '' : ' <span class="warn">(no supply fee)</span>'}</td>` +
        `<td class="num">${p.qty}</td><td class="num">${money(p.revenueCents)}</td>` +
        `<td class="num">${money(p.unitSupplyFeeCents)}</td><td class="num">${money(p.totalSupplyCents)}</td></tr>`,
    )
    .join('');
  const productSupplyTotal = d.products.reduce((a, p) => a + p.totalSupplyCents, 0);

  const cmp = d.comparison ?? [];
  const cmpRows = cmp
    .map((c) => {
      const same = c.appCents !== null && c.computedCents === c.appCents;
      const diff = c.appCents === null ? null : c.computedCents - c.appCents;
      const badge =
        c.appCents === null
          ? '<span class="b b-na">n/a</span>'
          : same
            ? '<span class="b b-ok">match ✓</span>'
            : '<span class="b b-bad">differ ✗</span>';
      return (
        `<tr><td>${c.metric}</td><td class="num">${money(c.computedCents)}</td>` +
        `<td class="num">${c.appCents === null ? '—' : money(c.appCents)}</td>` +
        `<td class="num">${diff === null || diff === 0 ? '—' : money(diff)}</td><td>${badge}</td></tr>`
      );
    })
    .join('');
  const cmpMatch = cmp.filter((c) => c.appCents !== null && c.computedCents === c.appCents).length;
  const cmpComparable = cmp.filter((c) => c.appCents !== null).length;

  const statCard = (label: string, value: string, desc: string, active = false): string =>
    `<div class="stat${active ? ' active' : ''}"><div class="stat-head">${label}</div><div class="stat-desc">${desc}</div><div class="stat-value">${value}</div></div>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Daily Sale Report &amp; Income Summary — ${d.reportDate}</title>
<style>
  :root{--primary:#4f46e5;--ink:#1f2330;--muted:#6b7280;--line:#eef0f3;--red:#c0392b;--bg:#f4f5f7}
  *{box-sizing:border-box}
  body{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:var(--bg);color:var(--ink)}
  .wrap{max-width:1120px;margin:24px auto;padding:0 16px}
  .page-title{font-size:24px;font-weight:800;margin:0}
  .date-badge{display:inline-block;border:1px solid #d1d5db;border-radius:8px;padding:6px 14px;font-weight:600;color:#374151;background:#fff;margin-left:12px;font-size:14px;vertical-align:middle}
  .sub{color:var(--muted);font-size:13px;margin:6px 0 18px}
  .section-title{font-size:18px;font-weight:800;margin:28px 0 14px;display:flex;align-items:center;gap:10px}
  .section-title::before{content:"";width:4px;height:20px;background:var(--primary);border-radius:2px}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}
  .stat{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px}
  .stat.active{border:2px solid var(--primary);background:#eef0ff}
  .stat-head{font-size:15px;font-weight:700}
  .stat-desc{font-size:11px;color:var(--muted);margin:4px 0 10px;min-height:28px}
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
  .warn{color:#b45309;font-size:11px}
  .b{font-size:12px;font-weight:700;padding:2px 8px;border-radius:6px}
  .b-ok{background:#e7f6ec;color:#1a7f37}.b-bad{background:#fdeaea;color:#b42318}.b-na{background:#eef0f3;color:#6b7280}
  .drow{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)}
  .drow.strong{font-weight:800;border-bottom:none;border-top:2px solid #d1d5db;margin-top:4px}
  .drow span:first-child{color:#374151}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
  .grid3 .card{margin-bottom:0}
  .scroll{overflow-x:auto}
  @media(max-width:900px){.stats{grid-template-columns:1fr 1fr}.cols{grid-template-columns:1fr}.grid3{grid-template-columns:1fr}}
</style></head><body><div class="wrap">

  <div><span class="page-title">Daily Sale Report</span><span class="date-badge">${d.reportDate}</span></div>
  <div class="sub">${d.orders.length} orders · generated ${d.generatedAt}</div>

  ${
    cmp.length
      ? `<div class="section-title">Compare — Computed vs App</div>
  <div class="card">
    <div class="sub" style="margin-top:0">${cmpMatch}/${cmpComparable} figures match the app screen</div>
    <div class="scroll"><table>
      <thead><tr><th>Metric</th><th class="num">Computed</th><th class="num">App</th><th class="num">Diff</th><th>Result</th></tr></thead>
      <tbody>${cmpRows}</tbody>
    </table></div>
  </div>`
      : ''
  }

  <div class="stats">
    ${statCard('Total Order', String(d.stat.totalOrderCount), 'Total number of order, excluding cancel/refunds/manual refunds')}
    ${statCard('Sale', usd(d.stat.saleCents), 'Total sale amount, after discount, excluding Tax and Tip', true)}
    ${statCard('Total tip', usd(d.stat.tipCents), 'Total tips received, not included in sales revenue')}
    ${statCard('Total Payment', usd(d.stat.totalPaymentCents), 'The final revenue including Gift Card Redemption')}
  </div>

  <div class="cols">
    <div class="card"><h2>Orders</h2>
      <div class="scroll"><table>
        <thead><tr><th>Order #</th><th class="num">Sale/Refund</th><th class="num">Tip</th><th class="num">Tax</th><th class="num">Total</th></tr></thead>
        <tbody>${orderRows}</tbody>
      </table></div>
    </div>
    <div>
      <div class="card"><h2>Income Details</h2>
        ${detailRow('Sale', d.incomeDetails.saleCents)}
        ${detailRow('Tip', d.incomeDetails.tipCents)}
        ${detailRow('Tax Collected', d.incomeDetails.taxCents)}
        ${detailRow('Total Payment', d.incomeDetails.totalPaymentCents, true)}
      </div>
      <div class="card"><h2>Payment Details</h2>
        ${detailRow('Card', d.paymentDetails.cardCents)}
        ${detailRow('Cash', d.paymentDetails.cashCents)}
        ${detailRow('Others', d.paymentDetails.othersCents)}
        ${detailRow('Amount Collected', d.paymentDetails.amountCollectedCents, true)}
        ${detailRow('Gift Card Redemption', d.paymentDetails.giftCardRedemptionCents)}
        ${detailRow('Total Payment', d.paymentDetails.totalPaymentCents, true)}
      </div>
    </div>
  </div>

  <div class="section-title">Income Summary</div>
  <div class="grid3">
    <div class="card"><h2>Supply Fee</h2>${detailRow('Total', sf.totalCents, true)}</div>
    <div class="card"><h2>Staff Payout</h2>
      ${detailRow('Total Service', sp.totalServiceCents)}
      ${detailRow('Supply Fee', sp.supplyFeeCents)}
      ${detailRow('Commission', sp.commissionCents)}
      ${detailRow('Tip', sp.tipCents)}
      ${detailRow('Total', sp.totalCents, true)}
    </div>
    <div class="card"><h2>Salon Earnings</h2>${detailRow('Service Commission', se.serviceCommissionCents, true)}</div>
  </div>

  <div class="section-title">Products</div>
  <div class="card"><h2>Products / services sold — supply fee looked up by name</h2>
    <div class="scroll"><table>
      <thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Revenue</th><th class="num">Unit Supply</th><th class="num">Total Supply</th></tr></thead>
      <tbody>${productRows}</tbody>
      <tfoot><tr class="strong"><td>Total Supply Fee</td><td class="num"></td><td class="num"></td><td class="num"></td><td class="num">${money(productSupplyTotal)}</td></tr></tfoot>
    </table></div>
  </div>

  <div class="section-title">Staff Income</div>
  <div class="card"><h2>Per staff — income = Commission + Tip · commission = (Service − Supply) × Rate%</h2>
    <div class="scroll"><table>
      <thead><tr><th>Staff</th><th>Type</th><th class="num">Rate</th><th class="num">Service</th><th class="num">Supply</th><th class="num">Net</th><th class="num">Commission</th><th class="num">Tip</th><th class="num">Income</th><th class="num">Salon Comm</th></tr></thead>
      <tbody>${staffRows}</tbody>
    </table></div>
  </div>

</div></body></html>`;
};
