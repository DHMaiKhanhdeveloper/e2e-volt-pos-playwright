import { type Locator, type Page } from '@playwright/test';
import {
  DIALOG_SELECTOR,
  detectDialog,
  enterPasscodeIfPrompted,
  routerNavigate,
  type RawDetect,
  type RouteScan,
} from '@utils/i18nScan';

/**
 * Popup/dialog layer of the Vietnamese localization scan.
 *
 * The route scan ({@link STATIC_ROUTES}) only covers full screens; popups never
 * render until the user interacts. This module drives each popup OPEN from its
 * host route, scans only the dialog portal for leftover English, then closes it.
 *
 * Per the agreed scope this is "openable only": a popup that can't be triggered
 * in a normal authenticated session (device/error dialogs — Disconnected,
 * Signature-wait, card-processing, software-update — and deep multi-step flows)
 * is recorded as `reachable: false` and never counted as untranslated, instead
 * of failing the run. Each {@link PopupDef} lists several fallback triggers
 * (test id → role+name → text → css) so a single label change in EN/VN doesn't
 * silently drop coverage; the first trigger that surfaces a dialog wins.
 */

/** One way to surface a popup. Tried in order until a dialog appears. */
export type Trigger =
  | { by: 'testid'; value: string }
  | { by: 'role'; role: 'button' | 'link' | 'menuitem' | 'tab' | 'switch'; name: RegExp }
  | { by: 'text'; name: RegExp }
  | { by: 'css'; selector: string }
  | { by: 'key'; keys: string };

export interface PopupDef {
  /** Vietnamese label shown in the report. */
  name: string;
  group: RouteScan['group'];
  /** Client-side route to load before trying to open the popup. */
  host: string;
  /** A passcode dialog may guard the host route. */
  gated?: boolean;
  /** Click these (in order) to reach the popup trigger (e.g. open a list row). */
  prep?: Trigger[];
  /** Ordered open attempts; the first that surfaces a dialog wins. */
  open: Trigger[];
  /** Human note (e.g. "trang showcase dev", "chỉ hiện khi mất kết nối"). */
  note?: string;
}

/** A popup scan result — a {@link RouteScan} flagged as a popup. */
export type PopupScan = RouteScan & { popup: true; reachable: boolean };

/** Resolve a trigger to a Locator (null for keyboard triggers). */
function locatorFor(page: Page, t: Trigger): Locator | null {
  switch (t.by) {
    case 'testid':
      return page.getByTestId(t.value).first();
    case 'role':
      return page.getByRole(t.role, { name: t.name }).first();
    case 'text':
      return page.getByText(t.name).first();
    case 'css':
      return page.locator(t.selector).first();
    case 'key':
      return null;
  }
}

/** Perform a trigger. Returns true if it actually fired (element existed). */
async function fireTrigger(page: Page, t: Trigger): Promise<boolean> {
  try {
    if (t.by === 'key') {
      await page.keyboard.press(t.keys);
      return true;
    }
    const loc = locatorFor(page, t);
    if (!loc) return false;
    if (!(await loc.isVisible({ timeout: 2500 }).catch(() => false))) return false;
    await loc.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
    try {
      await loc.click({ timeout: 3000 });
    } catch {
      // A stray overlay/backdrop may intercept the click — force it through.
      await loc.click({ timeout: 2000, force: true }).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

/** True once a dialog/alert portal is visible. */
async function dialogVisible(page: Page, timeout = 2500): Promise<boolean> {
  return page
    .locator(DIALOG_SELECTOR)
    .last()
    .isVisible({ timeout })
    .catch(() => false);
}

/**
 * Dismiss any open dialog so the next popup starts clean. Prefers the dialog's
 * explicit close (X) button, then falls back to Escape and an outside click:
 * the QR-scanner / camera dialog keeps the camera live and ignores Escape, so
 * it only closes via its X button — leaving it open would block later steps.
 */
async function closeDialog(page: Page): Promise<void> {
  for (let i = 0; i < 4; i++) {
    const dialog = page.locator(DIALOG_SELECTOR).last();
    if (!(await dialog.isVisible().catch(() => false))) return;
    // The close control's accessible name is "Close" (hardcoded EN) or "Đóng".
    const closeBtn = dialog.getByRole('button', { name: /close|đóng/i }).first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ timeout: 1500, force: true }).catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(250);
  }
  // Last resort: click outside (top-left corner) to dismiss a modal overlay.
  await page.mouse.click(5, 5).catch(() => {});
  await page.waitForTimeout(200);
}

/** Build a not-reachable result for `def` (logged, never gated on). */
function unreachable(def: PopupDef, error?: string): PopupScan {
  return {
    route: `${def.host} ▸ ${def.name}`,
    name: def.name,
    group: def.group,
    ui: [],
    aria: [],
    overflow: [],
    stub: false,
    path: def.host,
    redirected: true, // keeps it out of the untranslated bucket and the gate
    popup: true,
    reachable: false,
    error,
  };
}

/**
 * Open `def`'s popup from its host route, scan the dialog, then close it.
 *
 * @param hooks.onOpen Called while the dialog is still open IF it shows English,
 *                     so the caller can screenshot it; returns the relative
 *                     screenshot path to attach to the result.
 */
export async function scanPopup(
  page: Page,
  def: PopupDef,
  hooks: { onOpen?: (page: Page, raw: RawDetect) => Promise<string | undefined> } = {},
): Promise<PopupScan> {
  try {
    await routerNavigate(page, def.host);
    await page.waitForTimeout(1200);
    // Drop any leftover overlay/popover (e.g. the notification panel opened in a
    // previous phase) whose backdrop would otherwise swallow our trigger clicks.
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
    if (def.gated) {
      await enterPasscodeIfPrompted(page).catch(() => {});
      await page.waitForTimeout(800);
    }
    // Reach the trigger (open a row / switch a tab) if needed.
    for (const t of def.prep ?? []) {
      await fireTrigger(page, t);
      await page.waitForTimeout(800);
    }
    // Try each open trigger until a dialog actually appears.
    let opened = false;
    for (const t of def.open) {
      if (await fireTrigger(page, t)) {
        await page.waitForTimeout(700);
        if (await dialogVisible(page)) {
          opened = true;
          break;
        }
      }
    }
    if (!opened) return unreachable(def);

    const raw = await detectDialog(page);
    // Screenshot when the dialog fails i18n OR shows UI vỡ (clipped / overflow).
    const worthShooting =
      raw.ui.length > 0 || (raw.overflow?.length ?? 0) > 0 || (raw.xOverflow ?? 0) > 8;
    const screenshot = worthShooting && hooks.onOpen ? await hooks.onOpen(page, raw) : undefined;
    await closeDialog(page);
    return {
      ...raw,
      route: `${def.host} ▸ ${def.name}`,
      name: def.name,
      group: def.group,
      redirected: false,
      popup: true,
      reachable: true,
      screenshot,
    };
  } catch (err) {
    await closeDialog(page).catch(() => {});
    return unreachable(def, String(err).slice(0, 120));
  }
}

// ─────────────────────────────── registry ───────────────────────────────
//
// Triggers list multiple fallbacks because the app is in Tiếng Việt during the
// scan, so EN labels from the source audit won't match the rendered text — we
// pair each with its VN equivalent (and a structural fallback) where known.
// The `cash-drawer` route is a dev showcase whose dialog text is hardcoded
// English regardless of language, so its buttons match by EN label directly.

/** Cash Drawer showcase route — every dialog here is a known hardcoded-EN demo. */
const CASH_DRAWER_POPUPS: PopupDef[] = (
  [
    ['Cảnh báo xoá tài khoản (Are you absolutely sure?)', /Show Dialog/i],
    ['Gỡ SĐT khách (Remove Customer Phone)', /Remove Customer Phone/i],
    ['Gỡ dịch vụ (Remove Service Item)', /Remove Service Item/i],
    ['Gỡ nhân viên (Remove Staff)', /Remove Staff/i],
    ['Xoá đơn (Delete Order)', /Delete Order/i],
    ['Huỷ đơn (Void Order)', /Void Order/i],
    ['Hoàn tiền (Refund Payment)', /Refund Payment/i],
    ['Thêm tip (Add a Tip)', /Add a Tip/i],
    ['Chia tip (Split Tip)', /Split Tip/i],
    ['Bộ lọc (Filter)', /^Filter$/i],
  ] as const
).map(([name, label]) => ({
  name: `Két tiền · ${name}`,
  group: 'System' as const,
  host: '/cash-drawer',
  open: [{ by: 'role', role: 'button', name: label }],
  note: 'Trang showcase dev — chuỗi hardcode tiếng Anh (audit đã xác nhận).',
}));

/**
 * Popup registry. Best-effort triggers; anything that can't be opened in a
 * normal session is reported as "không mở được" rather than failing the run.
 * Extend this list as more popups get reliable triggers against the live app.
 */
export const POPUP_DEFS: PopupDef[] = [
  ...CASH_DRAWER_POPUPS,

  // ── Settings ──────────────────────────────────────────────────────────
  {
    name: 'Cài đặt · Demo Mode',
    group: 'Settings',
    host: '/settings/demo-mode',
    open: [
      { by: 'testid', value: 'demo-mode-trigger' },
      { by: 'role', role: 'button', name: /demo mode|chế độ demo/i },
      { by: 'text', name: /demo mode|chế độ demo/i },
    ],
    note: 'Dialog tool nội bộ — nhãn/ mô tả tính năng hardcode tiếng Anh (audit).',
  },
  {
    name: 'Cài đặt · Thêm dịch vụ / sản phẩm',
    group: 'Settings',
    host: '/settings/services',
    open: [
      { by: 'role', role: 'button', name: /add new item|thêm (mục|mới)|tạo mới/i },
      { by: 'testid', value: 'add-service' },
      { by: 'css', selector: 'main button:has(svg.lucide-plus)' },
    ],
  },
  {
    name: 'Cài đặt · Tạo danh mục',
    group: 'Settings',
    host: '/settings/services',
    open: [
      { by: 'role', role: 'button', name: /create category|tạo danh mục|thêm danh mục/i },
      { by: 'testid', value: 'add-category' },
    ],
  },
  {
    name: 'Cài đặt · Tạo nhân viên',
    group: 'Settings',
    host: '/settings/staffs',
    open: [
      { by: 'role', role: 'button', name: /create.*staff|new staff|thêm nhân viên|tạo nhân viên/i },
      { by: 'testid', value: 'add-staff' },
    ],
  },
  {
    name: 'Cài đặt · Tạo nhóm nhân viên',
    group: 'Settings',
    host: '/settings/staffs',
    open: [
      { by: 'role', role: 'button', name: /new group|add group|tạo nhóm|thêm nhóm/i },
      { by: 'testid', value: 'add-staff-group' },
    ],
  },
  {
    name: 'Cài đặt · Gán nhân viên vào vai trò',
    group: 'Settings',
    host: '/settings/roles',
    open: [
      { by: 'role', role: 'button', name: /assign.*staff|gán nhân viên/i },
      { by: 'testid', value: 'assign-staff' },
    ],
  },
  {
    name: 'Cài đặt · Tạo cấu hình tip',
    group: 'Settings',
    host: '/settings/charge-fee',
    open: [
      { by: 'role', role: 'button', name: /add.*tip|tip setting|thêm tip|cấu hình tip/i },
      { by: 'testid', value: 'add-tip-setting' },
    ],
  },

  // ── POS / Home ────────────────────────────────────────────────────────
  {
    name: 'Trang chủ · Tìm kiếm toàn cục',
    group: 'POS',
    host: '/home',
    open: [
      { by: 'key', keys: 'Control+KeyK' },
      { by: 'role', role: 'button', name: /search|tìm kiếm/i },
      { by: 'testid', value: 'global-search' },
    ],
  },
  {
    name: 'Trang chủ · Quét QR',
    group: 'POS',
    host: '/home',
    open: [
      { by: 'role', role: 'button', name: /scan|quét|qr/i },
      { by: 'testid', value: 'qr-scanner' },
    ],
    note: 'Có thể cần quyền camera — thường không mở được trong CI.',
  },
  {
    name: 'Lịch sử đơn · Bộ lọc',
    group: 'POS',
    host: '/order-history',
    open: [
      { by: 'role', role: 'button', name: /^filter$|bộ lọc|lọc/i },
      { by: 'testid', value: 'order-history-filter' },
    ],
  },

  // ── Time tracking ───────────────────────────────────────────────────────
  {
    name: 'Chấm công · Thêm bản ghi',
    group: 'System',
    host: '/time-tracking',
    open: [
      { by: 'role', role: 'button', name: /add|new|thêm|tạo/i },
      { by: 'testid', value: 'add-time-keeping' },
    ],
  },
];
