import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export type PaymentMethod = 'Card' | 'Cash' | 'Gift Card' | 'Other';

export class CheckoutPage extends BasePage {
  protected readonly path = '/checkout';

  readonly completePaymentButton: Locator;
  readonly printButton: Locator;
  readonly tipButton: Locator;
  readonly cashDrawerButton: Locator;
  readonly enterAmountLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.completePaymentButton = page.getByRole('button', { name: 'Complete Payment' });
    this.printButton = page.getByRole('button', { name: 'Print' });
    this.tipButton = page.getByRole('button', { name: 'Tip' });
    this.cashDrawerButton = page.getByRole('button', { name: 'Cash Drawer' });
    this.enterAmountLabel = page.getByText('Enter Amount');
  }

  async waitForReady(): Promise<void> {
    await expect(this.completePaymentButton).toBeVisible();
  }

  async selectPaymentMethod(method: PaymentMethod): Promise<void> {
    const button = this.page.getByRole('button', { name: new RegExp(`^${method}`) });
    await button.click();
    await this.page.waitForTimeout(300);
  }

  async clickCompletePayment(): Promise<void> {
    await expect(this.completePaymentButton).toBeEnabled();
    await this.completePaymentButton.click();
  }

  async getDisplayedAmount(): Promise<string> {
    const amountEl = this.enterAmountLabel
      .locator('..')
      .locator('xpath=following-sibling::*')
      .first();
    return (await amountEl.textContent()) ?? '';
  }

  async getOrderTotal(): Promise<string> {
    const totalRow = this.page.getByText('Total').last().locator('..');
    return (await totalRow.textContent()) ?? '';
  }

  async verifyOrderDetails(options: {
    staffName?: string;
    services?: Array<{ name: string; price: string }>;
    total?: string;
  }): Promise<void> {
    if (options.staffName) {
      await expect(this.page.getByText(`Staff: ${options.staffName}`)).toBeVisible();
    }
    if (options.services) {
      for (const service of options.services) {
        await expect(this.page.getByText(service.name)).toBeVisible();
        await expect(this.page.getByText(service.price)).toBeVisible();
      }
    }
    if (options.total) {
      await expect(this.page.getByText(options.total)).toBeVisible();
    }
  }

  async enterAmountViaNumpad(amount: string): Promise<void> {
    for (const digit of amount) {
      await this.page.getByRole('button', { name: digit, exact: true }).click();
      await this.page.waitForTimeout(100);
    }
  }

  async isCompletePaymentEnabled(): Promise<boolean> {
    return this.completePaymentButton.isEnabled();
  }

  /**
   * Open the cashier-side Tip dialog and enter `amountInCents` via the numpad,
   * then confirm with "Add". Required before Complete Payment in the current
   * Volt POS build — otherwise the app pauses at a "Customer is adding a tip"
   * prompt waiting on the paired customer-facing display (which the test env
   * doesn't have). Pre-setting the tip from cashier-side skips that prompt.
   *
   * Pass digits only, e.g. "500" for $5.00 or "0" for no tip.
   */
  async addTip(amountInCents: string): Promise<void> {
    await this.tipButton.click();

    const tipDialog = this.page.getByRole('dialog');
    const addButton = tipDialog.getByRole('button', { name: 'Add', exact: true });
    await expect(addButton).toBeVisible();

    for (const digit of amountInCents) {
      await tipDialog.getByRole('button', { name: digit, exact: true }).click();
      await this.page.waitForTimeout(100);
    }

    await addButton.click();
    await expect(tipDialog).toBeHidden();
  }

  /**
   * Gift Card *redemption* flow — runs AFTER the owner passcode is entered.
   *
   * Selecting "Gift Card" + Complete Payment + passcode opens a QR-scan dialog.
   * The test environment has no scanner, so we take the manual path:
   *   "Input Gift Card Code" → type the code → Confirm → (balance check) → Pay.
   *
   * Leaves the page on the Payment Success screen for the caller to assert.
   */
  async redeemGiftCard(code: string): Promise<void> {
    const dialog = this.page.getByRole('dialog');

    // Switch from QR scan to manual code entry.
    await dialog.getByRole('button', { name: 'Input Gift Card Code' }).click();

    const codeInput = dialog.getByRole('textbox');
    await codeInput.fill(code);

    const confirmButton = dialog.getByRole('button', { name: 'Confirm', exact: true });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Balance-check confirmation: the card must be accepted before we can pay.
    await expect(dialog.getByText('Gift Card Accepted')).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: 'Pay', exact: true }).click();
  }

  /**
   * Card flow helper — stops at the "Card amount entered" screen.
   *
   * Card payment in Volt POS does NOT auto-tender like Cash; "Complete Payment"
   * only enables once a real card terminal reports a successful charge. Until
   * the terminal is wired into the test env, this helper just lands the page
   * at the Card numpad with the order total typed in — verifying we can drive
   * the UI up to that point.
   */
  async payByCardForOrderTotal(): Promise<void> {
    await this.selectPaymentMethod('Card');

    const totalText = await this.getOrderTotal();
    const digits = totalText.replace(/\D/g, '');
    if (!digits) {
      throw new Error(`Could not parse order total digits from: "${totalText}"`);
    }

    await this.page.getByRole('button', { name: 'C', exact: true }).click();
    await this.page.waitForTimeout(200);
    await this.enterAmountViaNumpad(digits);

    // Sanity check we're on the Card screen — Complete Payment stays disabled
    // until a card terminal completes the charge, so we only assert visibility.
    // TODO: switch back to `toBeEnabled` once a card terminal is wired in.
    // await expect(this.completePaymentButton).toBeEnabled({ timeout: 5_000 });
    await expect(this.completePaymentButton).toBeVisible();
  }
}
