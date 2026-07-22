/**
 * Shared HTML-report building blocks for the Income Reports V2 compare spec —
 * same "V1 vs V2, every field side by side, mismatches highlighted" pattern as
 * tests/portal/staff-payroll-compare.spec.ts, generalized to flat stat objects
 * AND row-lists (orders / staff / detail-section rows) so all 3 test cases can
 * feed the same renderer.
 */

export interface FieldCell {
  name: string;
  v1: string;
  v2: string;
  mismatch: boolean;
}

export interface CompareRow {
  key: string;
  status: 'match' | 'mismatch' | 'v1-only' | 'v2-only';
  fields: FieldCell[];
}

export interface CompareSection {
  title: string;
  fieldNames: string[];
  rows: CompareRow[];
}

export interface CaseReport {
  name: string;
  sections: CompareSection[];
}

function toDisplay(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

/** A single logical row comparing two flat objects field-by-field (stat cards, stat bars, panels). */
export function compareFlat(key: string, v1Input: object, v2Input: object): CompareRow {
  const v1 = v1Input as Record<string, unknown>;
  const v2 = v2Input as Record<string, unknown>;
  const names = [...new Set([...Object.keys(v1), ...Object.keys(v2)])];
  const fields: FieldCell[] = names.map((name) => {
    const a = toDisplay(v1[name]);
    const b = toDisplay(v2[name]);
    return { name, v1: a, v2: b, mismatch: a !== b };
  });
  return {
    key,
    status: fields.some((f) => f.mismatch) ? 'mismatch' : 'match',
    fields,
  };
}

/** Wraps a single compareFlat row into a one-row section. */
export function section(title: string, row: CompareRow): CompareSection {
  return { title, fieldNames: row.fields.map((f) => f.name), rows: [row] };
}

/**
 * Compares two row-lists (e.g. order rows, staff rows, detail-section rows)
 * keyed by some identifying field (order code, staff name, row label) — rows
 * present on only one side are flagged v1-only/v2-only rather than diffed.
 */
export function compareRowsList<T extends object>(
  title: string,
  v1Rows: T[],
  v2Rows: T[],
  keyFn: (row: T) => string,
  fieldNames: string[],
): CompareSection {
  const v1ByKey = new Map(v1Rows.map((r) => [keyFn(r), r]));
  const v2ByKey = new Map(v2Rows.map((r) => [keyFn(r), r]));
  const allKeys = [...new Set([...v1ByKey.keys(), ...v2ByKey.keys()])];

  const rows: CompareRow[] = allKeys.map((key) => {
    const v1Row = v1ByKey.get(key) as Record<string, unknown> | undefined;
    const v2Row = v2ByKey.get(key) as Record<string, unknown> | undefined;
    const fields: FieldCell[] = fieldNames.map((name) => {
      const a = toDisplay(v1Row?.[name]);
      const b = toDisplay(v2Row?.[name]);
      return { name, v1: a, v2: b, mismatch: !!v1Row && !!v2Row && a !== b };
    });
    const status: CompareRow['status'] = !v1Row
      ? 'v2-only'
      : !v2Row
        ? 'v1-only'
        : fields.some((f) => f.mismatch)
          ? 'mismatch'
          : 'match';
    return { key, status, fields };
  });

  return { title, fieldNames, rows };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSection(sec: CompareSection): string {
  const fieldNames = sec.fieldNames;

  const rowsHtml = sec.rows
    .map((row) => {
      const rowClass =
        row.status === 'v1-only' || row.status === 'v2-only'
          ? 'row-missing'
          : row.status === 'mismatch'
            ? 'row-mismatch'
            : 'row-ok';
      const badge =
        row.status === 'v1-only'
          ? '<span class="badge badge-missing">Missing in V2</span>'
          : row.status === 'v2-only'
            ? '<span class="badge badge-missing">Missing in V1</span>'
            : row.status === 'mismatch'
              ? '<span class="badge badge-mismatch">Mismatch</span>'
              : '<span class="badge badge-ok">Match</span>';
      const cells = row.fields
        .map((f) => {
          const v1Cell = f.v1 === '' ? '<span class="muted">—</span>' : escapeHtml(f.v1);
          const v2Cell = f.v2 === '' ? '<span class="muted">—</span>' : escapeHtml(f.v2);
          return `<td class="${f.mismatch ? 'mismatch' : ''}"><div class="pair"><span class="volt">${v1Cell}</span><span class="portal">${v2Cell}</span></div></td>`;
        })
        .join('\n      ');
      return `<tr class="${rowClass}">
      <td>${escapeHtml(row.key)}</td>
      <td>${badge}</td>
      ${cells}
    </tr>`;
    })
    .join('\n');

  return `
    <h3 style="margin:20px 0 4px;font-size:14px;">${escapeHtml(sec.title)}</h3>
    <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Status</th>
          ${fieldNames.map((f) => `<th>${escapeHtml(f)}<br/><span class="sub">V1 / V2</span></th>`).join('\n          ')}
        </tr>
      </thead>
      <tbody>
${rowsHtml || `<tr><td colspan="${fieldNames.length + 2}" class="muted">No rows</td></tr>`}
      </tbody>
    </table>`;
}

function renderCases(reports: CaseReport[]): string {
  return reports
    .map((report) => {
      const okCount = report.sections
        .flatMap((s) => s.rows)
        .filter((r) => r.status === 'match').length;
      const rowCount = report.sections.flatMap((s) => s.rows).length;
      const issueCount = rowCount - okCount;
      return `
  <section>
    <h2>${escapeHtml(report.name)}</h2>
    <div class="cards">
      <div class="card"><div class="n">${rowCount}</div><div class="l">Total rows</div></div>
      <div class="card ok"><div class="n">${okCount}</div><div class="l">Matching</div></div>
      <div class="card ${issueCount ? 'missing' : ''}"><div class="n">${issueCount}</div><div class="l">Issues</div></div>
    </div>
    ${report.sections.map(renderSection).join('\n')}
  </section>`;
    })
    .join('\n');
}

const SHARED_STYLE = `
  :root { font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  body { margin: 0; background: #f8fafc; color: #0f172a; }
  header { padding: 24px 32px; background: #0f172a; color: #f8fafc; }
  header h1 { margin: 0 0 4px; font-size: 20px; }
  header .meta { font-size: 13px; opacity: .8; }
  .cards { display: flex; gap: 12px; padding: 16px 0 8px; flex-wrap: wrap; }
  .card { flex: 1 1 110px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
  .card .n { font-size: 26px; font-weight: 700; }
  .card .l { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
  .card.ok .n { color: #16a34a; } .card.missing .n { color: #dc2626; }
  section { margin: 0 32px 32px; }
  h2 { margin: 24px 0 4px; font-size: 16px; }
  table { width: 100%; border-collapse: collapse; background: #fff;
          border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
  th, td { text-align: left; padding: 9px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: top; }
  th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #475569; }
  th .sub { text-transform: none; font-size: 10px; color: #94a3b8; }
  .pair { display: flex; flex-direction: column; gap: 2px; }
  .pair .volt::before { content: 'V1: '; color: #94a3b8; font-size: 10px; }
  .pair .portal::before { content: 'V2: '; color: #94a3b8; font-size: 10px; }
  td.mismatch { background: #fef2f2; }
  tr.row-missing { background: #fffbeb; }
  .muted { color: #94a3b8; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .badge-ok { background: #dcfce7; color: #166534; }
  .badge-mismatch { background: #fee2e2; color: #991b1b; }
  .badge-missing { background: #fef9c3; color: #854d0e; }
`;

export function renderReport(reports: CaseReport[], generatedAt: string): string {
  const allRows = reports.flatMap((r) => r.sections.flatMap((s) => s.rows));
  const totalRows = allRows.length;
  const totalMismatched = allRows.filter((r) => r.status !== 'match').length;
  const totalOk = totalRows - totalMismatched;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Income Reports V2 — V1 vs V2 data compare</title>
<style>${SHARED_STYLE}</style></head>
<body>
  <header>
    <h1>Income Reports V2 — V1 vs V2 data compare</h1>
    <div class="meta">${totalRows} rows across ${reports.length} screen(s) · ${totalOk} matching · ${totalMismatched} with issues · generated ${generatedAt}</div>
  </header>
  ${renderCases(reports) || '<section><p class="muted" style="margin:24px 32px">No data captured this run.</p></section>'}
</body></html>`;
}

/** One calendar day's worth of case reports (all 3 screen pairs, for that single date). */
export interface DayReport {
  /** ISO date, e.g. "2026-07-21". */
  date: string;
  cases: CaseReport[];
}

/**
 * Renders a single self-contained HTML file covering many days at once: a
 * clickable calendar strip (colored green/red by whether that day had any
 * V1/V2 mismatches) plus one hidden panel per day, toggled client-side with
 * plain JS — no server or rebuild needed to look at a different day.
 */
export function renderCalendarReport(days: DayReport[], generatedAt: string): string {
  // Most recent day first, so it's the one shown by default.
  const sorted = [...days].sort((a, b) => (a.date < b.date ? 1 : -1));

  const summaries = sorted.map((d) => {
    const rows = d.cases.flatMap((c) => c.sections.flatMap((s) => s.rows));
    return {
      date: d.date,
      totalRows: rows.length,
      issues: rows.filter((r) => r.status !== 'match').length,
    };
  });
  const totalRows = summaries.reduce((n, s) => n + s.totalRows, 0);
  const totalIssues = summaries.reduce((n, s) => n + s.issues, 0);
  const daysWithIssues = summaries.filter((s) => s.issues > 0).length;

  const chipsHtml = summaries
    .map((s, i) => {
      const weekday = new Date(`${s.date}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
      });
      return `<button class="day-chip ${s.issues ? 'has-issues' : 'ok'}" data-idx="${i}" onclick="showDay(${i})">
      <span class="chip-weekday">${weekday}</span>
      <span class="chip-date">${s.date}</span>
      <span class="chip-badge">${s.issues === 0 ? '✓' : s.issues}</span>
    </button>`;
    })
    .join('\n');

  const panelsHtml = sorted
    .map((d, i) => {
      const s = summaries[i];
      return `<div class="day-panel" id="day-panel-${i}" style="display:${i === 0 ? 'block' : 'none'}">
    <h2 style="margin:24px 32px 0;">${escapeHtml(d.date)} <span class="muted" style="font-weight:400;">(${s.totalRows} rows, ${s.issues} issue${s.issues === 1 ? '' : 's'})</span></h2>
    ${renderCases(d.cases) || '<section><p class="muted" style="margin:24px 32px">No data captured for this day.</p></section>'}
  </div>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Income Reports V2 — V1 vs V2 daily compare</title>
<style>${SHARED_STYLE}
  .calendar { display: flex; gap: 8px; padding: 16px 32px; flex-wrap: wrap; background: #fff; border-bottom: 1px solid #e2e8f0;
              position: sticky; top: 0; z-index: 1; }
  .day-chip { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 64px;
              padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer;
              font-family: inherit; }
  .day-chip.ok { border-color: #bbf7d0; }
  .day-chip.has-issues { border-color: #fecaca; }
  .day-chip .chip-weekday { font-size: 10px; text-transform: uppercase; color: #94a3b8; letter-spacing: .04em; }
  .day-chip .chip-date { font-size: 12px; font-weight: 600; }
  .day-chip .chip-badge { font-size: 12px; font-weight: 700; }
  .day-chip.ok .chip-badge { color: #16a34a; }
  .day-chip.has-issues .chip-badge { color: #dc2626; }
  .day-chip.selected { outline: 2px solid #0f172a; outline-offset: 1px; }
</style></head>
<body>
  <header>
    <h1>Income Reports V2 — V1 vs V2 daily compare</h1>
    <div class="meta">${sorted.length} day(s) scanned · ${totalRows} rows · ${daysWithIssues} day(s) with issues (${totalIssues} rows) · generated ${generatedAt}</div>
  </header>
  <div class="calendar">
    ${chipsHtml}
  </div>
  ${panelsHtml}
  <script>
    function showDay(idx) {
      document.querySelectorAll('.day-panel').forEach(function (el) { el.style.display = 'none'; });
      document.querySelectorAll('.day-chip').forEach(function (el) { el.classList.remove('selected'); });
      var panel = document.getElementById('day-panel-' + idx);
      if (panel) panel.style.display = 'block';
      var chip = document.querySelector('.day-chip[data-idx="' + idx + '"]');
      if (chip) chip.classList.add('selected');
    }
    showDay(0);
  </script>
</body></html>`;
}
