import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { OrderDetail } from '@domains/orders/orderDetail';
import {
  cancelOrder as cancelOrderAction,
  refundOrder as refundOrderAction,
} from './order-history/actions';
import {
  collectOrdersForDate as collectOrdersForDateScrape,
  readOrderDetailById as readOrderDetailByIdScrape,
} from './order-history/scraping';

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
  readonly filterButton: Locator;
  readonly receiptButton: Locator;
  readonly emptyDetailMessage: Locator;
  readonly orderCards: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search order id/i);
    // The toolbar "Filter" button (opens the filter dialog) — anchored so it
    // never matches other buttons that merely contain the word.
    this.filterButton = page.getByRole('button', { name: /^Filter$/i });
    // Detail-panel "Receipt" button; present for every order regardless of status.
    this.receiptButton = page.getByRole('button', { name: /^Receipt$/i });
    // Empty-state message shown in the right panel before an order is selected.
    this.emptyDetailMessage = page.getByText(/Select an order to view details/i);
    // Order rows are `<a>` links to `/order-history/<uuid>`.
    this.orderCards = page.locator('a[href*="/order-history/"]');
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
    return collectOrdersForDateScrape(this.page, date);
  }

  /** Navigate to an order's detail page (by id) and parse its breakdown. */
  async readOrderDetailById(orderId: string, orderCode: string): Promise<OrderDetail> {
    return readOrderDetailByIdScrape(this.page, orderId, orderCode);
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
    await cancelOrderAction(this.page, this.confirmDialog, opts);
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
    await refundOrderAction(this.page, this.confirmDialog, opts);
  }

  // -------------------------------------------------- read-only list helpers

  /** Number of order cards currently rendered in the list. */
  async orderCardCount(): Promise<number> {
    return this.orderCards.count();
  }

  /** OD-code of the first order card, or null when the list is empty. */
  async firstOrderCode(): Promise<string | null> {
    if ((await this.orderCards.count()) === 0) return null;
    const text = (await this.orderCards.first().textContent()) ?? '';
    return text.match(/OD\d{6}-\d+/)?.[0] ?? null;
  }

  /** Open the first order in the list and wait for the detail panel to mount. */
  async openFirstOrder(): Promise<void> {
    await this.orderCards.first().click();
    await expect(this.page).toHaveURL(/\/order-history\/[^?]+/);
    await expect(this.receiptButton).toBeVisible();
  }

  /**
   * Open the first order whose card text matches `statusText` (e.g. /Settled/,
   * /Canceled/). Returns false — and opens nothing — when none is found, so the
   * caller can `test.skip` on status-dependent scenarios.
   */
  async openFirstOrderWithStatus(statusText: RegExp): Promise<boolean> {
    const match = this.orderCards.filter({ hasText: statusText }).first();
    if ((await match.count()) === 0) return false;
    await match.click();
    await expect(this.page).toHaveURL(/\/order-history\/[^?]+/);
    await expect(this.receiptButton).toBeVisible();
    return true;
  }

  /** A detail-panel section/field located by its visible heading or label text. */
  detailText(name: string | RegExp): Locator {
    return this.page.getByText(name).first();
  }

  // ------------------------------------------------------------ search

  /** Type into the order search box; waits out the input debounce. */
  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(700);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(700);
  }

  // --------------------------------------------------------- filter dialog

  /** The Filter dialog (shadcn dialog scoped by its "Filter" heading). */
  get filterDialog(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: /Filter|Bộ lọc/ });
  }

  async openFilter(): Promise<void> {
    await this.filterButton.click();
    await expect(this.filterDialog).toBeVisible();
  }

  /**
   * Inside the open Filter dialog, expand the Payment Method sub-popover. Its
   * options render as checkboxes (Card / Cash / Gift Card / Other) in a separate
   * popover surface.
   */
  async openFilterPaymentMethods(): Promise<void> {
    await this.filterDialog.getByRole('button', { name: /Select payment method/i }).click();
    // exact — "Card" would otherwise also match the "Gift Card" checkbox.
    await expect(this.page.getByRole('checkbox', { name: 'Card', exact: true })).toBeVisible();
  }

  /** Inside the open Filter dialog, expand the Status sub-popover (checkboxes). */
  async openFilterStatuses(): Promise<void> {
    await this.filterDialog.getByRole('button', { name: /Select status/i }).click();
    await expect(
      this.page.getByRole('checkbox', { name: 'Successful - Settled', exact: true }),
    ).toBeVisible();
  }

  // ---------------------------------------------------------- date picker

  /** The calendar popover (rendered as role="dialog" holding an "Apply" button). */
  get datePickerPopover(): Locator {
    return this.page
      .getByRole('dialog')
      .filter({ has: this.page.getByRole('button', { name: /^Apply$/ }) });
  }

  async openDatePicker(): Promise<void> {
    await this.dateFilterButton().click();
    await expect(this.datePickerPopover).toBeVisible();
  }

  // ------------------------------------------------------- receipt dialog

  /** Any modal surface (dialog or alertdialog) currently open. */
  get anyDialog(): Locator {
    return this.page.getByRole('dialog').or(this.page.getByRole('alertdialog'));
  }

  /** Click "Receipt" on the open order and wait for its modal to appear. */
  async openReceipt(): Promise<void> {
    await this.receiptButton.click();
    await expect(this.anyDialog.last()).toBeVisible();
  }

  /**
   * Dismiss the top-most modal WITHOUT confirming. Tries Escape first (closes
   * popovers + most dialogs), then falls back to the explicit "Close"/"Đóng"
   * button — Escape alone is focus-dependent and can miss a Radix dialog.
   */
  async dismissActiveDialog(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(150);
    if ((await this.anyDialog.count()) > 0) {
      const closeBtn = this.page.getByRole('button', { name: /^(Close|Đóng)$/i }).last();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click().catch(() => {});
    }
  }

  /**
   * Belt-and-suspenders cleanup for the continuous one-big-test flow: ensure no
   * dialog/popover is left open so the next check starts from a clean surface. A
   * leaked modal's overlay would otherwise intercept every later click.
   */
  async ensureNoModal(): Promise<void> {
    for (let i = 0; i < 4 && (await this.anyDialog.count()) > 0; i++) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(150);
      if ((await this.anyDialog.count()) === 0) break;
      const closeBtn = this.page.getByRole('button', { name: /^(Close|Đóng)$/i }).last();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click().catch(() => {});
        await this.page.waitForTimeout(150);
      }
    }
  }

  // ----------------------------- status-dependent action-button getters

  get adjustTipButton(): Locator {
    return this.page.getByRole('button', { name: /Adjust Tip|Chỉnh tip/i });
  }

  get reopenButton(): Locator {
    return this.page.getByRole('button', { name: /Re-?Open|Mở lại/i });
  }

  /**
   * Open the Refund confirm dialog but do NOT confirm — for verifying the modal
   * appears without mutating backend state. Caller must be on a settled order.
   */
  async openRefundDialogOnly(): Promise<void> {
    await this.refundButton.click();
    await expect(this.anyDialog.last()).toBeVisible();
  }

  /**
   * Open the Cancel/Void confirm dialog but do NOT confirm. Caller must be on an
   * unsettled order. Safety: never press a "Confirm" button here.
   */
  async openCancelDialogOnly(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.anyDialog.last()).toBeVisible();
  }
}
