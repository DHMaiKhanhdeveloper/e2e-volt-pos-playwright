import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import {
  StaffPayrollPage,
  type StaffPayrollDetail,
  type StaffPayrollRow,
} from '@pages/pos/StaffPayrollPage';
import { PasscodeDialog } from '@components/modal/PasscodeDialog';
import { env } from '@configs/env/loadEnv';
import {
  PortalStaffPayrollPage,
  type PortalStaffPayrollDetail,
  type PortalStaffPayrollRow,
} from './PortalStaffPayrollPage';

/**
 * Cross-app parity: Volt POS `/incomes/staff-payroll` vs the FASTBOY Portal's
 * Payroll > Staff Payroll tab, for the SAME period. See
 * docs/screens/staff-payroll/staff-payroll-test-cases.md (TC-10/TC-11) for
 * the manually-scanned baseline this spec automates.
 *
 * Requires `npm run auth` to have been run at least once (SSO login can't be
 * scripted — see tests/portal/auth.setup.ts) so PORTAL_STORAGE_STATE exists.
 * Run with: `npm run test:portal`
 *
 * Every run — pass or fail — writes a self-contained HTML comparison report
 * (every staff row from both apps, side by side, per-field diff) to
 * reports/staff-payroll/compare-<ISO date>.html and a `-latest.html` alias.
 *
 * Periods are NOT hardcoded: whatever presets the POS period dropdown lists
 * at run time is exactly what gets checked, and the Portal is driven to the
 * SAME label via its own period dropdown (no manual periodId/epoch mapping).
 */

const PORTAL_SHOP_ID = '100004';

const FIELDS = ['orders', 'subtotal', 'supplyFee', 'tip', 'totalIncome'] as const;
type Field = (typeof FIELDS)[number];

interface StaffCompareRow {
  staff: string;
  inVolt: boolean;
  inPortal: boolean;
  volt: Partial<StaffPayrollRow>;
  portal: Partial<PortalStaffPayrollRow>;
  mismatchFields: Field[];
}

/** Detail-panel fields common to BOTH the salary and commission layouts (see `StaffPayType`). */
const COMMON_DETAIL_FIELDS = [
  'workingDays',
  'deduction',
  'tip',
  'cardChargeTip',
  'totalIncome',
  'pay1',
  'pay2',
] as const;
/** Salary-layout-only fields (Working Hours, Salary Amount as the pay base). */
const SALARY_DETAIL_FIELDS = ['workingHours', 'salaryAmount'] as const;
/** Commission-layout-only fields (Sale/Refund/Subtotal/Supply Fee/Staff Commission/...). */
const COMMISSION_DETAIL_FIELDS = [
  'sale',
  'refund',
  'subtotal',
  'supplyFee',
  'staffCommission',
  'cardChargeCommission',
  'discountCharge',
] as const;
type DetailField =
  | (typeof COMMON_DETAIL_FIELDS)[number]
  | (typeof SALARY_DETAIL_FIELDS)[number]
  | (typeof COMMISSION_DETAIL_FIELDS)[number]
  | 'payType';

/**
 * Detail-panel rows a staff's headline row is expected to expand into, per
 * app. `workingHours` is compared with a numeric tolerance, not byte-equal —
 * see the `workingHoursMismatch` note below.
 */
interface StaffDetailCompare {
  staff: string;
  volt: StaffPayrollDetail;
  portal: PortalStaffPayrollDetail;
  mismatchFields: DetailField[];
}

/**
 * Volt POS shows 2 decimals (e.g. "20.92"), the Portal rounds display to 1
 * (e.g. "20.9") — same underlying value, different display precision. A
 * byte-equal compare would false-positive on every staff, so tolerate up to
 * 0.05 hours of rounding drift instead.
 */
function workingHoursMismatch(volt?: string, portal?: string): boolean {
  const v = Number.parseFloat(volt ?? '');
  const p = Number.parseFloat(portal ?? '');
  if (Number.isNaN(v) || Number.isNaN(p)) return volt !== portal;
  return Math.abs(v - p) > 0.05;
}

/**
 * Compares a Volt POS and Portal detail read-out for the SAME staff. Both
 * apps expose the same two pay-model layouts (salary vs. commission), so a
 * `payType` mismatch is itself flagged; otherwise only the fields that
 * layout actually renders are compared (commission-only fields are absent —
 * `undefined` — on a salary-type staff and vice versa, so comparing the full
 * union would false-positive on every staff of one type).
 */
function compareDetail(volt: StaffPayrollDetail, portal: PortalStaffPayrollDetail): DetailField[] {
  const mismatches: DetailField[] = [];
  if (volt.payType !== portal.payType) {
    mismatches.push('payType');
    return mismatches; // field sets differ entirely — no point comparing further
  }
  const fields =
    volt.payType === 'salary'
      ? [...COMMON_DETAIL_FIELDS, ...SALARY_DETAIL_FIELDS]
      : [...COMMON_DETAIL_FIELDS, ...COMMISSION_DETAIL_FIELDS];
  for (const field of fields) {
    if (field === 'workingHours') {
      if (workingHoursMismatch(volt.workingHours, portal.workingHours)) mismatches.push(field);
      continue;
    }
    if (volt[field] !== portal[field]) mismatches.push(field);
  }
  return mismatches;
}

interface PeriodReport {
  label: string;
  voltRowCount: number;
  portalRowCount: number;
  totalStaffStat: string;
  rows: StaffCompareRow[];
  detailRows: StaffDetailCompare[];
  detailSkipped: number;
}

function byStaffName<T extends { staff: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.staff, r]));
}

function buildCompareRows(
  voltRows: StaffPayrollRow[],
  portalRows: PortalStaffPayrollRow[],
): StaffCompareRow[] {
  const voltByName = byStaffName(voltRows);
  const portalByName = byStaffName(portalRows);
  const allNames = [...new Set([...voltByName.keys(), ...portalByName.keys()])].sort();

  return allNames.map((staff) => {
    const volt = voltByName.get(staff);
    const portal = portalByName.get(staff);
    const mismatchFields: Field[] = [];
    if (volt && portal) {
      for (const field of FIELDS) {
        if (volt[field] !== portal[field]) mismatchFields.push(field);
      }
    }
    return {
      staff,
      inVolt: !!volt,
      inPortal: !!portal,
      volt: volt ?? {},
      portal: portal ?? {},
      mismatchFields,
    };
  });
}

const periodReports: PeriodReport[] = [];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Full union of columns across both pay-model layouts. A given staff row
 * only ever populates one layout's fields — the other side renders as a
 * muted "—" (see {@link renderDetailTable}'s `cell` helper).
 */
const DETAIL_COLUMNS: DetailField[] = [
  'payType',
  'workingDays',
  'workingHours',
  'salaryAmount',
  'sale',
  'refund',
  'subtotal',
  'supplyFee',
  'staffCommission',
  'cardChargeCommission',
  'discountCharge',
  'deduction',
  'tip',
  'cardChargeTip',
  'totalIncome',
  'pay1',
  'pay2',
];

function renderDetailTable(report: PeriodReport): string {
  if (report.detailRows.length === 0 && report.detailSkipped === 0) return '';
  const rowsHtml = report.detailRows
    .map((row) => {
      const rowClass = row.mismatchFields.length ? 'row-mismatch' : 'row-ok';
      const cell = (field: DetailField): string => {
        const voltVal = row.volt[field];
        const portalVal = row.portal[field];
        const mismatched = row.mismatchFields.includes(field);
        const voltCell =
          voltVal === undefined ? '<span class="muted">—</span>' : escapeHtml(voltVal);
        const portalCell =
          portalVal === undefined ? '<span class="muted">—</span>' : escapeHtml(portalVal);
        return `<td class="${mismatched ? 'mismatch' : ''}"><div class="pair"><span class="volt">${voltCell}</span><span class="portal">${portalCell}</span></div></td>`;
      };
      const badge = row.mismatchFields.length
        ? '<span class="badge badge-mismatch">Mismatch</span>'
        : '<span class="badge badge-ok">Match</span>';
      return `<tr class="${rowClass}">
      <td>${escapeHtml(row.staff)}</td>
      <td>${badge}</td>
      ${DETAIL_COLUMNS.map((f) => cell(f)).join('\n      ')}
    </tr>`;
    })
    .join('\n');

  const skippedNote =
    report.detailSkipped > 0
      ? `<p class="muted" style="margin:8px 0 0">${report.detailSkipped} staff row(s) with orders in both apps were not detail-checked this run (capped for runtime — see spec).</p>`
      : '';

  return `
    <h3 style="margin:20px 0 4px;font-size:14px;">Per-staff detail panel (Working Days/Hours, Salary, Deduction, Tip, Card Charge Tip, Total Income, Pay 1/2)</h3>
    <table>
      <thead>
        <tr>
          <th>Staff</th>
          <th>Status</th>
          ${DETAIL_COLUMNS.map((f) => `<th>${f}<br/><span class="sub">POS / Portal</span></th>`).join('\n          ')}
        </tr>
      </thead>
      <tbody>
${rowsHtml || '<tr><td colspan="11" class="muted">No staff with orders &gt; 0 in both apps this period</td></tr>'}
      </tbody>
    </table>
    ${skippedNote}`;
}

function renderReport(reports: PeriodReport[], generatedAt: string): string {
  const totalRows = reports.reduce((sum, r) => sum + r.rows.length, 0);
  const totalMismatched = reports.reduce(
    (sum, r) =>
      sum +
      r.rows.filter((row) => row.mismatchFields.length > 0 || !row.inVolt || !row.inPortal).length,
    0,
  );
  const totalOk = totalRows - totalMismatched;

  const sections = reports
    .map((report) => {
      const rowsHtml = report.rows
        .map((row) => {
          const rowHasIssue = row.mismatchFields.length > 0 || !row.inVolt || !row.inPortal;
          const rowClass =
            !row.inVolt || !row.inPortal
              ? 'row-missing'
              : row.mismatchFields.length
                ? 'row-mismatch'
                : 'row-ok';
          const cell = (field: Field): string => {
            const voltVal = row.volt[field];
            const portalVal = row.portal[field];
            const mismatched = row.mismatchFields.includes(field);
            const voltCell =
              voltVal === undefined ? '<span class="muted">—</span>' : escapeHtml(voltVal);
            const portalCell =
              portalVal === undefined ? '<span class="muted">—</span>' : escapeHtml(portalVal);
            return `<td class="${mismatched ? 'mismatch' : ''}"><div class="pair"><span class="volt">${voltCell}</span><span class="portal">${portalCell}</span></div></td>`;
          };
          const presence = !row.inVolt
            ? '<span class="badge badge-missing">Missing in POS</span>'
            : !row.inPortal
              ? '<span class="badge badge-missing">Missing in Portal</span>'
              : rowHasIssue
                ? '<span class="badge badge-mismatch">Mismatch</span>'
                : '<span class="badge badge-ok">Match</span>';
          return `<tr class="${rowClass}">
      <td>${escapeHtml(row.staff)}</td>
      <td>${presence}</td>
      ${FIELDS.map((f) => cell(f)).join('\n      ')}
    </tr>`;
        })
        .join('\n');

      const okCount = report.rows.filter(
        (r) => r.inVolt && r.inPortal && r.mismatchFields.length === 0,
      ).length;
      const issueCount = report.rows.length - okCount;

      return `
  <section>
    <h2>${escapeHtml(report.label)}</h2>
    <div class="cards">
      <div class="card"><div class="n">${report.rows.length}</div><div class="l">Total staff</div></div>
      <div class="card"><div class="n">${report.voltRowCount}</div><div class="l">POS rows</div></div>
      <div class="card"><div class="n">${report.portalRowCount}</div><div class="l">Portal rows</div></div>
      <div class="card ok"><div class="n">${okCount}</div><div class="l">Matching</div></div>
      <div class="card ${issueCount ? 'missing' : ''}"><div class="n">${issueCount}</div><div class="l">Issues</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Staff</th>
          <th>Status</th>
          ${FIELDS.map((f) => `<th>${f}<br/><span class="sub">POS / Portal</span></th>`).join('\n          ')}
        </tr>
      </thead>
      <tbody>
${rowsHtml || '<tr><td colspan="7" class="muted">No rows</td></tr>'}
      </tbody>
    </table>
    ${renderDetailTable(report)}
  </section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Staff Payroll — POS vs Portal compare</title>
<style>
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
  .pair .volt::before { content: 'POS: '; color: #94a3b8; font-size: 10px; }
  .pair .portal::before { content: 'Portal: '; color: #94a3b8; font-size: 10px; }
  td.mismatch { background: #fef2f2; }
  tr.row-missing { background: #fffbeb; }
  .muted { color: #94a3b8; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .badge-ok { background: #dcfce7; color: #166534; }
  .badge-mismatch { background: #fee2e2; color: #991b1b; }
  .badge-missing { background: #fef9c3; color: #854d0e; }
</style></head>
<body>
  <header>
    <h1>Staff Payroll — POS vs Portal compare</h1>
    <div class="meta">${totalRows} staff rows across ${reports.length} period(s) · ${totalOk} matching · ${totalMismatched} with issues · generated ${generatedAt}</div>
  </header>
  ${sections || '<section><p class="muted" style="margin:24px 32px">No periods found in the POS period dropdown.</p></section>'}
</body></html>`;
}

test.describe('Staff Payroll — cross-app parity (Volt POS vs Portal)', () => {
  test('every period in the dropdown: every staff row matches', async ({ browser }) => {
    // Clicking into per-staff detail panels on BOTH apps, for every period
    // the dropdown lists, is far slower than reading list tables alone —
    // the global 30s timeout (playwright.config.ts) isn't enough here.
    test.setTimeout(25 * 60 * 1000);

    // Volt POS (local, passcode-gated) — plain context, no stored session
    // needed. `baseURL` must be overridden here: this spec runs under the
    // "portal" project, whose project-level baseURL points at the FASTBOY
    // Portal, so a relative goto() would otherwise resolve against the
    // wrong host.
    const voltContext = await browser.newContext({ baseURL: env.BASE_URL });
    const voltPage = await voltContext.newPage();
    const staffPayroll = new StaffPayrollPage(voltPage);
    const passcodeDialog = new PasscodeDialog(voltPage);
    await staffPayroll.goto();
    await passcodeDialog.enterPasscode(env.OWNER_PASSCODE);
    await staffPayroll.waitForReady();

    // Portal (authenticated via cached storageState from `npm run auth`).
    const portalContext = await browser.newContext({ storageState: env.PORTAL_STORAGE_STATE });
    const portalPage = await portalContext.newPage();
    const portalPayroll = new PortalStaffPayrollPage(portalPage);
    await portalPayroll.gotoDefault(PORTAL_SHOP_ID);

    // Whatever presets the POS dropdown lists right now — no fixed period count.
    const periodLabels = await staffPayroll.listPeriodLabels();
    expect(periodLabels.length, 'POS period dropdown returned no options').toBeGreaterThan(0);

    for (const label of periodLabels) {
      await test.step(label, async () => {
        await staffPayroll.selectPeriod(label);
        await staffPayroll.waitForReady();
        const voltRows = await staffPayroll.readAllRows();
        const voltStats = await staffPayroll.readAllStats();

        await portalPayroll.selectPeriod(label);
        const portalRows = await portalPayroll.readAllRows();

        const compareRows = buildCompareRows(voltRows as StaffPayrollRow[], portalRows);

        // Per-staff detail-panel drill-down: for every staff both apps agree
        // has activity (orders > 0), click into the row on each app and
        // compare the full payroll breakdown, not just the listing columns.
        // Capped per period to keep runtime bounded — clicking is much
        // slower than reading the list table.
        const DETAIL_CHECK_CAP = 8;
        const detailCandidates = compareRows.filter(
          (row) => row.inVolt && row.inPortal && row.volt.orders !== '0',
        );
        const toCheck = detailCandidates.slice(0, DETAIL_CHECK_CAP);
        let detailSkipped = detailCandidates.length - toCheck.length;
        const detailRows: StaffDetailCompare[] = [];
        for (const candidate of toCheck) {
          try {
            await staffPayroll.openStaffDetailByName(candidate.staff);
            const voltDetail = await staffPayroll.readDetailPanel();
            await portalPayroll.openStaffDetailByName(candidate.staff);
            const portalDetail = await portalPayroll.readDetailPanel();
            detailRows.push({
              staff: candidate.staff,
              volt: voltDetail,
              portal: portalDetail,
              mismatchFields: compareDetail(voltDetail, portalDetail),
            });
          } catch (err) {
            // A staff row occasionally becomes transiently unfindable
            // mid-loop (observed alongside a background "Internet connection
            // restored" reconnect/refetch) — skip that one row rather than
            // failing every remaining candidate in this period.
            detailSkipped++;
            // eslint-disable-next-line no-console
            console.warn(
              `[staff-payroll-compare] detail check skipped for "${candidate.staff}" (${label}): ${(err as Error).message}`,
            );
          }
        }

        periodReports.push({
          label,
          voltRowCount: voltRows.length,
          portalRowCount: portalRows.length,
          totalStaffStat: voltStats['Total staff'],
          rows: compareRows,
          detailRows,
          detailSkipped,
        });

        // Soft assertions: record every discrepancy in the HTML report
        // instead of aborting the whole run on the first mismatch.
        // NOTE: the Portal only lists staff with payroll activity for the
        // period (D-1 in the test-case doc) while Volt POS always lists the
        // full staff roster, so row counts are legitimately unequal — the
        // relationship checked here is "every Portal row matches its Volt
        // POS counterpart", not "row counts are equal".
        for (const row of compareRows) {
          expect.soft(row.inVolt, `staff "${row.staff}" missing in Volt POS`).toBeTruthy();
          if (!row.inPortal) continue; // expected: Portal only lists active staff (D-1)
          expect
            .soft(
              row.mismatchFields,
              `mismatch for staff "${row.staff}": ${row.mismatchFields.join(', ')}`,
            )
            .toEqual([]);
        }
        for (const row of detailRows) {
          expect
            .soft(
              row.mismatchFields,
              `detail-panel mismatch for staff "${row.staff}": ${row.mismatchFields.join(', ')}`,
            )
            .toEqual([]);
        }
      });
    }

    await voltContext.close();
    await portalContext.close();
  });

  test.afterAll(() => {
    if (periodReports.length === 0) return;
    const outDir = path.resolve(__dirname, '../../reports/staff-payroll');
    fs.mkdirSync(outDir, { recursive: true });
    const generatedAt = new Date().toISOString();
    const html = renderReport(periodReports, generatedAt);
    const dateStamp = generatedAt.slice(0, 10);
    fs.writeFileSync(path.join(outDir, `compare-${dateStamp}.html`), html, 'utf-8');
    fs.writeFileSync(path.join(outDir, 'compare-latest.html'), html, 'utf-8');
    // eslint-disable-next-line no-console
    console.log(`Staff Payroll compare report: ${path.join(outDir, 'compare-latest.html')}`);
  });
});
