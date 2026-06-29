import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { Urls } from '@constants/urls';

/**
 * Pending Orders page (`/order-pending`).
 *
 * Lists every order still in progress. A completed/paid order should drop off
 * this list. Order cards render the code WITHOUT a leading "#"
 * (e.g. "OD260616-12063420"), unlike the active-order panel on Home.
 */
export class OrderPendingPage extends BasePage {
  protected readonly path = Urls.ORDER_PENDING;

  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText('Pending Orders').first();
  }

  async waitForReady(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
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
}
