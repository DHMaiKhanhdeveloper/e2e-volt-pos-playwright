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
import type { ChartCard } from '@pages/pos/DailySaleReportPage';

/**
 * Daily Sale Report — "one big test" suite (Home contract).
 *
 * Every check runs as a test.step on a SINGLE session (navigate + unlock once).
 * Results accumulate and render to reports/income-daily/income-daily-scan.{html,json}.
 * Data-dependent checks self-skip (SkipCheck) so the run stays green on an empty day.
 * Run report-only with I18N_LENIENT=1 to avoid the soft-fail gate.
 */
test.describe(`Daily Sale Report — full scan ${Tag.REGRESSION} ${Tag.UI}`, () => {
  test('TC-DSR-ALL: Daily Sale Report — full check', async ({
    dailySaleReportPage,
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
        // Screenshot the screen as it looks at the end of this case (Home-style).
        const shot = await captureShot(page);
        results.push({ id, title, status, detail, shot });
      });
    };

    // Navigate + unlock ONCE — all checks run continuously on this session.
    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    await check('TC-1', 'default filter = Today, layout renders', async () => {
      await expect(dailySaleReportPage.heading).toBeVisible();
      // from/to are shop-TZ epochs, so only assert their presence (not an exact value).
      await expect(page).toHaveURL(/from=\d+&to=\d+/);
      return 'heading + from/to present';
    });

    // Note: the app renders the tip card heading as "Total tip" (lowercase t),
    // so it's matched with a case-insensitive regex rather than the strict
    // ChartCard label used by the other three cards.
    await check('TC-3/5/9', 'stat cards visible with descriptions', async () => {
      for (const name of ['Total Order', 'Sale', 'Total Payment'] as ChartCard[]) {
        await expect(dailySaleReportPage.card(name)).toBeVisible();
        await expect(dailySaleReportPage.cardDescription(name)).toBeVisible();
      }
      await expect(page.getByRole('heading', { level: 4, name: /Total tip/i })).toBeVisible();
      return '4 cards + always-visible <p> descriptions';
    });

    await check('TC-10', 'every card shows a % vs Yesterday label', async () => {
      for (const name of ['Total Order', 'Sale', 'Total Payment'] as ChartCard[]) {
        await expect(dailySaleReportPage.cardPercentage(name)).toContainText('%');
      }
      return 'cards carry a %-vs-Yesterday badge';
    });

    await check('TC-11', 'defaults to the Sale chart on first load', async () => {
      expect(dailySaleReportPage.activeChartFromUrl()).toBe('sale');
    });

    await check('TC-27', 'clicking Total Payment card switches the active chart', async () => {
      await dailySaleReportPage.clickCard('Total Payment');
      expect(dailySaleReportPage.activeChartFromUrl()).toBe('totalPayment');
      // cleanup: restore default Sale chart for the next checks
      await dailySaleReportPage.clickCard('Sale');
      return 'chart switch + restored to Sale';
    });

    await check('TC-25', 'Print button is enabled', async () => {
      await expect(dailySaleReportPage.printButton).toBeEnabled();
    });

    await check('TC-14', 'first order row (if any) matches OD…', async () => {
      const code = await dailySaleReportPage.firstOrderCode();
      if (!code) throw new SkipCheck('No orders for today.');
      expect(code).toMatch(/OD\d{6}-\d+/);
      return code;
    });

    await check('TC-19/20', 'Income & Payment Details panels render money values', async () => {
      const income = await dailySaleReportPage.readIncomeDetailsPanel();
      const payment = await dailySaleReportPage.readPaymentDetailsPanel();
      // Income Details.Total Payment == Sale + Tip + Tax (spec identity)
      expect(income.totalPaymentCents).toBe(income.saleCents + income.tipCents + income.taxCents);
      // Payment Details.Total Payment == Amount Collected + Gift Card Redemption
      expect(payment.totalPaymentCents).toBe(
        payment.amountCollectedCents + payment.giftCardRedemptionCents,
      );
      return `income TP=${income.totalPaymentCents}¢ · payment TP=${payment.totalPaymentCents}¢`;
    });

    await check('TC-12', 'date filter controls (Today + calendar) present', async () => {
      await expect(dailySaleReportPage.todayButton).toBeVisible();
      await expect(page.getByRole('button', { name: /\d{2}\/\d{2}\/\d{4}/ }).first()).toBeVisible();
      return 'Today button + MM/DD/YYYY calendar button';
    });

    // ---- report (Home contract) ----
    const generatedAt = new Date().toISOString();
    const { html, htmlPath } = writeCheckReport('income-daily', results, {
      screen: 'Daily Sale Report',
      route: '/incomes/income-daily',
      generatedAt,
    });
    await test.info().attach('income-daily-scan.html', { body: html, contentType: 'text/html' });

    const s = summarize(results);
    const failed = results.filter((r) => r.status === 'fail');
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Daily Sale Report — ${s.pass}/${s.total} pass · ${s.fail} fail · ${s.skip} skip ===\n` +
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
