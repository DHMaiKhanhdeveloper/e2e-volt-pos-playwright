#!/usr/bin/env node
/**
 * Build a single self-contained React dashboard from the Playwright JSON
 * reporter output (reports/json/results.json) → reports/dashboard/index.html.
 *
 * Shows: total pass/fail/skipped, a per-feature breakdown, and one card per
 * failing test (with its error message + screenshot). Also lists every test
 * case with its own screenshot thumbnail.
 *
 * Durable: re-run any time to refresh — `node scripts/build-dashboard.mjs`.
 * It only reads reports/json/results.json + test-results/; it never runs tests
 * itself (see scripts/run-dashboard.mjs for the single "run + report" command).
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const RESULTS_JSON = path.join(ROOT, 'reports/json/results.json');
const OUT_DIR = path.join(ROOT, 'reports/dashboard');
const ASSETS_DIR = path.join(OUT_DIR, 'assets');

if (!existsSync(RESULTS_JSON)) {
  console.error(`Không tìm thấy ${path.relative(ROOT, RESULTS_JSON)}. Chạy test trước (npm run dashboard).`);
  process.exit(1);
}

const stripAnsi = (s) => String(s ?? '').replace(/\x1b\[[0-9;]*m/g, '');

// tests/e2e/orders/foo.spec.ts -> feature "orders"; tests/Bug/foo.spec.ts -> "Bug"
const featureOf = (file) => {
  const parts = file.split(/[\\/]/).filter(Boolean);
  const CATEGORY = new Set(['e2e', 'regression', 'smoke', 'api']);
  if (parts.length > 2 && CATEGORY.has(parts[0])) return parts[1];
  return parts[0] ?? 'other';
};

rmSync(ASSETS_DIR, { recursive: true, force: true });
mkdirSync(ASSETS_DIR, { recursive: true });

const raw = JSON.parse(readFileSync(RESULTS_JSON, 'utf8'));
const rows = [];

const walk = (suite, describeChain) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const results = test.results ?? [];
      const last = results[results.length - 1];
      // Tests that never ran (e.g. skipped by annotation, or the run aborted
      // before reaching them) have an empty results array — still "skipped".
      const status = !last
        ? 'skipped'
        : last.status === 'passed'
          ? 'passed'
          : last.status === 'skipped'
            ? 'skipped'
            : 'failed'; // failed | timedOut | interrupted

      const errMsg = last?.error?.message ? stripAnsi(last.error.message) : null;
      const location = last?.error?.location
        ? `${path.relative(ROOT, last.error.location.file)}:${last.error.location.line}`
        : null;

      const shot = last?.attachments?.find((a) => a.name === 'screenshot' && a.path);
      let screenshotRel = null;
      if (shot && existsSync(shot.path)) {
        const id = crypto.createHash('md5').update(spec.file + spec.title + test.projectName).digest('hex').slice(0, 12);
        const dest = path.join(ASSETS_DIR, `${id}.png`);
        copyFileSync(shot.path, dest);
        screenshotRel = `assets/${id}.png`;
      }

      rows.push({
        feature: featureOf(spec.file),
        file: spec.file,
        suite: describeChain,
        title: spec.title,
        project: test.projectName,
        status,
        duration: last?.duration ?? 0,
        error: errMsg,
        location,
        screenshot: screenshotRel,
        retries: results.length - 1,
      });
    }
  }
  for (const child of suite.suites ?? []) {
    walk(child, describeChain ? `${describeChain} › ${child.title}` : child.title);
  }
};

for (const top of raw.suites ?? []) walk(top, '');

const stats = rows.reduce(
  (acc, r) => {
    acc.total++;
    acc[r.status]++;
    return acc;
  },
  { total: 0, passed: 0, failed: 0, skipped: 0 },
);

const byFeature = {};
for (const r of rows) {
  byFeature[r.feature] ??= { feature: r.feature, total: 0, passed: 0, failed: 0, skipped: 0 };
  byFeature[r.feature].total++;
  byFeature[r.feature][r.status]++;
}

const data = {
  generatedAt: new Date(raw.stats?.startTime ?? Date.now()).toISOString(),
  durationMs: raw.stats?.duration ?? null,
  stats,
  features: Object.values(byFeature).sort((a, b) => b.failed - a.failed || a.feature.localeCompare(b.feature)),
  tests: rows,
};

writeFileSync(path.join(OUT_DIR, 'data.json'), JSON.stringify(data), 'utf8');

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>VOLT POS — Test dashboard</title>
<style>
  :root { font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f8fafc; color: #0f172a; }
  header { padding: 24px 32px; background: #0f172a; color: #f8fafc; }
  header h1 { margin: 0 0 4px; font-size: 20px; }
  header .meta { font-size: 13px; opacity: .8; }
  main { padding: 24px 32px 60px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 28px; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; }
  .card .n { font-size: 28px; font-weight: 700; }
  .card .l { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
  .card.pass .n { color: #166534; } .card.fail .n { color: #991b1b; } .card.skip .n { color: #92400e; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .05em; color: #334155;
       border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 30px 0 14px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
  th, td { text-align: left; padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  th { background: #f8fafc; color: #475569; font-weight: 600; }
  .bar { height: 8px; border-radius: 4px; background: #e2e8f0; overflow: hidden; display: flex; min-width: 120px; }
  .bar span { display: block; height: 100%; }
  .tabs { display: flex; gap: 6px; margin-bottom: 12px; }
  .tab { padding: 6px 14px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 13px; }
  .tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }
  .search { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; width: 260px; margin-bottom: 12px; }
  .toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  tr.feature-row { cursor: pointer; }
  tr.feature-row:hover { background: #f1f5f9; }
  tr.feature-row.selected { background: #e0e7ff; }
  .clear-filter { font-size: 12px; color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 999px; padding: 4px 12px; cursor: pointer; margin-bottom: 12px; display: inline-block; }
  .active-feature { font-size: 13px; color: #334155; margin-bottom: 12px; }
  .active-feature b { color: #0f172a; }
  .badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
  .badge.passed { background: #dcfce7; color: #166534; }
  .badge.failed { background: #fee2e2; color: #991b1b; }
  .badge.skipped { background: #fef3c7; color: #92400e; }
  .fail-card { background: #fff; border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: 10px;
               padding: 14px 16px; margin-bottom: 14px; display: grid; grid-template-columns: 1fr 220px; gap: 16px; }
  .fail-card h3 { margin: 0 0 4px; font-size: 14px; }
  .fail-card .meta { font-size: 12px; color: #64748b; margin-bottom: 8px; }
  .fail-card pre { background: #fef2f2; color: #7f1d1d; font-size: 12px; padding: 10px; border-radius: 6px; overflow: auto; max-height: 160px; margin: 0; white-space: pre-wrap; }
  .fail-card img, .thumb { width: 100%; border-radius: 6px; border: 1px solid #e2e8f0; cursor: zoom-in; }
  .thumb-cell { width: 90px; }
  .thumb-cell img { width: 80px; border-radius: 4px; border: 1px solid #e2e8f0; cursor: zoom-in; }
  .row-status-failed { background: #fef2f2; }
  .empty { color: #94a3b8; font-size: 13px; padding: 16px; }
  footer { padding: 24px 0; color: #94a3b8; font-size: 12px; }
</style></head>
<body>
<div id="root"></div>
<script>window.__DATA__ = ${JSON.stringify(data)};</script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script>
const { useState, useMemo, createElement: h } = React;
const D = window.__DATA__;

function StatCard({ label, value, cls }) {
  return h('div', { className: 'card ' + (cls || '') },
    h('div', { className: 'n' }, value),
    h('div', { className: 'l' }, label),
  );
}

function Bar({ passed, failed, skipped, total }) {
  const pct = (n) => (total ? (100 * n) / total : 0);
  return h('div', { className: 'bar' },
    h('span', { style: { width: pct(passed) + '%', background: '#22c55e' } }),
    h('span', { style: { width: pct(failed) + '%', background: '#ef4444' } }),
    h('span', { style: { width: pct(skipped) + '%', background: '#f59e0b' } }),
  );
}

function Lightbox({ src, onClose }) {
  if (!src) return null;
  return h('div', {
    onClick: onClose,
    style: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.85)', display: 'flex',
             alignItems: 'center', justifyContent: 'center', zIndex: 50, cursor: 'zoom-out', padding: 24 },
  }, h('img', { src, style: { maxWidth: '95%', maxHeight: '95%', borderRadius: 8 } }));
}

function FailCard({ t, onZoom }) {
  return h('div', { className: 'fail-card' },
    h('div', null,
      h('h3', null, t.title),
      h('div', { className: 'meta' }, (t.feature) + ' · ' + t.file + (t.location ? ' · ' + t.location : '') + ' · ' + t.project),
      t.error ? h('pre', null, t.error) : h('div', { className: 'empty' }, '(no error message captured)'),
    ),
    t.screenshot
      ? h('img', { src: t.screenshot, onClick: () => onZoom(t.screenshot) })
      : h('div', { className: 'empty' }, 'no screenshot'),
  );
}

function App() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [zoom, setZoom] = useState(null);
  const [feature, setFeature] = useState(null);

  const filtered = useMemo(() => {
    return D.tests.filter((t) => {
      if (feature && t.feature !== feature) return false;
      if (tab !== 'all' && t.status !== tab) return false;
      if (!q) return true;
      const s = (t.title + ' ' + t.file + ' ' + t.feature).toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [tab, q, feature]);

  const failedOnly = useMemo(
    () => D.tests.filter((t) => t.status === 'failed' && (!feature || t.feature === feature)),
    [feature],
  );

  const selectFeature = (f) => {
    setFeature((prev) => (prev === f ? null : f));
    document.getElementById('all-cases-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return h('div', null,
    h('header', null,
      h('h1', null, 'VOLT POS — Test dashboard'),
      h('div', { className: 'meta' },
        D.stats.total + ' test case · sinh lúc ' + new Date(D.generatedAt).toLocaleString('vi-VN') +
        (D.durationMs ? ' · ' + Math.round(D.durationMs / 1000) + 's' : '')),
    ),
    h('main', null,
      h('div', { className: 'cards' },
        h(StatCard, { label: 'Tổng số', value: D.stats.total }),
        h(StatCard, { label: 'Pass', value: D.stats.passed, cls: 'pass' }),
        h(StatCard, { label: 'Fail', value: D.stats.failed, cls: 'fail' }),
        h(StatCard, { label: 'Skip', value: D.stats.skipped, cls: 'skip' }),
      ),

      h('h2', null, 'Theo tính năng'),
      h('div', { className: 'empty', style: { marginBottom: 8 } }, 'Nhấn vào một tính năng để xem tất cả test case của tính năng đó.'),
      h('table', null,
        h('thead', null, h('tr', null,
          h('th', null, 'Tính năng'), h('th', null, 'Tổng'), h('th', null, 'Pass'),
          h('th', null, 'Fail'), h('th', null, 'Skip'), h('th', null, 'Tỉ lệ'))),
        h('tbody', null, D.features.map((f) => h('tr', {
          key: f.feature,
          className: 'feature-row' + (f.failed ? ' row-status-failed' : '') + (feature === f.feature ? ' selected' : ''),
          onClick: () => selectFeature(f.feature),
        },
          h('td', null, f.feature), h('td', null, f.total),
          h('td', null, f.passed), h('td', null, f.failed), h('td', null, f.skipped),
          h('td', null, h(Bar, f)),
        ))),
      ),

      h('h2', null, 'Test case fail (' + failedOnly.length + ') — nguyên nhân' + (feature ? ' · ' + feature : '')),
      failedOnly.length
        ? failedOnly.map((t) => h(FailCard, { key: t.feature + t.title + t.project, t, onZoom: setZoom }))
        : h('div', { className: 'empty' }, 'Không có test fail.'),

      h('h2', { id: 'all-cases-anchor' }, feature ? 'Test case của tính năng: ' + feature : 'Tất cả test case'),
      feature
        ? h('div', { className: 'active-feature' },
            'Đang lọc theo tính năng ',
            h('b', null, feature),
            ' (' + filtered.length + ' test case). ',
            h('span', { className: 'clear-filter', onClick: () => setFeature(null) }, '✕ Xóa lọc'))
        : null,
      h('div', { className: 'tabs' },
        ['all', 'passed', 'failed', 'skipped'].map((s) => h('div', {
          key: s, className: 'tab' + (tab === s ? ' active' : ''), onClick: () => setTab(s),
        }, s === 'all' ? 'Tất cả' : s))),
      h('input', {
        className: 'search', placeholder: 'Tìm theo tên, file, tính năng…',
        value: q, onChange: (e) => setQ(e.target.value),
      }),
      h('table', null,
        h('thead', null, h('tr', null,
          h('th', null, 'Ảnh'), h('th', null, 'Test case'), h('th', null, 'Tính năng'),
          h('th', null, 'File'), h('th', null, 'Trạng thái'), h('th', null, 'Thời gian'))),
        h('tbody', null, filtered.map((t, i) => h('tr', {
          key: t.feature + t.title + t.project + i, className: t.status === 'failed' ? 'row-status-failed' : '',
        },
          h('td', { className: 'thumb-cell' }, t.screenshot
            ? h('img', { src: t.screenshot, onClick: () => setZoom(t.screenshot) })
            : null),
          h('td', null, t.title),
          h('td', null, t.feature),
          h('td', null, t.file),
          h('td', null, h('span', { className: 'badge ' + t.status }, t.status)),
          h('td', null, Math.round(t.duration / 1000) + 's'),
        ))),
      ),
      !filtered.length ? h('div', { className: 'empty' }, 'Không có kết quả khớp.') : null,
    ),
    h('footer', null, 'Sinh bởi node scripts/build-dashboard.mjs từ reports/json/results.json — chạy npm run dashboard để làm mới.'),
    h(Lightbox, { src: zoom, onClose: () => setZoom(null) }),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App));
</script>
</body></html>`;

writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');

console.log(
  `reports/dashboard/index.html rebuilt — ${data.stats.total} test case ` +
    `(pass ${data.stats.passed} / fail ${data.stats.failed} / skip ${data.stats.skipped}).`,
);
