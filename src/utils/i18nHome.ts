import { type Page } from '@playwright/test';
import { detectDialog, detectToasts, routerNavigate, type RouteScan } from '@utils/i18nScan';
import { type PopupDef } from '@utils/i18nPopups';

/**
 * Home (/home) deep localization scan for the Vietnamese audit.
 *
 * PREREQUISITE (see docs/i18n/vietnamese-scan-flow.md): the caller MUST have
 * already switched the app to Tiếng Việt via `switchToVietnamese()` and reach
 * `/home` through the client-side router (`routerNavigate`) — a full
 * `page.goto` reverts the language (known non-persistence bug).
 *
 * Two kinds of Home surface (mapped in docs/i18n/home-translation-map.md):
 *   1. {@link HOME_POPUP_DEFS} — dialogs openable with NO active order
 *      (Sell Gift Card, Quick Pay staff-warning, Global search, Scanner).
 *      Scanned through the shared `scanPopup()` infra alongside POPUP_DEFS.
 *   2. {@link scanHomeOrderDialogs} — dialogs that only exist once an order has
 *      a staff + service line (Order Note, Promo & Rewards). One order is set
 *      up once, then each dialog is opened / scanned / closed in place.
 *
 * All triggers were verified live via MCP Playwright (2026-07-01). Each lists
 * several fallbacks (EN label → VN label → structural) because the app is in
 * Tiếng Việt during the scan, so the English source labels won't match.
 */

/** Home popups reachable WITHOUT an active order. */
export const HOME_POPUP_DEFS: PopupDef[] = [
  {
    name: 'Trang chủ · Bán thẻ quà tặng (Sell Gift Card)',
    group: 'POS',
    host: '/home',
    open: [
      { by: 'text', name: /^gift card$|thẻ quà tặng|bán thẻ/i },
      { by: 'role', role: 'button', name: /gift card|thẻ quà/i },
    ],
  },
  {
    name: 'Trang chủ · Cảnh báo chọn nhân viên (Select Staff First)',
    group: 'POS',
    host: '/home',
    // Clicking Quick Pay with NO staff selected surfaces the warning dialog.
    // Runs before the order-flow section, so no staff is attached yet.
    open: [
      { by: 'text', name: /^quick pay$|thanh toán nhanh/i },
      { by: 'role', role: 'button', name: /quick pay|thanh toán nhanh/i },
    ],
    note: 'Hiện khi bấm Quick Pay lúc chưa chọn nhân viên.',
  },
  {
    name: 'Trang chủ · Tìm kiếm toàn cục (Global Search)',
    group: 'POS',
    host: '/home',
    // The header search is a READONLY <input> wrapped in a clickable
    // `div.input-wrapper`; the input itself isn't clickable and Ctrl+K does NOT
    // open the dialog (verified live via MCP 2026-07-05). Click the wrapper. NOTE:
    // needs the 1920×1080 scan viewport — at a narrow viewport the header search
    // sits off-screen and the click is skipped.
    open: [
      { by: 'css', selector: 'header .input-wrapper' },
      { by: 'key', keys: 'Control+KeyK' },
      { by: 'role', role: 'button', name: /^search$|tìm kiếm/i },
    ],
    // Bug this catches: the 4 tabs (All / Appointment / Customer / Order) stay
    // English in VN mode — only title/placeholder/empty-state are translated.
    note: 'Tabs All/Appointment/Customer/Order chưa dịch (còn tiếng Anh) khi ở chế độ VN.',
  },
  {
    name: 'Trang chủ · Quét mã (Scanner)',
    group: 'POS',
    host: '/home',
    open: [
      { by: 'role', role: 'button', name: /^scanner$|quét mã|máy quét/i },
      { by: 'text', name: /^scanner$|quét mã/i },
    ],
    note: 'Có thể cần quyền camera — thường không mở được trong CI.',
  },
];

/** One order-dependent Home dialog: how to open it + its report label. */
interface OrderDialogDef {
  name: string;
  /** Button label (EN|VN) that opens the dialog from the order summary. */
  open: RegExp;
}

const ORDER_DIALOGS: OrderDialogDef[] = [
  // The order-note button reads "Lưu ý" in Vietnamese ("Note" in English).
  { name: 'Trang chủ · Ghi chú đơn (Order Note)', open: /^note$|ghi chú|lưu ý/i },
  {
    name: 'Trang chủ · Khuyến mãi & Thưởng (Promo & Rewards)',
    open: /promo.*rewards?|khuyến mãi.*thưởng|ưu đãi/i,
  },
  // Merge Order dialog ("Gộp đơn") — order cards inside leak "Unknown" /
  // "Processing" / "N/A" (see docs/i18n/home-translation-map.md §3).
  { name: 'Trang chủ · Gộp đơn (Merge Order)', open: /merge order|gộp đơn/i },
];

/**
 * Fully close any open dialog AND its backdrop, best-effort. Critically, it
 * waits until the modal OVERLAY (`[data-slot="dialog-overlay"]`) is gone — a
 * lingering overlay keeps intercepting pointer events and silently swallows the
 * next click (e.g. the Print button becomes a no-op → no toast). Strategy per
 * pass: click a Close/Cancel control inside the dialog, click the overlay
 * backdrop, and press Escape; stop once no dialog/overlay remains.
 */
async function dismissDialog(page: Page): Promise<void> {
  for (let i = 0; i < 6; i++) {
    const stillOpen = await page.evaluate(() => {
      const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
      const open =
        document.querySelectorAll('[role="dialog"],[role="alertdialog"]').length > 0 ||
        document.querySelectorAll('[data-slot="dialog-overlay"]').length > 0;
      if (!open) return false;
      // Prefer an explicit close/cancel control inside the open dialog(s).
      const btns = [
        ...document.querySelectorAll('[role="dialog"] button,[role="alertdialog"] button'),
      ].filter((b) =>
        /close|đóng|cancel|huỷ|hủy/i.test(
          norm(b.textContent) || b.getAttribute('aria-label') || '',
        ),
      );
      if (btns.length) (btns[btns.length - 1] as HTMLElement).click();
      // Also click the overlay backdrop — secondary dialogs dismiss on it.
      const ov = document.querySelector('[data-slot="dialog-overlay"]');
      if (ov) (ov as HTMLElement).click();
      return true;
    });
    if (!stillOpen) return;
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  }
}

/**
 * Set up one active order (first staff + first service) on /home, then open
 * each order-dependent dialog, scan it for leftover English, and close it.
 *
 * Best-effort throughout: if there's no staff/service to select, or a dialog
 * won't open, the affected step is skipped — it never throws, so a missing
 * fixture can't fail the localization gate. `record` is the same recorder the
 * main scan uses (screenshots failing/broken surfaces).
 */
export async function scanHomeOrderDialogs(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/home');
    await page.waitForTimeout(1500);
    await dismissDialog(page);

    // 1) Attach the first staff — an order is created on selection. The staff
    //    listing lives under #home-staff-listing (see HomePage page object);
    //    each card is a cursor-pointer node. `force` bypasses the transient
    //    `.is-changing-staff::after` overlay that intercepts pointer events.
    const staffCard = page.locator('#home-staff-listing [class*="cursor"]').first();
    if (!(await staffCard.isVisible().catch(() => false))) return; // no staff → skip
    await staffCard.click({ force: true }).catch(() => {});
    // Confirm an order was actually created (Pay button appears) before going on
    // — staff selection round-trips a mutation, so a fixed wait is unreliable.
    const payBtn = page.getByRole('button', { name: /thanh toán|^pay$/i }).first();
    await payBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});

    // 2) Add the first service line so Note / Promo & Rewards become available.
    const service = page.getByRole('listitem').first();
    if (await service.isVisible().catch(() => false)) {
      await service.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    // 3) Open, scan, close each order-dependent dialog.
    for (const def of ORDER_DIALOGS) {
      try {
        const trigger = page.getByRole('button', { name: def.open }).first();
        if (!(await trigger.isVisible().catch(() => false))) continue;
        await trigger.click().catch(() => {});
        await page.waitForTimeout(900);
        const dialogUp = await page
          .locator('[role="dialog"],[role="alertdialog"]')
          .last()
          .isVisible()
          .catch(() => false);
        if (!dialogUp) continue;
        const raw = await detectDialog(page);
        await record({
          ...raw,
          route: `/home ▸ ${def.name}`,
          name: def.name,
          group: 'POS',
          redirected: false,
          popup: true,
          reachable: true,
        });
        await dismissDialog(page);
      } catch {
        /* this dialog couldn't be opened — skip, never fail the scan */
      }
    }

    // 3b) Change-staff confirmation dialog. Click "Change Staff" / "Đổi nhân
    //     viên" on the order's staff row, then pick a different staff card to
    //     raise the "Change from X to Y?" confirm dialog; scan it, then cancel.
    try {
      const changeBtn = page.getByRole('button', { name: /change staff|đổi nhân viên/i }).first();
      if (await changeBtn.isVisible().catch(() => false)) {
        await changeBtn.click().catch(() => {});
        await page.waitForTimeout(900);
        const cards = page.locator('#home-staff-listing [class*="cursor"]');
        const n = await cards.count().catch(() => 0);
        for (let i = 0; i < Math.min(n, 4); i++) {
          await cards
            .nth(i)
            .click({ force: true })
            .catch(() => {});
          await page.waitForTimeout(700);
          if (
            await page
              .locator('[role="dialog"],[role="alertdialog"]')
              .last()
              .isVisible()
              .catch(() => false)
          )
            break;
        }
        if (
          await page
            .locator('[role="dialog"],[role="alertdialog"]')
            .last()
            .isVisible()
            .catch(() => false)
        ) {
          await record({
            ...(await detectDialog(page)),
            route: '/home ▸ Đổi nhân viên (Change Staff)',
            name: 'Trang chủ · Đổi nhân viên',
            group: 'POS',
            redirected: false,
            popup: true,
            reachable: true,
          });
        }
        await dismissDialog(page);
      }
    } catch {
      /* change-staff unavailable — skip */
    }

    // 4) Print button → "Printer not connected" toast (hardcoded EN). The Print
    //    button is the first icon-only sibling of Pay (no accessible name, blue).
    //    MUST run with NO leftover dialog overlay (see dismissDialog) — an open
    //    overlay swallows the click and no toast fires. The toast renders a beat
    //    after the click, so POLL detectToasts rather than checking once.
    try {
      await dismissDialog(page);
      const clicked = await page.evaluate(() => {
        const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
        const isIcon = (b: Element): boolean =>
          !norm(b.textContent) && !!b.querySelector('svg,img');
        const all = [...document.querySelectorAll('button')];
        // The Print button is the icon-only button with the primary (blue)
        // background. Match by colour first — robust to footer re-renders that
        // shift its sibling position (e.g. after the Change-Staff step). Fall
        // back to the first icon-only sibling of Pay.
        let printBtn = all.find(
          (b) => isIcon(b) && getComputedStyle(b).backgroundColor === 'rgb(86, 105, 255)',
        ) as HTMLElement | undefined;
        if (!printBtn) {
          const pay = all.find((b) => /thanh toán|^pay$/i.test(norm(b.textContent)));
          printBtn = [...(pay?.parentElement?.children || [])].find(
            (e) => e.tagName === 'BUTTON' && isIcon(e),
          ) as HTMLElement | undefined;
        }
        if (!printBtn) return false;
        printBtn.click();
        return true;
      });
      if (clicked) {
        for (let i = 0; i < 6; i++) {
          await page.waitForTimeout(400);
          const raw = await detectToasts(page);
          if (raw.ui.length > 0) {
            await record({
              ...raw,
              route: '/home ▸ Toast nút In (máy in)',
              name: 'Trang chủ · Toast nút In',
              group: 'POS',
              redirected: false,
              popup: true,
              reachable: true,
            });
            break;
          }
        }
      }
    } catch {
      /* print toast unavailable — skip, never fail */
    }
  } catch {
    /* home order flow unavailable — skip entirely */
  }
}

/** The three unlabeled status icons at the top-right of the header + the panel
 * each opens (verified via MCP): Notifications, Time Keeping, Devices. */
const HEADER_PANELS: { idx: number; name: string }[] = [
  { idx: 0, name: 'Trang chủ · Bảng thông báo (chuông 🔔)' }, // rightmost
  { idx: 1, name: 'Trang chủ · Chấm công (Time Keeping)' },
  { idx: 2, name: 'Trang chủ · Thiết bị (Devices)' },
];

/**
 * Open + scan the three header status panels. Their trigger buttons have NO
 * accessible name (see {@link scanHomeOrderDialogs} / docs §4b), so they're
 * clicked by position — top row (y < 70), icon-only, right→left. Only the panel
 * portal is scanned (via {@link detectDialog}) — NOT the whole body — so the
 * /home tiles behind the overlay aren't mis-attributed to the panel. Best-effort:
 * a panel that won't open (or isn't a dialog portal) is recorded clean.
 */
export async function scanHeaderPanels(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  for (const panel of HEADER_PANELS) {
    try {
      await routerNavigate(page, '/home');
      await page.waitForTimeout(800);
      await dismissDialog(page);
      const opened = await page.evaluate((idx: number) => {
        const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
        const btns = [...document.querySelectorAll('header button')]
          .filter((b) => {
            const r = b.getBoundingClientRect();
            return r.top < 70 && !norm(b.textContent) && !!b.querySelector('svg,img');
          })
          .sort((a, b) => b.getBoundingClientRect().x - a.getBoundingClientRect().x);
        const btn = btns[idx] as HTMLElement | undefined;
        if (!btn) return false;
        btn.click();
        return true;
      }, panel.idx);
      if (!opened) continue;
      await page.waitForTimeout(1000);
      await record({
        ...(await detectDialog(page)),
        route: `/home ▸ ${panel.name}`,
        name: panel.name,
        group: 'System',
        redirected: false,
        popup: true,
        reachable: true,
      });
      await dismissDialog(page);
    } catch {
      /* header panel unavailable — skip */
    }
  }
}

/**
 * Scan the Chấm công (Time Keeping) dialog specifically. The clock icon in the
 * header has NO accessible name, so {@link scanHeaderPanels} reaches it by blind
 * position (fragile). This helper instead uses the dialog's DEEP-LINK — the app
 * opens it from `?dialog=time-keeping` (verified live via MCP: clicking the clock
 * icon sets `/home?dialog=time-keeping`). Navigating CLIENT-SIDE with that search
 * param keeps the language Vietnamese and opens the dialog deterministically.
 *
 * Known finding (see docs/i18n/time-keeping-i18n-result.md): the empty state of
 * the "Nhân viên sẵn sàng" column renders the hardcoded English "No staffs found."
 * (fixed in app PR #1947, pending merge). Best-effort — never throws.
 */
export async function scanTimeKeepingDialog(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    await routerNavigate(page, '/home');
    await page.waitForTimeout(800);
    await dismissDialog(page);
    // Client-side navigate with the ?dialog=time-keeping search param (keeps VN).
    await page.evaluate(() => {
      const r = (
        window as unknown as {
          __TSR_ROUTER__?: { navigate: (o: unknown) => unknown };
        }
      ).__TSR_ROUTER__;
      r?.navigate({ to: '/home', search: { dialog: 'time-keeping' } });
    });
    await page.waitForTimeout(1200);
    // Fallback: if the deep-link didn't surface the dialog, click the clock icon
    // (icon-only header button that sets the ?dialog=time-keeping URL).
    let up = await page
      .locator('[role="dialog"],[role="alertdialog"]')
      .last()
      .isVisible()
      .catch(() => false);
    if (!up) {
      await page.evaluate(() => {
        const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
        const btns = [...document.querySelectorAll('header button')].filter(
          (b) => !norm(b.textContent) && !!b.querySelector('svg,img'),
        );
        for (const b of btns) {
          (b as HTMLElement).click();
          if (location.search.includes('dialog=time-keeping')) break;
        }
      });
      await page.waitForTimeout(1000);
      up = await page
        .locator('[role="dialog"],[role="alertdialog"]')
        .last()
        .isVisible()
        .catch(() => false);
    }
    if (!up) return; // couldn't open — skip, never fail the scan
    await record({
      ...(await detectDialog(page)),
      route: '/home ▸ Chấm công (Time Keeping)',
      name: 'Trang chủ · Chấm công (Time Keeping)',
      group: 'System',
      redirected: false,
      popup: true,
      reachable: true,
    });
    await dismissDialog(page);
  } catch {
    /* time-keeping dialog unavailable — skip */
  }
}
