import { type Page } from '@playwright/test';
import {
  DATA_ZONE_SELECTORS,
  DATA_VALUES,
  detectScope,
  routerNavigate,
  type RouteScan,
} from '@domains/i18n/i18nScan';

/**
 * Split Order (/order/$id/split-order) deep localization scan — the VP-2287
 * group (VP-2290 / VP-2291 / VP-2292).
 *
 * PREREQUISITE (see docs/i18n/vietnamese-scan-flow.md): the caller MUST have
 * already switched to Tiếng Việt via `switchToVietnamese()` and navigate
 * CLIENT-SIDE (`routerNavigate`) — a full `page.goto` reverts the language
 * (known non-persistence bug).
 *
 * Surfaces (mapped to the Linear bugs):
 *   1. The split screen BODY — the "Check 1 / Check 2 / …" tabs (VP-2290) and,
 *      once a check is paid, its summary line "Check 1 Paid by Cash - Got: … -
 *      Total Paid: …" (VP-2291). Scanned live. The word "Check" is in the shared
 *      UI dictionary so these leaks are flagged.
 *   2. The amount-entry popup ("Hoàn tất Check 1") and the "Thanh toán thành
 *      công" popup (VP-2292: "Received", "Tip", "Email", "Check") only appear
 *      DURING / AFTER a real payment. This scan is deliberately NON-DESTRUCTIVE —
 *      it never charges a check — so those popups are recorded "không mở được"
 *      (manual) rather than auto-driven, matching the scanner's openable-only
 *      scope (device/payment dialogs are excluded the same way in i18nPopups).
 *
 * Reaching split-order needs a live order id, discovered from Order History.
 * Everything is best-effort and never throws, so a missing / unsplittable order
 * can't fail the localization gate.
 */

/** Best-effort: an order id from the current URL, else the first Order History card. */
async function findOrderId(page: Page): Promise<string | null> {
  const fromUrl = await page.evaluate(() => {
    const m = location.pathname.match(/order(?:-history)?\/([\w-]+)/);
    return m && m[1] !== 'split-order' ? m[1] : null;
  });
  if (fromUrl) return fromUrl;
  try {
    await routerNavigate(page, '/order-history');
    await page.waitForTimeout(1200);
    const card = page.locator('main a[href*="/order-history/"]').first();
    if (await card.isVisible().catch(() => false)) {
      const href = (await card.getAttribute('href').catch(() => null)) || '';
      const m = href.match(/order-history\/([\w-]+)/);
      if (m) return m[1];
    }
  } catch {
    /* no order to derive an id from */
  }
  return null;
}

/**
 * A split-order surface that can't be opened non-destructively (needs a real
 * payment). Recorded so it's TRACKED for manual review — `reachable: false` +
 * `redirected: true` keep it out of the localization gate (lands in the report's
 * "🚫 Popup KHÔNG mở được" bucket).
 */
function manual(name: string, note: string): RouteScan {
  return {
    route: `/order/$id/split-order ▸ ${name}`,
    name,
    group: 'POS',
    ui: [],
    aria: [],
    overflow: [],
    stub: false,
    path: '/order/$id/split-order',
    redirected: true,
    popup: true,
    reachable: false,
    error: note,
  };
}

/**
 * Scan the Split Order screen body, then register its payment-flow popups for
 * manual review. Best-effort throughout — never throws.
 */
export async function scanSplitOrder(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    const id = await findOrderId(page);
    if (!id) return;
    await routerNavigate(page, `/order/${id}/split-order`);
    await page.waitForTimeout(1600);
    const onSplit = await page.evaluate(() => location.pathname.includes('/split-order'));
    if (!onSplit) return; // order not splittable / redirected — skip

    // 1) Split screen body — "Check" tabs + any paid-check summary line.
    await record({
      ...(await page.evaluate(detectScope, {
        rootSelector: 'main',
        dataZones: DATA_ZONE_SELECTORS,
        dataValues: DATA_VALUES,
      })),
      route: '/order/$id/split-order ▸ thân trang',
      name: 'Tách đơn · Thân trang (Check tabs)',
      group: 'POS',
      redirected: false,
      popup: true,
      reachable: true,
    });

    // 2) Payment-flow popups — need a real payment; recorded manual (VP-2290/2291/2292).
    await record(
      manual(
        'Popup nhập số tiền / Hoàn tất Check',
        'Mở trong luồng thanh toán từng check — scan không tự thanh toán (tránh phá dữ liệu đơn thật). Kiểm tra thủ công (VP-2290).',
      ),
    );
    await record(
      manual(
        'Popup Thanh toán thành công (Received/Tip/Email/Check)',
        'Chỉ hiện sau khi thực thanh toán 1 check. Kiểm tra thủ công (VP-2292/2291).',
      ),
    );
  } catch {
    /* split-order flow unavailable — skip entirely */
  }
}
