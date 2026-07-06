#!/usr/bin/env node
/**
 * Build a per-screen reports dashboard → reports/index.html.
 *
 * Scans reports/<screen>/ folders for their report files and renders a single
 * self-contained page grouping every report BY SCREEN, then BY FUNCTION
 * (Functional suite / i18n compare / i18n deep-scan). Cross-screen sweeps that
 * live in reports/i18n-audit/ (auto-scan, incomes group scan) get their own
 * section.
 *
 * Durable: re-run any time to refresh — `node scripts/build-reports-index.mjs`.
 * It reads whatever is on disk; it never runs tests.
 */
import { readdirSync, readFileSync, existsSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';

const REPORTS = path.resolve('reports');
// Playwright-native + cross-screen folders are not "screens".
const NATIVE = new Set(['html', 'json', 'junit', 'allure-results', 'i18n-audit']);

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};

/** Classify a report by its JSON shape and return {kind, label, metrics[]}. */
const classify = (json) => {
  if (!json) return { kind: 'unknown', label: 'Report', metrics: [] };
  const s = json.summary ?? {};
  // Functional suite (checkReport): summary has pass/fail/skip.
  if (typeof s.pass === 'number') {
    return {
      kind: 'suite',
      label: 'Kiểm thử chức năng',
      metrics: [
        ['pass', s.pass],
        ['fail', s.fail],
        ['skip', s.skip],
      ],
    };
  }
  // i18n EN↔VI compare: summary has missing/suspect/ok.
  if (typeof s.missing === 'number' || typeof s.ok === 'number') {
    return {
      kind: 'compare',
      label: 'i18n EN↔VI',
      metrics: [
        ['chưa dịch', s.missing ?? 0],
        ['sai chuẩn', s.suspect ?? 0],
        ['đúng', s.ok ?? 0],
      ],
    };
  }
  // i18n deep-scan: top-level scanned/untranslatedCount.
  if (typeof json.untranslatedCount === 'number' || typeof json.scanned === 'number') {
    return {
      kind: 'deepscan',
      label: 'i18n deep-scan',
      metrics: [
        ['bề mặt', json.scanned ?? 0],
        ['chưa dịch', json.untranslatedCount ?? 0],
      ],
    };
  }
  return { kind: 'unknown', label: 'Report', metrics: [] };
};

/** Collect {html, json, meta} report entries in a folder. */
const collectReports = (dir) => {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.html')) continue;
    const stem = name.slice(0, -'.html'.length);
    const jsonPath = path.join(dir, `${stem}.json`);
    const json = existsSync(jsonPath) ? readJson(jsonPath) : null;
    const info = classify(json);
    // Doc HTML twins (from md-to-html.mjs) have no JSON — label them by filename.
    if (info.kind === 'unknown') {
      const DOC = {
        'feature-spec': 'Feature spec',
        testcases: 'Test cases',
        'flow-map': 'Luồng code-gen (map)',
        'flow-detail': 'Luồng code-gen (chi tiết)',
        'i18n-result': 'i18n kết quả (kèm ảnh)',
      };
      if (DOC[stem]) {
        info.kind = 'doc';
        info.label = DOC[stem];
      }
    }
    out.push({
      htmlRel: path.relative(REPORTS, path.join(dir, name)).replace(/\\/g, '/'),
      stem,
      generatedAt: json?.generatedAt ?? null,
      ...info,
    });
  }
  // Suite first, then compare, deep-scan, docs, then anything else.
  const order = { suite: 0, compare: 1, deepscan: 2, doc: 3, unknown: 4 };
  return out.sort((a, b) => order[a.kind] - order[b.kind]);
};

const badge = (label, n) => {
  const bad =
    (/chưa dịch|fail|sai chuẩn/.test(label) && n > 0) || (label === 'fail' && n > 0);
  const good = /đúng|pass/.test(label) && n > 0;
  const bg = bad ? '#fee2e2' : good ? '#dcfce7' : '#f1f5f9';
  const fg = bad ? '#991b1b' : good ? '#166534' : '#475569';
  return `<span class="m" style="background:${bg};color:${fg}">${esc(label)}: <b>${n}</b></span>`;
};

const reportCard = (r) =>
  `<a class="rc" href="${esc(r.htmlRel)}" target="_blank">
    <div class="rc-h"><span class="tag tag-${r.kind}">${esc(r.label)}</span></div>
    <div class="rc-f">${esc(r.stem)}.html</div>
    <div class="rc-m">${r.metrics.map(([l, n]) => badge(l, n)).join(' ')}</div>
    ${r.generatedAt ? `<div class="rc-t">${esc(r.generatedAt)}</div>` : ''}
  </a>`;

const section = (title, subtitle, reports) =>
  !reports.length
    ? ''
    : `<section class="scr">
      <h2>${esc(title)}${subtitle ? ` <span class="rt">${esc(subtitle)}</span>` : ''}</h2>
      <div class="cards">${reports.map(reportCard).join('\n')}</div>
    </section>`;

// --- gather screens ---
const entries = readdirSync(REPORTS).filter((n) => {
  const full = path.join(REPORTS, n);
  return statSync(full).isDirectory() && !NATIVE.has(n);
});
entries.sort();

const screenSections = entries
  .map((screen) => {
    const reports = collectReports(path.join(REPORTS, screen));
    const routeGuess = reports.find((r) => r)?.stem ?? screen;
    return section(screen, `/${screen.replace(/-/g, '-')}`, reports);
  })
  .join('\n');

// --- cross-screen sweeps in i18n-audit ---
const auditDir = path.join(REPORTS, 'i18n-audit');
let crossSection = '';
if (existsSync(auditDir)) {
  const cross = collectReports(auditDir).filter((r) =>
    /^(auto-scan|incomes-scan)$/.test(r.stem),
  );
  crossSection = section('Cross-screen (i18n-audit)', 'quét nhiều màn', cross);
}

const generatedAt = new Date().toISOString();
const totalReports =
  entries.reduce((n, s) => n + collectReports(path.join(REPORTS, s)).length, 0) +
  (existsSync(auditDir)
    ? collectReports(auditDir).filter((r) => /^(auto-scan|incomes-scan)$/.test(r.stem)).length
    : 0);

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>VOLT POS — Reports dashboard</title>
<style>
  :root { font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  body { margin: 0; background: #f8fafc; color: #0f172a; }
  header { padding: 24px 32px; background: #0f172a; color: #f8fafc; }
  header h1 { margin: 0 0 4px; font-size: 20px; }
  header .meta { font-size: 13px; opacity: .8; }
  .scr { padding: 8px 32px 4px; }
  .scr h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .05em; color: #334155;
            border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 22px 0 12px; }
  .scr h2 .rt { font-size: 12px; color: #94a3b8; text-transform: none; letter-spacing: 0; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .rc { display: block; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
        padding: 14px 16px; text-decoration: none; color: inherit; transition: box-shadow .15s, border-color .15s; }
  .rc:hover { box-shadow: 0 4px 14px rgba(15,23,42,.08); border-color: #cbd5e1; }
  .rc-f { font-family: ui-monospace, monospace; font-size: 12px; color: #64748b; margin: 6px 0 10px; word-break: break-all; }
  .rc-m { display: flex; flex-wrap: wrap; gap: 6px; }
  .m { font-size: 12px; padding: 2px 8px; border-radius: 999px; }
  .rc-t { margin-top: 8px; font-size: 11px; color: #94a3b8; }
  .tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: .03em; }
  .tag-suite { background: #ede9fe; color: #5b21b6; }
  .tag-compare { background: #dbeafe; color: #1e40af; }
  .tag-deepscan { background: #fef3c7; color: #92400e; }
  .tag-doc { background: #dcfce7; color: #166534; }
  .tag-unknown { background: #f1f5f9; color: #475569; }
  footer { padding: 24px 32px 40px; color: #94a3b8; font-size: 12px; }
</style></head>
<body>
  <header>
    <h1>VOLT POS — Bảng điều khiển báo cáo</h1>
    <div class="meta">${totalReports} report · theo màn hình → chức năng · cập nhật ${esc(generatedAt)}</div>
  </header>
  ${screenSections}
  ${crossSection}
  <footer>Sinh bởi <code>scripts/build-reports-index.mjs</code> — chạy lại để làm mới. Không tự-chứa: các link trỏ tới file report cùng thư mục <code>reports/</code>.</footer>
</body></html>`;

writeFileSync(path.join(REPORTS, 'index.html'), html, 'utf8');
// eslint-disable-next-line no-console
console.log(`reports/index.html rebuilt — ${totalReports} reports across ${entries.length} screens.`);
