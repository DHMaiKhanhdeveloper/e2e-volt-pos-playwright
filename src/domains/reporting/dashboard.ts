import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CheckResult, CheckReportMeta } from '@domains/reporting/checkReport';
import { summarize } from '@domains/reporting/checkReport';

/**
 * Gallery-style dashboard for a "one big test per screen" suite: a card per
 * check (screenshot + status + detail) instead of the table view in
 * checkReport.ts, with client-side All/Pass/Fail/Skip filter tabs.
 *
 * Kept as a separate renderer (not a mode of renderCheckReport) because the
 * card grid and the compact table serve different reading modes — table for
 * scanning every row fast, dashboard for eyeballing screenshots.
 */

const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );

const STATUS_META: Record<CheckResult['status'], { label: string; color: string }> = {
  pass: { label: 'Pass', color: '#22c55e' },
  fail: { label: 'Fail', color: '#ef4444' },
  skip: { label: 'Skip', color: '#eab308' },
};

export const renderDashboard = (results: CheckResult[], meta: CheckReportMeta): string => {
  const s = summarize(results);
  const passRate = s.total ? Math.round((s.pass / s.total) * 100) : 0;

  const cards = results
    .map((r) => {
      const m = STATUS_META[r.status];
      const img = r.shot
        ? `<a class="thumb" href="${r.shot}" target="_blank"><img loading="lazy" src="${r.shot}" alt="${escapeHtml(r.id)}"/></a>`
        : `<div class="thumb noimg">Không có ảnh</div>`;
      return `<article class="card" data-status="${r.status}">
        ${img}
        <div class="body">
          <div class="row-top">
            <span class="id">${escapeHtml(r.id)}</span>
            <span class="badge" style="--c:${m.color}">${m.label}</span>
          </div>
          <div class="title">${escapeHtml(r.title)}</div>
          ${r.detail ? `<div class="detail">${escapeHtml(r.detail)}</div>` : ''}
        </div>
      </article>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(meta.screen)} — Dashboard</title>
<style>
  :root { color-scheme: light dark; font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  body { margin: 0; background: #0b1220; color: #e2e8f0; }
  header { padding: 28px 32px 20px; background: linear-gradient(135deg,#0f172a,#1e293b); border-bottom: 1px solid #1e293b; }
  header h1 { margin: 0 0 4px; font-size: 22px; }
  header .meta { font-size: 13px; color: #94a3b8; }
  .stats { display: flex; gap: 14px; padding: 20px 32px 4px; flex-wrap: wrap; }
  .stat { flex: 1 1 130px; background: #111a2e; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 18px; }
  .stat .n { font-size: 28px; font-weight: 700; }
  .stat .l { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; }
  .stat.pass .n { color: #22c55e; } .stat.fail .n { color: #ef4444; } .stat.skip .n { color: #eab308; }
  .stat.rate .n { color: #38bdf8; }
  .tabs { display: flex; gap: 8px; padding: 18px 32px 4px; }
  .tab { cursor: pointer; padding: 6px 16px; border-radius: 999px; border: 1px solid #1e293b; background: #111a2e; color: #cbd5e1; font-size: 13px; }
  .tab.active { background: #38bdf8; color: #0b1220; border-color: #38bdf8; font-weight: 700; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; padding: 20px 32px 48px; }
  .card { background: #111a2e; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
  .card.hide { display: none; }
  .thumb { display: block; aspect-ratio: 16/10; background: #0b1220; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; cursor: zoom-in; }
  .thumb.noimg { display: flex; align-items: center; justify-content: center; color: #475569; font-size: 12px; }
  .body { padding: 12px 14px 16px; display: flex; flex-direction: column; gap: 6px; }
  .row-top { display: flex; justify-content: space-between; align-items: center; }
  .id { font-family: ui-monospace, monospace; font-size: 11px; color: #94a3b8; }
  .badge { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: color-mix(in srgb, var(--c) 22%, transparent); color: var(--c); }
  .title { font-size: 14px; line-height: 1.4; color: #e2e8f0; }
  .detail { font-size: 12px; color: #64748b; line-height: 1.4; }
</style></head>
<body>
  <header>
    <h1>${escapeHtml(meta.screen)} — Dashboard kết quả</h1>
    <div class="meta">Route <code>${escapeHtml(meta.route)}</code> · ${escapeHtml(meta.generatedAt)}</div>
  </header>
  <div class="stats">
    <div class="stat"><div class="n">${s.total}</div><div class="l">Tổng số case</div></div>
    <div class="stat pass"><div class="n">${s.pass}</div><div class="l">Pass</div></div>
    <div class="stat fail"><div class="n">${s.fail}</div><div class="l">Fail</div></div>
    <div class="stat skip"><div class="n">${s.skip}</div><div class="l">Skip</div></div>
    <div class="stat rate"><div class="n">${passRate}%</div><div class="l">Tỷ lệ pass</div></div>
  </div>
  <div class="tabs">
    <div class="tab active" data-filter="all">Tất cả (${s.total})</div>
    <div class="tab" data-filter="pass">Pass (${s.pass})</div>
    <div class="tab" data-filter="fail">Fail (${s.fail})</div>
    <div class="tab" data-filter="skip">Skip (${s.skip})</div>
  </div>
  <div class="grid" id="grid">
${cards}
  </div>
  <script>
    const tabs = document.querySelectorAll('.tab');
    const cards = document.querySelectorAll('.card');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const f = tab.dataset.filter;
        cards.forEach((c) => {
          c.classList.toggle('hide', f !== 'all' && c.dataset.status !== f);
        });
      });
    });
  </script>
</body></html>`;
};

/** Write the dashboard under reports/<slug>/dashboard/. */
export const writeDashboard = (
  slug: string,
  results: CheckResult[],
  meta: CheckReportMeta,
): { html: string; htmlPath: string } => {
  const outDir = path.resolve('reports', slug, 'dashboard');
  mkdirSync(outDir, { recursive: true });
  const html = renderDashboard(results, meta);
  const htmlPath = path.join(outDir, 'index.html');
  writeFileSync(htmlPath, html, 'utf8');
  return { html, htmlPath };
};
