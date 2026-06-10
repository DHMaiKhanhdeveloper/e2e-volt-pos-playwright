import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class PaymentSuccessPage extends BasePage {
  protected readonly path = '/payment-success';

  readonly successHeading: Locator;
  readonly noReceiptButton: Locator;
  readonly printButton: Locator;
  readonly textMessageButton: Locator;
  readonly emailButton: Locator;
  readonly adjustTipLink: Locator;

  constructor(page: Page) {
    super(page);
    this.successHeading = page.getByText('Payment Successful!');
    this.noReceiptButton = page.getByRole('button', { name: 'No Receipt' });
    this.printButton = page.getByRole('button', { name: 'Print' });
    this.textMessageButton = page.getByRole('button', { name: 'Text Message' });
    this.emailButton = page.getByRole('button', { name: 'Email' });
    this.adjustTipLink = page.getByText('Adjust Tip');
  }

  async waitForReady(): Promise<void> {
    await this.waitForSuccess();
  }

  async waitForSuccess(): Promise<void> {
    await expect(this.successHeading).toBeVisible({ timeout: 10_000 });
  }

  async getPaymentAmount(): Promise<string> {
    const amountEl = this.successHeading.locator('xpath=following-sibling::*').first();
    return (await amountEl.textContent()) ?? '';
  }

  async verifyPaymentMethod(method: string): Promise<void> {
    await expect(this.page.getByText(new RegExp(method))).toBeVisible();
  }

  async clickNoReceipt(): Promise<void> {
    await this.noReceiptButton.click();
    // Closing the receipt returns to the order workspace — the build may land
    // on either /home or /order-pending depending on how the order was opened.
    await this.page.waitForURL(/\/(home|order-pending)/);
  }

  async isSuccessful(): Promise<boolean> {
    return this.successHeading.isVisible();
  }
}
