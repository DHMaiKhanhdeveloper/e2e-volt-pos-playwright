import { formatUsdFromCents } from '@utils/moneyUtils';
import type { SectionsFromScrape } from '@utils/sectionsFromScrape';

export interface IncomeSummaryHtmlData {
  reportDate: string;
  generatedAt: string;
  orderCount: number;
  staffCount: number;
  foundCount: number;
  totals: { netSaleCents: number; tipCents: number; taxCents: number; totalPaymentCents: number };
  app: { saleCents: number; tipCents: number; taxCents: number; totalPaymentCents: number };
  sections: SectionsFromScrape;
}

const usd = formatUsdFromCents;
const cls = (c: number): string => (c < 0 ? ' class="neg"' : '');

const kvRows = (rows: Array<[string, number, boolean?]>): string =>
  rows
    .map(
      ([l, c, strong]) =>
        `<tr class="${strong ? 'strong' : ''}"><td>${l}</td><td class="num"${cls(c)}>${usd(c)}</td></tr>`,
    )
    .join('');

/**
 * Render the full Income Summary (totals + Supply Fee / Staff Payout / Salon
 * Earnings, with the per-staff commission derivation) as a self-contained HTML
 * page. All amounts are cents in; rendered as USD.
 */
export const renderIncomeSummaryHtml = (d: IncomeSummaryHtmlData): string => {
  const t = d.totals;
  const a = d.app;
  const totalsRows: Array<[string, number, number]> = [
    ['Net Sale', a.saleCents, t.netSaleCents],
    ['Tip', a.tipCents, t.tipCents],
    ['Tax', a.taxCents, t.taxCents],
    ['Total Payment', a.totalPaymentCents, t.totalPaymentCents],
  ];
  const totalsHtml = totalsRows
    .map(([l, app, calc]) => {
      const ok = app === calc;
      return `<tr><td>${l}</td><td class="num"${cls(app)}>${usd(app)}</td><td class="num"${cls(calc)}>${usd(calc)}</td><td class="mark ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'}</td></tr>`;
    })
    .join('');
  const totalsMatch = totalsRows.every(([, x, y]) => x === y);

  const sp = d.sections.staffPayout;
  const se = d.sections.salonEarnings;
  const sf = d.sections.supplyFee;

  const perStaffHtml = d.sections.perStaff
    .map(
      (s) =>
        `<tr><td>${s.staff}</td><td>${s.compensationType}</td>` +
        `<td class="num">${s.serviceRatePct === null ? '—' : s.serviceRatePct + '%'}</td>` +
        `<td class="num"${cls(s.serviceRevenueCents)}>${usd(s.serviceRevenueCents)}</td>` +
        `<td class="num"${cls(s.supplyFeeCents)}>${usd(s.supplyFeeCents)}</td>` +
        `<td class="num"${cls(s.netServiceCents)}>${usd(s.netServiceCents)}</td>` +
        `<td class="num"${cls(s.commissionCents)}>${usd(s.commissionCents)}</td>` +
        `<td class="num"${cls(s.salonCommissionCents)}>${usd(s.salonCommissionCents)}</td>` +
        `<td class="num"${cls(s.tipCents)}>${usd(s.tipCents)}</td></tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Income Summary — ${d.reportDate}</title>
<style>
  body{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#f4f5f7;color:#1f2330}
  .wrap{max-width:1040px;margin:24px auto;padding:0 16px}
  h1{font-size:20px;margin:0 0 4px}.meta{color:#6b7280;font-size:13px;margin-bottom:16px}
  .banner{padding:10px 16px;border-radius:8px;font-weight:600;margin:16px 0}
  .banner.ok{background:#e7f6ec;color:#1a7f37;border:1px solid #aedcbb}
  .banner.bad{background:#fdeaea;color:#b42318;border:1px solid #f1b0aa}
  .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
  .tile{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px}
  .tile-label{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.03em}
  .tile-value{font-size:20px;font-weight:700;margin-top:6px}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:16px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
  .grid .card{margin-bottom:0}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;margin:0 0 12px}
  table{width:100%;border-collapse:collapse}th,td{padding:6px 10px;text-align:left;border-bottom:1px solid #eef0f3}
  th{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.03em}
  .num,th.num{text-align:right;font-variant-numeric:tabular-nums}.neg{color:#c0392b}
  tr.strong td{font-weight:700}
  .mark{text-align:center;font-weight:700}.mark.ok{color:#1a7f37}.mark.bad{color:#b42318}
  .scroll{overflow-x:auto}
  @media(max-width:820px){.tiles{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
  <h1>Income Summary <span style="font-size:13px;font-weight:400;color:#6b7280">— ${d.reportDate}</span></h1>
  <div class="meta">${d.orderCount} orders · ${d.staffCount} staff (${d.foundCount} with compensation) · generated ${d.generatedAt}</div>

  <div class="banner ${totalsMatch ? 'ok' : 'bad'}">${totalsMatch ? 'TOTALS MATCH ✓ — computed equals the app' : 'TOTALS MISMATCH ✗'} · sections derived from compensation for ${d.sections.matchedStaff} staff</div>

  <div class="tiles">
    <div class="tile"><div class="tile-label">Net Sale</div><div class="tile-value${cls(t.netSaleCents)}">${usd(t.netSaleCents)}</div></div>
    <div class="tile"><div class="tile-label">Tip</div><div class="tile-value${cls(t.tipCents)}">${usd(t.tipCents)}</div></div>
    <div class="tile"><div class="tile-label">Tax</div><div class="tile-value${cls(t.taxCents)}">${usd(t.taxCents)}</div></div>
    <div class="tile"><div class="tile-label">Total Payment</div><div class="tile-value${cls(t.totalPaymentCents)}">${usd(t.totalPaymentCents)}</div></div>
  </div>

  <div class="card"><h2>Totals — App vs Computed (from orders)</h2>
    <table><thead><tr><th>Field</th><th class="num">App</th><th class="num">Computed</th><th class="mark">Match</th></tr></thead><tbody>${totalsHtml}</tbody></table>
  </div>

  <div class="grid">
    <div class="card"><h2>Supply Fee</h2><table><tbody>${kvRows([['Total', sf.totalCents, true]])}</tbody></table></div>
    <div class="card"><h2>Staff Payout</h2><table><tbody>${kvRows([
      ['Total Service', sp.totalServiceCents],
      ['Supply Fee', sp.supplyFeeCents],
      ['Commission', sp.commissionCents],
      ['Tip', sp.tipCents],
      ['Total', sp.totalCents, true],
    ])}</tbody></table></div>
    <div class="card"><h2>Salon Earnings</h2><table><tbody>${kvRows([['Service Commission', se.serviceCommissionCents, true]])}</tbody></table></div>
  </div>

  <div class="card"><h2>Per-staff — commission = (Service − Supply) × Rate%</h2>
    <div class="scroll"><table>
      <thead><tr><th>Staff</th><th>Type</th><th class="num">Rate</th><th class="num">Service</th><th class="num">Supply</th><th class="num">Net</th><th class="num">Commission</th><th class="num">Salon Comm</th><th class="num">Tip</th></tr></thead>
      <tbody>${perStaffHtml}</tbody>
    </table></div>
  </div>
</div></body></html>`;
};
