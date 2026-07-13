import type { Page } from '@playwright/test';

/**
 * i18n (Vietnamese) coverage scanner — shared helpers for the automated
 * "which screens are still in English" test.
 *
 * The app does NOT persist the language across a full reload (known bug), so the
 * test switches to Tiếng Việt once via the UI and then navigates client-side
 * through the TanStack router (`window.__TSR_ROUTER__.navigate`) to keep the VN
 * state alive. Every page is then scanned in-browser for leftover English.
 */

/** A navigable surface to scan. */
export interface RouteDef {
  /** Client-side path to navigate to via the router. */
  path: string;
  /** Human label shown in the report. */
  name: string;
  /** Section grouping in the report. */
  group: 'POS' | 'Incomes' | 'Settings' | 'System';
  /** True if an owner passcode dialog is expected before content loads. */
  gated?: boolean;
  /** True to click an "Expand All" control first so collapsed rows are scanned. */
  expandAll?: boolean;
}

/** Static, parameter-free routes (the core of the scan). */
export const STATIC_ROUTES: RouteDef[] = [
  { path: '/home', name: 'Trang chủ / POS', group: 'POS' },
  { path: '/order-pending', name: 'Đơn đang chờ', group: 'POS' },
  { path: '/order-history', name: 'Lịch sử đơn hàng', group: 'POS' },
  { path: '/appointment', name: 'Lịch hẹn', group: 'POS' },
  { path: '/incomes', name: 'Báo cáo thu nhập (index)', group: 'Incomes' },
  { path: '/incomes/income-daily', name: 'Thu nhập theo ngày', group: 'Incomes', gated: true },
  { path: '/incomes/income-summary', name: 'Tổng hợp thu nhập', group: 'Incomes', gated: true },
  { path: '/incomes/income-staff', name: 'Thu nhập nhân viên', group: 'Incomes', gated: true },
  { path: '/settings', name: 'Cài đặt (index)', group: 'Settings' },
  { path: '/settings/business', name: 'Thông tin doanh nghiệp', group: 'Settings' },
  { path: '/settings/services', name: 'Dịch vụ & Sản phẩm', group: 'Settings' },
  { path: '/settings/staffs', name: 'Nhân viên', group: 'Settings' },
  { path: '/settings/roles', name: 'Vai trò', group: 'Settings' },
  { path: '/settings/permissions', name: 'Quyền hạn', group: 'Settings', expandAll: true },
  { path: '/settings/receipt', name: 'Hóa đơn (mẫu in)', group: 'Settings' },
  { path: '/settings/charge-fee', name: 'Phí & Phụ thu', group: 'Settings' },
  { path: '/settings/accessibility', name: 'Hiển thị', group: 'Settings' },
  { path: '/settings/language', name: 'Ngôn ngữ', group: 'Settings' },
  { path: '/time-tracking', name: 'Chấm công', group: 'System' },
  { path: '/batch-history', name: 'Lịch sử ca (Batch)', group: 'System', gated: true },
  { path: '/cash-drawer', name: 'Két tiền', group: 'System' },
  { path: '/customer', name: 'Màn hình khách hàng', group: 'System' },
  { path: '/force-update', name: 'Yêu cầu cập nhật', group: 'System' },
  { path: '/customer/force-update', name: 'Khách hàng · cập nhật', group: 'System' },
];

/** Raw findings returned from the in-browser detector. */
export interface RawDetect {
  /** Untranslated visible text (headings, labels, cells, button text…). */
  ui: string[];
  /** Untranslated placeholder / aria-label / title (tooltip) attributes. */
  aria: string[];
  /**
   * Untranslated accessible-name of INTERACTIVE controls only (button, link,
   * tab, menuitem, switch, option…). A focused "buttons still in English" view;
   * text-labelled controls also appear in `ui`, icon-only ones only here.
   */
  controls?: string[];
  /**
   * Icon-only controls with NO accessible name (no text/aria-label/title).
   * Untranslatable AND an a11y gap — the scan can't verify their wording and a
   * screen reader can't announce them. Reported by dev source (data-tsd-source)
   * so a label can be added. Report-only; never trips the localization gate.
   */
  noName?: string[];
  /** Text visibly clipped by its container (ellipsis / hidden overflow). */
  overflow: string[];
  /** Horizontal overflow of the scan root in px (>8 ≈ layout vỡ). 0 if none. */
  xOverflow?: number;
  stub: boolean;
  path: string;
}

/** A scanned route plus the navigation outcome. */
export interface RouteScan extends RawDetect {
  route: string;
  name: string;
  group: string;
  /** Router landed somewhere else (e.g. /login redirected to /home when authed). */
  redirected: boolean;
  /** Relative path (from the report dir) to the failing-page screenshot, if any. */
  screenshot?: string;
  error?: string;
  /** True for a popup/dialog scan (vs a full-page route scan). */
  popup?: boolean;
  /**
   * Popups only: whether the popup could actually be opened in this session.
   * `false` → not reachable (logged, never counted as untranslated). For an
   * unreachable popup `redirected` is also set `true` so it lands in the
   * skipped bucket and never trips the localization gate.
   */
  reachable?: boolean;
}

/** One untranslated string and every route it shows up on. */
export interface DedupString {
  text: string;
  count: number;
  routes: string[];
}

/** Run-over-run delta of untranslated strings. */
export interface I18nDiff {
  baselineAt: string | null;
  newStrings: string[];
  fixedStrings: string[];
}

/** True when a scan represents a real untranslated screen (not redirect/stub). */
export const isUntranslated = (s: RouteScan): boolean =>
  !s.redirected && !s.stub && s.ui.length > 0;

/**
 * Collapse a per-scan string list across all screens into a single deduped list,
 * each with the routes it appears on — so a string is fixed ONCE, not per-screen.
 * Sorted by how many screens it hits (highest leverage first). `pick` chooses
 * which field to dedup (default: untranslated visible text).
 */
export function dedupUntranslated(
  scans: RouteScan[],
  pick: (s: RouteScan) => string[] = (s) => s.ui,
): DedupString[] {
  const map = new Map<string, Set<string>>();
  for (const s of scans) {
    if (s.redirected || s.stub) continue;
    for (const t of pick(s)) {
      const set = map.get(t) ?? new Set<string>();
      set.add(s.route);
      map.set(t, set);
    }
  }
  return [...map.entries()]
    .map(([text, routes]) => ({ text, count: routes.size, routes: [...routes].sort() }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
}

/** Diff the current dedup strings against a previous run's set. */
export function diffStrings(
  current: DedupString[],
  baseline: { strings?: string[]; generatedAt?: string } | null,
): I18nDiff {
  const cur = new Set(current.map((d) => d.text));
  const base = new Set(baseline?.strings ?? []);
  return {
    baselineAt: baseline?.generatedAt ?? null,
    newStrings: [...cur].filter((t) => !base.has(t)).sort(),
    fixedStrings: [...base].filter((t) => !cur.has(t)).sort(),
  };
}

/** The dialog/alert portal selector — the scan root when checking a popup. */
export const DIALOG_SELECTOR = '[role="dialog"],[role="alertdialog"]';

/**
 * "Data zones" — DOM subtrees whose text is merchant-entered DATA, not UI chrome
 * (service/category names, staff names, order rows). Any text inside these is
 * skipped so the gate only fails on real UI labels. Tune this list as the app
 * evolves. Selectors are verified against the page objects.
 */
export const DATA_ZONE_SELECTORS = [
  '#home-staff-listing', // POS staff cards (names)
  'a[href*="/settings/staffs/"]', // staff list rows
  'a[href*="/settings/services/"]', // service / category settings rows
  'a[href*="/order-history/"]', // order-history cards
];

/**
 * Exact string values that are DATA, not UI — default catalog categories and
 * role names a merchant sees but that are not translation bugs. Edit freely.
 */
export const DATA_VALUES = ['Owner', 'Manager', 'Staff', 'Product', 'Custom...'];

/** Options for the in-page detector. */
export interface DetectOpts {
  rootSelector: string;
  /** CSS selectors whose descendant text is skipped (merchant data). */
  dataZones?: string[];
  /** Exact strings treated as data (never flagged). */
  dataValues?: string[];
}

/**
 * Detector executed INSIDE the page, scoped to `rootSelector`. Pass `'body'` to
 * scan a full screen, or {@link DIALOG_SELECTOR} to scan only the open popup.
 * Self-contained (no outer scope) because it is serialized by `page.evaluate`.
 *
 * Strategy: a string is "untranslated UI" when it has NO Vietnamese diacritics
 * and contains a word from a curated UI dictionary. The dictionary deliberately
 * avoids generic English stop-words ("and/the/of") so catalog/proper names
 * (e.g. service titles, customer names) are NOT flagged as bugs. Text inside
 * `dataZones`, exact `dataValues`, dates, count badges ("3 Services"),
 * ALL-CAPS catalog names and multi-word proper names are also skipped. Known
 * false positives ("In" = Print in VN, "English" = a language name) excluded.
 */
/* eslint-disable */
export function detectScope(opts: DetectOpts): RawDetect {
  const { rootSelector, dataZones = [], dataValues = [] } = opts;
  // A popup may match more than once across nested portals; scan the LAST match
  // (the most-recently-opened dialog). Bail cleanly if the root is absent (e.g.
  // a popup that never opened) so the caller can mark it unreachable.
  const roots = Array.from(document.querySelectorAll(rootSelector));
  const root = (roots[roots.length - 1] as HTMLElement | undefined) || null;
  if (!root) {
    return { ui: [], aria: [], overflow: [], stub: false, path: location.pathname };
  }
  // A text/element is "in a data zone" if it lives inside a merchant-data area.
  const zoneSel = dataZones.join(',');
  const inDataZone = (el: Element | null): boolean => !!zoneSel && !!el && !!el.closest(zoneSel);
  const dataVal = new Set(dataValues);
  const viet = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  // Curated UI vocabulary that SHOULD be translated. No generic stop-words.
  const ui = new Set([
    // notification panel + relative-time vocabulary
    'notification',
    'notifications',
    'mark',
    'read',
    'unread',
    'reminder',
    'ago',
    'hours',
    'minutes',
    'yesterday',
    'confirmed',
    'requested',
    'highlight',
    'order',
    'orders',
    'total',
    'sale',
    'sales',
    'tip',
    'tax',
    'staff',
    'staffs',
    'found', // empty states: "No staffs found.", "No results found" — must be flagged
    'today',
    'latest',
    'search',
    'save',
    'cancel',
    'close',
    'add',
    'edit',
    'delete',
    'remove',
    'print',
    'export',
    'language',
    'settings',
    'setting',
    'customer',
    'payment',
    'pay', // "Pay 1"/"Pay 2" payout rows still English (VP-2253)
    'cash',
    'card',
    'check', // split-order "Check 1/2/3" tabs & summary still English (VP-2290/2291/2292)
    'checks',
    'discount',
    'refund',
    'quantity',
    'price',
    'amount',
    'service',
    'services',
    'product',
    'products',
    'employee',
    'employees',
    'role',
    'roles',
    'permission',
    'permissions',
    'receipt',
    'charge',
    'fee',
    'business',
    'accessibility',
    'logout',
    'login',
    'version',
    'support',
    'device',
    'checkout',
    'quick',
    'scanner',
    'appointment',
    'history',
    'pending',
    'home',
    'income',
    'daily',
    'summary',
    'report',
    'reports',
    'commission',
    'salary',
    'salon',
    'supply',
    'share',
    'gift',
    'net',
    'gross',
    'subtotal',
    'submit',
    'confirm',
    'apply',
    'select',
    'enter', // "No, enter again" customer-display phone confirm (VP-2302)
    'filter',
    'status',
    'active',
    'inactive',
    'unknown',
    'enable',
    'disable',
    'week',
    'month',
    'previous',
    'next',
    'back',
    'continue',
    'done',
    'loading',
    'error',
    'warning',
    'view',
    'detail',
    'details',
    'manage',
    'management',
    'account',
    'store',
    'choose',
    'primary',
    'required',
    'optional',
    'update',
    'create',
    'available',
    'collected',
    'redemption',
    'promotion', // customer-display / order shows "Promotion" line (VP-2302)
    'promotions',
    'method',
    'overview',
    'clean',
    'wage',
    'period',
    'redeem',
    'void',
    'complete',
    'completed',
    'finished', // "Check-in hôm nay" card status still English "Completed"/"Finished" (VP-2322)
    'closed', // work-hours OFF day shows the raw "Closed" (VP-2274)
    'unsettled',
    'successful',
    'refunded',
    'show',
    'hide',
    'reset',
    'clear',
    'default',
    'address',
    'email',
    'phone', // "...Is this your phone number?" customer-display confirm (VP-2302)
    'message', // "Text Message" send-receipt button, Payment Complete display (VP-2304)
    'terms', // "By proceeding, you agree to Terms and Privacy Policy" — Add Tip (VP-2303)
    'privacy',
    'policy',
    'note',
    'description',
    'category',
    'rate',
    'balance',
    'due',
    'paid',
    'unpaid',
    'tendered',
    'change',
    'received',
    'remain', // refund-method dropdown "Cash (Remain $150.00)" — remaining balance (VP-2312)
    'remaining',
    'got',
    'minimum',
    'maximum',
    'enabled',
    'disabled',
    'custom',
    'manager',
    'owner',
    'partner', // staff role "Vai trò nhân viên" dropdown / role column headers (VP-2272/2279/2280)
    'partners',
    'admin',
    'password',
    'passcode',
    'revenue',
    'earnings',
    'payout',
    'deduction',
    'adjustment',
    'working',
    'hours',
    'tracking',
    'calendar',
    'booking',
    'duration',
    'assign',
    'assigned',
    'online',
    'offline',
    'sync',
    'setup', // device sync screen "Finishing setup..." (VP-2243)
    'waiting', // "Waiting for device approval from portal..." (VP-2243)
    'approval',
    'approve',
    'portal',
    'retry',
    'please',
    'printer',
    'connect',
    'connected',
    'connection',
    'disconnected',
    'drawer',
    'batch',
    'split',
    'processing',
    'success',
    'welcome',
    'equally',
    'dialog',
    'dialogs', // /cash-drawer showcase group heading "Dialogs" (VP-2284)
    'alert', // /cash-drawer showcase group heading "Alerts" (VP-2284)
    'alerts',
    'equal',
    'points', // loyalty term — leaks as "Current points:" on the order receipt
    'visit', // "Total visit:" on the order receipt
    // Card-payment terminal flow on the Order Page (/order/$id) — the tip /
    // signature / "Getting ready to charge" / "Payment Successfully" / "Total
    // Amount" + "Processing" screens shown during a real card transaction
    // (VP-2315…VP-2321). "Total Amount"/"Tip"/"Processing" are caught by the
    // 'total'/'amount'/'tip'/'processing' dict words above; the reader prompts
    // "PRESENT CARD" / "CARD READ OK, REMOVE CARD" are ALL-CAPS multiword so they
    // slip past the dictionary and are caught by `forceEnglish` below instead.
    'present', // "PRESENT CARD" in non-caps contexts + present-card copy (VP-2320/VP-2316/VP-2321)
    'sign', // "Sign here" on the Add Signature screen (VP-2317)
    'signature', // "Add Signature" (VP-2317)
    'transaction', // "Transaction approved. Please sign your name." (VP-2317)
    'getting', // "Getting ready to charge" waiting popup (VP-2319/VP-2320)
    'ready',
    'successfully', // "Payment Successfully" success popup (VP-2318)
  ]);
  // Exact-string false positives to never flag.
  const fpExact = new Set(['In', 'English']);
  // Hardcoded-English phrases the data heuristics would otherwise skip, all
  // always flagged:
  //   - "WELCOME TO [merchant]" — ALL-CAPS reads as a catalog name, mixed-case
  //     "Welcome to X" reads as a ≥3-word proper name (VP-2285/VP-2282).
  //   - The card-reader terminal prompts "PRESENT CARD" / "CARD READ OK, REMOVE
  //     CARD" on the card-payment flow — ALL-CAPS multiword, so looksLikeData
  //     treats them as catalog names (VP-2320/VP-2316).
  const forceEnglish =
    /^welcome to\b|\b(present|insert|tap|swipe) card\b|\bcard read\b|\bremove card\b/i;

  // A string is DATA (merchant catalog/name/log), not a UI label, when it looks
  // like: an exact data value, a date, a count badge ("3 Services"), an ALL-CAPS
  // catalog name, or a multi-word proper name (≥3 words, ≤1 dictionary word, and
  // not a sentence/instruction). Sentences (dialog messages, legal text) and
  // leaked i18n keys ("global.permissionLabels.*") are deliberately NOT data.
  const looksLikeData = (t: string, dictCount: number, tokens: string[]): boolean => {
    if (dataVal.has(t)) return true;
    // A sentence — ends with .?! or contains sentence words — is UI copy, even
    // with an interpolated name/date (e.g. a notification "X appointment on
    // 07/03/2026 has been confirmed"). It MUST be translated, so it is NOT data.
    const isSentence =
      /[.?!]/.test(t) ||
      /\b(you|your|this|that|these|those|we|our|please|want|sure|cannot|will|do|does|are|is|has|have|been)\b/i.test(
        t,
      );
    // A bare date marks appointment/log DATA — but only when it is NOT a sentence.
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(t) && !isSentence) return true;
    if (/^\d[\d.,]*\s+\S/.test(t)) return true; // "3 Services", "1 Product"
    if (/\(.*\$\S*\d.*\)/.test(t)) return true; // "(Received $0.01 - Change $0.00)"
    const letters = t.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 4 && letters === letters.toUpperCase() && /\s/.test(t.trim())) {
      return true; // ALL-CAPS multiword catalog name ("KID SERVICES")
    }
    if (tokens.length >= 3 && dictCount <= 1 && !isSentence) return true; // proper/catalog name
    return false;
  };

  const isEnglish = (t: string): boolean => {
    if (fpExact.has(t)) return false;
    if (viet.test(t)) return false;
    if (forceEnglish.test(t)) return true; // known hardcoded-EN phrase (WELCOME TO …)
    const tokens = t.toLowerCase().match(/[a-z]+/g) || [];
    const dictCount = tokens.filter((x) => ui.has(x)).length;
    if (dictCount === 0) return false;
    if (/^[$\d.,:()/\s+%@#-]+$/.test(t)) return false; // money / numeric / code
    if (/^[A-Z0-9-]{6,}$/.test(t)) return false; // device id / order code
    if (looksLikeData(t, dictCount, tokens)) return false; // merchant data, not UI
    return true;
  };

  const uiHits: string[] = [];
  const ariaHits: string[] = [];
  const seen = new Set<string>();
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) {
    const t = (n.textContent || '').trim();
    if (!t || t.length < 2) continue;
    const el = n.parentElement;
    if (!el) continue;
    if (inDataZone(el)) continue; // merchant data (service/staff/order names)
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue;
    if (seen.has(t)) continue;
    seen.add(t);
    if (isEnglish(t)) uiHits.push(t);
  }
  // placeholder / aria-label / title(tooltip) attributes.
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach((e) => {
    if (inDataZone(e)) return;
    ['placeholder', 'aria-label', 'title'].forEach((a) => {
      const t = (e.getAttribute(a) || '').trim();
      if (!t) return;
      const key = '[' + a + '] ' + t;
      if (seen.has(key)) return;
      seen.add(key);
      if (isEnglish(t)) ariaHits.push(t);
    });
  });

  // Interactive controls — a focused "nút/điều khiển còn tiếng Anh" list. The
  // accessible name is the visible text, else aria-label/title (icon buttons).
  const controls: string[] = [];
  const ctlSeen = new Set<string>();
  root
    .querySelectorAll(
      'button,[role="button"],a[href],[role="link"],[role="menuitem"],[role="tab"],[role="switch"],[role="option"],[role="radio"],[role="checkbox"],summary',
    )
    .forEach((e) => {
      if (inDataZone(e)) return; // e.g. staff/service card links
      const r = e.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const st = getComputedStyle(e as HTMLElement);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      const name = (
        (e.textContent || '').trim() ||
        e.getAttribute('aria-label') ||
        e.getAttribute('title') ||
        ''
      ).trim();
      if (name.length < 2 || ctlSeen.has(name)) return;
      ctlSeen.add(name);
      if (isEnglish(name)) controls.push(name);
    });

  // Icon-only controls with NO accessible name (no text/aria-label/title) — the
  // header status icons, the print button, etc. Nothing to translate, but the
  // scan can't verify them and a screen reader can't read them. Report each by
  // its nearest dev source (data-tsd-source: "file:line") so a label is easy to
  // add; dedup by source so shared components collapse to one entry.
  const noName: string[] = [];
  const nnSeen = new Set<string>();
  root.querySelectorAll('button,[role="button"],[role="menuitem"],[role="tab"]').forEach((e) => {
    if (inDataZone(e)) return;
    const r = e.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const st = getComputedStyle(e as HTMLElement);
    if (st.display === 'none' || st.visibility === 'hidden') return;
    const name = (
      (e.textContent || '').trim() ||
      e.getAttribute('aria-label') ||
      e.getAttribute('title') ||
      ''
    ).trim();
    if (name) return; // has a name → handled by the `controls`/`aria` checks
    if (!e.querySelector('svg,img')) return; // only icon buttons are in scope
    let src: string | null = null;
    let n: Element | null = e;
    for (let i = 0; i < 6 && n; i++) {
      const s = n.getAttribute('data-tsd-source');
      if (s) {
        src = s;
        break;
      }
      n = n.parentElement;
    }
    const label = src || 'icon (không rõ nguồn)';
    if (nnSeen.has(label)) return;
    nnSeen.add(label);
    noName.push(label);
  });

  // UI vỡ #1 — text visibly clipped by its container (ellipsis / hidden).
  const overflow: string[] = [];
  root.querySelectorAll('button,a,span,div,p,h1,h2,h3,h4,label,th,td').forEach((e) => {
    if (e.children.length > 0) return;
    const t = (e.textContent || '').trim();
    if (!t) return;
    if (
      e.scrollWidth - e.clientWidth > 4 &&
      getComputedStyle(e as HTMLElement).overflow !== 'visible'
    ) {
      const tt = t.length > 40 ? t.slice(0, 40) + '…' : t;
      if (!overflow.includes(tt)) overflow.push(tt);
    }
  });
  // UI vỡ #2 — the scan root itself overflows horizontally (layout đẩy ngang).
  const xOverflow = Math.max(0, root.scrollWidth - root.clientWidth);

  const bodyText = document.querySelector('main')?.textContent || document.body.textContent || '';
  const stub = /^\s*Hello\s+"/.test(bodyText.trim());
  return {
    ui: uiHits,
    aria: ariaHits,
    controls,
    noName,
    overflow: overflow.slice(0, 25),
    xOverflow: xOverflow > 8 ? xOverflow : 0,
    stub,
    path: location.pathname,
  };
}
/* eslint-enable */

/** Scan the full page body — the route-level localization check. */
export async function detectBody(page: Page): Promise<RawDetect> {
  return page.evaluate(detectScope, {
    rootSelector: 'body',
    dataZones: DATA_ZONE_SELECTORS,
    dataValues: DATA_VALUES,
  });
}

/** Scan only the most-recently-opened dialog/alert popup. */
export async function detectDialog(page: Page): Promise<RawDetect> {
  return page.evaluate(detectScope, {
    rootSelector: DIALOG_SELECTOR,
    dataZones: DATA_ZONE_SELECTORS,
    dataValues: DATA_VALUES,
  });
}

/**
 * Scan any visible toast / snackbar for leftover English. Toasts are transient
 * (they fade after a few seconds) and render OUTSIDE the dialog portal — in the
 * sonner toaster or the notifications region — so they need their own scan root.
 * Call right after the action that fires the toast (e.g. clicking Print with no
 * printer → "Printer not connected").
 */
export async function detectToasts(page: Page): Promise<RawDetect> {
  return page.evaluate(detectScope, {
    rootSelector:
      '[data-sonner-toaster],[role="region"][aria-label*="otification"],[data-sonner-toast]',
    dataZones: DATA_ZONE_SELECTORS,
    dataValues: DATA_VALUES,
  });
}

/**
 * English abbreviated-month date OR a 12-hour AM/PM time — the date/time shape
 * the app renders UNLOCALIZED in several places the generic detector deliberately
 * skips (a bare date is treated as merchant DATA):
 *   • Order-history detail panel + day-group headers — "Cập nhật cuối: Jun 30,
 *     2026 03:58 AM" / "Jul 1, 2026" (VP-2313).
 *   • Home order panel "Giờ hẹn" line — "Jul 7, 2026 03:00 AM" (VP-2323).
 *   • Business Info payroll period / working hours — "Jul 01 - Jul 10, 2026",
 *     "Áp dụng từ Jul 11, 2026", "09:00 AM - 05:00 PM" (VP-2325).
 * Requires date CONTEXT (abbrev month + year, OR a HH:MM AM/PM time) so it never
 * fires on a stray "May"/"Mar" inside merchant catalog text. Same bug class as
 * the react-day-picker grid (VP-2198).
 */
export const EN_DATETIME =
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b\.?\s+\d{1,2},?\s+\d{4}|\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/;

/**
 * Collect leaf-node texts under `containerSelector` (last match wins) that carry
 * an English date/time ({@link EN_DATETIME}) the generic detector skips as DATA.
 * Data-zone aware (merchant cards excluded) and leaf-scoped so it never fires on
 * catalog text. Returns the deduped, length-capped strings, to be merged into a
 * scan's `ui`. Never throws — returns [] on any failure.
 */
export async function detectEnDateTimeHits(
  page: Page,
  containerSelector = 'main',
  dataZones: string[] = DATA_ZONE_SELECTORS,
): Promise<string[]> {
  try {
    return await page.evaluate(
      ({ dateSrc, zones, sel }) => {
        const re = new RegExp(dateSrc);
        const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
        const zoneSel = zones.join(',');
        const containers = Array.from(document.querySelectorAll(sel));
        const root =
          (containers[containers.length - 1] as HTMLElement | undefined) || document.body;
        const found = new Set<string>();
        root.querySelectorAll('*').forEach((e) => {
          if (e.children.length) return; // leaf elements only
          if (zoneSel && e.closest(zoneSel)) return; // merchant data (cards)
          const t = norm(e.textContent);
          if (t && re.test(t)) found.add(t.length > 60 ? t.slice(0, 60) + '…' : t);
        });
        return [...found];
      },
      { dateSrc: EN_DATETIME.source, zones: dataZones, sel: containerSelector },
    );
  } catch {
    return [];
  }
}

/** Switch the app to Tiếng Việt via Settings → Language (real UI click). */
export async function switchToVietnamese(page: Page): Promise<void> {
  await page.goto('/settings/language', { waitUntil: 'domcontentloaded' });
  // The radio row carries the visible language name.
  const viRow = page.getByText('Tiếng Việt', { exact: true });
  await viRow.waitFor({ state: 'visible', timeout: 15_000 });
  await viRow.click();
  // Confirm the switch took effect — the sidebar/header re-renders in VN.
  await page.getByText('Đơn đang chờ', { exact: true }).first().waitFor({ timeout: 10_000 });
}

/**
 * Client-side navigate via the TanStack router so the in-memory language stays
 * Vietnamese (a full `page.goto` would revert to English — see file header).
 */
export async function routerNavigate(page: Page, to: string): Promise<void> {
  await page.evaluate((dest) => {
    const r = (
      window as unknown as { __TSR_ROUTER__?: { navigate: (o: { to: string }) => unknown } }
    ).__TSR_ROUTER__;
    r?.navigate({ to: dest });
  }, to);
}

/**
 * Scroll the whole screen (window + every inner scroll container) from top to
 * bottom in steps, then back to top — BEFORE scanning. Report screens (Incomes,
 * Order History) render tall bodies with lazy/virtualized rows and below-the-fold
 * panels that only mount once scrolled into view; without this walk the scan (and
 * the EN↔VI compare) miss everything under the fold. Waits briefly between steps
 * so IntersectionObserver-mounted content settles. Best-effort — never throws.
 */
export async function scrollThroughPage(page: Page, stepPause = 180): Promise<void> {
  try {
    // 1) Collect scrollable targets (the window + any overflow:auto/scroll box
    //    taller than its client height) and their max scrollTop, in-page.
    const targets = await page.evaluate(() => {
      const els: { top: number }[] = [];
      const doc = document.scrollingElement || document.documentElement;
      els.push({ top: Math.max(0, doc.scrollHeight - doc.clientHeight) });
      document.querySelectorAll('*').forEach((e) => {
        const el = e as HTMLElement;
        if (el.scrollHeight - el.clientHeight <= 40) return;
        const st = getComputedStyle(el);
        if (!/(auto|scroll|overlay)/.test(st.overflowY)) return;
        els.push({ top: Math.max(0, el.scrollHeight - el.clientHeight) });
      });
      return els.length;
    });
    // 2) Walk down in ~viewport-sized steps, pausing so lazy content mounts,
    //    then snap back to the top so the scan/compare sees a stable layout.
    const passes = Math.min(24, Math.max(6, targets * 4));
    for (let i = 1; i <= passes; i++) {
      await page.evaluate((frac) => {
        const doc = document.scrollingElement || document.documentElement;
        const y = (doc.scrollHeight - doc.clientHeight) * frac;
        doc.scrollTo(0, y);
        document.querySelectorAll('*').forEach((e) => {
          const el = e as HTMLElement;
          if (el.scrollHeight - el.clientHeight <= 40) return;
          const st = getComputedStyle(el);
          if (!/(auto|scroll|overlay)/.test(st.overflowY)) return;
          el.scrollTo(0, (el.scrollHeight - el.clientHeight) * frac);
        });
      }, i / passes);
      await page.waitForTimeout(stepPause);
    }
    await page.evaluate(() => {
      const doc = document.scrollingElement || document.documentElement;
      doc.scrollTo(0, 0);
      document.querySelectorAll('*').forEach((e) => {
        const el = e as HTMLElement;
        if (el.scrollHeight - el.clientHeight > 40) el.scrollTo(0, 0);
      });
    });
    await page.waitForTimeout(150);
  } catch {
    /* scrolling is best-effort — a screen with no scroll is fine */
  }
}

/**
 * Language-agnostic owner-passcode entry: works whether the dialog title is
 * English or Vietnamese, since the keypad digits are language-neutral.
 * No-op if no passcode dialog is showing.
 */
export async function enterPasscodeIfPrompted(page: Page, code = '8888'): Promise<boolean> {
  const dialog = page.getByRole('dialog');
  const visible = await dialog
    .first()
    .isVisible()
    .catch(() => false);
  if (!visible) return false;
  const keypad = dialog.getByRole('button', { name: code[0], exact: true }).first();
  if (!(await keypad.isVisible().catch(() => false))) return false;
  // Tick "don't ask for 30 minutes" so later gated routes don't re-prompt.
  const remember = dialog.getByRole('checkbox').first();
  if (await remember.isVisible().catch(() => false)) {
    if (!(await remember.isChecked().catch(() => false))) await remember.click().catch(() => {});
  }
  for (const d of code) {
    await dialog.getByRole('button', { name: d, exact: true }).first().click();
    await page.waitForTimeout(150);
  }
  await dialog
    .first()
    .waitFor({ state: 'hidden', timeout: 5_000 })
    .catch(() => {});
  return true;
}

/**
 * Click an "Expand All / Mở rộng tất cả" control (e.g. on the Permissions page)
 * so collapsed sub-rows are rendered before scanning. No-op if absent.
 */
export async function expandAllSections(page: Page): Promise<void> {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      /mở rộng tất cả|expand all/i.test(b.textContent || ''),
    );
    (btn as HTMLElement | undefined)?.click();
  });
  await page.waitForTimeout(800);
}

/** Scan the route currently loaded in `page`. */
export async function scanRoute(page: Page, def: RouteDef): Promise<RouteScan> {
  await routerNavigate(page, def.path);
  await page.waitForTimeout(1500);
  if (def.gated) {
    await enterPasscodeIfPrompted(page).catch(() => {});
    await page.waitForTimeout(1200);
  }
  if (def.expandAll) await expandAllSections(page).catch(() => {});
  // Reveal below-the-fold / lazy-mounted content (tall report bodies) before scanning.
  await scrollThroughPage(page);
  const raw = await detectBody(page);
  const redirected = !raw.path.startsWith(def.path.split('?')[0]);
  return { ...raw, route: def.path, name: def.name, group: def.group, redirected };
}

// ───────────────────────────── HTML report ─────────────────────────────

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Render the scan results to a self-contained HTML report. */
export function renderI18nReport(
  scans: RouteScan[],
  generatedAt: string,
  opts: { dedup?: DedupString[]; diff?: I18nDiff } = {},
): string {
  // Split full-page route scans from popup/dialog scans so each gets its own
  // sections (a popup carries `popup: true`).
  const routes = scans.filter((s) => !s.popup);
  const popups = scans.filter((s) => s.popup);
  const untranslated = routes.filter(isUntranslated);
  const clean = routes.filter((s) => !s.redirected && !s.stub && s.ui.length === 0);
  const skipped = routes.filter((s) => s.redirected || s.stub);
  // Popups: reachable+English (a real bug) / reachable+clean / never opened.
  const popupBad = popups.filter(isUntranslated);
  const popupClean = popups.filter((s) => s.reachable !== false && !s.stub && s.ui.length === 0);
  const popupUnreachable = popups.filter((s) => s.reachable === false);
  const dedup = opts.dedup ?? dedupUntranslated(scans);
  const diff = opts.diff;
  // Interactive controls still in English (buttons, tabs, switches, icon
  // buttons via aria/title) — deduped across every screen and popup.
  const controlsDedup = dedupUntranslated(scans, (s) => s.controls ?? []);
  // Icon-only buttons with no accessible name, deduped by dev source location.
  const noNameDedup = dedupUntranslated(scans, (s) => s.noName ?? []);
  // "UI vỡ" (report-only): any scan whose content is clipped or overflows
  // horizontally. Sorted worst-first. Popups included (labelled by route).
  const broken = scans
    .filter(
      (s) => !s.redirected && !s.stub && ((s.overflow?.length ?? 0) > 0 || (s.xOverflow ?? 0) > 8),
    )
    .sort(
      (a, b) => (b.xOverflow ?? 0) - (a.xOverflow ?? 0) || b.overflow.length - a.overflow.length,
    );

  // Failing page = a card with a thumbnail (only failing pages are shot).
  const card = (s: RouteScan): string => {
    const chips = s.ui.map((t) => `<span class="chip">${esc(t)}</span>`).join(' ');
    const aria = s.aria.length
      ? `<div class="aria">aria: ${s.aria.map((t) => esc(t)).join(', ')}</div>`
      : '';
    const thumb = s.screenshot
      ? `<a class="thumb" href="${esc(s.screenshot)}" target="_blank"><img loading="lazy" src="${esc(
          s.screenshot,
        )}" alt="${esc(s.name)}"></a>`
      : `<div class="thumb noimg">không có ảnh</div>`;
    return `<div class="fcard">
      ${thumb}
      <div class="fbody">
        <div class="fhead"><b>${esc(s.name)}</b><span class="b b-bad">${s.ui.length} chuỗi</span></div>
        <div class="route">${esc(s.route)}</div>
        <div class="chips">${chips}</div>
        ${aria}
      </div>
    </div>`;
  };

  // Clean / skipped pages stay as a compact table (no screenshots).
  const row = (s: RouteScan): string => {
    const badge = s.redirected
      ? '<span class="b b-skip">redirect</span>'
      : s.stub
        ? '<span class="b b-stub">stub</span>'
        : '<span class="b b-ok">sạch</span>';
    const aria = s.aria.length ? s.aria.map((t) => esc(t)).join(', ') : '—';
    return `<tr><td><b>${esc(s.name)}</b><div class="route">${esc(s.route)}</div></td><td>${badge}</td><td class="aria">${aria}</td></tr>`;
  };

  // Popup status row (no aria column; the open/closed outcome matters more).
  const popupRow = (s: RouteScan): string => {
    const badge =
      s.reachable === false
        ? '<span class="b b-skip">không mở được</span>'
        : '<span class="b b-ok">sạch</span>';
    return `<tr><td><b>${esc(s.name)}</b><div class="route">${esc(s.route)}</div></td><td>${badge}</td></tr>`;
  };

  // Whole popup section (omitted entirely when no popups were scanned).
  const popupBlock = popups.length
    ? `<h2>🪟 Popup CHƯA chuyển Tiếng Việt (${popupBad.length})</h2>
  ${
    popupBad.map(card).join('') ||
    '<div class="diffcol fixed"><span class="ok">🎉 Mọi popup mở được đều đã dịch!</span></div>'
  }

  <h2>✅ Popup đã dịch sạch (${popupClean.length})</h2>
  <table><thead><tr><th>Popup</th><th>Trạng thái</th></tr></thead>
  <tbody>${popupClean.map(popupRow).join('') || '<tr><td colspan="2">—</td></tr>'}</tbody></table>

  ${
    popupUnreachable.length
      ? `<h2>🚫 Popup KHÔNG mở được trong phiên này — không tính vào "chưa dịch" (${popupUnreachable.length})</h2>
  <div class="meta" style="margin-top:-4px">Các popup chỉ xuất hiện theo sự kiện thiết bị/lỗi (mất kết nối, chờ chữ ký, cập nhật phần mềm…) hoặc cần luồng sâu hơn. Cần mở thủ công để kiểm tra.</div>
  <table><thead><tr><th>Popup</th><th>Trạng thái</th></tr></thead>
  <tbody>${popupUnreachable.map(popupRow).join('')}</tbody></table>`
      : ''
  }`
    : '';

  // 🔘 Interactive controls still in English (buttons/tabs/switches/icons).
  const controlsBlock = `<h2>🔘 Nút / điều khiển còn tiếng Anh — gom trùng (${controlsDedup.length})</h2>
  <div class="meta" style="margin-top:-4px">Gồm cả nút chỉ có icon (đọc từ aria-label/title). Text của nút thường cũng nằm ở bảng "chuỗi cần dịch" phía trên — đây là góc nhìn tập trung vào nút bấm.</div>
  <table><thead><tr><th>Nhãn nút (tiếng Anh)</th><th class="num">#Nơi</th><th>Xuất hiện ở</th></tr></thead>
  <tbody>${
    controlsDedup
      .map(
        (d) =>
          `<tr><td class="str">${esc(d.text)}</td><td class="num">${d.count}</td><td class="route">${d.routes
            .map(esc)
            .join('<br>')}</td></tr>`,
      )
      .join('') || '<tr><td colspan="3" class="ok">🎉 Không còn nút nào tiếng Anh!</td></tr>'
  }</tbody></table>`;

  // 🔇 Icon-only buttons with NO accessible name (header status icons, print
  // button…). No text to translate, but a11y-broken and unverifiable — devs
  // should add a translated aria-label. Report-only, grouped by source file.
  const noNameBlock = `<h2>🔇 Nút icon thiếu nhãn — a11y, scan không kiểm được (${noNameDedup.length}) <span class="b b-skip">chỉ báo cáo</span></h2>
  <div class="meta" style="margin-top:-4px">Nút chỉ có icon, KHÔNG có text/aria-label/title → không có chữ để dịch NHƯNG screen reader không đọc được và scan không kiểm được nội dung. Nên thêm <code>aria-label</code> (đã dịch). Liệt kê theo file nguồn (data-tsd-source).</div>
  <table><thead><tr><th>Nguồn (file:line)</th><th class="num">#Nơi</th><th>Xuất hiện ở</th></tr></thead>
  <tbody>${
    noNameDedup
      .map(
        (d) =>
          `<tr><td class="str">${esc(d.text)}</td><td class="num">${d.count}</td><td class="route">${d.routes
            .map(esc)
            .join('<br>')}</td></tr>`,
      )
      .join('') || '<tr><td colspan="3" class="ok">🎉 Mọi nút icon đều có nhãn!</td></tr>'
  }</tbody></table>`;

  // 📐 UI vỡ (report-only): clipped text + horizontal overflow, worst-first.
  const brokenCard = (s: RouteScan): string => {
    const x =
      (s.xOverflow ?? 0) > 8 ? `<span class="b b-bad">tràn ngang ${s.xOverflow}px</span>` : '';
    const clips = (s.overflow ?? [])
      .map((t) => `<span class="chip chip-clip">${esc(t)}</span>`)
      .join(' ');
    const thumb = s.screenshot
      ? `<a class="thumb" href="${esc(s.screenshot)}" target="_blank"><img loading="lazy" src="${esc(
          s.screenshot,
        )}" alt="${esc(s.name)}"></a>`
      : `<div class="thumb noimg">không có ảnh</div>`;
    return `<div class="fcard">
      ${thumb}
      <div class="fbody">
        <div class="fhead"><b>${esc(s.name)}</b>${x}</div>
        <div class="route">${esc(s.route)}</div>
        ${clips ? `<div class="chips">${clips}</div>` : ''}
        ${(s.overflow?.length ?? 0) ? `<div class="aria">chữ bị cắt/tràn khung (${s.overflow.length})</div>` : ''}
      </div>
    </div>`;
  };
  const brokenBlock = `<h2>📐 UI vỡ — chữ tràn/cắt & layout đẩy ngang (${broken.length}) <span class="b b-skip">chỉ báo cáo</span></h2>
  <div class="meta" style="margin-top:-4px">Heuristic — KHÔNG làm test fail. Tiếng Việt thường dài hơn tiếng Anh nên hay bị cắt chữ hoặc đẩy tràn khung. Kiểm tra bằng mắt kèm ảnh chụp.</div>
  ${
    broken.map(brokenCard).join('') ||
    '<div class="diffcol fixed"><span class="ok">🎉 Không phát hiện UI vỡ.</span></div>'
  }`;

  const dedupRows = dedup
    .map(
      (d) =>
        `<tr><td class="str">${esc(d.text)}</td><td class="num">${d.count}</td><td class="route">${d.routes
          .map(esc)
          .join('<br>')}</td></tr>`,
    )
    .join('');

  const diffBlock = diff
    ? `<h2>🔬 So với lần chạy trước ${diff.baselineAt ? `(${esc(diff.baselineAt)})` : '(không có baseline)'}</h2>
  <div class="diffgrid">
    <div class="diffcol new"><div class="dh">🆕 Chuỗi MỚI phát sinh (${diff.newStrings.length})</div>${
      diff.newStrings.map((t) => `<span class="chip">${esc(t)}</span>`).join(' ') ||
      '<span class="ok">— không có —</span>'
    }</div>
    <div class="diffcol fixed"><div class="dh">✅ Chuỗi ĐÃ dịch xong (${diff.fixedStrings.length})</div>${
      diff.fixedStrings.map((t) => `<span class="chip ok-chip">${esc(t)}</span>`).join(' ') ||
      '<span class="ok">— không có —</span>'
    }</div>
  </div>`
    : '';

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>i18n VN scan — Volt POS</title>
<style>
  :root{--bg:#eef1f6;--surface:#fff;--ink:#0f172a;--muted:#64748b;--line:#e6eaf0;--red:#dc2626;--green:#16a34a;--amber:#d97706;--shadow:0 1px 2px rgba(16,24,40,.04),0 4px 16px rgba(16,24,40,.06)}
  *{box-sizing:border-box}body{font:14px/1.55 ui-sans-serif,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:var(--bg);color:var(--ink)}
  .wrap{max-width:1080px;margin:0 auto;padding:28px 22px 60px}
  h1{font-size:25px;font-weight:800;margin:0 0 4px}.meta{color:var(--muted);font-size:13px;margin-bottom:18px}
  h2{font-size:15px;font-weight:800;margin:28px 0 10px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
  .sc{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:14px 16px}
  .sc .lbl{color:var(--muted);font-size:12px}.sc .val{font-size:26px;font-weight:800;margin-top:4px}
  .sc .val.red{color:var(--red)}.sc .val.green{color:var(--green)}.sc .val.amber{color:var(--amber)}
  table{width:100%;border-collapse:collapse;background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);margin-bottom:18px}
  th,td{padding:9px 12px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top;font-size:13px}
  th{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;background:#fafbfd}
  tr:last-child td{border-bottom:none}.num{text-align:center;font-weight:800;width:60px}
  .route{font-family:ui-monospace,Consolas,monospace;font-size:11px;color:var(--muted)}
  .str{font-family:ui-monospace,Consolas,monospace;font-size:12.5px;font-weight:600}
  .chip{display:inline-block;background:#fef2f2;color:var(--red);border-radius:6px;padding:1px 7px;margin:1px 2px;font-size:12px;font-family:ui-monospace,Consolas,monospace}
  .chip.ok-chip{background:#ecfdf5;color:var(--green)}
  .chip.chip-clip{background:#fff7ed;color:var(--amber)}
  .aria{color:var(--muted);font-size:12px;margin-top:4px}.ok{color:var(--green)}
  .b{font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px;white-space:nowrap}
  .b-bad{background:#fef2f2;color:var(--red)}.b-ok{background:#ecfdf5;color:var(--green)}
  .b-skip{background:#f1f5f9;color:var(--muted)}.b-stub{background:#f5f3ff;color:#7c3aed}
  .fcard{display:grid;grid-template-columns:240px 1fr;gap:14px;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:12px;margin-bottom:12px}
  .thumb{display:block}.thumb img{width:100%;border:1px solid var(--line);border-radius:8px;display:block}
  .thumb.noimg{display:flex;align-items:center;justify-content:center;color:var(--muted);background:#fafbfd;border:1px dashed var(--line);border-radius:8px;font-size:12px;min-height:120px}
  .fhead{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .chips{margin-top:8px}
  .diffgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
  .diffcol{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:14px}
  .diffcol.new{border-left:4px solid var(--red)}.diffcol.fixed{border-left:4px solid var(--green)}
  .dh{font-weight:800;font-size:13px;margin-bottom:8px}
  @media(max-width:760px){.stats{grid-template-columns:1fr 1fr}.fcard{grid-template-columns:1fr}.diffgrid{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
  <h1>Quét Tiếng Việt — Volt POS</h1>
  <div class="meta">Tự động bằng Playwright · ${esc(generatedAt)} · ${routes.length} màn${
    popups.length ? ` · ${popups.length} popup` : ''
  }</div>
  <div class="stats">
    <div class="sc"><div class="lbl">Trang đã quét</div><div class="val">${routes.length}</div></div>
    <div class="sc"><div class="lbl">Trang CHƯA dịch</div><div class="val red">${untranslated.length}</div></div>
    ${
      popups.length
        ? `<div class="sc"><div class="lbl">Popup CHƯA dịch</div><div class="val red">${popupBad.length}</div></div>`
        : ''
    }
    <div class="sc"><div class="lbl">Chuỗi cần dịch (dedup)</div><div class="val amber">${dedup.length}</div></div>
    <div class="sc"><div class="lbl">Nút còn tiếng Anh</div><div class="val red">${controlsDedup.length}</div></div>
    <div class="sc"><div class="lbl">Nút icon thiếu nhãn</div><div class="val amber">${noNameDedup.length}</div></div>
    <div class="sc"><div class="lbl">UI vỡ (báo cáo)</div><div class="val amber">${broken.length}</div></div>
    <div class="sc"><div class="lbl">Dịch sạch</div><div class="val green">${clean.length + popupClean.length}</div></div>
  </div>

  ${diffBlock}

  <h2>🔑 Chuỗi cần dịch — gom trùng (${dedup.length})</h2>
  <div class="meta" style="margin-top:-4px">Dịch 1 lần là sửa hết các trang liệt kê. Sắp theo số trang ảnh hưởng.</div>
  <table><thead><tr><th>Chuỗi tiếng Anh</th><th class="num">#Trang</th><th>Xuất hiện ở</th></tr></thead>
  <tbody>${dedupRows || '<tr><td colspan="3" class="ok">🎉 Không còn chuỗi nào cần dịch!</td></tr>'}</tbody></table>

  <h2>❌ Trang CHƯA chuyển Tiếng Việt (${untranslated.length})</h2>
  ${untranslated.map(card).join('') || '<div class="diffcol fixed"><span class="ok">🎉 Tất cả các trang đã dịch!</span></div>'}

  <h2>✅ Trang đã dịch sạch (${clean.length})</h2>
  <table><thead><tr><th>Màn</th><th>Trạng thái</th><th>aria-label</th></tr></thead>
  <tbody>${clean.map(row).join('') || '<tr><td colspan="3">—</td></tr>'}</tbody></table>

  ${
    skipped.length
      ? `<h2>↪ Redirect / Stub — không tính vào "chưa dịch" (${skipped.length})</h2>
  <table><thead><tr><th>Màn</th><th>Trạng thái</th><th>aria-label</th></tr></thead>
  <tbody>${skipped.map(row).join('')}</tbody></table>`
      : ''
  }

  ${popupBlock}

  ${controlsBlock}

  ${noNameBlock}

  ${brokenBlock}
  <p class="meta">Ảnh chỉ chụp cho trang/popup FAIL (mục sạch không chụp). "In"=Print và "English"=tên ngôn ngữ đã loại khỏi danh sách lỗi. Từ điển UI chủ đích bỏ stop-word để không gắn cờ nhầm tên dịch vụ/khách hàng. aria-label liệt kê tham khảo, không tính vào "chưa dịch". Popup không mở được chỉ xuất hiện theo sự kiện thiết bị/lỗi — không tính là "chưa dịch".</p>
</div></body></html>`;
}
