import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { Urls } from '@constants/urls';

/** Bare pending-order code, e.g. "OD260616-12063420" (no leading "#"). */
export const ORDER_CODE_RE = /OD\d{6}-\d{8}/;

export type SortOrder = 'Latest' | 'Oldest';

/**
 * Pending Orders page (`/order-pending`).
 *
 * Lists every order still in progress. A completed/paid order should drop off
 * this list. Order cards render the code WITHOUT a leading "#"
 * (e.g. "OD260616-12063420"), unlike the active-order panel on Home.
 *
 * Toolbar (left→right): Search · Staff filter · Sort (Latest/Oldest) ·
 * Date range preset ("Today") + calendar · Quick Checkout.
 */
export class OrderPendingPage extends BasePage {
  protected readonly path = Urls.ORDER_PENDING;

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly staffFilterButton: Locator;
  readonly sortCombobox: Locator;
  readonly dateRangeCombobox: Locator;
  readonly calendarButton: Locator;
  readonly quickCheckoutButton: Locator;
  readonly orderHistoryLink: Locator;
  readonly appointmentLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText('Pending Orders').first();
    this.searchInput = page.getByRole('textbox', {
      name: /Search order ID, customer name or phone/i,
    });
    this.staffFilterButton = page.getByRole('button', { name: /^Staff/ });
    this.sortCombobox = page.getByRole('combobox').filter({ hasText: /Latest|Oldest/ });
    this.dateRangeCombobox = page.getByRole('combobox').filter({ hasText: /Today|Yesterday/ });
    this.calendarButton = page.getByRole('button', { name: /icon-calendar/ });
    this.quickCheckoutButton = page.getByRole('button', { name: 'Quick Checkout' });
    this.orderHistoryLink = page.getByRole('link', { name: /Order History/ });
    this.appointmentLink = page.getByRole('link', { name: /Appointment/ });
  }

  async waitForReady(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  // --- Order cards -----------------------------------------------------------

  /** Every pending order card currently rendered (matched by its bare code). */
  orderCards(): Locator {
    return this.page.getByRole('button', { name: ORDER_CODE_RE });
  }

  async orderCardCount(): Promise<number> {
    return this.orderCards().count();
  }

  /** Extract the order code shown on the Nth card (default first). */
  async orderCodeAt(index = 0): Promise<string | null> {
    const name = await this.orderCards().nth(index).getAttribute('aria-label');
    const text = name ?? (await this.orderCards().nth(index).innerText());
    return text.match(ORDER_CODE_RE)?.[0] ?? null;
  }

  /** Locator for a pending order card by its bare code (e.g. "OD260616-12063420"). */
  orderCard(orderNumber: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(orderNumber) });
  }

  /** True if the given order is currently shown in the pending list. */
  async isOrderListed(orderNumber: string): Promise<boolean> {
    return this.orderCard(orderNumber)
      .first()
      .isVisible()
      .catch(() => false);
  }

  /** Assert the given order is NOT present in the pending list. */
  async expectOrderAbsent(orderNumber: string): Promise<void> {
    await expect(this.orderCard(orderNumber)).toHaveCount(0, { timeout: 10_000 });
  }

  /** Assert the given order IS present in the pending list. */
  async expectOrderPresent(orderNumber: string): Promise<void> {
    await expect(this.orderCard(orderNumber).first()).toBeVisible({ timeout: 10_000 });
  }

  // --- Toolbar actions -------------------------------------------------------

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
  }

  /** Pick a sort order from the Sort combobox (Latest / Oldest). */
  async setSort(order: SortOrder): Promise<void> {
    await this.sortCombobox.click();
    await this.page.getByRole('option', { name: order, exact: true }).click();
  }

  /** The option labels offered by the Sort combobox (dropdown left open-then-closed). */
  async sortOptions(): Promise<string[]> {
    await this.sortCombobox.click();
    const options = this.page.getByRole('option');
    await expect(options.first()).toBeVisible({ timeout: 5_000 });
    const labels = await options.allInnerTexts();
    await this.page.keyboard.press('Escape');
    return labels.map((l) => l.trim());
  }
}
