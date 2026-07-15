import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { Urls } from '@constants/urls';
import { ORDER_CODE_RE } from '@pages/pos/OrderPendingPage';
import {
  type CheckResult,
  SkipCheck,
  summarize,
  writeCheckReport,
} from '@domains/reporting/checkReport';

/**
 * Order Pending queue (`/order-pending`) — ONE big test, Home-style.
 *
 * Source: docs/testcases/order-pending-testcases.md (TC-OP-01..11). Instead of
 * 11 separate tests, every TC runs as a `test.step` inside a single test, so
 * one run produces one report — mirroring the Home i18n deep scan contract.
 * Results accumulate and a self-contained HTML + JSON report is written to
 * reports/order-pending/order-pending-scan.{html,json} and attached to the run.
 *
 * Continuous flow: navigate to the screen ONCE, then run every check back-to-back
 * as steps on the SAME session (no per-check re-navigation). Steps that mutate
 * state clean up after themselves (clear search, reset sort, return to the
 * screen) so the next step starts from a known state. A check that throws
 * SkipCheck is recorded as skip; any other throw (failed expect) is recorded as
 * fail and enumerated — the suite never aborts on the first failure. Set
 * I18N_LENIENT=1 for an info-only run.
 */
test.describe(`Order Pending — queue scan ${Tag.REGRESSION} ${Tag.UI}`, () => {
  test('TC-OP-ALL: Order Pending queue — full check', async ({ orderPendingPage, page }) => {
    test.setTimeout(180_000);

    const results: CheckResult[] = [];

    /** Run one check as a step; capture pass/skip/fail without aborting. */
    const check = async (
      id: string,
      title: string,
      fn: () => Promise<string | void>,
    ): Promise<void> => {
      await test.step(`${id}: ${title}`, async () => {
        try {
          const detail = await fn();
          results.push({ id, title, status: 'pass', detail: detail || undefined });
        } catch (e) {
          if (e instanceof SkipCheck) {
            results.push({ id, title, status: 'skip', detail: e.message });
            return;
          }
          results.push({ id, title, status: 'fail', detail: (e as Error).message });
        }
      });
    };

    // Navigate ONCE — every check below runs continuously on this session.
    await orderPendingPage.goto();

    await check('TC-OP-01', 'screen loads with toolbar controls', async () => {
      await expect(orderPendingPage.heading).toBeVisible();
      await expect(orderPendingPage.searchInput).toBeVisible();
      await expect(orderPendingPage.staffFilterButton).toBeVisible();
      await expect(orderPendingPage.sortCombobox).toBeVisible();
      await expect(orderPendingPage.dateRangeCombobox).toBeVisible();
      await expect(orderPendingPage.quickCheckoutButton).toBeVisible();
    });

    await check('TC-OP-02', 'pending card exposes code + Processing status', async () => {
      const count = await orderPendingPage.orderCardCount();
      if (count === 0) throw new SkipCheck('No pending orders to inspect');
      const firstCard = orderPendingPage.orderCards().first();
      await expect(firstCard).toContainText(ORDER_CODE_RE);
      await expect(firstCard).toContainText('Processing');
      return `${count} card(s)`;
    });

    await check('TC-OP-03', 'search by order ID filters to the matching card', async () => {
      const count = await orderPendingPage.orderCardCount();
      if (count === 0) throw new SkipCheck('No pending orders to search');
      const code = await orderPendingPage.orderCodeAt(0);
      expect(code, 'first card should expose an order code').not.toBeNull();
      const fragment = code!.split('-')[1]; // 8-digit suffix
      await orderPendingPage.search(fragment);
      await expect(orderPendingPage.orderCards()).toHaveCount(1);
      await expect(orderPendingPage.orderCards().first()).toContainText(code!);
      await orderPendingPage.clearSearch(); // reset for the next step
      return `filtered to ${code}`;
    });

    await check('TC-OP-04', 'search with no match shows an empty list', async () => {
      await orderPendingPage.search('ZZZ000000');
      await expect(orderPendingPage.orderCards()).toHaveCount(0);
      await orderPendingPage.clearSearch(); // reset for the next step
    });

    await check('TC-OP-05', 'sorting Latest ↔ Oldest reverses the first card', async () => {
      const count = await orderPendingPage.orderCardCount();
      if (count < 2) throw new SkipCheck('Need at least two pending orders to compare ordering');
      await orderPendingPage.setSort('Latest');
      const latestFirst = await orderPendingPage.orderCodeAt(0);
      await orderPendingPage.setSort('Oldest');
      const oldestFirst = await orderPendingPage.orderCodeAt(0);
      expect(oldestFirst).not.toBe(latestFirst);
      await orderPendingPage.setSort('Latest'); // reset for the next step
      return `Latest=${latestFirst} · Oldest=${oldestFirst}`;
    });

    await check('TC-OP-06', 'sort combobox offers exactly Latest and Oldest', async () => {
      const options = await orderPendingPage.sortOptions();
      expect(options).toEqual(['Latest', 'Oldest']);
      return options.join(', ');
    });

    await check('TC-OP-07', 'Quick Checkout is visible and enabled', async () => {
      await expect(orderPendingPage.quickCheckoutButton).toBeVisible();
      await expect(orderPendingPage.quickCheckoutButton).toBeEnabled();
    });

    await check('TC-OP-08', 'staff filter shows a count badge', async () => {
      await expect(orderPendingPage.staffFilterButton).toBeVisible();
      await expect(orderPendingPage.staffFilterButton).toContainText(/\d+/);
      return (await orderPendingPage.staffFilterButton.innerText()).replace(/\s+/g, ' ').trim();
    });

    await check('TC-OP-09', 'date range defaults to Today with a calendar date', async () => {
      await expect(orderPendingPage.dateRangeCombobox).toContainText('Today');
      await expect(orderPendingPage.calendarButton).toContainText(/\d{2}\/\d{2}\/\d{4}/);
    });

    await check('TC-OP-10', 'header links navigate to Order History and Appointment', async () => {
      await orderPendingPage.orderHistoryLink.click();
      await expect(page).toHaveURL(new RegExp(Urls.ORDER_HISTORY));
      await orderPendingPage.goto();
      await orderPendingPage.appointmentLink.click();
      await expect(page).toHaveURL(new RegExp(Urls.APPOINTMENT));
      await orderPendingPage.goto(); // return to the screen for the next step
    });

    await check('TC-OP-11', 'an unknown order code is absent from the pending list', async () => {
      await orderPendingPage.expectOrderAbsent('OD999999-99999999');
    });

    // --- Report (Home-style: single HTML + JSON, attached to the run) --------
    const generatedAt = new Date().toISOString();
    const { html, htmlPath } = writeCheckReport('order-pending', results, {
      screen: 'Order Pending',
      route: Urls.ORDER_PENDING,
      generatedAt,
    });
    await test.info().attach('order-pending-scan.html', { body: html, contentType: 'text/html' });

    const s = summarize(results);
    const failed = results.filter((r) => r.status === 'fail');
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Order Pending — ${s.pass}/${s.total} pass · ${s.fail} fail · ${s.skip} skip ===\n` +
        results.map((r) => `  [${r.status.toUpperCase()}] ${r.id} ${r.title}`).join('\n') +
        `\nBáo cáo: ${htmlPath}\n`,
    );

    // Gate — enumerate every failing check. I18N_LENIENT=1 → info-only.
    if (process.env.I18N_LENIENT !== '1') {
      for (const f of failed) {
        expect.soft(f.status, `${f.id} "${f.title}": ${f.detail}`).not.toBe('fail');
      }
    }
  });
});
