import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { PasscodeDialog } from '@components/modal/PasscodeDialog';
import { parseOrderDetailFromText, type OrderDetail } from '@utils/orderDetail';

/** A row in the Order History list (the card shows staff + amount + time). */
export interface OrderHistoryCard {
  orderCode: string;
  orderId: string;
  /** `MM/DD/YYYY` from the card timestamp. */
  date: string;
}

/**
 * Order History (`/order-history`) — list + detail view.
 *
 * Selector strategy: visible role/text because Volt POS source uses
 * shadcn primitives without explicit `data-testid` on these flows. Each
 * action method is matched to a known button label from the volt-pos
 * source (`order-history-detail-actions.tsx`).
 *
 * NOTE: this is the minimum surface needed to drive refund/cancel from
 * Cluster D. Extend with filters/search when those scenarios show up.
 */
export class OrderHistoryPage extends BasePage {
  protected readonly path = '/order-history';

  readonly searchInput: Locator;
  readonly refundButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search/i);
    // Detail-page action buttons are labelled "Refund Order" / "Cancel Order"
    // (not bare "Refund"/"Cancel") — match the real wording, anchored so the
    // confirm-dialog buttons don't widen the match.
    this.refundButton = page.getByRole('button', { name: /^Refund( Order)?$/i });
    this.cancelButton = page.getByRole('button', { name: 'Cancel Order', exact: true });
    // The confirm step renders as a shadcn AlertDialog (role="alertdialog").
    // Scope to it specifically so it never collides with the passcode dialog
    // (role="dialog") that pops up afterwards to authorise the void.
    this.confirmDialog = page.getByRole('alertdialog');
  }

  async waitForReady(): Promise<void> {
    // The header is always present; wait for it before doing anything.
    await expect(this.page.getByRole('heading', { name: /Order History/i })).toBeVisible();
  }

  // ----------------------------------------------------- date filter + list

  private static mmddyyyy(d: Date): string {
    const p = (n: number): string => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()}`;
  }

  /** The button that shows the active `MM/DD/YYYY - MM/DD/YYYY` range. */
  private dateFilterButton(): Locator {
    return this.page
      .locator('button')
      .filter({ hasText: /\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}/ })
      .first();
  }

  /**
   * Set the date filter so the visible range INCLUDES `date` (we then filter the
   * cards client-side, so an exact single-day range isn't required). Opens the
   * two-month calendar, navigates to the target month if needed, clicks the day
   * (which sets a range bound), and applies. Day cells carry an aria-label like
   * "Monday, June 1st, 2026" — matched by month/day/year.
   */
  async filterToDateIncluding(date: Date): Promise<void> {
    await this.dateFilterButton().click();
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    const dayRe = new RegExp(`${monthName} ${date.getDate()}(st|nd|rd|th)?, ${date.getFullYear()}`);
    const dayBtn = this.page.getByLabel(dayRe);

    // Navigate months until the day is visible (prev chevron is the first nav
    // button in the calendar popover). Best effort: bounded loop.
    const prevChevron = this.page.locator('button:has(svg)').nth(0);
    for (let i = 0; i < 24 && (await dayBtn.count()) === 0; i++) {
      await prevChevron.click().catch(() => {});
      await this.page.waitForTimeout(150);
    }
    if ((await dayBtn.count()) === 0) {
      throw new Error(`Calendar day for ${OrderHistoryPage.mmddyyyy(date)} not reachable`);
    }
    await dayBtn.first().click();
    await dayBtn.first().click();
    await this.page.getByRole('button', { name: /^Apply$/ }).click();
    await this.page.waitForTimeout(800);
  }

  /**
   * All order cards currently rendered whose timestamp falls on `date`. Scrolls
   * the list to materialize lazily-rendered cards. Cards are `<a>` links to
   * `/order-history/<id>` and show `MM/DD/YYYY hh:mm AM/PM`.
   */
  async collectOrdersForDate(date: Date): Promise<OrderHistoryCard[]> {
    const target = OrderHistoryPage.mmddyyyy(date);
    const byId = new Map<string, OrderHistoryCard>();
    for (let step = 0; step < 60; step++) {
      const batch = await this.page.locator('a[href*="/order-history/"]').evaluateAll((els) =>
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
      const grew = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/order-history/"]'));
        const last = links[links.length - 1] as HTMLElement | undefined;
        const before = links.length;
        last?.scrollIntoView({ block: 'end' });
        return before;
      });
      await this.page.waitForTimeout(200);
      const after = await this.page.locator('a[href*="/order-history/"]').count();
      if (after <= grew) break; // no new cards loaded
    }
    return [...byId.values()];
  }

  /** Navigate to an order's detail page (by id) and parse its breakdown. */
  async readOrderDetailById(orderId: string, orderCode: string): Promise<OrderDetail> {
    await this.page.goto(`/order-history/${orderId}`, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByText('Order Summary').first()).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText('Service Details').first()).toBeVisible({ timeout: 15_000 });
    const text = await this.page.evaluate(() => document.body.innerText);
    return parseOrderDetailFromText(text, orderCode);
  }

  /**
   * Open an order's detail page by clicking the row whose accessible text
   * contains the orderCode. The route at `$orderId.tsx` reads the id from
   * the URL — we verify the URL too.
   */
  async openOrder(orderCode: string): Promise<void> {
    const row = this.page.getByRole('listitem').filter({ hasText: orderCode }).first();
    await row.click();
    await expect(this.page).toHaveURL(new RegExp(`/order-history/[^?]+`));
    // Detail page renders a "Receipt" button — wait for it as the readiness
    // signal so the action buttons are mounted.
    await expect(this.page.getByRole('button', { name: 'Receipt' })).toBeVisible();
  }

  /**
   * Cancel an unsettled order. Caller is responsible for being on the order
   * detail page already. The button is gated by order state — if the order
   * has been settled, `canCancel()` returns false and you should skip the test.
   */
  async canCancel(): Promise<boolean> {
    return this.cancelButton.isVisible().catch(() => false);
  }

  async cancelOrder(opts: { reason?: string; passcode?: string } = {}): Promise<void> {
    await this.cancelButton.click();
    const dialog = this.confirmDialog;
    await expect(dialog).toBeVisible();

    // A cancellation reason is mandatory — "Confirm Cancel" stays disabled
    // until one is chosen from the dropdown. Reasons are a fixed list (the
    // Select renders its options in a portal, outside the dialog), so use the
    // requested reason if it's a valid option, else the first available one.
    await dialog.getByRole('combobox').click();
    const requested = opts.reason
      ? this.page.getByRole('option', { name: opts.reason, exact: true })
      : null;
    const reason =
      requested && (await requested.count()) > 0
        ? requested
        : this.page.getByRole('option').first();
    await reason.click();

    const confirm = dialog.getByRole('button', { name: /Confirm Cancel/i });
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(dialog).toBeHidden();

    // Voiding payments is passcode-gated: a passcode dialog pops up after the
    // confirm. Enter it when present (it may be skipped if the merchant ticked
    // "don't require for 30 minutes" earlier in the run).
    await this.enterPasscodeIfPrompted(opts.passcode);
  }

  /** Enter the passcode if the authorise dialog appears; no-op otherwise. */
  private async enterPasscodeIfPrompted(passcode?: string): Promise<void> {
    if (!passcode) return;
    const passcodeDialog = new PasscodeDialog(this.page);
    const prompted = await passcodeDialog.dialog
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (prompted) await passcodeDialog.enterPasscode(passcode);
  }

  /**
   * Issue a full refund on a settled order. Partial-refund variant takes a
   * service list — extend when needed.
   */
  async canRefund(): Promise<boolean> {
    return this.refundButton.isVisible().catch(() => false);
  }

  async refundOrder(opts: { reason?: string; passcode?: string } = {}): Promise<void> {
    await this.refundButton.click();
    const dialog = this.confirmDialog;
    await expect(dialog).toBeVisible();

    // Mirror the cancel flow: if the confirm is gated behind a reason
    // dropdown, pick the requested reason (or the first valid one).
    const combobox = dialog.getByRole('combobox');
    if (await combobox.count()) {
      await combobox.click();
      const requested = opts.reason
        ? this.page.getByRole('option', { name: opts.reason, exact: true })
        : null;
      const reason =
        requested && (await requested.count()) > 0
          ? requested
          : this.page.getByRole('option').first();
      await reason.click();
    }

    const confirm = dialog.getByRole('button', { name: /Confirm Refund|Confirm|Refund/i });
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(dialog).toBeHidden();

    // Refunds void payments and are passcode-gated, same as cancel.
    await this.enterPasscodeIfPrompted(opts.passcode);
  }
}
