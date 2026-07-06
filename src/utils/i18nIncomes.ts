import { type Page } from '@playwright/test';
import {
  DATA_ZONE_SELECTORS,
  DATA_VALUES,
  DIALOG_SELECTOR,
  detectDialog,
  detectScope,
  enterPasscodeIfPrompted,
  routerNavigate,
  type RouteScan,
} from '@utils/i18nScan';
import { type PopupDef } from '@utils/i18nPopups';

/**
 * Incomes (report) deep localization scan for the Vietnamese audit — covers the
 * three gated report routes: Daily Sale Report (/incomes/income-daily), Income
 * Summary (/incomes/income-summary) and Staff Income (/incomes/income-staff).
 *
 * PREREQUISITE (see docs/i18n/vietnamese-scan-flow.md): the caller MUST have
 * already switched the app to Tiếng Việt via `switchToVietnamese()` and reach
 * the routes through the client-side router (`routerNavigate`) — a full
 * `page.goto` reverts the language (known non-persistence bug).
 *
 * The route bodies (tabs, table headings, Search, empty states) are already
 * covered by the static route scan (STATIC_ROUTES, gated). This module adds the
 * surfaces that route-scan can't reach (mapped in docs/i18n/incomes-translation-map.md):
 *   1. {@link scanIncomesGate} — the owner-passcode gate dialog ("Enter your
 *      passcode" / "Do not require passcode for the next 30 minutes"). Route-scan
 *      enters the passcode but never scans the dialog. Runs BEFORE unlocking; a
 *      no-op if the session is already unlocked.
 *   2. {@link INCOMES_POPUP_DEFS} — the DatePicker calendar (a `[role=dialog]`),
 *      scanned via the shared `scanPopup()`.
 *   3. {@link scanIncomesDatePicker} — the react-day-picker GRID, still English
 *      (month/weekday names aren't in the shared UI dictionary) — shared bug.
 *   4. {@link scanIncomesDetail} — click a data row → the in-place detail panel
 *      (Print button, detail headings) → best-effort the "Order Details" dialog.
 *
 * All triggers were verified live via MCP Playwright (2026-07-02). Each lists
 * several fallbacks (EN label → VN label → structural) because the app is in
 * Tiếng Việt during the scan, so the English source labels won't match.
 */

/** DatePicker calendar on the income routes — a `[role=dialog]` popover. `gated`
 *  so `scanPopup()` enters the owner passcode before opening it. */
export const INCOMES_POPUP_DEFS: PopupDef[] = [
  {
    name: 'Thu nhập · Lịch chọn ngày (DatePicker)',
    group: 'Incomes',
    host: '/incomes/income-summary',
    gated: true,
    open: [
      { by: 'css', selector: 'main button:has([aria-label="icon-calendar"])' },
      { by: 'role', role: 'button', name: /pick|chọn ngày|chọn khoảng/i },
    ],
    note: 'Nút/preset đã dịch nhưng lưới lịch react-day-picker còn tiếng Anh — xem scanIncomesDatePicker.',
  },
];

/** Fully close any open dialog/popover so the next surface starts clean. Mirrors
 *  the order-history/order-pending dismiss helper (overlay-aware). */
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
 * Scan the owner-passcode gate dialog, THEN unlock. Route-scan enters the
 * passcode but never scans the dialog text ("Enter your passcode", "Do not
 * require passcode for the next 30 minutes"), so this catches it. Best-effort +
 * a no-op if the session is already unlocked (no dialog appears).
 */
export async function scanIncomesGate(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/incomes/income-summary');
    await page.waitForTimeout(1200);
    const dialogUp = await page
      .locator(DIALOG_SELECTOR)
      .last()
      .isVisible()
      .catch(() => false);
    if (dialogUp) {
      await record({
        ...(await detectDialog(page)),
        route: '/incomes ▸ Cổng passcode',
        name: 'Thu nhập · Dialog nhập passcode',
        group: 'Incomes',
        redirected: false,
        popup: true,
        reachable: true,
      });
    }
    // Unlock (tick "remember 30 min" so later income routes don't re-prompt).
    await enterPasscodeIfPrompted(page).catch(() => {});
    await page.waitForTimeout(800);
  } catch {
    /* gate unavailable — skip */
  }
}

/** English month names → detect an UNLOCALIZED react-day-picker grid (month name
 *  + digits). Shared shape with the order-history / order-pending scanners. */
const EN_MONTHS =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/;

/**
 * Open the DatePicker calendar (on income-summary) and flag the react-day-picker
 * GRID if it renders in English (month caption + weekday header). Precisely
 * catches the calendar-locale bug the generic dictionary detector misses.
 */
export async function scanIncomesDatePicker(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/incomes/income-summary');
    await page.waitForTimeout(1200);
    await enterPasscodeIfPrompted(page).catch(() => {});
    await page.waitForTimeout(800);
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
          if (months.test(t) && /\d/.test(t)) found.add(t);
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
      route: '/incomes ▸ Lịch (grid tiếng Anh)',
      name: 'Thu nhập · Lịch — grid react-day-picker',
      group: 'Incomes',
      redirected: false,
      popup: true,
      reachable: true,
    });
    await dismiss(page);
  } catch {
    /* date picker unavailable — skip */
  }
}

/** The report routes whose first data row opens an in-place detail panel. */
const DETAIL_ROUTES: { path: string; name: string }[] = [
  { path: '/incomes/income-summary', name: 'Tổng hợp thu nhập' },
  { path: '/incomes/income-staff', name: 'Thu nhập nhân viên' },
];

/**
 * Click the first data row on each report route, scan the in-place detail panel
 * (which exposes the "Print" button + detail headings), then best-effort open
 * the "Order Details" dialog if a per-order trigger surfaces. Best-effort: no
 * data / no dialog → skipped, never fails the gate.
 */
export async function scanIncomesDetail(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  for (const rt of DETAIL_ROUTES) {
    try {
      await routerNavigate(page, rt.path);
      await page.waitForTimeout(1200);
      await enterPasscodeIfPrompted(page).catch(() => {});
      await page.waitForTimeout(800);
      await dismiss(page);

      const row = page.locator('main tbody tr, main tr.cursor-pointer').first();
      if (!(await row.isVisible().catch(() => false))) continue; // no data → skip
      await row.click().catch(() => {});
      await page.waitForTimeout(1500);

      // 1) The detail panel body (Print button, detail headings, "No detail to
      //    show" when empty). Scan `main`; list rows are outside the data zone
      //    so their text is included, but that's already route-scan territory —
      //    the value here is the panel-only content (Print, per-order rows).
      await record({
        ...(await page.evaluate(detectScope, {
          rootSelector: 'main',
          dataZones: DATA_ZONE_SELECTORS,
          dataValues: DATA_VALUES,
        })),
        route: `${rt.path} ▸ chi tiết`,
        name: `${rt.name} · Panel chi tiết`,
        group: 'Incomes',
        redirected: false,
        popup: true,
        reachable: true,
      });

      // 2) Best-effort "Order Details" dialog: click a per-order row (carries an
      //    OD code) inside the detail panel.
      const orderRow = page
        .locator('main tbody tr')
        .filter({ hasText: /OD\d{6}/ })
        .first();
      if (await orderRow.isVisible().catch(() => false)) {
        await orderRow.click().catch(() => {});
        await page.waitForTimeout(1200);
        if (
          await page
            .locator(DIALOG_SELECTOR)
            .last()
            .isVisible()
            .catch(() => false)
        ) {
          await record({
            ...(await detectDialog(page)),
            route: `${rt.path} ▸ Order Details`,
            name: `${rt.name} · Order Details`,
            group: 'Incomes',
            redirected: false,
            popup: true,
            reachable: true,
          });
          await dismiss(page);
        }
      }
    } catch {
      /* this route's detail unavailable — skip */
    }
  }
}
