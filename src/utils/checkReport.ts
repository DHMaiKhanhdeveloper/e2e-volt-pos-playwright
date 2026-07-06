import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

/**
 * Shared reporting for "one big test per screen" functional suites.
 *
 * Mirrors the Home i18n scan contract: a single test runs every check as a
 * step, accumulates results here, then writes a self-contained HTML + JSON
 * report to reports/<slug>/ and (optionally) attaches the HTML to the run.
 *
 * The spec owns the run loop (test.step + try/catch) so it keeps access to
 * Playwright's `test`/`expect`; this module only models results and renders.
 */

export type CheckStatus = 'pass' | 'fail' | 'skip';

export interface CheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  /** One-line note: assertion detail, skip reason, or observed value. */
  detail?: string;
  /**
   * Optional screenshot of the screen when the check ran, as a self-contained
   * `data:image/...;base64,...` URI. Rendered as a clickable thumbnail in the
   * HTML report (mirrors the Home i18n scan's per-surface images). Stripped
   * from the JSON report to keep it lean.
   */
  shot?: string;
}

/**
 * Capture the current page as a compact base64 JPEG data URI, for embedding as
 * a thumbnail in the check report. Kept small (viewport-only, quality 55) so a
 * 10-case report stays a few hundred KB and fully self-contained.
 */
export const captureShot = async (page: Page): Promise<string | undefined> => {
  try {
    const buf = await page.screenshot({ type: 'jpeg', quality: 55 });
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
};

export interface CheckReportMeta {
  /** Display name, e.g. "Order Pending". */
  screen: string;
  /** Route under test, e.g. "/order-pending". */
  route: string;
  /** ISO timestamp — pass `new Date().toISOString()` from the spec. */
  generatedAt: string;
}

export interface CheckSummary {
  total: number;
  pass: number;
  fail: number;
  skip: number;
}

/** Thrown inside a check to record it as skipped (not failed). */
export class SkipCheck extends Error {}

export const summarize = (results: CheckResult[]): CheckSummary => ({
  total: results.length,
  pass: results.filter((r) => r.status === 'pass').length,
  fail: results.filter((r) => r.status === 'fail').length,
  skip: results.filter((r) => r.status === 'skip').length,
});

const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );

const BADGE: Record<CheckStatus, { label: string; bg: string; fg: string }> = {
  pass: { label: 'PASS', bg: '#dcfce7', fg: '#166534' },
  fail: { label: 'FAIL', bg: '#fee2e2', fg: '#991b1b' },
  skip: { label: 'SKIP', bg: '#fef9c3', fg: '#854d0e' },
};

/** Build a self-contained HTML report (inline CSS, no external assets). */
export const renderCheckReport = (results: CheckResult[], meta: CheckReportMeta): string => {
  const s = summarize(results);
  const hasShots = results.some((r) => r.shot);
  const rows = results
    .map((r) => {
      const b = BADGE[r.status];
      const shotCell = hasShots
        ? r.shot
          ? `<td class="shot"><a href="${r.shot}" target="_blank"><img loading="lazy" src="${r.shot}" alt="${escapeHtml(r.id)}"/></a></td>`
          : '<td class="shot noimg">—</td>'
        : '';
      return `<tr>
      <td class="id">${escapeHtml(r.id)}</td>
      <td>${escapeHtml(r.title)}</td>
      <td><span class="badge" style="background:${b.bg};color:${b.fg}">${b.label}</span></td>
      <td class="detail">${r.detail ? escapeHtml(r.detail) : ''}</td>
      ${shotCell}
    </tr>`;
    })
    .join('\n');
  const shotHeader = hasShots ? '<th>Ảnh</th>' : '';

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(meta.screen)} — Test report</title>
<style>
  :root { font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  body { margin: 0; background: #f8fafc; color: #0f172a; }
  header { padding: 24px 32px; background: #0f172a; color: #f8fafc; }
  header h1 { margin: 0 0 4px; font-size: 20px; }
  header .meta { font-size: 13px; opacity: .8; }
  .cards { display: flex; gap: 12px; padding: 20px 32px 0; flex-wrap: wrap; }
  .card { flex: 1 1 120px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
  .card .n { font-size: 26px; font-weight: 700; }
  .card .l { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
  .card.pass .n { color: #16a34a; } .card.fail .n { color: #dc2626; } .card.skip .n { color: #ca8a04; }
  table { width: calc(100% - 64px); margin: 20px 32px 40px; border-collapse: collapse; background: #fff;
          border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: top; }
  th { background: #f1f5f9; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #475569; }
  td.id { font-family: ui-monospace, monospace; white-space: nowrap; color: #334155; }
  td.detail { color: #64748b; font-size: 13px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  td.shot { width: 220px; }
  td.shot img { width: 200px; height: auto; border: 1px solid #e2e8f0; border-radius: 6px; display: block; cursor: zoom-in; }
  td.shot.noimg { color: #cbd5e1; text-align: center; }
</style></head>
<body>
  <header>
    <h1>${escapeHtml(meta.screen)} — Kết quả kiểm thử</h1>
    <div class="meta">Route <code>${escapeHtml(meta.route)}</code> · ${escapeHtml(meta.generatedAt)}</div>
  </header>
  <div class="cards">
    <div class="card"><div class="n">${s.total}</div><div class="l">Tổng</div></div>
    <div class="card pass"><div class="n">${s.pass}</div><div class="l">Pass</div></div>
    <div class="card fail"><div class="n">${s.fail}</div><div class="l">Fail</div></div>
    <div class="card skip"><div class="n">${s.skip}</div><div class="l">Skip</div></div>
  </div>
  <table>
    <thead><tr><th>ID</th><th>Tiêu đề</th><th>Trạng thái</th><th>Chi tiết</th>${shotHeader}</tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body></html>`;
};

/**
 * Write <slug>-scan.{html,json} under reports/<slug>/ and return their paths.
 * `slug` is the folder + file stem, e.g. "order-pending".
 */
export const writeCheckReport = (
  slug: string,
  results: CheckResult[],
  meta: CheckReportMeta,
): { html: string; htmlPath: string; jsonPath: string } => {
  const outDir = path.resolve('reports', slug);
  mkdirSync(outDir, { recursive: true });
  const html = renderCheckReport(results, meta);
  const htmlPath = path.join(outDir, `${slug}-scan.html`);
  const jsonPath = path.join(outDir, `${slug}-scan.json`);
  writeFileSync(htmlPath, html, 'utf8');
  // Strip the (large) base64 screenshots from the JSON — keep it lean. The
  // HTML report is where images live; JSON keeps a boolean marker instead.
  const leanResults = results.map(({ shot, ...r }) => ({ ...r, hasShot: !!shot }));
  writeFileSync(
    jsonPath,
    JSON.stringify({ ...meta, summary: summarize(results), results: leanResults }, null, 2),
    'utf8',
  );
  return { html, htmlPath, jsonPath };
};
