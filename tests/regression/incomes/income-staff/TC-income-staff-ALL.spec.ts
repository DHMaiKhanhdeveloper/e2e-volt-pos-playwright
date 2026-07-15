import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import {
  type CheckResult,
  type CheckStatus,
  captureShot,
  SkipCheck,
  summarize,
  writeCheckReport,
} from '@domains/reporting/checkReport';
import type { StaffIncomeStat } from '@pages/pos/IncomeStaffPage';

/**
 * Staff Income — "one big test" suite (Home contract).
 *
 * Navigate + unlock once, then run every check as a step on the same session.
 * Renders reports/income-staff/income-staff-scan.{html,json}. Data-dependent
 * checks self-skip. Report-only with I18N_LENIENT=1.
 */
const STAT_LABELS: StaffIncomeStat[] = [
  'Total staff',
  'Total orders',
  'Total subtotal',
  'Total supply fee',
  'Total tip',
  'Total staff income',
];
const USD = /^-?\$[\d,]+\.\d{2}$/;

test.describe(`Staff Income — full scan ${Tag.REGRESSION} ${Tag.UI}`, () => {
  test('TC-IST-ALL: Staff Income — full check', async ({
    incomeStaffPage,
    passcodeDialog,
    page,
  }) => {
    test.setTimeout(180_000);
    const results: CheckResult[] = [];

    const check = async (id: string, title: string, fn: () => Promise<string | void>) => {
      await test.step(`${id}: ${title}`, async () => {
        let status: CheckStatus = 'pass';
        let detail: string | undefined;
        try {
          detail = (await fn()) || undefined;
        } catch (e) {
          if (e instanceof SkipCheck) {
            status = 'skip';
            detail = e.message;
          } else {
            status = 'fail';
            detail = (e as Error).message;
          }
        }
        const shot = await captureShot(page);
        results.push({ id, title, status, detail, shot });
      });
    };

    await incomeStaffPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await incomeStaffPage.waitForReady();

    await check('TC-IST-02', 'heading "Staff Income" visible after unlock', async () => {
      await expect(incomeStaffPage.heading).toBeVisible();
    });

    await check('TC-IST-03', 'default filter Today carries from/to in URL', async () => {
      await expect(page).toHaveURL(/from=\d+/);
      await expect(page).toHaveURL(/to=\d+/);
    });

    await check('TC-IST-04', 'aggregate bar shows all 6 stats', async () => {
      for (const label of STAT_LABELS) await expect(incomeStaffPage.statLabel(label)).toBeVisible();
      return '6 stats present';
    });

    await check('TC-IST-05', 'Search staff box accepts input', async () => {
      await incomeStaffPage.searchStaff('Anna');
      await expect(incomeStaffPage.searchInput).toHaveValue('Anna');
      // cleanup
      await incomeStaffPage.searchStaff('');
    });

    await check('TC-IST-06', 'period preset defaults to Today', async () => {
      expect(await incomeStaffPage.periodDropdownText()).toContain('Today');
    });

    await check('TC-IST-12', 'aggregate money stats render as $#,##0.00', async () => {
      for (const label of [
        'Total subtotal',
        'Total supply fee',
        'Total tip',
        'Total staff income',
      ] as StaffIncomeStat[]) {
        expect(await incomeStaffPage.readStatValue(label)).toMatch(USD);
      }
      return 'USD formatting OK';
    });

    await check('TC-IST-08', 'detail panel empty until a staff is selected', async () => {
      if ((await incomeStaffPage.rowCount()) > 0) {
        throw new SkipCheck('Staff rows present — empty-detail state not applicable.');
      }
      await expect(incomeStaffPage.noDetail).toBeVisible();
    });

    await check('TC-IST-13', 'staff listing exposes the 6 columns', async () => {
      if ((await incomeStaffPage.rowCount()) === 0) throw new SkipCheck('No staff rows today.');
      const headers = (await incomeStaffPage.headerLabels()).join(' | ');
      for (const col of ['Staff', 'Orders', 'Subtotal', 'Supply', 'Tip', 'Total']) {
        expect(headers).toContain(col);
      }
      return headers;
    });

    await check('TC-IST-15', 'clicking a staff opens detail with Print enabled', async () => {
      if ((await incomeStaffPage.rowCount()) === 0) throw new SkipCheck('No staff rows today.');
      await incomeStaffPage.openStaffDetail(0);
      await expect(incomeStaffPage.printButton).toBeEnabled();
    });

    await check('TC-IST-18', 'Total staff income = Σ per-staff Total Income', async () => {
      const count = await incomeStaffPage.rowCount();
      if (count === 0) throw new SkipCheck('No staff rows today.');
      const toCents = (v: string): number =>
        Math.round(parseFloat(v.replace(/[^0-9.-]/g, '')) * 100) || 0;
      let sum = 0;
      for (let i = 0; i < count; i++)
        sum += toCents((await incomeStaffPage.readRow(i)).totalIncome);
      expect(toCents(await incomeStaffPage.readStatValue('Total staff income'))).toBe(sum);
      return `${count} staff summed`;
    });

    // ---- report (Home contract) ----
    const generatedAt = new Date().toISOString();
    const { html, htmlPath } = writeCheckReport('income-staff', results, {
      screen: 'Staff Income',
      route: '/incomes/income-staff',
      generatedAt,
    });
    await test.info().attach('income-staff-scan.html', { body: html, contentType: 'text/html' });

    const s = summarize(results);
    const failed = results.filter((r) => r.status === 'fail');
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Staff Income — ${s.pass}/${s.total} pass · ${s.fail} fail · ${s.skip} skip ===\n` +
        results.map((r) => `  [${r.status.toUpperCase()}] ${r.id} ${r.title}`).join('\n') +
        `\nBáo cáo: ${htmlPath}\n`,
    );

    if (process.env.I18N_LENIENT !== '1') {
      for (const f of failed) {
        expect.soft(f.status, `${f.id} "${f.title}": ${f.detail}`).not.toBe('fail');
      }
    }
  });
});
