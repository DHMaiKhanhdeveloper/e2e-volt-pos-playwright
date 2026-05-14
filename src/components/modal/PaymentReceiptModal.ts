import { Page, expect } from '@playwright/test';
import { BaseModal } from '@components/modal/BaseModal';

export class PaymentReceiptModal extends BaseModal {
  private readonly txnId = this.root.getByTestId('receipt-txn-id');
  private readonly amount = this.root.getByTestId('receipt-amount');
  private readonly printBtn = this.root.getByTestId('receipt-print');
  private readonly emailBtn = this.root.getByTestId('receipt-email');

  constructor(page: Page) {
    super(page, 'payment-receipt-modal');
  }

  async getTransactionId(): Promise<string> {
    return (await this.txnId.textContent())?.trim() ?? '';
  }

  async getAmount(): Promise<string> {
    return (await this.amount.textContent())?.trim() ?? '';
  }

  async print(): Promise<void> {
    await this.printBtn.click();
  }

  async sendByEmail(email: string): Promise<void> {
    await this.emailBtn.click();
    await this.root.getByTestId('receipt-email-input').fill(email);
    await this.root.getByTestId('receipt-email-confirm').click();
  }

  async expectShown(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.txnId).not.toBeEmpty();
  }
}
