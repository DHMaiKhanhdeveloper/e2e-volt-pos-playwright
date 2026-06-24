import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import type { StaffCompensation } from '@pages/settings/EmployeeSettingsPage';

/**
 * Staff Compensation → JSON (approach 1, UI scrape via Settings → Employees).
 *
 * For each staff member in the list, search the employee list, open the staff,
 * read the Compensation tab (service / product / gift-card staff %, card-fee %,
 * pay split), and write everything to
 * `reports/income-summary/staff-compensation-<date>.json`.
 *
 * Staff list source (first that exists):
 *   1. `reports/income-summary/staff-names.json` — a JSON array of names
 *      (e.g. produced from the day's orders), or
 *   2. the built-in DEFAULT_STAFF below (the staff seen on today's orders).
 *
 * Settings → Employees is NOT passcode-gated, so this spec is fast and doesn't
 * depend on the Daily Sale Report. The compensation it captures is the INPUT the
 * Income Summary "Staff Payout" is derived from (payout ≈ service × rate).
 */
const DEFAULT_STAFF = [
  'APIB1778506575 abc',
  'Althea Schroeder',
  'Teri Jennings',
  'Emma2',
  'Luna',
  'Bell',
  'Thomassssss13',
  'Harley',
  'Olivia2',
  'Lizzie Wade',
  'Lami',
  'Amelia',
  'Erin',
];

const loadStaffNames = (): string[] => {
  const file = path.resolve('reports', 'income-summary', 'staff-names.json');
  if (existsSync(file)) {
    try {
      const arr = JSON.parse(readFileSync(file, 'utf8'));
      if (Array.isArray(arr) && arr.every((x) => typeof x === 'string') && arr.length > 0) {
        return arr;
      }
    } catch {
      // fall through to default
    }
  }
  return DEFAULT_STAFF;
};

test.describe(`Staff Compensation from Settings → JSON ${Tag.REGRESSION}`, () => {
  test('TC-RECON: scrape each staff compensation → JSON', async ({ employeeSettingsPage }) => {
    test.setTimeout(180_000);

    const staffNames = loadStaffNames();
    await employeeSettingsPage.goto();

    const compensation: StaffCompensation[] = [];
    for (const name of staffNames) {
      compensation.push(await employeeSettingsPage.readCompensationFor(name));
    }

    const reportDate = new Date().toISOString().slice(0, 10);
    const json = {
      meta: {
        source: 'Settings → Employees → Compensation (UI scrape via Playwright)',
        url: 'http://localhost:1420/settings/staffs',
        reportDate,
        scrapedAt: new Date().toISOString(),
        note: 'Percentages are the configured compensation rules — the input the Income Summary Staff Payout is derived from.',
      },
      staffCount: compensation.length,
      foundCount: compensation.filter((c) => c.found).length,
      compensation,
    };

    const outDir = path.resolve('reports', 'income-summary');
    mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, `staff-compensation-${reportDate}.json`);
    const body = JSON.stringify(json, null, 2);
    writeFileSync(jsonPath, body, 'utf8');
    writeFileSync(path.join(outDir, 'staff-compensation-latest.json'), body, 'utf8');
    // eslint-disable-next-line no-console
    console.log(
      `Staff compensation written to ${jsonPath} (${json.foundCount}/${json.staffCount} found)`,
    );
    await test.info().attach('staff-compensation.json', { body, contentType: 'application/json' });

    expect(json.foundCount, 'read compensation for at least one staff').toBeGreaterThan(0);
  });
});
