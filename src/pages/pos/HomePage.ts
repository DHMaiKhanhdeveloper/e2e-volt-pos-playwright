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
    // Filter the catalogue via the "Search service" box first. The default grid
    // only shows services from the open category, so services that live in a
    // collapsed category (or below the fold) aren't in the DOM and a direct
    // click times out. Searching by name surfaces any active service.
    await this.serviceSearchInput.fill(serviceName);
    // Catalog services are <li> cards in the services grid (implicit listitem
    // role). Click the matching one (auto-waits for the filtered list to render).
    const serviceItem = this.page.getByRole('listitem').filter({ hasText: serviceName }).first();
    await serviceItem.click();
    // Restore the default catalogue view so a later selectProduct() can still
    // reach the "Product" category heading (a leftover filter would hide it).
    await this.serviceSearchInput.clear();
    // Adding a service round-trips a GraphQL mutation before the order picks
    // up the line and Pay enables — give that the full action timeout rather
    // than a tight 2s window that flakes on a busy backend.
    await expect(this.payButton).toBeEnabled({ timeout: 10_000 });
  }

  /**
   * Add a retail product to the order. Products live under the dedicated
   * "Product" catalogue category (separate from service categories) and are
   * filed under the order's "Store" bucket — they are NOT attributed to a
   * staff member, so they alone do NOT make a tip collectible.
   *
   * `exact: true` on the "Product" heading avoids matching "Product 2".
   */
  async selectProduct(productName: string): Promise<void> {
    await this.page.getByRole('heading', { name: 'Product', exact: true }).click();
    const productItem = this.page.getByRole('listitem').filter({ hasText: productName }).first();
    await productItem.click();
    await this.waitForOrderCreated();
  }

  /**
   * Open the customer search and type a phone (or name) fragment. The app then
   * pops a "Customers Found" dialog listing matches — call
   * {@link selectFirstCustomerResult} to attach the first one.
   */
  async enterCustomerPhone(phoneOrName: string): Promise<void> {
    await this.customerPhoneButton.click();
    const input = this.page.getByRole('textbox', { name: 'Enter Customer Phone or Name' });
    await input.waitFor({ state: 'visible' });
    await input.fill(phoneOrName);
  }

  /** Attach the first customer from the "Customers Found" results dialog. */
  async selectFirstCustomerResult(): Promise<void> {
    // The results popover is role="dialog" containing the "Customers Found"
    // header. Each result row is a div holding a masked-phone leaf + a name
    // leaf; the click handler sits on the row, so click the phone's parent.
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'Customers Found' });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    const firstRow = dialog
      .getByText(/^\*\*\*-\*\*\*-\d{4}$/)
      .first()
      .locator('..');
    await firstRow.click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
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
    // The active order panel renders the code as "#OD260616-12063420" in this
    // build (older builds used the "Order #OD…" prefix). Match the bare
    // "#OD<date>" form so both are covered. Pending-sidebar cards show the
    // code WITHOUT the leading "#", so this stays scoped to the active order.
    await expect(this.page.getByText(/#OD\d{6}/).first()).toBeVisible({ timeout: 10_000 });
  }

  async getOrderNumber(): Promise<string> {
    // The home banner shows "Order #OD260612-25638211". Extract the canonical
    // code (no "Order " prefix, no leading "#") so it matches how the code is
    // rendered everywhere else — Order History rows and the Daily Sale Report
    // table both use the bare `OD\d{6}-\d+` form.
    const orderText =
      (await this.page
        .getByText(/#OD\d{6}/)
        .first()
        .textContent()) ?? '';
    return orderText.match(/OD\d{6}-\d+/)?.[0] ?? '';
  }
}
