/**
 * Render the app's Income Summary screen as a polished, self-contained HTML page
 * — a left overview (filter bar, hero Total Income, comparison badge, legend, a
 * bar chart) and a right detail panel mirroring the app's sections (Payment
 * Details, Sale Details, Supply Fee, Staff Payout, Salon Earnings). Detail rows
 * are scraped from the live panel and keep a `bold` flag (the app bolds category
 * rows, sub-rows are lighter); we mirror that with weight + indentation.
 */

export interface IsRow {
  label: string;
  value: string;
  bold: boolean;
}

export interface IsSection {
  title: string;
  rows: IsRow[];
}

export interface IncomeSummaryUiData {
  reportDate: string;
  generatedAt: string;
  shop?: string;
  totalIncomeText: string;
  legend: { grossIncome: string; netIncome: string; totalTip: string };
  comparePercent?: string;
  compareLabel?: string;
  sections: IsSection[];
}

const isNeg = (v: string): boolean => v.trim().startsWith('-');
const toNum = (v: string): number => Math.abs(parseFloat((v || '').replace(/[^0-9.-]/g, '')) || 0);

/** A faint emoji glyph per section, for a touch of visual hierarchy. */
const SECTION_ICON: Record<string, string> = {
  'Payment Details': '💳',
  'Sale Details': '🧾',
  'Supply Fee': '📦',
  'Staff Payout': '👥',
  'Salon Earnings': '🏛️',
};

const rowHtml = (r: IsRow): string =>
  `<div class="row ${r.bold ? 'main' : 'sub'}"><span class="lbl">${r.label}</span>` +
  `<span class="val${isNeg(r.value) ? ' neg' : ''}">${r.value}</span></div>`;

export const renderIncomeSummaryUi = (d: IncomeSummaryUiData): string => {
  const sectionsHtml = d.sections
    .map(
      (s) =>
        `<section class="sec"><h3 class="sec-title"><span class="sec-ico">${SECTION_ICON[s.title] ?? '•'}</span>${s.title}</h3>` +
        `<div class="sec-body">${s.rows.map(rowHtml).join('')}</div></section>`,
    )
    .join('');

  const g = toNum(d.legend.grossIncome);
  const n = toNum(d.legend.netIncome);
  const t = toNum(d.legend.totalTip);
  const max = Math.max(g, n, t, 1);
  const barH = (v: number): number => Math.round((v / max) * 150) + 4;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Income Summary — ${d.reportDate}</title>
<style>
  :root{
    --bg:#eef1f6;--surface:#fff;--ink:#0f172a;--muted:#64748b;--faint:#94a3b8;
    --line:#eef1f5;--line-2:#e6eaf0;--primary:#5b54e6;--primary-50:#eef0ff;
    --grad-a:#6366f1;--grad-b:#8b5cf6;--sky:#0ea5e9;--green:#16a34a;--red:#dc2626;
    --shadow:0 1px 2px rgba(16,24,40,.04),0 4px 16px rgba(16,24,40,.06);
    --radius:18px;
  }
  *{box-sizing:border-box}
  body{font:14px/1.55 ui-sans-serif,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:
    radial-gradient(1200px 400px at 80% -10%,#e7e9ff 0,rgba(231,233,255,0) 60%),var(--bg);color:var(--ink);
    -webkit-font-smoothing:antialiased}
  .wrap{max-width:1180px;margin:0 auto;padding:28px 24px 48px}
  .appbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
  .appbar h1{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:0}
  .appbar .meta{color:var(--muted);font-size:12px}
  .grid{display:grid;grid-template-columns:minmax(380px,1fr) 1.05fr;gap:22px;align-items:start}

  .card{background:var(--surface);border:1px solid var(--line-2);border-radius:var(--radius);box-shadow:var(--shadow)}
  .pad{padding:22px}

  /* filter bar */
  .filters{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px}
  .pill{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line-2);background:#fff;border-radius:11px;padding:9px 14px;font-weight:600;color:#334155;font-size:13px}
  .seg{display:inline-flex;background:#f1f3f8;border-radius:11px;padding:3px}
  .seg span{padding:7px 15px;font-weight:700;color:var(--faint);border-radius:8px;font-size:13px}
  .seg span.on{background:#fff;color:var(--primary);box-shadow:0 1px 2px rgba(16,24,40,.08)}

  /* hero */
  .ti-label{font-size:13px;font-weight:600;color:var(--muted)}
  .ti-value{font-size:46px;font-weight:800;letter-spacing:-.03em;margin:4px 0 12px;line-height:1;
    background:linear-gradient(90deg,var(--ink),#334155);-webkit-background-clip:text;background-clip:text}
  .ti-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .badge{display:inline-flex;align-items:center;gap:5px;background:#fef2f2;color:var(--red);font-weight:700;border-radius:999px;padding:5px 12px;font-size:13px}
  .badge.up{background:#ecfdf3;color:#067647}
  .cmp-label{color:var(--muted);font-size:12px;max-width:180px}

  .legend{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}
  .leg{border:1px solid var(--line-2);border-radius:12px;padding:11px 13px;background:#fbfcfe}
  .leg .top{display:flex;align-items:center;gap:7px;color:var(--muted);font-size:12px;font-weight:600}
  .leg .dot{width:9px;height:9px;border-radius:50%}
  .leg b{display:block;color:var(--ink);font-size:16px;font-weight:800;margin-top:5px;letter-spacing:-.01em}
  .d1{background:var(--grad-a)}.d2{background:var(--sky)}.d3{background:var(--green)}

  /* chart */
  .chart-wrap{margin-top:20px;padding-top:8px}
  .chart{display:flex;align-items:flex-end;justify-content:space-around;gap:24px;height:184px;
    border-bottom:1px solid var(--line-2);padding:0 6px;position:relative}
  .bar{width:64px;border-radius:9px 9px 0 0;position:relative;transition:filter .2s}
  .bar.b1{background:linear-gradient(180deg,#7c79f4,#5b54e6)}
  .bar.b2{background:linear-gradient(180deg,#38bdf8,#0ea5e9)}
  .bar.b3{background:linear-gradient(180deg,#4ade80,#16a34a)}
  .bar .cap{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:12px;font-weight:800;white-space:nowrap;color:#1f2937}
  .xlabels{display:flex;justify-content:space-around;gap:24px;margin-top:8px}
  .xlabels span{width:64px;text-align:center;font-size:11px;color:var(--muted);font-weight:600}

  /* right panel */
  .panel-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--line)}
  .panel-head h2{font-size:18px;font-weight:800;margin:0;letter-spacing:-.01em}
  .print{display:inline-flex;align-items:center;gap:7px;background:var(--primary);color:#fff;border:none;border-radius:11px;padding:9px 16px;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(91,84,230,.35)}
  .panel{max-height:78vh;overflow:auto;padding:6px 22px 18px}
  .panel::-webkit-scrollbar{width:8px}.panel::-webkit-scrollbar-thumb{background:#dfe3ea;border-radius:8px}

  .sec{padding:14px 0}
  .sec+.sec{border-top:1px dashed var(--line-2)}
  .sec-title{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:4px 0 8px}
  .sec-ico{font-size:14px}
  .row{display:flex;justify-content:space-between;align-items:center;padding:9px 10px;border-radius:9px}
  .row:hover{background:#f7f8fc}
  .row.main{font-weight:700}
  .row.main .val{font-weight:800}
  .row.sub{color:#475569}
  .row.sub .lbl{padding-left:18px;position:relative}
  .row.sub .lbl::before{content:"";position:absolute;left:6px;top:50%;width:6px;height:1px;background:#cbd5e1;transform:translateY(-50%)}
  .val{font-variant-numeric:tabular-nums}.val.neg{color:var(--red)}

  @media(max-width:900px){.grid{grid-template-columns:1fr}.ti-value{font-size:38px}}
</style></head><body><div class="wrap">

  <div class="appbar">
    <h1>Income Summary</h1>
    <div class="meta">${d.shop ? `${d.shop} · ` : ''}${d.reportDate} · generated ${d.generatedAt}</div>
  </div>

  <div class="grid">
    <div>
      <div class="card pad">
        <div class="filters">
          <span class="pill">Today <span style="color:var(--faint)">▾</span></span>
          <span class="pill">📅 ${d.reportDate}</span>
          <span class="seg"><span class="on">Day</span><span>Week</span><span>Month</span></span>
        </div>
        <div class="ti-label">Total Income · ${d.reportDate}</div>
        <div class="ti-value">${d.totalIncomeText}</div>
        <div class="ti-row">
          ${d.comparePercent ? `<span class="badge up">↗ ${d.comparePercent}</span>` : ''}
          ${d.compareLabel ? `<span class="cmp-label">${d.compareLabel}</span>` : ''}
        </div>
        <div class="legend">
          <div class="leg"><div class="top"><span class="dot d1"></span>Gross Income</div><b>${d.legend.grossIncome}</b></div>
          <div class="leg"><div class="top"><span class="dot d2"></span>Net Income</div><b>${d.legend.netIncome}</b></div>
          <div class="leg"><div class="top"><span class="dot d3"></span>Total tip</div><b>${d.legend.totalTip}</b></div>
        </div>
        <div class="chart-wrap">
          <div class="chart">
            <div class="bar b1" style="height:${barH(g)}px"><span class="cap">${d.legend.grossIncome}</span></div>
            <div class="bar b2" style="height:${barH(n)}px"><span class="cap">${d.legend.netIncome}</span></div>
            <div class="bar b3" style="height:${barH(t)}px"><span class="cap">${d.legend.totalTip}</span></div>
          </div>
          <div class="xlabels"><span>Gross</span><span>Net</span><span>Tip</span></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="panel-head"><h2>${d.reportDate}</h2><button class="print">🖨 Print</button></div>
      <div class="panel">${sectionsHtml}</div>
    </div>
  </div>
</div></body></html>`;
};
