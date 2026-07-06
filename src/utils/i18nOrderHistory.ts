import { type Page } from '@playwright/test';
import {
  DATA_ZONE_SELECTORS,
  DATA_VALUES,
  DIALOG_SELECTOR,
  detectDialog,
  detectScope,
  routerNavigate,
  type RawDetect,
  type RouteScan,
} from '@utils/i18nScan';
import { type PopupDef } from '@utils/i18nPopups';

/**
 * Order History (/order-history) deep localization scan for the Vietnamese audit.
 *
 * PREREQUISITE (see docs/i18n/vietnamese-scan-flow.md): the caller MUST have
 * already switched the app to Tiếng Việt via `switchToVietnamese()` and reach
 * `/order-history` through the client-side router (`routerNavigate`) — a full
 * `page.goto` reverts the language (known non-persistence bug).
 *
 * Surfaces (mapped in docs/i18n/order-history-translation-map.md):
 *   1. {@link ORDER_HISTORY_POPUP_DEFS} — the DatePicker calendar, openable with
 *      NO order selected. Scanned through the shared `scanPopup()` infra
 *      alongside POPUP_DEFS (its popover is a `[role=dialog]`).
 *   2. {@link scanOrderHistoryFilter} — the "Bộ lọc" dialog and its four
 *      sub-dropdowns (Sort / Staff / Payment method / Status).
 *   3. {@link scanOrderHistoryDatePicker} — the react-day-picker GRID, which is
 *      still English (month/weekday names are NOT in the UI dictionary, so the
 *      generic detector misses them — this scanner flags them explicitly).
 *   4. {@link scanOrderHistoryDetail} — the right-side detail panel plus the two
 *      order-dependent dialogs it exposes: "Hoá đơn" (Receipt) and "Hoàn tiền"
 *      (Refund). The Receipt reuses the settings/receipt preview components, so
 *      its English leaks are shared with /settings/receipt.
 *
 * All triggers were verified live via MCP Playwright (2026-07-02). Each lists
 * several fallbacks (EN label → VN label → structural) because the app is in
 * Tiếng Việt during the scan, so the English source labels won't match.
 */

/** DatePicker calendar — reachable WITHOUT selecting an order. Its popover is a
 *  `[role=dialog]`, so the standard `scanPopup()` infra can open + scan it. */
export const ORDER_HISTORY_POPUP_DEFS: PopupDef[] = [
  {
    name: 'Lịch sử đơn · Lịch chọn ngày (DatePicker)',
    group: 'POS',
    host: '/order-history',
    open: [
      // The trigger's only stable, language-neutral hook is the calendar icon's
      // aria-label; the visible text is a data-driven date range in VN.
      { by: 'css', selector: 'main button:has([aria-label="icon-calendar"])' },
      { by: 'role', role: 'button', name: /pick range|chọn ngày|chọn khoảng/i },
    ],
    note: 'Nút/độ dài đã dịch (Hôm nay/Huỷ/Áp dụng) nhưng lưới lịch react-day-picker còn tiếng Anh — xem scanOrderHistoryDatePicker.',
  },
];

/** Scan an arbitrary popover/listbox root for leftover English (the filter's
 *  sub-dropdowns are popovers or a listbox, not always `[role=dialog]`). */
async function detectRoot(page: Page, rootSelector: string): Promise<RawDetect> {
  return page.evaluate(detectScope, {
    rootSelector,
    dataZones: DATA_ZONE_SELECTORS,
    dataValues: DATA_VALUES,
  });
}

/**
 * Fully close any open dialog/popover so the next surface starts clean —
 * NON-DESTRUCTIVELY. Some order-history dialogs contain a destructive confirm
 * whose label matches a naive close-pattern (e.g. "Xác nhận huỷ" = confirm-cancel
 * contains "huỷ"), so clicking by keyword could actually cancel/refund the order.
 * This routine therefore: (1) presses Escape (all these radix dialogs close on
 * it), (2) clicks the overlay backdrop, and (3) clicks a control ONLY when it is
 * an explicit, safe close — an aria-label close, the exact word "Đóng"/"Close",
 * or the keep-order "Giữ đơn hàng" — and NEVER anything containing "xác
 * nhận"/"confirm". It never clicks a bare "huỷ/hủy/cancel" (Escape handles those).
 */
async function dismiss(page: Page): Promise<void> {
  for (let i = 0; i < 6; i++) {
    // Escape first — it is the safe, side-effect-free way to close every radix
    // dialog/alertdialog/popover used here.
    await page.keyboard.press('Escape').catch(() => {});
    const open = await page.evaluate(() => {
      const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
      const dialogs = document.querySelectorAll(
        '[role="dialog"],[role="alertdialog"],[role="listbox"]',
      );
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      if (!dialogs.length && !overlay) return false;
      const safe = [
        ...document.querySelectorAll('[role="dialog"] button,[role="alertdialog"] button'),
      ].filter((b) => {
        const label = norm(b.textContent) || b.getAttribute('aria-label') || '';
        // Never touch a confirm/destructive action.
        if (/xác nhận|confirm/i.test(label)) return false;
        // Only explicit, safe closes.
        return /^(đóng|close|giữ đơn hàng)$/i.test(label);
      });
      if (safe.length) (safe[safe.length - 1] as HTMLElement).click();
      if (overlay) (overlay as HTMLElement).click();
      return true;
    });
    if (!open) return;
    await page.waitForTimeout(250);
  }
}

/**
 * Open the "Bộ lọc" dialog, scan it, then open + scan each of its four
 * sub-dropdowns (Sort / Staff / Payment method / Status). All are expected to be
 * translated already; scanning them guards against regressions. Best-effort: a
 * control that won't open is skipped and never fails the gate.
 */
export async function scanOrderHistoryFilter(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/order-history');
    await page.waitForTimeout(1200);
    await dismiss(page);

    const filterBtn = page.getByRole('button', { name: /^bộ lọc$|^filter$|lọc/i }).first();
    if (!(await filterBtn.isVisible().catch(() => false))) return;
    await filterBtn.click().catch(() => {});
    await page.waitForTimeout(700);
    if (
      !(await page
        .locator(DIALOG_SELECTOR)
        .last()
        .isVisible()
        .catch(() => false))
    )
      return;

    // 1) The filter dialog shell (trigger labels: Sắp xếp theo / Nhân viên / …).
    await record({
      ...(await detectDialog(page)),
      route: '/order-history ▸ Bộ lọc',
      name: 'Lịch sử đơn · Bộ lọc',
      group: 'POS',
      redirected: false,
      popup: true,
      reachable: true,
    });

    // 2) Each sub-dropdown. The Sort control is a native-ish combobox (opens a
    //    listbox); Staff/Payment/Status open a nested popover (`[role=dialog]`).
    const subs: { name: string; open: () => Promise<void>; root: string }[] = [
      {
        name: 'Lịch sử đơn · Bộ lọc › Sắp xếp',
        open: async () => {
          await page
            .getByRole('combobox')
            .first()
            .click()
            .catch(() => {});
        },
        root: '[role="listbox"]',
      },
      {
        name: 'Lịch sử đơn · Bộ lọc › Nhân viên',
        open: async () => {
          await page
            .getByRole('button', { name: /chọn nhân viên|select staff|nhân viên/i })
            .first()
            .click()
            .catch(() => {});
        },
        root: DIALOG_SELECTOR,
      },
      {
        name: 'Lịch sử đơn · Bộ lọc › Phương thức thanh toán',
        open: async () => {
          await page
            .getByRole('button', { name: /phương thức thanh toán|payment method/i })
            .first()
            .click()
            .catch(() => {});
        },
        root: DIALOG_SELECTOR,
      },
      {
        name: 'Lịch sử đơn · Bộ lọc › Trạng thái',
        open: async () => {
          await page
            .getByRole('button', { name: /chọn trạng thái|select status|trạng thái/i })
            .first()
            .click()
            .catch(() => {});
        },
        root: DIALOG_SELECTOR,
      },
    ];

    for (const sub of subs) {
      try {
        await sub.open();
        await page.waitForTimeout(600);
        const raw = await detectRoot(page, sub.root);
        await record({
          ...raw,
          route: sub.name,
          name: sub.name,
          group: 'POS',
          redirected: false,
          popup: true,
          reachable: true,
        });
        // Close just this sub-popover (Escape) without dropping the filter dialog.
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(250);
      } catch {
        /* this sub-dropdown couldn't be opened — skip */
      }
    }
    await dismiss(page);
  } catch {
    /* filter unavailable — skip entirely */
  }
}

/** English month names + weekday captions used to detect an UNLOCALIZED
 *  react-day-picker grid (these are NOT in the shared UI dictionary because a
 *  month token could be merchant data elsewhere — here we require date context). */
const EN_MONTHS =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/;

/**
 * Open the DatePicker calendar and flag the react-day-picker GRID if it renders
 * in English. Targeted (month captions like "June 2026" + weekday header row
 * "Mo Tu We…") so it precisely catches the calendar-locale bug that the generic
 * dictionary detector misses, WITHOUT risking false positives on other screens.
 */
export async function scanOrderHistoryDatePicker(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/order-history');
    await page.waitForTimeout(1200);
    await dismiss(page);

    const trigger = page.locator('main button:has([aria-label="icon-calendar"])').first();
    if (!(await trigger.isVisible().catch(() => false))) return;
    await trigger.click().catch(() => {});
    await page.waitForTimeout(700);
    if (
      !(await page
        .locator(DIALOG_SELECTOR)
        .last()
        .isVisible()
        .catch(() => false))
    )
      return;

    const hits = await page.evaluate(
      ({ monthsSrc }) => {
        const months = new RegExp(monthsSrc);
        const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
        const roots = document.querySelectorAll('[role="dialog"],[role="alertdialog"]');
        const root = roots[roots.length - 1] as HTMLElement | undefined;
        if (!root) return [] as string[];
        const found = new Set<string>();
        // Month caption, e.g. "June 2026".
        root.querySelectorAll('*').forEach((e) => {
          if (e.children.length) return;
          const t = norm(e.textContent);
          if (months.test(t) && /\d/.test(t)) found.add(t);
        });
        // English weekday header row (Mo Tu We Th Fr Sa Su).
        const heads = [...root.querySelectorAll('th,[role="columnheader"]')]
          .map((e) => norm(e.textContent))
          .filter(Boolean);
        if (heads.some((h) => /^(Mo|Tu|We|Th|Fr|Sa|Su)$/.test(h))) {
          found.add(heads.slice(0, 7).join(' '));
        }
        return [...found];
      },
      { monthsSrc: EN_MONTHS.source },
    );

    // Merge the targeted month/weekday hits into a normal dialog detect so aria
    // ("Go to the Previous Month") and any other leftover English are captured too.
    const raw = await detectDialog(page);
    const ui = [...new Set([...raw.ui, ...hits])];
    await record({
      ...raw,
      ui,
      route: '/order-history ▸ Lịch (grid tiếng Anh)',
      name: 'Lịch sử đơn · Lịch — grid react-day-picker',
      group: 'POS',
      redirected: false,
      popup: true,
      reachable: true,
    });
    await dismiss(page);
  } catch {
    /* date picker unavailable — skip */
  }
}

/**
 * Order-dependent detail dialogs. Which action buttons render depends on the
 * order's STATUS (verified live 2026-07-02):
 *   • Chưa quyết toán (unsettled): Chỉnh tip · Hoá đơn · Mở lại đơn hàng · Huỷ đơn
 *   • Đã quyết toán (settled):     Hoá đơn · Hoàn tiền
 *   • Đã huỷ / Đã hoàn tiền:       Hoá đơn
 * So each entry is best-effort — a button absent for the scanned order's status
 * is silently skipped. `sub` lists nested triggers reachable INSIDE the opened
 * dialog (e.g. the Receipt's "Gửi SMS" / "Gửi Email").
 */
const DETAIL_DIALOGS: { name: string; open: RegExp; sub?: { name: string; open: RegExp }[] }[] = [
  // Adjust tip ("Chỉnh tip") — unsettled orders. Verified translated.
  { name: 'Lịch sử đơn · Chỉnh tip (Adjust tip)', open: /chỉnh tip|adjust tip/i },
  // Reopen order ("Mở lại đơn hàng") — unsettled orders. Verified translated.
  { name: 'Lịch sử đơn · Mở lại đơn hàng (Reopen)', open: /mở lại đơn|reopen/i },
  // Cancel order ("Huỷ đơn") — unsettled orders. Verified translated (incl. its
  // reason dropdown). SAFE: dismiss() never clicks the "Xác nhận huỷ" confirm.
  { name: 'Lịch sử đơn · Huỷ đơn (Cancel order)', open: /^huỷ đơn$|^hủy đơn$|cancel order/i },
  // Receipt ("Hoá đơn") — reuses the settings/receipt preview components; leaks
  // "Current points:", "Total visit:", "Staff:", "Business Note:", legal footer.
  // Its "Gửi SMS" sub-dialog has an untranslated aria-label "Clear input".
  {
    name: 'Lịch sử đơn · Chi tiết hoá đơn (Receipt)',
    open: /hoá đơn|hóa đơn|receipt/i,
    sub: [
      { name: 'Lịch sử đơn · Hoá đơn › Gửi SMS', open: /gửi sms|send sms/i },
      { name: 'Lịch sử đơn · Hoá đơn › Gửi Email', open: /gửi email|send email/i },
    ],
  },
  // Refund ("Hoàn tiền") — settled orders. Verified fully translated.
  { name: 'Lịch sử đơn · Hoàn tiền (Refund)', open: /hoàn tiền|refund/i },
];

/**
 * Open the first order's detail panel, scan it, then open / scan / close each
 * order-dependent dialog (Receipt, Refund). Best-effort: if there is no order to
 * open, or a dialog won't surface, the affected step is skipped and never fails
 * the localization gate.
 */
export async function scanOrderHistoryDetail(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/order-history');
    await page.waitForTimeout(1200);
    await dismiss(page);

    const card = page.locator('main a[href*="/order-history/"]').first();
    if (!(await card.isVisible().catch(() => false))) return; // no orders → skip
    await card.click().catch(() => {});
    await page.waitForTimeout(1600);

    // 1) The detail panel body. `detectScope` on `main` covers the panel plus the
    //    list (list card text lives in the order-history data zone → skipped),
    //    catching detail leaks like "Amount: $44.00".
    await record({
      ...(await page.evaluate(detectScope, {
        rootSelector: 'main',
        dataZones: DATA_ZONE_SELECTORS,
        dataValues: DATA_VALUES,
      })),
      route: '/order-history ▸ chi tiết đơn',
      name: 'Lịch sử đơn · Chi tiết đơn',
      group: 'POS',
      redirected: false,
      popup: true,
      reachable: true,
    });

    // 2) Status-dependent dialogs (Chỉnh tip / Mở lại / Huỷ đơn / Receipt / Refund).
    for (const def of DETAIL_DIALOGS) {
      try {
        const trigger = page.getByRole('button', { name: def.open }).first();
        if (!(await trigger.isVisible().catch(() => false))) continue;
        await trigger.click().catch(() => {});
        await page.waitForTimeout(1000);
        if (
          !(await page
            .locator(DIALOG_SELECTOR)
            .last()
            .isVisible()
            .catch(() => false))
        )
          continue;
        await record({
          ...(await detectDialog(page)),
          route: `/order-history ▸ ${def.name}`,
          name: def.name,
          group: 'POS',
          redirected: false,
          popup: true,
          reachable: true,
        });

        // Nested sub-dialogs opened from WITHIN this dialog (e.g. Receipt →
        // Gửi SMS / Gửi Email). Scan each, then return to the parent dialog.
        for (const sub of def.sub ?? []) {
          try {
            const subTrigger = page.getByRole('button', { name: sub.open }).first();
            if (!(await subTrigger.isVisible().catch(() => false))) continue;
            await subTrigger.click().catch(() => {});
            await page.waitForTimeout(800);
            await record({
              ...(await detectDialog(page)),
              route: `/order-history ▸ ${sub.name}`,
              name: sub.name,
              group: 'POS',
              redirected: false,
              popup: true,
              reachable: true,
            });
            // Close just the sub-dialog (Escape) so the parent stays open.
            await page.keyboard.press('Escape').catch(() => {});
            await page.waitForTimeout(300);
          } catch {
            /* this sub-dialog couldn't be opened — skip */
          }
        }

        await dismiss(page);
      } catch {
        /* this dialog couldn't be opened — skip */
      }
    }
  } catch {
    /* order-history detail unavailable — skip entirely */
  }
}
