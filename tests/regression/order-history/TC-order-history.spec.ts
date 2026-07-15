import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { Urls } from '@constants/urls';
import {
  type CheckResult,
  SkipCheck,
  summarize,
  writeCheckReport,
} from '@domains/reporting/checkReport';

/**
 * Order History (`/order-history`) — ONE big test, Home-style, CONTINUOUS.
 *
 * Source: docs/testcases/order-history-testcases.md (TC-OH-01..20). Every TC runs
 * as a `test.step` inside a single test, so one run produces one report — the Home
 * i18n deep scan contract. A self-contained HTML + JSON report is written to
 * reports/order-history/order-history-scan.{html,json} and attached to the run.
 *
 * CONTINUOUS FLOW: navigate ONCE, then every check runs back-to-back on the same
 * session (no re-navigation per check) — faster and closer to real UX. On the
 * detail route `/order-history/<id>` the list stays rendered on the left, so
 * opening an order never loses the list. Each state-changing check self-cleans
 * (clearSearch after a search; Escape after opening a dialog) so the next check
 * starts from a clean surface. Order-dependent checks self-skip when the seed has
 * no matching order.
 *
 * A check that throws SkipCheck is recorded as skip; any other throw (failed
 * expect) is recorded as fail and enumerated — the suite never aborts. Set
 * I18N_LENIENT=1 for an info-only run.
 *
 * SAFETY: single-worker against shared, real backend state. Destructive dialogs
 * (Refund / Cancel) are only OPENED then dismissed with Escape — no "Confirm"
 * button is ever pressed, so no order is mutated.
 */
test.describe(`Order History — screen scan ${Tag.REGRESSION} ${Tag.UI}`, () => {
  test('TC-OH-ALL: Order History screen — full check', async ({ orderHistoryPage, page }) => {
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
        } finally {
          // Safety net: never let one check's stray dialog cascade into the next.
          await orderHistoryPage.ensureNoModal().catch(() => {});
        }
      });
    };

    // Navigate ONCE; every check runs continuously on this session.
    await orderHistoryPage.goto();
    // Best-effort settle: give the list a moment to populate before checks read it
    // (avoids spurious skips when the backend is slow, without failing if empty).
    await orderHistoryPage.orderCards
      .first()
      .waitFor({ state: 'visible', timeout: 8_000 })
      .catch(() => {});

    // --- List-level checks (no order selected yet) ---------------------------

    await check(
      'TC-OH-01',
      'page loads with toolbar (title, date filter, Filter, Search)',
      async () => {
        await expect(page.getByRole('heading', { name: /Order History/i }).first()).toBeVisible();
        await expect(orderHistoryPage.filterButton).toBeVisible();
        await expect(orderHistoryPage.searchInput).toBeVisible();
        await expect(
          page
            .locator('button')
            .filter({ hasText: /\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}/ }),
        ).toBeVisible();
      },
    );

    await check('TC-OH-02', 'order list renders cards with code / amount / time', async () => {
      const count = await orderHistoryPage.orderCardCount();
      if (count === 0) throw new SkipCheck('No orders in the current date range');
      await expect(
        page.getByRole('heading', { name: /[A-Z][a-z]{2} \d{1,2}, \d{4}/ }).first(),
      ).toBeVisible();
      const cardText = (await orderHistoryPage.orderCards.first().textContent()) ?? '';
      expect(cardText).toMatch(/OD\d{6}-\d+/);
      expect(cardText).toMatch(/\$\d/);
      expect(cardText).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      return `${count} card(s)`;
    });

    // Must run BEFORE any order is opened (empty state only shows with no selection).
    await check('TC-OH-03', 'empty detail panel before selecting an order', async () => {
      await expect(orderHistoryPage.emptyDetailMessage).toBeVisible();
    });

    await check('TC-OH-20', 'default list excludes pending orders', async () => {
      const n = await orderHistoryPage.orderCardCount();
      if (n === 0) throw new SkipCheck('No orders in range');
      for (let i = 0; i < n; i++) {
        await expect(orderHistoryPage.orderCards.nth(i)).not.toContainText(/Pending/i);
      }
      return `${n} card(s) checked`;
    });

    // --- Search checks (self-clean with clearSearch) -------------------------

    await check('TC-OH-10', 'search by order code narrows the list (partial match)', async () => {
      const code = await orderHistoryPage.firstOrderCode();
      if (!code) throw new SkipCheck('No orders to search');
      const partial = code.split('-')[1].slice(0, 4);
      await orderHistoryPage.search(partial);
      const cards = orderHistoryPage.orderCards;
      await expect(cards.first()).toBeVisible();
      const n = await cards.count();
      for (let i = 0; i < n; i++) await expect(cards.nth(i)).toContainText(partial);
      await orderHistoryPage.clearSearch(); // cleanup → restore full list
      return `filtered by "${partial}" → ${n} card(s)`;
    });

    await check('TC-OH-11', 'search with no match yields an empty list', async () => {
      await orderHistoryPage.search('ZZZNOMATCH999');
      await expect(orderHistoryPage.orderCards).toHaveCount(0);
      await orderHistoryPage.clearSearch(); // cleanup → restore full list
    });

    // --- Filter dialog / date picker (self-clean with Escape) ----------------

    await check(
      'TC-OH-12',
      'Filter dialog opens with Sort / Staff / Payment / Status groups',
      async () => {
        await orderHistoryPage.openFilter();
        const dialog = orderHistoryPage.filterDialog;
        await expect(dialog.getByText(/Sort by/i).first()).toBeVisible();
        await expect(dialog.getByText(/Staff/i).first()).toBeVisible();
        await expect(dialog.getByText(/Payment method/i).first()).toBeVisible();
        await expect(dialog.getByText(/^Status$/i).first()).toBeVisible();
        await orderHistoryPage.dismissActiveDialog(); // close filter dialog
      },
    );

    await check('TC-OH-13', 'Filter dialog exposes the four payment-method options', async () => {
      await orderHistoryPage.openFilter();
      await orderHistoryPage.openFilterPaymentMethods();
      for (const pm of ['Card', 'Cash', 'Gift Card', 'Other']) {
        await expect(page.getByRole('checkbox', { name: pm, exact: true })).toBeVisible();
      }
      await orderHistoryPage.dismissActiveDialog(); // close popover + filter dialog
    });

    await check(
      'TC-OH-14',
      'Filter dialog lists settled/unsettled statuses separately',
      async () => {
        await orderHistoryPage.openFilter();
        await orderHistoryPage.openFilterStatuses();
        for (const status of ['Successful - Unsettled', 'Successful - Settled', 'Canceled']) {
          await expect(page.getByRole('checkbox', { name: status, exact: true })).toBeVisible();
        }
        await orderHistoryPage.dismissActiveDialog(); // close popover + filter dialog
      },
    );

    await check('TC-OH-15', 'Filter dialog has Clear + Confirm and closes safely', async () => {
      await orderHistoryPage.openFilter();
      const dialog = orderHistoryPage.filterDialog;
      await expect(dialog.getByRole('button', { name: /Clear|Xoá/i })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /Confirm|Apply|Xác nhận/i })).toBeVisible();
      await orderHistoryPage.dismissActiveDialog();
      await expect(dialog).toBeHidden();
    });

    await check(
      'TC-OH-16',
      'date picker opens a calendar with Today / Cancel / Apply',
      async () => {
        await orderHistoryPage.openDatePicker();
        const cal = orderHistoryPage.datePickerPopover;
        await expect(cal.getByRole('button', { name: /^Today$/i })).toBeVisible();
        await expect(cal.getByRole('button', { name: /^Cancel$/i })).toBeVisible();
        await expect(cal.getByRole('button', { name: /^Apply$/i })).toBeVisible();
        await orderHistoryPage.dismissActiveDialog(); // close calendar
      },
    );

    // --- Detail-level checks (open an order; the list persists on the left) ---

    await check('TC-OH-04', 'selecting an order opens its detail page', async () => {
      if ((await orderHistoryPage.orderCardCount()) === 0) throw new SkipCheck('No orders to open');
      await orderHistoryPage.openFirstOrder();
      await expect(page).toHaveURL(/\/order-history\/[^?]+/);
      await expect(orderHistoryPage.receiptButton).toBeVisible();
    });

    await check('TC-OH-05', 'detail shows Order Information fields', async () => {
      if ((await orderHistoryPage.orderCardCount()) === 0) throw new SkipCheck('No orders to open');
      await orderHistoryPage.openFirstOrder();
      await expect(orderHistoryPage.detailText(/Order Information/i)).toBeVisible();
      for (const label of ['Status', 'Order ID', 'Cashier', 'Order Date', 'Customer', 'Phone']) {
        await expect(orderHistoryPage.detailText(new RegExp(`^${label}$`, 'i'))).toBeVisible();
      }
    });

    await check('TC-OH-06', 'detail shows Order Summary breakdown', async () => {
      if ((await orderHistoryPage.orderCardCount()) === 0) throw new SkipCheck('No orders to open');
      await orderHistoryPage.openFirstOrder();
      await expect(orderHistoryPage.detailText(/Order Summary/i)).toBeVisible();
      for (const label of ['Subtotal', 'Total Discount', 'Tax', 'Tip', 'Total']) {
        await expect(orderHistoryPage.detailText(new RegExp(`^${label}$`, 'i'))).toBeVisible();
      }
    });

    await check(
      'TC-OH-07',
      'detail shows Service Details, Payment Details and Order Note',
      async () => {
        if ((await orderHistoryPage.orderCardCount()) === 0)
          throw new SkipCheck('No orders to open');
        await orderHistoryPage.openFirstOrder();
        await expect(orderHistoryPage.detailText(/Service Details/i)).toBeVisible();
        await expect(orderHistoryPage.detailText(/Payment Details/i)).toBeVisible();
        await expect(orderHistoryPage.detailText(/Order Note/i)).toBeVisible();
      },
    );

    await check('TC-OH-08', 'a settled order exposes Receipt + Refund actions', async () => {
      // /Settled/ alone also matches "Unsettled" — anchor to the full label.
      const found = await orderHistoryPage.openFirstOrderWithStatus(/Successful - Settled/i);
      if (!found) throw new SkipCheck('No settled order in the current range');
      await expect(orderHistoryPage.receiptButton).toBeVisible();
      await expect(orderHistoryPage.refundButton).toBeVisible();
    });

    await check('TC-OH-09', 'a closed order (Canceled/Refunded) exposes only Receipt', async () => {
      const found = await orderHistoryPage.openFirstOrderWithStatus(/Canceled|Refunded/i);
      if (!found) throw new SkipCheck('No canceled/refunded order in the current range');
      await expect(orderHistoryPage.receiptButton).toBeVisible();
      await expect(orderHistoryPage.refundButton).toHaveCount(0);
      await expect(orderHistoryPage.cancelButton).toHaveCount(0);
    });

    await check('TC-OH-17', 'Receipt dialog opens and closes safely', async () => {
      if ((await orderHistoryPage.orderCardCount()) === 0) throw new SkipCheck('No orders to open');
      await orderHistoryPage.openFirstOrder();
      await orderHistoryPage.openReceipt();
      await expect(orderHistoryPage.anyDialog.last()).toBeVisible();
      await orderHistoryPage.dismissActiveDialog(); // close receipt dialog
    });

    await check('TC-OH-18', 'Refund dialog opens then is dismissed WITHOUT refunding', async () => {
      const found = await orderHistoryPage.openFirstOrderWithStatus(/Successful - Settled/i);
      if (!found) throw new SkipCheck('No settled order to open the refund dialog on');
      if (!(await orderHistoryPage.canRefund()))
        throw new SkipCheck('Refund not available on this order');
      await orderHistoryPage.openRefundDialogOnly();
      await expect(orderHistoryPage.anyDialog.last()).toBeVisible();
      await orderHistoryPage.dismissActiveDialog(); // Escape — never Confirm
      await expect(orderHistoryPage.receiptButton).toBeVisible();
    });

    await check(
      'TC-OH-19',
      'Cancel dialog opens then is dismissed WITHOUT cancelling',
      async () => {
        const found = await orderHistoryPage.openFirstOrderWithStatus(/Successful - Unsettled/i);
        if (!found) throw new SkipCheck('No unsettled order to open the cancel dialog on');
        if (!(await orderHistoryPage.canCancel()))
          throw new SkipCheck('Cancel not available on this order');
        await orderHistoryPage.openCancelDialogOnly();
        await expect(orderHistoryPage.anyDialog.last()).toBeVisible();
        await orderHistoryPage.dismissActiveDialog(); // Escape — never Confirm Cancel
        await expect(orderHistoryPage.receiptButton).toBeVisible();
      },
    );

    // --- Report (Home-style: single HTML + JSON, attached to the run) --------
    const generatedAt = new Date().toISOString();
    const { html, htmlPath } = writeCheckReport('order-history', results, {
      screen: 'Order History',
      route: Urls.ORDER_HISTORY,
      generatedAt,
    });
    await test.info().attach('order-history-scan.html', { body: html, contentType: 'text/html' });

    const s = summarize(results);
    const failed = results.filter((r) => r.status === 'fail');
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Order History — ${s.pass}/${s.total} pass · ${s.fail} fail · ${s.skip} skip ===\n` +
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
