import { type Page } from '@playwright/test';
import { DATA_ZONE_SELECTORS } from '@utils/i18nScan';

/**
 * EN ↔ VI translation-quality comparison for the Vietnamese audit.
 *
 * The leftover-English scan ({@link detectScope}) only answers "is any English
 * still showing?". This module answers the harder question: "was each label
 * translated, and to the RIGHT Vietnamese term?". Strategy:
 *
 *   1. Capture every meaningful UI string on a screen in ENGLISH, keyed by a
 *      structural DOM path (stable across languages — only the text changes).
 *   2. Switch to Tiếng Việt, capture the same screen again.
 *   3. Join EN↔VI by key and classify each pair (missing / suspect / ok) using a
 *      curated POS {@link GLOSSARY} of approved terms. A `suspect` carries the
 *      suggested standard term so the report can say "dịch sang từ nào".
 *
 * The DOM-path key is reliable because switching language changes text, not
 * structure. `data-tsd-source` (app dev-source attr) is captured too, purely for
 * a human-readable "where" in the report.
 */

/** A captured UI string plus where it lives. */
export interface CapturedText {
  /** Structural key (DOM path from scan root) — the EN↔VI join key. */
  key: string;
  /** Normalized visible text (or `[attr] value` for placeholder/aria/title). */
  text: string;
  /** App dev source "file:line" from the nearest data-tsd-source, if any. */
  source?: string;
}

/** Classification of one EN→VI pair. */
export type PairStatus =
  | 'ok' // translated to an approved / plausibly-Vietnamese term
  | 'missing' // VI still shows the English string (not translated)
  | 'suspect' // translated, but not the approved glossary term
  | 'data'; // proper noun / value — not a translation target

export interface ComparedPair {
  key: string;
  en: string;
  vi: string;
  status: PairStatus;
  /** For `suspect`/`missing` with a glossary hit: the recommended VN term. */
  suggestion?: string;
  source?: string;
}

/**
 * Approved POS glossary: English term → acceptable Vietnamese term(s). First
 * value is the preferred/standard one (used as the suggestion). Keys are matched
 * case-insensitively on the trimmed string. Extend as the product's VI style
 * guide grows — this is the source of truth for "chuẩn tiếng Việt".
 */
export const GLOSSARY: Record<string, string[]> = {
  // Navigation / chrome
  Home: ['Trang chủ'],
  'Pending Orders': ['Đơn đang chờ'],
  'Order History': ['Lịch sử đơn hàng'],
  Appointment: ['Lịch hẹn'],
  Appointments: ['Lịch hẹn'],
  Scanner: ['Máy quét', 'Quét mã'],
  Search: ['Tìm kiếm'],
  Settings: ['Cài đặt'],
  Incomes: ['Thu nhập'],
  // Actions
  Save: ['Lưu'],
  Cancel: ['Huỷ', 'Hủy'],
  Close: ['Đóng'],
  Confirm: ['Xác nhận'],
  Add: ['Thêm'],
  Edit: ['Sửa', 'Chỉnh sửa'],
  Delete: ['Xoá', 'Xóa'],
  Remove: ['Xoá', 'Xóa', 'Gỡ'],
  Apply: ['Áp dụng'],
  Print: ['In'],
  Done: ['Xong', 'Hoàn tất'],
  Continue: ['Tiếp tục'],
  Back: ['Quay lại'],
  Show: ['Hiện'],
  Hide: ['Ẩn'],
  Pay: ['Thanh toán'],
  // POS domain
  'Quick Pay': ['Thanh toán nhanh'],
  'Quick Checkout': ['Thanh toán nhanh'],
  'Gift Card': ['Thẻ quà tặng'],
  'Sell Gift Card': ['Bán thẻ quà tặng'],
  Tip: ['Tiền tip', 'Tiền boa'],
  Tax: ['Thuế'],
  Subtotal: ['Tạm tính'],
  Total: ['Tổng', 'Tổng cộng'],
  // Income (báo cáo thu nhập) — thuật ngữ chuẩn hoá theo VP-2252 sub-tasks.
  Sale: ['Doanh thu'], // VP-2268/2259: "Bán hàng" ⇒ dùng "Doanh thu" cho nhất quán
  'Total Sale': ['Tổng doanh thu'],
  'Service Sale': ['Doanh thu dịch vụ'],
  'Product Sale': ['Doanh thu sản phẩm'],
  'Net Total': ['Doanh thu thuần'], // VP-2258: "Thực thu" gây nhầm với Amount Collected
  'Gross Income': ['Tổng thu nhập'], // VP-2256: "Thu nhập gộp" chưa chuẩn
  'Net Income': ['Thu nhập thực nhận'], // VP-2256: "Thu nhập ròng" chưa chuẩn
  Rate: ['Mức lương', 'Đơn giá'], // VP-2267/2263: "Tỉ lệ" SAI — Rate là số tiền, không phải %
  'Amount Collected': ['Số tiền đã thu'],
  'Staff Payout': ['Tổng chi trả nhân viên'],
  'Salon Earnings': ['Thu nhập salon'],
  Discount: ['Giảm giá'],
  Refund: ['Hoàn tiền'],
  Cash: ['Tiền mặt'],
  Card: ['Thẻ'],
  Note: ['Ghi chú', 'Lưu ý'],
  'Order Note': ['Ghi chú đơn'],
  'Merge Order': ['Gộp đơn'],
  'Delete Order': ['Xoá đơn', 'Xóa đơn'],
  'Void Order': ['Huỷ đơn', 'Hủy đơn'],
  Staff: ['Nhân viên'],
  Customer: ['Khách hàng'],
  Service: ['Dịch vụ'],
  Services: ['Dịch vụ'],
  Product: ['Sản phẩm'],
  Products: ['Sản phẩm'],
  'Promo & Rewards': ['Khuyến mãi & Thưởng', 'Ưu đãi'],
  'Change Staff': ['Đổi nhân viên'],
  'Next appt': ['Lịch hẹn kế', 'Hẹn kế'],
};

/** Normalize for glossary comparison: trim, collapse spaces, lowercase. */
const norm = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase();

/** True if `t` has at least one Vietnamese diacritic (so it reads as VI). */
const hasVietnamese = (t: string): boolean =>
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(t);

/**
 * Capture meaningful UI strings under `rootSelector`, keyed by a structural DOM
 * path so the same element can be matched across an EN scan and a VI scan.
 * Self-contained — serialized by `page.evaluate`.
 */
/* eslint-disable */
export function captureTextsInPage(opts: {
  rootSelector: string;
  dataZones: string[];
}): CapturedText[] {
  const { rootSelector, dataZones } = opts;
  const roots = Array.from(document.querySelectorAll(rootSelector));
  const root = (roots[roots.length - 1] as HTMLElement | undefined) || null;
  if (!root) return [];
  // Skip merchant-data subtrees (service/staff/order names) — same zones the
  // leftover-English scan excludes, so the compare isn't drowned in catalog data.
  const zoneSel = dataZones.join(',');
  const inDataZone = (el: Element | null): boolean => !!zoneSel && !!el && !!el.closest(zoneSel);

  // Structural path from `root` to `el`: tag + index-among-same-tag-siblings.
  const pathOf = (el: Element): string => {
    const parts: string[] = [];
    let cur: Element | null = el;
    while (cur && cur !== root && parts.length < 40) {
      const par: Element | null = cur.parentElement;
      if (!par) break;
      const tag = cur.tagName.toLowerCase();
      let idx = 0;
      for (const sib of Array.from(par.children)) {
        if (sib.tagName === cur.tagName) {
          if (sib === cur) break;
          idx++;
        }
      }
      parts.push(tag + '[' + idx + ']');
      cur = par;
    }
    return parts.reverse().join('>');
  };
  const sourceOf = (el: Element): string | undefined => {
    const s = el.closest('[data-tsd-source]');
    return s ? s.getAttribute('data-tsd-source') || undefined : undefined;
  };
  const visible = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const st = getComputedStyle(el as HTMLElement);
    return st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0';
  };

  const out: CapturedText[] = [];
  const seen = new Set<string>();
  const push = (key: string, text: string, el: Element): void => {
    const t = text.replace(/\s+/g, ' ').trim();
    if (t.length < 2) return;
    if (t === 'null' || t === 'undefined') return; // leaked JS values, not UI
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ key, text: t, source: sourceOf(el) });
  };

  // 1) Visible text nodes, keyed by parent path + text-node ordinal.
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) {
    const raw = (n.textContent || '').trim();
    if (raw.length < 2) continue;
    const el = n.parentElement;
    if (!el || !visible(el) || inDataZone(el)) continue;
    let ord = 0;
    for (const c of Array.from(el.childNodes)) {
      if (c === n) break;
      if (c.nodeType === Node.TEXT_NODE && (c.textContent || '').trim()) ord++;
    }
    push(pathOf(el) + '#t' + ord, raw, el);
  }
  // 2) placeholder / aria-label / title attributes.
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach((e) => {
    if (!visible(e) || inDataZone(e)) return;
    ['placeholder', 'aria-label', 'title'].forEach((a) => {
      const v = (e.getAttribute(a) || '').trim();
      if (v.length < 2) return;
      push(pathOf(e) + '@' + a, '[' + a + '] ' + v, e);
    });
  });
  return out;
}
/* eslint-enable */

/** Capture the current screen's strings for the EN or VI pass. */
export async function captureTexts(page: Page, rootSelector = 'body'): Promise<CapturedText[]> {
  return page.evaluate(captureTextsInPage, { rootSelector, dataZones: DATA_ZONE_SELECTORS });
}

/** Strip the `[attr] ` prefix so glossary lookup sees the bare value. */
const bare = (t: string): string => t.replace(/^\[(placeholder|aria-label|title)\]\s*/, '');

/** Look up an approved VN term set for an English string (case-insensitive). */
function glossaryHit(en: string): string[] | undefined {
  const b = bare(en);
  const key = Object.keys(GLOSSARY).find((k) => norm(k) === norm(b));
  return key ? GLOSSARY[key] : undefined;
}

/**
 * Preferred (standard) Vietnamese term for an English UI string, or `undefined`
 * if it isn't in the {@link GLOSSARY}. Used to annotate a leftover-English
 * finding with the term it SHOULD be translated to.
 */
export function suggestFor(en: string): string | undefined {
  return glossaryHit(en)?.[0];
}

/**
 * Join EN↔VI captures by key and classify each. A pair is:
 *  - `missing`  — VI text equals EN and still reads as English (untranslated).
 *  - `suspect`  — VI differs from EN but not the approved glossary term.
 *  - `ok`       — VI matches an approved term, or reads as Vietnamese with no
 *                 glossary entry to check against.
 *  - `data`     — EN unchanged and not an English UI word (proper noun / value).
 */
export function pairAndClassify(en: CapturedText[], vi: CapturedText[]): ComparedPair[] {
  const viByKey = new Map(vi.map((c) => [c.key, c]));
  const pairs: ComparedPair[] = [];
  for (const e of en) {
    const v = viByKey.get(e.key);
    if (!v) continue; // element vanished in VI (layout diff) — skip, low value
    const enText = e.text;
    const viText = v.text;
    const approved = glossaryHit(enText);
    const changed = norm(enText) !== norm(viText);
    let status: PairStatus;
    let suggestion: string | undefined;

    if (approved && approved.some((a) => norm(a) === norm(bare(viText)))) {
      status = 'ok';
    } else if (!changed) {
      // Unchanged between EN and VI.
      if (approved) {
        status = 'missing'; // a known UI term left in English
        suggestion = approved[0];
      } else if (hasVietnamese(enText)) {
        status = 'ok'; // already Vietnamese in both
      } else {
        // ASCII and unchanged: english UI word → missing; else proper noun/data.
        status = /[a-z]/i.test(enText) && enText.length >= 2 ? 'missing' : 'data';
      }
    } else {
      // Text changed EN→VI (something was translated).
      if (approved) {
        status = 'suspect'; // translated, but not to the approved term
        suggestion = approved[0];
      } else if (hasVietnamese(viText) || !/[a-z]/i.test(viText)) {
        status = 'ok';
      } else {
        status = 'missing'; // changed but STILL English (e.g. different EN copy)
      }
    }
    pairs.push({ key: e.key, en: enText, vi: viText, status, suggestion, source: e.source });
  }
  return pairs;
}

/** A screen the compare skill can target: display name → client-side route. */
export interface ScreenDef {
  name: string;
  route: string;
  gated?: boolean;
}

/** Registry of scannable screens (matches STATIC_ROUTES paths). */
export const SCREENS: Record<string, ScreenDef> = {
  home: { name: 'Trang chủ / POS', route: '/home' },
  'order-pending': { name: 'Đơn đang chờ', route: '/order-pending' },
  'order-history': { name: 'Lịch sử đơn hàng', route: '/order-history' },
  appointment: { name: 'Lịch hẹn', route: '/appointment' },
  'income-daily': { name: 'Thu nhập theo ngày', route: '/incomes/income-daily', gated: true },
  'income-summary': { name: 'Tổng hợp thu nhập', route: '/incomes/income-summary', gated: true },
  'income-staff': { name: 'Thu nhập nhân viên', route: '/incomes/income-staff', gated: true },
  'settings-business': { name: 'Thông tin doanh nghiệp', route: '/settings/business', gated: true },
  'settings-services': { name: 'Dịch vụ & Sản phẩm', route: '/settings/services' },
  'settings-staffs': { name: 'Nhân viên', route: '/settings/staffs' },
  'settings-roles': { name: 'Vai trò', route: '/settings/roles' },
  'settings-permissions': { name: 'Quyền hạn', route: '/settings/permissions' },
  receipt: { name: 'Hóa đơn (mẫu in)', route: '/settings/receipt' },
  'charge-fee': { name: 'Phí & Phụ thu', route: '/settings/charge-fee' },
  'settings-accessibility': { name: 'Hiển thị', route: '/settings/accessibility' },
  'settings-language': { name: 'Ngôn ngữ', route: '/settings/language' },
  'time-tracking': { name: 'Chấm công', route: '/time-tracking' },
  'cash-drawer': { name: 'Két tiền', route: '/cash-drawer' },
};

/** Summary counts for a compare run. */
export interface CompareSummary {
  screen: string;
  total: number;
  missing: number;
  suspect: number;
  ok: number;
  data: number;
}

/** Roll up classified pairs into a summary. */
export function summarize(screen: string, pairs: ComparedPair[]): CompareSummary {
  const by = (s: PairStatus): number => pairs.filter((p) => p.status === s).length;
  return {
    screen,
    total: pairs.length,
    missing: by('missing'),
    suspect: by('suspect'),
    ok: by('ok'),
    data: by('data'),
  };
}

// --- HTML report -----------------------------------------------------------

export interface CompareReportInput {
  screen: string;
  route: string;
  generatedAt: string;
  summary: CompareSummary & { missing: number };
  /** Authoritative leftover-English (data-filtered) + suggested standard term. */
  missing: Array<{ text: string; suggestion?: string }>;
  /** Glossary-anchored EN↔VI classification. */
  pairs: ComparedPair[];
  uiBroken?: { clipped?: unknown[]; xOverflow?: number };
}

const esc = (s: string): string =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );

const STATUS_BADGE: Record<PairStatus, { label: string; bg: string; fg: string }> = {
  ok: { label: 'ĐÚNG', bg: '#dcfce7', fg: '#166534' },
  missing: { label: 'CHƯA DỊCH', bg: '#fee2e2', fg: '#991b1b' },
  suspect: { label: 'SAI CHUẨN', bg: '#fef9c3', fg: '#854d0e' },
  data: { label: 'DATA', bg: '#e2e8f0', fg: '#475569' },
};

/**
 * Self-contained HTML report for an EN↔VI screen compare (inline CSS, opens
 * offline). Shows the summary, the leftover-English list, and every glossary
 * pair with its EN→VI value and verdict so a human can eyeball translation
 * quality at a glance.
 */
export function renderCompareReport(input: CompareReportInput): string {
  const { screen, route, generatedAt, summary, missing, pairs, uiBroken } = input;
  const broken = (uiBroken?.xOverflow ?? 0) > 8 || (uiBroken?.clipped?.length ?? 0) > 0;

  const missingRows = missing.length
    ? missing
        .map(
          (m) =>
            `<tr><td>${esc(m.text)}</td><td class="sug">${m.suggestion ? esc(m.suggestion) : '—'}</td></tr>`,
        )
        .join('\n')
    : '<tr><td colspan="2" class="muted">🎉 Không còn chuỗi tiếng Anh chưa dịch</td></tr>';

  // Quality view: glossary-anchored pairs, real translations first (drop data noise).
  // Quality view = glossary-anchored VERDICTS only (ok / suspect). Raw `missing`
  // pairs are dropped here because they include data noise (order codes, times,
  // proper nouns) that pairAndClassify can't tell from real labels; the
  // authoritative leftover-English list is the "Chưa dịch" table above.
  const shown = pairs
    .filter((p) => p.status === 'suspect' || p.status === 'ok')
    .sort((a, b) => {
      const rank = { missing: 0, suspect: 1, ok: 2, data: 3 } as Record<PairStatus, number>;
      return rank[a.status] - rank[b.status];
    });
  const pairRows = shown
    .map((p) => {
      const b = STATUS_BADGE[p.status];
      return `<tr>
      <td>${esc(p.en)}</td>
      <td class="vi">${esc(p.vi)}</td>
      <td><span class="badge" style="background:${b.bg};color:${b.fg}">${b.label}</span></td>
      <td class="sug">${p.suggestion ? esc(p.suggestion) : ''}</td>
    </tr>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Quét Tiếng Việt — ${esc(screen)}</title>
<style>
  :root { font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  body { margin: 0; background: #f8fafc; color: #0f172a; }
  header { padding: 24px 32px; background: #0f172a; color: #f8fafc; }
  header h1 { margin: 0 0 4px; font-size: 20px; }
  header .meta { font-size: 13px; opacity: .8; }
  .cards { display: flex; gap: 12px; padding: 20px 32px 0; flex-wrap: wrap; }
  .card { flex: 1 1 110px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
  .card .n { font-size: 26px; font-weight: 700; }
  .card .l { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
  .card.ok .n { color: #16a34a; } .card.missing .n { color: #dc2626; } .card.suspect .n { color: #ca8a04; }
  h2 { margin: 28px 32px 8px; font-size: 15px; }
  table { width: calc(100% - 64px); margin: 8px 32px 16px; border-collapse: collapse; background: #fff;
          border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
  th, td { text-align: left; padding: 9px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: top; }
  th { background: #f1f5f9; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #475569; }
  td.vi { color: #0f172a; } td.sug { color: #b45309; font-size: 13px; } td.muted { color: #64748b; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; }
  .warn { margin: 8px 32px; padding: 10px 14px; background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px; font-size: 13px; color: #854d0e; }
</style></head>
<body>
  <header>
    <h1>Quét Tiếng Việt — ${esc(screen)}</h1>
    <div class="meta">Route <code>${esc(route)}</code> · ${esc(generatedAt)}</div>
  </header>
  <div class="cards">
    <div class="card"><div class="n">${summary.ok + summary.missing + summary.suspect}</div><div class="l">Chuỗi UI</div></div>
    <div class="card ok"><div class="n">${summary.ok}</div><div class="l">Dịch đúng</div></div>
    <div class="card suspect"><div class="n">${summary.suspect}</div><div class="l">Sai chuẩn</div></div>
    <div class="card missing"><div class="n">${summary.missing}</div><div class="l">Chưa dịch</div></div>
  </div>
  ${broken ? `<div class="warn">📐 UI vỡ: tràn ngang ${uiBroken?.xOverflow ?? 0}px · cắt chữ ${uiBroken?.clipped?.length ?? 0}</div>` : ''}

  <h2>❌ Chưa dịch (còn tiếng Anh)</h2>
  <table>
    <thead><tr><th>Chuỗi (EN)</th><th>Nên dịch</th></tr></thead>
    <tbody>${missingRows}</tbody>
  </table>

  <h2>Chất lượng dịch (đối chiếu glossary)</h2>
  <table>
    <thead><tr><th>Gốc (EN)</th><th>Hiển thị (VI)</th><th>Kết luận</th><th>Nên dùng</th></tr></thead>
    <tbody>
${pairRows}
    </tbody>
  </table>
</body></html>`;
}
