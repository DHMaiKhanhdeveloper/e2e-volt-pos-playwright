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
  detectEnDateTimeHits,
  DATA_ZONE_SELECTORS,
  renderI18nReport,
  dedupUntranslated,
  diffStrings,
  isUntranslated,
  type RouteScan,
} from '@domains/i18n/i18nScan';
import { POPUP_DEFS, scanPopup } from '@domains/i18n/i18nPopups';
import {
  HOME_POPUP_DEFS,
  scanHomeOrderDialogs,
  scanTimeKeepingDialog,
  scanCustomerDisplay,
} from '@domains/i18n/i18nHome';
import { scanSplitOrder } from '@domains/i18n/i18nSplitOrder';
import { scanCashOtherPayment } from '@domains/i18n/i18nCheckoutPayment';
import {
  ORDER_HISTORY_POPUP_DEFS,
  scanOrderHistoryFilter,
  scanOrderHistoryDatePicker,
  scanOrderHistoryDetail,
} from '@domains/i18n/i18nOrderHistory';
import {
  ORDER_PENDING_POPUP_DEFS,
  scanOrderPendingFilter,
  scanOrderPendingDatePicker,
  scanOrderPendingCardOpen,
} from '@domains/i18n/i18nOrderPending';
import {
  INCOMES_POPUP_DEFS,
  scanIncomesGate,
  scanIncomesDatePicker,
  scanIncomesDetail,
} from '@domains/i18n/i18nIncomes';

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
    // Order Pending, the 3 Income reports, Time Keeping and Split Order — well
    // past the old 5-min budget.
    test.setTimeout(600_000);

    // ── VP-2115 "Mutiple Language Improvement" bug coverage ────────────────
    // Each sub-bug below is a case this scan must surface. Where covered:
    //   VP-2283/VP-2294 "Tip" chưa dịch (nhiều màn) → dict 'tip' + income/receipt/
    //                                                 order-history/checkout/batch scans
    //   VP-2284 /cash-drawer chưa dịch             → /cash-drawer route body (nút đã bắt
    //                                                 qua dict) + headings "Alerts"/"Dialogs"
    //                                                 nay bắt qua dict 'alert'/'alerts'/'dialogs'
    //   VP-2285/VP-2282 "WELCOME TO"               → /customer route + forceEnglish regex
    //   VP-2286 "Gift Card […]" / "Cannot use…"    → dict 'gift'/'card' + checkout &
    //                                                 order-history detail scans
    //   VP-2243 "Finishing setup…"/"Waiting…"      → dict 'setup'/'waiting'/'approval'
    //   VP-2200/VP-2139/VP-2144 "Unknown"          → dict 'unknown' + order-pending/
    //                                                 home body & Merge-Order dialog
    //   VP-2142 toast "Printer not connected"      → dict 'printer' + Home Print-toast scan
    //   VP-2198 lịch còn EN (June/Mo Tu…)          → date-picker grid scans (OH/OP/Incomes)
    //   VP-2244 tabs tìm kiếm (All/Appointment…)   → Home Global-Search popup
    //   VP-2143 panel Notifications                → notification bell panel scan (§4b)
    //   VP-2140 "Quick Pay"                        → dict 'quick'/'pay' + Home Quick-Pay popup
    //   VP-2194/VP-2196 "Got/Change/Tip"/"Cash"    → dict + order-history detail scan
    //   VP-2293 "Order #"/"Unknown" (checkout)     → dict + checkout subroute scan
    //   VP-2270/VP-2271/VP-2278 "Active/Inactive"  → dict + services/staffs body & popups
    //   VP-2273/VP-2253 "Pay 1/Pay 2"              → dict 'pay' + Staff/Income detail panels
    //   VP-2274 "Closed" (giờ làm việc)            → dict 'closed' + Staff work-hours tab
    //   VP-2246 "No staffs found"                  → dict 'found'/'staffs' + Time-Keeping dialog
    //   VP-2288/VP-2290/VP-2291/VP-2292 Tách đơn    → dict 'check' + Split-Order scan
    //   VP-2301 Order/POS gốc "Order #"/"Points:"  → /order/$id base scan (ORDER_SUBROUTES sub:'')
    //   VP-2302 Customer Display khi có đơn         → scanCustomerDisplay + dict 'promotion'/'phone'/'enter'
    //   VP-2298 UI vỡ Home khi có đơn               → home body scan có đơn (report-only UI vỡ)
    //   VP-2299 popup Thông tin khách hàng          → Customer-Info trong ORDER_DIALOGS (best-effort)
    //   VP-2295 popup Chỉnh tip (Order History)     → DETAIL_DIALOGS "Chỉnh tip"
    //   VP-2312 dropdown "Phương thức hoàn tiền"    → scanRefundMethod (Order History) + dict 'remain'
    //   VP-2313 ngày/giờ EN "Jun 30, 2026 03:58 AM" → EN_DATETIME dò trong scanOrderHistoryDetail
    //   VP-2303 Add Tip (Customer Display)          → dict 'terms'/'privacy'/'policy'; manual (cần thanh toán thật)
    //   VP-2304 Payment Complete (Customer Display) → dict 'message'/'points'; manual (cần thanh toán thật)
    //   VP-2305 Payment Success (Staff)             → /order/$id/payment-success subroute scan (đã phủ)
    //   VP-2306 Popup thẻ quà tặng không đủ số dư   → dict 'check'; manual (cần thanh toán thẻ quà tặng)
    //   VP-2307 "Unknown" màn Order/Thanh toán      → dict 'unknown' + /order/$id & checkout scans (đã phủ)
    //   VP-2308 Popup Terms Service (phía khách)    → dict 'terms'/'service' + forceEnglish; manual
    //   VP-2309 Popup Privacy Policy (phía khách)   → dict 'privacy'/'policy'; manual
    //   VP-2311 Toast xác nhận lịch hẹn             → dict 'confirmed'/'appointment' (đã bắt qua panel Thông báo); manual
    //   VP-2315 Custom tip (luồng TT thẻ)           → dict 'custom'/'tip'/'done' (đã có); manual (cần thanh toán thẻ)
    //   VP-2316 Total Amount (TT thẻ)               → dict 'total'/'amount'/'tip'/'present'; manual (cần đầu đọc thẻ)
    //   VP-2317 Add Signature (TT thẻ)              → dict 'sign'/'signature'/'transaction'; manual (cần giao dịch thẻ được duyệt)
    //   VP-2318 Popup "Payment Successfully"        → dict 'payment'/'successfully'; manual (cần hoàn tất thanh toán)
    //   VP-2319 Popup "Waiting for connect device"  → dict 'waiting'/'connect'/'device'/'getting'/'ready'; manual (cần kết nối đầu đọc)
    //   VP-2320 Popup "Getting ready to charge"     → dict 'getting'/'ready'/'charge' + forceEnglish "PRESENT CARD"/"CARD READ…"; manual
    //   VP-2321 Màn tiến hành thanh toán thẻ         → dict 'total'/'amount'/'tip'/'processing' + forceEnglish "PRESENT CARD"/"CARD READ…"; manual (present→read→processing)
    //   VP-2310/VP-2143 Appointment page — panel     → notification bell panel scan (§4b) flags "… appointment on … has been confirmed." (sentence rule); dict 'appointment'/'confirmed'
    // The scan is the deliverable; the gate (§7) fails on any screen still in EN.

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
        const scan = await scanRoute(page, def);
        // VP-2325 — Business Info payroll period + per-day working hours render
        // English date/time ("Jul 01 - Jul 10, 2026", "09:00 AM - 05:00 PM") that
        // the generic detector skips as bare DATA. Merge the shared EN-datetime
        // detector for this one route only. Best-effort — never throws.
        if (def.path === '/settings/business') {
          const dateHits = await detectEnDateTimeHits(page, 'main', DATA_ZONE_SELECTORS).catch(
            () => [],
          );
          if (dateHits.length) scan.ui = [...new Set([...scan.ui, ...dateHits])];
        }
        await record(scan);
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
    // `sub: ''` = the ORDER/POS base screen (/order/$id) itself — the edit-order
    // view with the right-side bill summary ("Order #", "Points:", "Total
    // visits:", the gift-card line — VP-2301/VP-2286/VP-2140). The rest are its
    // checkout sub-routes.
    const ORDER_SUBROUTES: { sub: string; name: string }[] = [
      { sub: '', name: 'Order / POS (Sửa đơn)' },
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
          const to = sub ? `/order/${orderId}/${sub}` : `/order/${orderId}`;
          await routerNavigate(page, to);
          await page.waitForTimeout(1700);
          const raw = await detectBody(page);
          await record({
            ...raw,
            route: sub ? `/order/$id/${sub}` : '/order/$id',
            name,
            group: 'POS',
            redirected: raw.path !== to,
          });
        }
      }
    } catch {
      /* checkout flow unavailable — skip */
    }

    // 4a2) Gift-card insufficient-balance popup (VP-2306) — "Dùng số dư & Thêm
    //      check mới" — only appears mid-checkout when a gift card can't cover the
    //      total. Needs a live gift-card payment attempt, so it's recorded manual
    //      (reachable:false — never charges). The word "check" is in the UI
    //      dictionary, so it's caught if ever scanned in that state.
    scans.push({
      route: '/order/$id/checkout ▸ Thẻ quà tặng không đủ số dư',
      name: 'Checkout · Popup thẻ quà tặng không đủ số dư (còn "check")',
      group: 'POS',
      ui: [],
      aria: [],
      overflow: [],
      stub: false,
      path: '/order/$id/checkout',
      redirected: true,
      popup: true,
      reachable: false,
      error:
        'Cần thanh toán bằng thẻ quà tặng không đủ số dư — scan không thanh toán thật. Kiểm tra thủ công (VP-2306).',
    });

    // 4a3) Appointment-confirm toast (VP-2311) — "X appointment on … has been
    //      confirmed." Confirming an appointment MUTATES its status (notifies the
    //      customer), so the scan never triggers it — recorded manual. The exact
    //      string is already flagged via the notification panel scan (§4b), so it
    //      is in the deduped list regardless.
    scans.push({
      route: '/appointment ▸ Toast xác nhận lịch hẹn',
      name: 'Lịch hẹn · Toast xác nhận ("… has been confirmed.")',
      group: 'POS',
      ui: [],
      aria: [],
      overflow: [],
      stub: false,
      path: '/appointment',
      redirected: true,
      popup: true,
      reachable: false,
      error:
        'Xác nhận lịch hẹn làm thay đổi trạng thái (gửi thông báo khách) — scan không tự xác nhận. Chuỗi đã được bắt qua panel Thông báo (§4b). Kiểm tra thủ công (VP-2311).',
    });

    // 4a4) Card-payment terminal flow on the Order Page (VP-2315…VP-2321) — the
    //      customer/terminal screens shown DURING a real card transaction: Custom
    //      tip, Total Amount ("PRESENT CARD"), Add Signature, the "Waiting for
    //      connect device" / "Getting ready to charge" reader popups, the
    //      "Payment Successfully" popup and the present→read→processing progress
    //      screens ("Processing" — VP-2321). All require a live card reader + a
    //      real charge, which the scan never performs, so each is recorded manual
    //      (reachable:false) for traceability. The dictionary carries their words
    //      ('present'/'sign'/'signature'/'transaction'/'getting'/'ready'/
    //      'successfully'/'processing'/'total'/'amount') and `forceEnglish` catches
    //      the ALL-CAPS reader prompts ("PRESENT CARD"/"CARD READ OK, REMOVE
    //      CARD"), so they're flagged if the scan ever lands on one of these states.
    const CARD_PAY_FLOW: { route: string; name: string; note: string }[] = [
      {
        route: '/order/$id ▸ Custom tip (thanh toán thẻ)',
        name: 'Order · Custom tip (luồng thanh toán thẻ)',
        note: 'Màn nhập tip tuỳ chọn ("Custom tip on $110.00", nút "Done") — chỉ hiện khi thanh toán thẻ. Kiểm tra thủ công (VP-2315).',
      },
      {
        route: '/order/$id ▸ Total Amount (thanh toán thẻ)',
        name: 'Order · Total Amount (thanh toán thẻ)',
        note: 'Màn tổng tiền phía đầu đọc thẻ ("Total Amount", "Tip", "PRESENT CARD") — cần đầu đọc thẻ. Kiểm tra thủ công (VP-2316).',
      },
      {
        route: '/order/$id ▸ Add Signature (thanh toán thẻ)',
        name: 'Order · Add Signature (thanh toán thẻ)',
        note: 'Màn ký tên ("Add Signature", "Transaction approved. Please sign your name.", "Sign here", "Clear", "Continue") — hiện sau khi giao dịch thẻ được duyệt. Kiểm tra thủ công (VP-2317).',
      },
      {
        route: '/order/$id ▸ Popup "Payment Successfully"',
        name: 'Order · Popup Thanh toán thành công ("Payment Successfully")',
        note: 'Popup xác nhận thanh toán thành công ("Payment Successfully") — cần hoàn tất thanh toán. Kiểm tra thủ công (VP-2318).',
      },
      {
        route: '/order/$id ▸ Popup "Waiting for connect device"',
        name: 'Order · Popup chờ kết nối đầu đọc ("Waiting for connect device")',
        note: 'Popup chờ kết nối thiết bị ("Waiting for connect device...", "Getting ready to charge") — cần kết nối đầu đọc thẻ. Kiểm tra thủ công (VP-2319).',
      },
      {
        route: '/order/$id ▸ Popup "Getting ready to charge"',
        name: 'Order · Popup đọc thẻ ("Getting ready to charge")',
        note: 'Popup đọc thẻ ("Getting ready to charge", "PRESENT CARD", "CARD READ OK, REMOVE CARD") — cần đầu đọc thẻ thật. Kiểm tra thủ công (VP-2320).',
      },
      {
        route: '/order/$id ▸ Màn tiến hành thanh toán thẻ (Processing)',
        name: 'Order · Tiến hành thanh toán thẻ (present → read → "Processing")',
        note: 'Luồng tiến hành thanh toán thẻ ("Total Amount"/"Tip"/"PRESENT CARD" → "CARD READ OK, REMOVE CARD" → "Processing") — cần đầu đọc thẻ + giao dịch thật. Kiểm tra thủ công (VP-2321).',
      },
      // The 2 rows below are the CUSTOMER-facing counterparts of Custom tip
      // (VP-2315) and Add Signature (VP-2317) above — the tip-entry and
      // signing steps are shown on the SECOND screen (Customer Display,
      // /customer), not just the staff terminal. Tracked separately so both
      // surfaces of each step are on record — see docs/i18n/
      // vietnamese-scan-flow.md §3.5(a) VP-2303 for the sibling Add Tip/
      // Payment Complete customer-display rows already covered by
      // `scanCustomerDisplay()`.
      {
        route: '/customer ▸ Custom tip (thanh toán thẻ, màn khách hàng)',
        name: 'Customer Display · Custom tip (luồng thanh toán thẻ)',
        note: 'Màn hình khách hàng (thứ 2) hiện màn nhập tip tuỳ chọn ("Custom tip on $110.00", nút "Done") khi khách tự chọn số tiền tip trong lúc thanh toán thẻ — cùng nội dung với Order/Terminal (VP-2315) nhưng render trên `/customer`, cần kiểm riêng vì có thể dùng component/route khác. Kiểm tra thủ công (VP-2315).',
      },
      {
        route: '/customer ▸ Ký tên (Add Signature, màn khách hàng)',
        name: 'Customer Display · Ký tên (Add Signature)',
        note: 'Màn hình khách hàng (thứ 2) là nơi khách THỰC SỰ ký tên ("Add Signature", "Transaction approved. Please sign your name.", "Sign here", "Clear", "Continue") sau khi giao dịch thẻ được duyệt — cùng nội dung với Order/Terminal (VP-2317) nhưng render trên `/customer`, cần kiểm riêng vì có thể dùng component/route khác. Kiểm tra thủ công (VP-2317).',
      },
    ];
    for (const { route, name, note } of CARD_PAY_FLOW) {
      scans.push({
        route,
        name,
        group: 'POS',
        ui: [],
        aria: [],
        overflow: [],
        stub: false,
        path: '/order/$id',
        redirected: true,
        popup: true,
        reachable: false,
        error: note,
      });
    }

    // 4a5) Cash / Other checkout payment panels (VP-2115) — unlike the card
    //      terminal flow (4a4), neither needs external hardware, so they are
    //      scanned LIVE (not recorded manual): select the method, scan the
    //      "Nhập số tiền"/"Tổng đã trả"/"Còn lại"/"Tiền thối" panel, never
    //      press "Hoàn tất thanh toán" (non-destructive — see
    //      i18nCheckoutPayment.ts and docs/i18n/vietnamese-scan-flow.md §3.7).
    await scanCashOtherPayment(page, record);

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
            // VP-2272 — on the "Thông tin" tab (i===0), best-effort open the
            // "Vai trò nhân viên" role dropdown so its options render before the
            // scan snapshot above. Note: the option VALUES themselves
            // (Owner/Manager/Partner/Staff) are exact `DATA_VALUES` the detector
            // deliberately treats as merchant/role data (not a UI-copy bug), so
            // opening this only helps report-only UI-vỡ / any surrounding label —
            // it will NOT flag the option text itself. Best-effort, non-fatal.
            if (i === 0) {
              try {
                const roleTrigger = page
                  .getByText(/vai trò nhân viên|employee role/i)
                  .first()
                  .locator('xpath=following::*[self::button or @role="combobox"][1]');
                if (await roleTrigger.isVisible().catch(() => false)) {
                  await roleTrigger.click();
                  await page.waitForTimeout(600);
                  await record({
                    ...(await detectBody(page)),
                    route: '/settings/staffs → Thông tin ▸ Vai trò nhân viên (dropdown)',
                    name: 'Nhân viên · Vai trò nhân viên (dropdown)',
                    group: 'Settings',
                    redirected: false,
                  });
                  await page.keyboard.press('Escape').catch(() => {});
                }
              } catch {
                /* role dropdown unavailable — skip, never fail the scan */
              }
            }
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

    // 4f2) Customer Display (/customer) WITH the active order still open from the
    //      step above — mirrors the order and leaks "Order Details", "Subtotal",
    //      "Promotion", the phone-confirm prompt… (VP-2302). Runs right after so
    //      the in-memory order is still alive.
    await scanCustomerDisplay(page, record);

    // 4g) Chấm công (Time Keeping) dialog — its "Nhân viên sẵn sàng" column empty
    //     state renders the hardcoded English "No staffs found." (VP-2246). The
    //     /time-tracking route above rarely shows the empty state; the dialog
    //     (deep-linked via ?dialog=time-keeping) reliably surfaces it.
    await scanTimeKeepingDialog(page, record);

    // 4h) Split Order (/order/$id/split-order) — the "Check" tabs / paid-check
    //     summary (VP-2290/2291) plus its payment-flow popups (VP-2292, tracked
    //     for manual review — the scan never charges a real check). Best-effort.
    await scanSplitOrder(page, record);

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
      // Coverage floor — the walk must reach its full surface set (static routes +
      // popups + deep scans). Guards against a silent regression that drops
      // coverage and lets untranslated screens slip through unscanned. Static
      // routes (22) + the popup loop alone push well past this even when every
      // deep/best-effort surface is unreachable in the session.
      expect
        .soft(scans.length, 'Số bề mặt đã quét giảm bất thường — kiểm tra lại luồng quét')
        .toBeGreaterThanOrEqual(40);
      for (const s of untranslated) {
        expect.soft(s.ui, `"${s.name}" (${s.route}) còn chuỗi tiếng Anh`).toHaveLength(0);
      }
    }
  });
});
