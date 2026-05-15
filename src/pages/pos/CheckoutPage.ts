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
   * Card flow helper — current best-effort. Card payment in Volt POS does NOT
   * auto-tender like Cash; it requires the user to register the tender amount
   * before "Complete Payment" enables. The exact UX is still being mapped:
   *
   *   - Selecting Card leaves "Enter Amount" pre-filled with the order total
   *     but "Total Paid" stays at $0.00 and Complete Payment is disabled.
   *   - Typing the amount on the numpad does not by itself move "Total Paid".
   *
   * Tests in `createOrderCard.e2e.spec.ts` that rely on this helper currently
   * fail at the `toBeEnabled` assertion below. Once we confirm the exact
   * gesture (e.g. a second Card tap, a Tender button, or a card-terminal
   * webhook) we'll update this helper and re-enable the suite.
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

    await expect(this.completePaymentButton).toBeEnabled({ timeout: 5_000 });
  }
}
