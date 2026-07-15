import { formatUsdFromCents } from '@utils/moneyUtils';

export interface CompareRow {
  metric: string;
  computedCents: number;
  appCents: number | null;
}

export interface CompareGroup {
  feature: string;
  rows: CompareRow[];
}

export interface ComparePageData {
  reportDate: string;
  generatedAt: string;
  shop?: string;
  groups: CompareGroup[];
}

const usd = formatUsdFromCents;
const isMatch = (r: CompareRow): boolean => r.appCents !== null && r.computedCents === r.appCents;

/**
 * Render a "Computed vs App" accuracy report — one card per feature (Daily Sale
 * Report / Income Summary / Staff Income), each row showing the computed value,
 * the value read off the app screen, their difference, and a match badge.
 */
export const renderComparePage = (d: ComparePageData): string => {
  const allRows = d.groups.flatMap((g) => g.rows);
  const comparable = allRows.filter((r) => r.appCents !== null);
  const matched = comparable.filter(isMatch).length;
  const pct = comparable.length ? Math.round((matched / comparable.length) * 100) : 0;

  const groupHtml = d.groups
    .map((g) => {
      const gComparable = g.rows.filter((r) => r.appCents !== null);
      const gMatched = gComparable.filter(isMatch).length;
      const rows = g.rows
        .map((r) => {
          const match = isMatch(r);
          const diff = r.appCents === null ? null : r.computedCents - r.appCents;
          const badge =
            r.appCents === null
              ? '<span class="b b-na">n/a</span>'
              : match
                ? '<span class="b b-ok">match ✓</span>'
                : '<span class="b b-bad">differ ✗</span>';
          const diffTxt = diff === null ? '—' : diff === 0 ? '—' : usd(diff);
          return (
            `<tr class="${match ? '' : r.appCents === null ? '' : 'r-bad'}">` +
            `<td>${r.metric}</td><td class="num">${usd(r.computedCents)}</td>` +
            `<td class="num">${r.appCents === null ? '—' : usd(r.appCents)}</td>` +
            `<td class="num diff">${diffTxt}</td><td class="res">${badge}</td></tr>`
          );
        })
        .join('');
      return `<section class="card">
        <div class="card-head"><h2>${g.feature}</h2><span class="tag">${gMatched}/${gComparable.length} match</span></div>
        <div class="scroll"><table>
          <thead><tr><th>Metric</th><th class="num">Computed</th><th class="num">App</th><th class="num">Diff</th><th>Result</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </section>`;
    })
    .join('');

  const ok = matched === comparable.length;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Compare — Computed vs App · ${d.reportDate}</title>
<style>
  :root{--bg:#eef1f6;--surface:#fff;--ink:#0f172a;--muted:#64748b;--line:#e6eaf0;--primary:#5b54e6;--red:#dc2626;--green:#16a34a;
    --shadow:0 1px 2px rgba(16,24,40,.04),0 4px 16px rgba(16,24,40,.06)}
  *{box-sizing:border-box}
  body{font:14px/1.55 ui-sans-serif,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:var(--bg);color:var(--ink)}
  .wrap{max-width:920px;margin:0 auto;padding:28px 24px 48px}
  h1{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:0 0 4px}
  .meta{color:var(--muted);font-size:12px;margin-bottom:18px}
  .hero{display:flex;align-items:center;gap:16px;background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);padding:18px 22px;margin-bottom:20px}
  .score{font-size:34px;font-weight:800;letter-spacing:-.02em}
  .score .pct{color:${ok ? 'var(--green)' : 'var(--primary)'}}
  .bar{flex:1;height:10px;border-radius:999px;background:#eceff4;overflow:hidden}
  .bar>i{display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,#6366f1,#22c55e)}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);margin-bottom:18px;overflow:hidden}
  .card-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--line)}
  .card-head h2{font-size:16px;font-weight:800;margin:0}
  .tag{font-size:12px;font-weight:700;color:var(--muted);background:#f1f3f8;border-radius:999px;padding:4px 12px}
  table{width:100%;border-collapse:collapse}
  th,td{padding:11px 20px;text-align:left;border-bottom:1px solid var(--line)}
  tbody tr:last-child td{border-bottom:none}
  th{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;background:#fafbfd}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .diff{color:var(--muted)}
  tr.r-bad{background:#fff7f7}tr.r-bad .diff{color:var(--red);font-weight:700}
  .res{text-align:right}
  .b{font-size:12px;font-weight:700;padding:3px 10px;border-radius:7px;white-space:nowrap}
  .b-ok{background:#ecfdf3;color:#067647}.b-bad{background:#fef2f2;color:var(--red)}.b-na{background:#f1f3f8;color:var(--muted)}
  .scroll{overflow-x:auto}
</style></head><body><div class="wrap">
  <h1>Compare — Computed vs App</h1>
  <div class="meta">${d.shop ? `${d.shop} · ` : ''}${d.reportDate} · generated ${d.generatedAt}</div>
  <div class="hero">
    <div class="score"><span class="pct">${matched}/${comparable.length}</span> figures match</div>
    <div class="bar"><i></i></div>
    <div class="score" style="font-size:20px">${pct}%</div>
  </div>
  ${groupHtml}
</div></body></html>`;
};
