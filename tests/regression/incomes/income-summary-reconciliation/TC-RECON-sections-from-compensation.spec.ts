import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import {
  computeSectionsFromCompensation,
  type CompRate,
  type StaffIncomeForSections,
} from '@domains/income/incomeSummaryFromCompensation';
import type { StaffCompensation } from '@pages/settings/EmployeeSettingsPage';

/**
 * Income Summary sections FROM staff compensation (VP-1048).
 *
 * Combines the two earlier pieces:
 *   • Settings → Compensation (`staff-compensation-latest.json`) — the rates, and
 *   • the settled per-staff income API — each staff's service revenue + supply fee,
 * to DERIVE each staff's contribution to the Income Summary's Supply Fee, Staff
 * Payout and Salon Earnings:
 *
 *   net service     = Total Service − Supply Fee
 *   staff commission = net service × serviceStaffRate%      (Staff Payout)
 *   salon commission = net service − staff commission       (Salon Earnings)
 *
 * The derived staff commission is checked against the backend's per-staff
 * `staffCommission` (the source of truth). Aggregates are the CONTRIBUTIONS of
 * the staff we have compensation for (the day's order-staff), not whole-store
 * totals. Reads only — needs `staff-compensation-latest.json` (run the staff
 * compensation spec first).
 */
test.describe(`Income Summary sections from compensation ${Tag.REGRESSION}`, () => {
  test('TC-RECON: derive Supply Fee / Staff Payout / Salon Earnings from compensation', async ({
    reportService,
  }) => {
    const compFile = path.resolve('reports', 'income-summary', 'staff-compensation-latest.json');
    test.skip(!existsSync(compFile), 'Run TC-RECON-staff-compensation first to produce the JSON');

    const compDoc = JSON.parse(readFileSync(compFile, 'utf8')) as {
      compensation: StaffCompensation[];
    };
    const compByStaffId: Record<string, CompRate> = {};
    for (const c of compDoc.compensation) {
      if (c.found && c.staffId) {
        compByStaffId[c.staffId] = {
          staffId: c.staffId,
          staff: c.staff,
          compensationType: c.compensationType,
          serviceStaffPct: c.serviceStaffPct,
        };
      }
    }
    expect(Object.keys(compByStaffId).length, 'compensation rows with staffId').toBeGreaterThan(0);

    // Settled per-staff income for the most recent day that has data.
    let income: StaffIncomeForSections[] = [];
    let incomeDate = new Date().toISOString().slice(0, 10);
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const rows = await reportService.getStaffDailyIncomeListSettled(d);
      if (rows.length > 0) {
        income = rows;
        incomeDate = d.toISOString().slice(0, 10);
        break;
      }
    }
    test.skip(income.length === 0, 'No settled per-staff income in the last 14 days');

    const sections = computeSectionsFromCompensation(income, compByStaffId);
    test.skip(sections.matchedStaff === 0, 'None of the compensation staff worked the settled day');

    const json = {
      meta: {
        source:
          'Income Summary sections derived from Settings compensation + settled per-staff income',
        compensationFile: 'staff-compensation-latest.json',
        incomeDate,
        generatedAt: new Date().toISOString(),
        amountsIn: 'cents (USD)',
        formula:
          'staff commission = (Total Service − Supply Fee) × serviceStaffRate%; salon commission = net service − staff commission',
      },
      matchedStaff: sections.matchedStaff,
      commissionVerified: `${sections.commissionVerified}/${sections.matchedStaff}`,
      supplyFee: sections.supplyFee,
      staffPayout: sections.staffPayout,
      salonEarnings: sections.salonEarnings,
      perStaff: sections.perStaff,
    };

    const outDir = path.resolve('reports', 'income-summary');
    mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, `income-summary-sections-${incomeDate}.json`);
    const body = JSON.stringify(json, null, 2);
    writeFileSync(jsonPath, body, 'utf8');
    writeFileSync(path.join(outDir, 'income-summary-sections-latest.json'), body, 'utf8');
    // eslint-disable-next-line no-console
    console.log(
      `Sections written to ${jsonPath} · matched ${sections.matchedStaff} staff · ` +
        `commission verified ${sections.commissionVerified}/${sections.matchedStaff} · ` +
        `Staff Payout commission ${sections.staffPayout.commissionCents} cents · ` +
        `Salon service commission ${sections.salonEarnings.serviceCommissionCents} cents · ` +
        `Supply Fee ${sections.supplyFee.totalCents} cents`,
    );
    await test
      .info()
      .attach('income-summary-sections.json', { body, contentType: 'application/json' });

    // The compensation-derived commission must match the backend for staff that
    // have a commission rate (salary-only staff have no service commission rule).
    const rated = sections.perStaff.filter((s) => s.serviceRatePct !== null);
    expect(sections.commissionVerified, 'derived commission == API for rated staff').toBe(
      rated.length,
    );
  });
});
