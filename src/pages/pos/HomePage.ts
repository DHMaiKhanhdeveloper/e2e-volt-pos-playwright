import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { Urls } from '@constants/urls';

export class HomePage extends BasePage {
  protected readonly path = Urls.HOME;

  readonly staffSearchInput: Locator;
  readonly serviceSearchInput: Locator;
  readonly payButton: Locator;
  readonly deleteOrderButton: Locator;
  readonly customerPhoneButton: Locator;

  constructor(page: Page) {
    super(page);
    this.staffSearchInput = page.getByPlaceholder('Search staff');
    this.serviceSearchInput = page.getByPlaceholder('Search service');
    this.payButton = page.getByRole('button', { name: 'Pay' });
    this.deleteOrderButton = page.getByRole('button', { name: 'Delete Order' });
    this.customerPhoneButton = page.getByText('Enter Customer Phone');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    // Wait for the page's signature element instead of `networkidle`, which can
    // hang on apps with long-poll / analytics traffic.
    await this.staffSearchInput.waitFor({ state: 'visible' });
    await this.cleanupExistingOrder();
  }

  async waitForReady(): Promise<void> {
    await expect(this.staffSearchInput).toBeVisible();
  }

  /** Removes any leftover order from a previous test run. Best-effort, never throws. */
  async cleanupExistingOrder(): Promise<void> {
    const deleteButton = this.page.getByRole('button', { name: 'Delete Order' });
    if (await deleteButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await deleteButton.click();
      const confirmButton = this.page.getByRole('button', { name: /confirm|yes|ok|delete/i });
      if (await confirmButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await confirmButton.click();
      }
      // Wait for the Delete Order button to disappear — that's the real signal
      // the order has been removed, not a fixed 500ms guess.
      await deleteButton.waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => undefined);
    }
  }

  async selectStaff(staffNickname: string): Promise<void> {
    // The app adds `.is-changing-staff` to the staff card while a staff change
    // is in flight; that class has an `::after` overlay which intercepts
    // pointer events and causes click-retry timeouts. Wait for it to clear.
    await this.page
      .waitForFunction(() => !document.querySelector('.is-changing-staff'), undefined, {
        timeout: 500,
      })
      .catch(() => undefined);

    const staffCard = this.page.locator('#home-staff-listing').getByText(staffNickname);
    // `force: true` bypasses the "intercepts pointer events" actionability
    // check — the `.is-changing-staff::after` overlay is purely visual and the
    // click event still lands on the underlying card element.
    await staffCard.click({ force: true });
    await this.waitForOrderCreated();
  }

  async selectService(serviceName: string): Promise<void> {
    const serviceItem = this.page.getByRole('listitem').filter({ hasText: serviceName }).first();
    await serviceItem.click();
    // Wait for the service to appear in the order summary instead of a fixed sleep.
    // The Pay button enabling is the downstream signal we ultimately care about.
    await expect(this.payButton).toBeEnabled({ timeout: 2_000 });
  }

  async getOrderTotal(): Promise<string> {
    const totalEl = this.page.locator('text=Total').last().locator('..');
    return (await totalEl.textContent()) ?? '';
  }

  async clickPay(): Promise<void> {
    await expect(this.payButton).toBeEnabled();
    await this.payButton.click();
    await this.page.waitForURL(/\/checkout/);
  }

  async deleteOrder(): Promise<void> {
    await this.deleteOrderButton.click();
  }

  async waitForOrderCreated(): Promise<void> {
    await expect(this.page.getByText(/Order #OD/)).toBeVisible({ timeout: 10_000 });
  }

  async getOrderNumber(): Promise<string> {
    const orderText = await this.page.getByText(/Order #OD/).textContent();
    return orderText?.replace('Order ', '') ?? '';
  }
}
