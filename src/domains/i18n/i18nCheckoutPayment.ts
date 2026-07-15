import { type Page } from '@playwright/test';
import {
  DATA_ZONE_SELECTORS,
  DATA_VALUES,
  detectScope,
  routerNavigate,
  type RouteScan,
} from '@domains/i18n/i18nScan';

/**
 * Checkout payment-method deep scan (/order/$id/checkout) — the Cash ("Tiền
 * mặt") and Other ("Khác") panels of VP-2115's payment flow. Unlike the card
 * terminal flow (i18nCheckoutPayment's sibling — see CARD_PAY_FLOW in the
 * spec), neither panel needs external hardware, so both are scanned live
 * instead of recorded manual.
 *
 * PREREQUISITE (see docs/i18n/vietnamese-scan-flow.md): the caller MUST have
 * already switched to Tiếng Việt via `switchToVietnamese()` and navigate
 * CLIENT-SIDE (`routerNavigate`) — a full `page.goto` reverts the language
 * (known non-persistence bug).
 *
 * Deliberately NON-DESTRUCTIVE: selects a payment method and scans the panel
 * ("Nhập số tiền" / "Tổng đã trả" / "Còn lại" / "Tiền thối"), but never
 * presses "Hoàn tất thanh toán" — completing a charge would mutate real order
 * data and pop the owner-passcode dialog (out of scope for a read-only scan).
 */

/**
 * Best-effort: navigate straight to `/order/$id/checkout` for a STILL-PAYABLE
 * order. Clicking an `/order-pending` card does NOT change the URL — it
 * loads the order into the `/home` editor (same widget Home uses to build a
 * new order) — so the real order UUID only appears in the URL once "Pay" /
 * "Thanh toán" is pressed from there. Falls back to the current URL / first
 * Order History card (which may include already-paid orders, so its checkout
 * can redirect away — handled by the `onCheckout` guard in the caller).
 */
async function findOrderId(page: Page): Promise<string | null> {
  try {
    await routerNavigate(page, '/order-pending');
    await page.waitForTimeout(1200);
    // Target an actual order card (not the header's Staff/Sort/Date/Quick
    // Checkout controls, which sit earlier in the DOM under the same
    // `main`) — same selector i18nOrderPending.ts uses to find a pending
    // card reliably. "Pts" is the EN loyalty-points label — already
    // switched to Vietnamese ("Điểm") by the time this runs, so fall back
    // to the order-code pattern ("OD260707-…"), which is language-neutral.
    const ptsCard = page
      .locator('main button:has-text("Pts"), main [role="button"]:has-text("Pts")')
      .first();
    const card = (await ptsCard.isVisible().catch(() => false))
      ? ptsCard
      : page
          .locator('main button')
          .filter({ hasText: /OD\d{6}/ })
          .first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await page.waitForTimeout(1200);
      const payButton = page.getByRole('button', { name: /^(Pay|Thanh toán)$/ }).first();
      if (await payButton.isVisible().catch(() => false)) {
        await payButton.click();
        await page.waitForTimeout(1200);
        const id = await page.evaluate(() => {
          const m = location.pathname.match(/\/order\/([\w-]+)\/checkout/);
          return m ? m[1] : null;
        });
        if (id) return id;
      }
    }
  } catch {
    /* no pending order to derive an id from */
  }
  const fromUrl = await page.evaluate(() => {
    const m = location.pathname.match(/order(?:-history)?\/([\w-]+)/);
    return m && !['checkout', 'split-order', 'payment-success'].includes(m[1]) ? m[1] : null;
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

const PAYMENT_METHODS: { key: string; label: string; fallback: RegExp }[] = [
  { key: 'cash', label: 'Tiền mặt', fallback: /^(Tiền mặt|Cash)\b/ },
  { key: 'other', label: 'Khác', fallback: /^(Khác|Other)\b/ },
];

/**
 * Select each of Cash / Other on the checkout screen and scan the payment
 * panel. Best-effort throughout — never throws, and never completes a charge.
 */
export async function scanCashOtherPayment(
  page: Page,
  record: (scan: RouteScan) => Promise<void>,
): Promise<void> {
  try {
    const id = await findOrderId(page);
    if (!id) return;
    await routerNavigate(page, `/order/${id}/checkout`);
    await page.waitForTimeout(1700);
    const onCheckout = await page.evaluate(() => location.pathname.includes('/checkout'));
    if (!onCheckout) return; // order not payable / redirected — skip

    for (const { key, label, fallback } of PAYMENT_METHODS) {
      try {
        const button = page.locator('main button', { hasText: fallback }).first();
        if (!(await button.isVisible().catch(() => false))) continue;
        await button.click();
        await page.waitForTimeout(500);
        await record({
          ...(await page.evaluate(detectScope, {
            rootSelector: 'main',
            dataZones: DATA_ZONE_SELECTORS,
            dataValues: DATA_VALUES,
          })),
          route: `/order/$id/checkout ▸ ${label} (${key === 'cash' ? 'Cash' : 'Other'})`,
          name: `Checkout · Phương thức ${label}`,
          group: 'POS',
          redirected: false,
          popup: true,
          reachable: true,
        });
      } catch {
        /* this payment method's panel unavailable — try the next one */
      }
    }
  } catch {
    /* checkout payment flow unavailable — skip entirely */
  }
}
