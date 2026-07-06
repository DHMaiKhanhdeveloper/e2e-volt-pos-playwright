import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import {
  STATIC_ROUTES,
  DIALOG_SELECTOR,
  scanRoute,
  switchToVietnamese,
  routerNavigate,
  enterPasscodeIfPrompted,
  detectBody,
  renderI18nReport,
  dedupUntranslated,
  diffStrings,
  isUntranslated,
  type RouteScan,
} from '@utils/i18nScan';
import { POPUP_DEFS, scanPopup } from '@utils/i18nPopups';
import { HOME_POPUP_DEFS, scanHomeOrderDialogs } from '@utils/i18nHome';
import {
  ORDER_HISTORY_POPUP_DEFS,
  scanOrderHistoryFilter,
  scanOrderHistoryDatePicker,
  scanOrderHistoryDetail,
} from '@utils/i18nOrderHistory';
import {
  ORDER_PENDING_POPUP_DEFS,
  scanOrderPendingFilter,
  scanOrderPendingDatePicker,
  scanOrderPendingCardOpen,
} from '@utils/i18nOrderPending';
import {
  INCOMES_POPUP_DEFS,
  scanIncomesGate,
  scanIncomesDatePicker,
  scanIncomesDetail,
} from '@utils/i18nIncomes';

/**
 * VP-462 — Vietnamese localization scan.
 *
 * Switches the app to Tiếng Việt, walks every navigable screen client-side
 * (keeping the in-memory language alive, since it is NOT persisted across a full
 * reload), and flags any screen still showing English UI text. Produces a
 * report listing exactly WHICH screens are not yet translated.
 *
 * OUTPUT — reports/i18n-audit/auto-scan.{html,json} + auto-screens/<page>.png
 *          (failing pages only). HTML has a deduped "strings to translate" list,
 *          per-failing-page thumbnails, and a run-over-run diff (new vs fixed).
 * MODE   — gate by default (fails, enumerating every untranslated screen);
 *          set I18N_LENIENT=1 for an informational run that never fails.
 */
test.describe(`i18n — Vietnamese coverage scan ${Tag.REGRESSION}`, () => {
  test('TC-I18N-VI-SCAN: list screens not yet translated to Vietnamese', async ({ page }) => {
    // 10 min: the full walk now includes deep scans for Home, Order History,
    // Order Pending and the 3 Income reports — well past the old 5-min budget.
    test.setTimeout(600_000);

    const outDir = path.resolve('reports', 'i18n-audit');
    // Dedicated dir so auto-generated shots don't mix with the manual audit's screens/.
    const screensDir = path.join(outDir, 'auto-screens');
    const slugify = (s: string): string =>
      s
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'page';

    const scans: RouteScan[] = [];

    // Push a scan; screenshot pages that FAIL i18n OR show UI vỡ (clipped text /
    // horizontal overflow). Clean, non-broken pages get no image.
    // Must be called while `page` is still on the scanned screen.
    const record = async (scan: RouteScan): Promise<void> => {
      const brokenUi = (scan.overflow?.length ?? 0) > 0 || (scan.xOverflow ?? 0) > 8;
      if (isUntranslated(scan) || brokenUi) {
        try {
          mkdirSync(screensDir, { recursive: true });
          const file = `auto-screens/${slugify(scan.route)}.png`;
          await page.screenshot({ path: path.join(outDir, file), fullPage: true });
          scan.screenshot = file;
        } catch {
          /* screenshot is best-effort */
        }
      }
      scans.push(scan);
    };

    // 1) Switch to Vietnamese (real UI click on the language radio).
    await switchToVietnamese(page);

    // The client-side router must be exposed for state-preserving navigation.
    const hasRouter = await page.evaluate(
      () => typeof (window as unknown as { __TSR_ROUTER__?: unknown }).__TSR_ROUTER__ === 'object',
    );
    expect(hasRouter, 'TanStack router (__TSR_ROUTER__) must be available for SPA navigation').toBe(
      true,
    );

    // 1b) Scan the Incomes passcode gate dialog BEFORE it's unlocked (the static
    //     route scan below enters the passcode but never scans the dialog text),
    //     then unlock so the gated income routes scan cleanly. No-op if already
    //     unlocked.
    await scanIncomesGate(page, record);

    // 2) Scan every static route.
    for (const def of STATIC_ROUTES) {
      try {
        await record(await scanRoute(page, def));
      } catch (err) {
        scans.push({
          route: def.path,
          name: def.name,
          group: def.group,
          ui: [],
          aria: [],
          overflow: [],
          stub: false,
          path: def.path,
          redirected: false,
          error: String(err).slice(0, 120),
        });
      }
    }

    // 3) Best-effort: dynamic detail pages reached by clicking the first list
    //    item. Wrapped so missing data never fails the localization scan.
    const scanDynamic = async (
      listPath: string,
      name: string,
      group: RouteScan['group'],
      clickSelector: string,
    ): Promise<void> => {
      try {
        await routerNavigate(page, listPath);
        await page.waitForTimeout(1500);
        await enterPasscodeIfPrompted(page).catch(() => {});
        const target = page.locator(clickSelector).first();
        if (!(await target.isVisible().catch(() => false))) return;
        await target.click();
        await page.waitForTimeout(1800);
        const raw = await detectBody(page);
        await record({
          ...raw,
          route: `${listPath} → chi tiết`,
          name,
          group,
          redirected: raw.path === listPath,
        });
      } catch {
        /* no data to open — skip */
      }
    };

    await scanDynamic(
      '/settings/staffs',
      'Chi tiết nhân viên',
      'Settings',
      'main a.cursor-pointer',
    );
    await scanDynamic(
      '/settings/roles',
      'Chi tiết vai trò',
      'Settings',
      'main a, main [role=button]',
    );
    await scanDynamic(
      '/settings/services',
      'Chi tiết danh mục',
      'Settings',
      'main a[href*="services/"], main a.cursor-pointer',
    );
    await scanDynamic(
      '/order-history',
      'Chi tiết đơn hàng',
      'POS',
      'main a[href*="order-history/"], main a.cursor-pointer',
    );

    // 4) Best-effort: checkout / order flow derived from any order id we can
    //    find. Includes the checkout sub-routes — note there are TWO distinct
    //    payment-success screens (one under /checkout, one at order root); the
    //    route label keeps them apart. (Login/splashscreen are intentionally
    //    out of scope here — they require a logged-out session.)
    const ORDER_SUBROUTES: { sub: string; name: string }[] = [
      { sub: 'checkout', name: 'Thanh toán (Checkout)' },
      { sub: 'checkout/view-cart', name: 'Checkout · Xem giỏ hàng' },
      { sub: 'checkout/processing-payment', name: 'Checkout · Đang xử lý thanh toán' },
      { sub: 'checkout/payment-success', name: 'Checkout · TT thành công' },
      { sub: 'payment-success', name: 'Thanh toán thành công' },
      { sub: 'split-order', name: 'Tách đơn' },
    ];
    try {
      const orderId = await page.evaluate(() => {
        const m = location.pathname.match(/order-history\/([\w-]+)/);
        return m ? m[1] : null;
      });
      if (orderId) {
        for (const { sub, name } of ORDER_SUBROUTES) {
          await routerNavigate(page, `/order/${orderId}/${sub}`);
          await page.waitForTimeout(1700);
          const raw = await detectBody(page);
          await record({
            ...raw,
            route: `/order/$id/${sub}`,
            name,
            group: 'POS',
            redirected: raw.path !== `/order/${orderId}/${sub}`,
          });
        }
      }
    } catch {
      /* checkout flow unavailable — skip */
    }

    // 4b) Best-effort: the notification bell panel + the screen a notification
    //     opens (clicking one routes to /appointment?appointmentId=…). Done last
    //     because it navigates away from the order-history detail used above.
    try {
      await routerNavigate(page, '/home');
      await page.waitForTimeout(1200);
      // The bell has no aria-label; try the small top-header icon buttons
      // right→left until the notification panel heading appears.
      const opened = await page.evaluate(async () => {
        const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
        const headingShown = (): boolean =>
          [...document.querySelectorAll('h1,h2,h3,div,span')].some((e) =>
            /^(Thông báo|Notifications)$/.test((e.textContent || '').trim()),
          );
        const btns = [...document.querySelectorAll('button')]
          .filter((b) => {
            const r = b.getBoundingClientRect();
            return r.top < 70 && r.width > 10 && r.width < 80;
          })
          .sort((a, b) => b.getBoundingClientRect().x - a.getBoundingClientRect().x);
        for (const b of btns) {
          (b as HTMLElement).click();
          await sleep(450);
          if (headingShown()) return true;
        }
        return false;
      });
      if (opened) {
        await page.waitForTimeout(500);
        await record({
          ...(await detectBody(page)),
          route: '🔔 → bảng thông báo',
          name: 'Bảng thông báo (panel)',
          group: 'System',
          redirected: false,
        });

        // Click the first notification (rows carry a language-neutral date),
        // which navigates to the appointment it refers to.
        const clicked = await page.evaluate(() => {
          const rows = [...document.querySelectorAll('div,li,a,button')].filter((e) => {
            const t = (e.textContent || '').trim();
            const r = e.getBoundingClientRect();
            return /\d{2}\/\d{2}\/\d{4}/.test(t) && t.length < 140 && r.right > 1100 && r.top < 700;
          });
          const target = rows.sort((a, b) => a.textContent!.length - b.textContent!.length)[0] as
            | HTMLElement
            | undefined;
          target?.click();
          return !!target;
        });
        if (clicked) {
          await page.waitForTimeout(1800);
          await record({
            ...(await detectBody(page)),
            route: '🔔 → chi tiết (Lịch hẹn)',
            name: 'Trang mở từ thông báo',
            group: 'System',
            redirected: false,
          });
        }
      }
    } catch {
      /* notifications unavailable — skip */
    }

    // 4c) Popups: open each registered dialog from its host route, scan the
    //     dialog portal for English, then close it. A popup that can't be opened
    //     in this session is recorded as "không mở được" and never fails the run
    //     (openable-only scope). The dialog is screenshotted while still open.
    for (const def of [
      ...POPUP_DEFS,
      ...HOME_POPUP_DEFS,
      ...ORDER_HISTORY_POPUP_DEFS,
      ...ORDER_PENDING_POPUP_DEFS,
      ...INCOMES_POPUP_DEFS,
    ]) {
      const slug = slugify(`${def.host}-${def.name}`);
      const scan = await scanPopup(page, def, {
        onOpen: async (p) => {
          try {
            mkdirSync(screensDir, { recursive: true });
            const file = `auto-screens/popup-${slug}.png`;
            await p
              .locator(DIALOG_SELECTOR)
              .last()
              .screenshot({ path: path.join(outDir, file) });
            return file;
          } catch {
            return undefined; // screenshot is best-effort
          }
        },
      });
      scans.push(scan);
    }

    // 4d) Detail UIs revealed by clicking a row/data item. Each opens an
    //     in-place right-side panel (income/batch), a set of tabs (employee), or
    //     a dialog (product) — detectBody scans the full body, covering all.
    //     Placed AFTER the order-flow section (4) so navigating away here can't
    //     rob it of the order-history detail it derives its order id from.
    //     Best-effort: missing data / unopenable UI never fails the scan.
    const clickFirstVisible = async (selectors: string[]): Promise<boolean> => {
      for (const sel of selectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible().catch(() => false)) {
          await el.click().catch(() => {});
          return true;
        }
      }
      return false;
    };

    // Navigate to a (possibly gated) list, click the first data row, scan the
    // detail panel it opens in place.
    const scanRowDetail = async (
      listPath: string,
      name: string,
      group: RouteScan['group'],
      rowSelectors: string[],
    ): Promise<void> => {
      try {
        await routerNavigate(page, listPath);
        await page.waitForTimeout(1500);
        await enterPasscodeIfPrompted(page).catch(() => {});
        await page.waitForTimeout(800);
        if (!(await clickFirstVisible(rowSelectors))) return;
        await page.waitForTimeout(1800);
        await record({
          ...(await detectBody(page)),
          route: `${listPath} → chi tiết`,
          name,
          group,
          redirected: false,
        });
      } catch {
        /* no data to open — skip */
      }
    };

    // Income Summary — click a period row → payment/sale/staff/salon detail panel.
    await scanRowDetail('/incomes/income-summary', 'Tổng hợp thu nhập → chi tiết', 'Incomes', [
      'main tr.cursor-pointer',
      'main tbody tr',
    ]);
    // Staff Income — click a staff row → clock/salary/pay detail panel.
    await scanRowDetail('/incomes/income-staff', 'Thu nhập nhân viên → chi tiết', 'Incomes', [
      'main tr.cursor-pointer',
      'main tbody tr',
    ]);
    // Batch History — click the underlined Total Amount → Batch Close Review panel.
    await scanRowDetail('/batch-history', 'Lịch sử ca → Batch Close Review', 'System', [
      'main tbody tr button',
      'main button.underline',
      'main tr.cursor-pointer',
    ]);
    // Product — open a product on the Services & Products screen (opens a dialog).
    await scanRowDetail('/settings/services', 'Dịch vụ & Sản phẩm → chi tiết', 'Settings', [
      'main a.cursor-pointer',
      'main [role="button"]',
    ]);

    // 4e) Employee — open the first staff, then scan EACH of the 5 tabs.
    try {
      await routerNavigate(page, '/settings/staffs');
      await page.waitForTimeout(1500);
      await enterPasscodeIfPrompted(page).catch(() => {});
      const staff = page.locator('main a.cursor-pointer').first();
      if (await staff.isVisible().catch(() => false)) {
        await staff.click();
        await page.waitForTimeout(1500);
        // Tab order matches STAFF_TABS: information, compensation, services,
        // workHours, permissions. Clicked by role+index (language-neutral).
        const TABS_VN = ['Thông tin', 'Thù lao', 'Kỹ năng dịch vụ', 'Giờ làm việc', 'Quyền hạn'];
        const tabs = page.getByRole('tab');
        const count = await tabs.count().catch(() => 0);
        for (let i = 0; i < Math.min(count, TABS_VN.length); i++) {
          try {
            await tabs.nth(i).click();
            await page.waitForTimeout(1200);
            await record({
              ...(await detectBody(page)),
              route: `/settings/staffs → ${TABS_VN[i]}`,
              name: `Nhân viên · ${TABS_VN[i]}`,
              group: 'Settings',
              redirected: false,
            });
          } catch {
            /* tab not clickable — skip */
          }
        }
      }
    } catch {
      /* no staff to open — skip */
    }

    // 4e-oh) Order History deep dialogs — the "Bộ lọc" dialog + its four
    //        sub-dropdowns, the react-day-picker calendar grid (still English),
    //        and the order-detail panel with its Receipt + Refund dialogs.
    //        Best-effort: missing orders / unopenable dialogs never fail the scan.
    await scanOrderHistoryFilter(page, record);
    await scanOrderHistoryDatePicker(page, record);
    await scanOrderHistoryDetail(page, record);

    // 4e-op) Order Pending deep surfaces — inline filter controls (Staff popover
    //        / Sort / DatePicker preset), the calendar grid (still English), and
    //        the guard dialog a card-open can raise. Best-effort.
    await scanOrderPendingFilter(page, record);
    await scanOrderPendingDatePicker(page, record);
    await scanOrderPendingCardOpen(page, record);

    // 4e-inc) Incomes deep surfaces — the DatePicker calendar grid (still
    //         English) + the per-route detail panel (Print, Order Details dialog)
    //         on Income Summary & Staff Income. Passcode already entered above.
    await scanIncomesDatePicker(page, record);
    await scanIncomesDetail(page, record);

    // 4f) Home order-flow dialogs — set up one order (first staff + service),
    //     then open/scan Order Note, Promo & Rewards… Best-effort: missing
    //     staff/service never fails the scan. Placed last because it mutates the
    //     active order (leaves a staff+service line on /home).
    await scanHomeOrderDialogs(page, record);

    // 5) Diff vs the previous run, then write the report (HTML + JSON).
    const generatedAt = new Date().toISOString();
    mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, 'auto-scan.json');

    // Baseline = previous auto-scan.json (if present) → run-over-run string diff.
    let baseline: { strings?: string[]; generatedAt?: string } | null = null;
    if (existsSync(jsonPath)) {
      try {
        baseline = JSON.parse(readFileSync(jsonPath, 'utf8'));
      } catch {
        baseline = null;
      }
    }

    const dedup = dedupUntranslated(scans);
    const diff = diffStrings(dedup, baseline);
    const untranslated = scans.filter(isUntranslated);

    const html = renderI18nReport(scans, generatedAt, { dedup, diff });
    writeFileSync(path.join(outDir, 'auto-scan.html'), html, 'utf8');
    writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          generatedAt,
          scanned: scans.length,
          untranslatedCount: untranslated.length,
          // `strings` = the dedup string list; also serves as next run's baseline.
          strings: dedup.map((d) => d.text),
          dedup,
          diff,
          untranslated: untranslated.map((s) => ({ route: s.route, name: s.name, ui: s.ui })),
          all: scans,
        },
        null,
        2,
      ),
      'utf8',
    );
    await test.info().attach('i18n-vi-scan.html', { body: html, contentType: 'text/html' });

    // 6) List the screens that are NOT yet translated (the deliverable).
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Trang CHƯA chuyển Tiếng Việt: ${untranslated.length}/${scans.length} ===\n` +
        (untranslated.length
          ? untranslated
              .map((s) => `  • ${s.name} (${s.route})\n      ${s.ui.join(' · ')}`)
              .join('\n')
          : '  🎉 Tất cả các màn đã dịch!') +
        `\n\nChuỗi cần dịch (dedup): ${dedup.length}` +
        ` · 🆕 mới: ${diff.newStrings.length} · ✅ vừa dịch xong: ${diff.fixedStrings.length}` +
        `\nBáo cáo: ${path.join(outDir, 'auto-scan.html')}\n`,
    );

    // 7) Surface each untranslated screen as its own soft expectation, so the
    //    Playwright report enumerates EVERY screen still in English (instead of
    //    aborting on the first). The run fails when any screen is untranslated —
    //    this is the localization gate. Set I18N_LENIENT=1 for an
    //    informational-only run (report + console, never fails).
    if (process.env.I18N_LENIENT !== '1') {
      for (const s of untranslated) {
        expect.soft(s.ui, `"${s.name}" (${s.route}) còn chuỗi tiếng Anh`).toHaveLength(0);
      }
    }
  });
});
