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
} from '@domains/i18n/i18nScan';
import { type PopupDef } from '@domains/i18n/i18nPopups';

/**
 * Order Pending (/order-pending) deep localization scan for the Vietnamese audit.
 *
 * PREREQUISITE (see docs/i18n/vietnamese-scan-flow.md): the caller MUST have
 * already switched the app to Tiếng Việt via `switchToVietnamese()` and reach
 * `/order-pending` through the client-side router (`routerNavigate`) — a full
 * `page.goto` reverts the language (known non-persistence bug).
 *
 * The route body (filter bar + order cards) is already covered by the static
 * route scan; this module adds the surfaces that only appear on INTERACTION
 * (mapped in docs/i18n/order-pending-translation-map.md):
 *   1. {@link ORDER_PENDING_POPUP_DEFS} — the DatePicker calendar, openable with
 *      no order selected. Scanned via the shared `scanPopup()` (its popover is a
 *      `[role=dialog]`).
 *   2. {@link scanOrderPendingFilter} — the inline filter controls: the Staff
 *      popover, the Sort dropdown (Latest/Oldest), and the DatePicker preset
 *      dropdown (Today/Yesterday/…).
 *   3. {@link scanOrderPendingDatePicker} — the react-day-picker GRID, still
 *      English (month/weekday names aren't in the shared UI dictionary), shared
 *      with /order-history.
 *   4. {@link scanOrderPendingCardOpen} — clicking a pending card can raise a
 *      shared guard dialog ("Order in use" / "Complete the current order
 *      first"); scanned best-effort.
 *
 * All triggers were verified live via MCP Playwright (2026-07-02). Each lists
 * several fallbacks (EN label → VN label → structural) because the app is in
 * Tiếng Việt during the scan, so the English source labels won't match.
 */

/** DatePicker calendar — reachable WITHOUT selecting an order. Its popover is a
 *  `[role=dialog]`, so the standard `scanPopup()` infra can open + scan it. */
export const ORDER_PENDING_POPUP_DEFS: PopupDef[] = [
  {
    name: 'Đơn đang chờ · Lịch chọn ngày (DatePicker)',
    group: 'POS',
    host: '/order-pending',
    open: [
      // The trigger's only stable, language-neutral hook is the calendar icon's
      // aria-label; the visible text is a data-driven date in VN.
      { by: 'css', selector: 'main button:has([aria-label="icon-calendar"])' },
      { by: 'role', role: 'button', name: /pick|chọn ngày|chọn khoảng/i },
    ],
    note: 'Nút/preset đã dịch nhưng lưới lịch react-day-picker còn tiếng Anh — xem scanOrderPendingDatePicker.',
  },
];

/** Scan an arbitrary popover/listbox root for leftover English (the filter
 *  controls open a popover `[role=dialog]` or a `[role=listbox]`). */
async function detectRoot(page: Page, rootSelector: string): Promise<RawDetect> {
  return page.evaluate(detectScope, {
    rootSelector,
    dataZones: DATA_ZONE_SELECTORS,
    dataValues: DATA_VALUES,
  });
}

/**
 * Fully close any open dialog/popover/listbox so the next surface starts clean.
 * Prefers an explicit Close/Cancel control, then clicks the overlay, then
 * presses Escape; loops until nothing remains (a lingering overlay swallows
 * clicks). Mirrors the order-history dismiss helper.
 */
async function dismiss(page: Page): Promise<void> {
  for (let i = 0; i < 6; i++) {
    const open = await page.evaluate(() => {
      const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
      const dialogs = document.querySelectorAll(
        '[role="dialog"],[role="alertdialog"],[role="listbox"]',
      );
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      if (!dialogs.length && !overlay) return false;
      const btns = [
        ...document.querySelectorAll('[role="dialog"] button,[role="alertdialog"] button'),
      ].filter((b) =>
        /close|đóng|cancel|huỷ|hủy/i.test(
          norm(b.textContent) || b.getAttribute('aria-label') || '',
        ),
      );
      if (btns.length) (btns[btns.length - 1] as HTMLElement).click();
      if (overlay) (overlay as HTMLElement).click();
      return true;
    });
    if (!open) return;
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(250);
  }
}

/**
 * Open + scan each inline filter control on the pending list: the Staff popover
 * (By Staff / All / No results found), the Sort dropdown (Latest / Oldest) and
 * the DatePicker preset dropdown (Today / Yesterday / …). All are expected to be
 * translated; scanning guards against regressions. Best-effort: a control that
 * won't open is skipped and never fails the gate.
 */
export async function scanOrderPendingFilter(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/order-pending');
    await page.waitForTimeout(1200);
    await dismiss(page);

    const controls: { name: string; open: () => Promise<void>; root: string }[] = [
      {
        // Staff filter button ("Staff" + count) → popover `[role=dialog]`.
        name: 'Đơn đang chờ · Bộ lọc nhân viên',
        open: async () => {
          await page
            .getByRole('button', { name: /^staff\b|nhân viên/i })
            .first()
            .click()
            .catch(() => {});
        },
        root: DIALOG_SELECTOR,
      },
      {
        // Sort combobox (shows Latest/Oldest) → `[role=listbox]`.
        name: 'Đơn đang chờ · Sắp xếp (Latest/Oldest)',
        open: async () => {
          await page
            .getByRole('combobox')
            .filter({ hasText: /latest|oldest|mới nhất|cũ nhất/i })
            .first()
            .click()
            .catch(() => {});
        },
        root: '[role="listbox"]',
      },
      {
        // DatePicker preset combobox (shows Today/…) → `[role=listbox]`.
        name: 'Đơn đang chờ · DatePicker preset (Today/…)',
        open: async () => {
          await page
            .getByRole('combobox')
            .filter({ hasText: /today|yesterday|hôm nay|hôm qua|tuần|tháng/i })
            .first()
            .click()
            .catch(() => {});
        },
        root: '[role="listbox"]',
      },
    ];

    for (const ctl of controls) {
      try {
        await ctl.open();
        await page.waitForTimeout(600);
        const raw = await detectRoot(page, ctl.root);
        await record({
          ...raw,
          route: ctl.name,
          name: ctl.name,
          group: 'POS',
          redirected: false,
          popup: true,
          reachable: true,
        });
        await dismiss(page);
      } catch {
        /* this control couldn't be opened — skip */
      }
    }
  } catch {
    /* filter bar unavailable — skip entirely */
  }
}

/** English month names used to detect an UNLOCALIZED react-day-picker grid
 *  (NOT in the shared UI dictionary — a month token could be data elsewhere, so
 *  here we require a date context: month name + digits). Shared shape with the
 *  order-history calendar scanner. */
const EN_MONTHS =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/;

/**
 * Open the DatePicker calendar and flag the react-day-picker GRID if it renders
 * in English (month caption like "July 2026" + weekday header "Mo Tu We…"). This
 * precisely catches the calendar-locale bug the generic dictionary detector
 * misses, without risking false positives elsewhere.
 */
export async function scanOrderPendingDatePicker(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/order-pending');
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
        root.querySelectorAll('*').forEach((e) => {
          if (e.children.length) return;
          const t = norm(e.textContent);
          if (months.test(t) && /\d/.test(t)) found.add(t); // "July 2026"
        });
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

    const raw = await detectDialog(page);
    const ui = [...new Set([...raw.ui, ...hits])];
    await record({
      ...raw,
      ui,
      route: '/order-pending ▸ Lịch (grid tiếng Anh)',
      name: 'Đơn đang chờ · Lịch — grid react-day-picker',
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
 * Click the first pending card. Opening an order can raise a shared guard dialog
 * ("Order in use" / "Complete the current order first") when the order is
 * half-paid or open elsewhere — scan it if it appears. Best-effort: if the click
 * just navigates into the order, nothing is recorded here (the checkout flow is
 * covered by the main scan). Placed LAST because it may navigate away.
 */
export async function scanOrderPendingCardOpen(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/order-pending');
    await page.waitForTimeout(1200);
    await dismiss(page);

    const card = page
      .locator('main button:has-text("Pts"), main [role="button"]:has-text("Pts")')
      .first();
    const target = (await card.isVisible().catch(() => false))
      ? card
      : page
          .locator('main button')
          .filter({ hasText: /OD\d{6}/ })
          .first();
    if (!(await target.isVisible().catch(() => false))) return; // no cards → skip
    await target.click().catch(() => {});
    await page.waitForTimeout(1200);

    // Only record if a guard dialog actually surfaced (else we navigated into the
    // order — that screen is scanned elsewhere).
    if (
      await page
        .locator(DIALOG_SELECTOR)
        .last()
        .isVisible()
        .catch(() => false)
    ) {
      await record({
        ...(await detectDialog(page)),
        route: '/order-pending ▸ Guard mở đơn',
        name: 'Đơn đang chờ · Dialog chặn mở đơn (guard)',
        group: 'POS',
        redirected: false,
        popup: true,
        reachable: true,
      });
      await dismiss(page);
    }
  } catch {
    /* card open unavailable — skip */
  }
}
