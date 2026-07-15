import { type Page, expect } from '@playwright/test';
import { parseOrderDetailFromText, type OrderDetail } from '@domains/orders/orderDetail';
import type { OrderHistoryCard } from '../OrderHistoryPage';

function mmddyyyy(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()}`;
}

/**
 * All order cards currently rendered whose timestamp falls on `date`. Scrolls
 * the list to materialize lazily-rendered cards. Cards are `<a>` links to
 * `/order-history/<id>` and show `MM/DD/YYYY hh:mm AM/PM`.
 */
export async function collectOrdersForDate(page: Page, date: Date): Promise<OrderHistoryCard[]> {
  const target = mmddyyyy(date);
  const byId = new Map<string, OrderHistoryCard>();
  for (let step = 0; step < 60; step++) {
    const batch = await page.locator('a[href*="/order-history/"]').evaluateAll((els) =>
      els.map((a) => {
        const text = (a.textContent || '').replace(/\s+/g, ' ');
        return {
          orderCode: text.match(/OD\d{6}-\d+/)?.[0] ?? '',
          orderId: (a.getAttribute('href') || '').split('/').pop() ?? '',
          date: text.match(/(\d{2}\/\d{2}\/\d{4}) \d{1,2}:\d{2} (AM|PM)/)?.[1] ?? '',
        };
      }),
    );
    for (const c of batch) if (c.orderCode && c.date === target) byId.set(c.orderId, c);
    const grew = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/order-history/"]'));
      const last = links[links.length - 1] as HTMLElement | undefined;
      const before = links.length;
      last?.scrollIntoView({ block: 'end' });
      return before;
    });
    await page.waitForTimeout(200);
    const after = await page.locator('a[href*="/order-history/"]').count();
    if (after <= grew) break; // no new cards loaded
  }
  return [...byId.values()];
}

/** Navigate to an order's detail page (by id) and parse its breakdown. */
export async function readOrderDetailById(
  page: Page,
  orderId: string,
  orderCode: string,
): Promise<OrderDetail> {
  await page.goto(`/order-history/${orderId}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Order Summary').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Service Details').first()).toBeVisible({ timeout: 15_000 });
  const text = await page.evaluate(() => document.body.innerText);
  return parseOrderDetailFromText(text, orderCode);
}
