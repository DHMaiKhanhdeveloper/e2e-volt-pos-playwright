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
} from '@utils/checkReport';
import type { DetailSection, GroupBy } from '@pages/pos/IncomeSummaryPage';

/**
 * Income Summary — "one big test" suite (Home contract).
 *
 * Navigate + unlock once, then run every check as a step on the same session.
 * Renders reports/income-summary/income-summary-scan.{html,json}. Data-dependent
 * checks self-skip. Report-only with I18N_LENIENT=1.
 */
test.describe(`Income Summary — full scan ${Tag.REGRESSION} ${Tag.UI}`, () => {
  test('TC-IS-ALL: Income Summary — full check', async ({
    incomeSummaryPage,
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

    await incomeSummaryPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await incomeSummaryPage.waitForReady();

    await check('TC-1', 'heading + Total Income render', async () => {
      await expect(incomeSummaryPage.heading).toBeVisible();
      await expect(incomeSummaryPage.totalIncomeHeading).toBeVisible();
    });

    await check('TC-2', 'period preset defaults to Today', async () => {
      expect(await incomeSummaryPage.periodDropdownText()).toContain('Today');
    });

    await check('TC-3', 'Day/Week/Month tabs present; Day selected', async () => {
      for (const t of ['Day', 'Week', 'Month'] as GroupBy[]) {
        await expect(incomeSummaryPage.groupByTab(t)).toBeVisible();
      }
      expect(await incomeSummaryPage.isGroupBySelected('Day')).toBe(true);
    });

    await check('TC-6', 'switching to Week updates the URL groupBy', async () => {
      await incomeSummaryPage.selectGroupBy('Week');
      expect(incomeSummaryPage.groupByFromUrl()).toBe('Week');
      // cleanup: back to Day
      await incomeSummaryPage.selectGroupBy('Day');
      return 'groupBy toggled Week→Day';
    });

    await check('TC-9', 'chart legend shows Gross / Net / Total tip', async () => {
      for (const name of ['Gross Income', 'Net Income'] as const) {
        await expect(incomeSummaryPage.legendItem(name)).toBeVisible();
      }
      // The app renders the tip legend as "Total tip" (lowercase t).
      await expect(incomeSummaryPage.page.getByText(/^Total tip$/i).first()).toBeVisible();
    });

    await check('TC-15', 'summary table header = Date/Sale/Tip/Tax/Total Payment', async () => {
      const headers = (await incomeSummaryPage.headerLabels()).join(' | ');
      for (const col of ['Date', 'Sale', 'Tip', 'Tax', 'Total Payment']) {
        expect(headers).toContain(col);
      }
      return headers;
    });

    await check('TC-20', 'clicking a period opens the detail with all 5 sections', async () => {
      if ((await incomeSummaryPage.rowCount()) === 0) throw new SkipCheck('No period rows.');
      await incomeSummaryPage.openPeriodDetail(0);
      for (const sec of [
        'Payment Details',
        'Sale Details',
        'Supply Fee',
        'Staff Payout',
        'Salon Earnings',
      ] as DetailSection[]) {
        await expect(incomeSummaryPage.sectionHeading(sec)).toBeVisible();
      }
      return '5 detail sections rendered';
    });

    await check('TC-25', 'Print button enabled in the detail panel', async () => {
      if (!(await incomeSummaryPage.printButton.isVisible().catch(() => false))) {
        throw new SkipCheck('Detail panel not open (no period selected).');
      }
      await expect(incomeSummaryPage.printButton).toBeEnabled();
    });

    await check('TC-56', 'detail sections scrape into ordered rows', async () => {
      if (!(await incomeSummaryPage.printButton.isVisible().catch(() => false))) {
        throw new SkipCheck('Detail panel not open.');
      }
      const sections = await incomeSummaryPage.readDetailSections();
      expect(sections.length).toBeGreaterThanOrEqual(5);
      return `${sections.length} sections, ${sections.reduce((n, s) => n + s.rows.length, 0)} rows`;
    });

    // ---- report (Home contract) ----
    const generatedAt = new Date().toISOString();
    const { html, htmlPath } = writeCheckReport('income-summary', results, {
      screen: 'Income Summary',
      route: '/incomes/income-summary',
      generatedAt,
    });
    await test.info().attach('income-summary-scan.html', { body: html, contentType: 'text/html' });

    const s = summarize(results);
    const failed = results.filter((r) => r.status === 'fail');
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Income Summary — ${s.pass}/${s.total} pass · ${s.fail} fail · ${s.skip} skip ===\n` +
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
