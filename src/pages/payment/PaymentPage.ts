import { Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { PaymentMethod } from '@api/models/Payment';
import { PaymentReceiptModal } from '@components/modal/PaymentReceiptModal';

export class PaymentPage extends BasePage {
  protected readonly path = '/payments/new';

  private readonly amountInput = this.byTestId('payment-amount');
  private readonly methodSelect = this.byTestId('payment-method');
  private readonly customerInput = this.byTestId('payment-customer');
  private readonly descriptionInput = this.byTestId('payment-description');
  private readonly submitBtn = this.byTestId('payment-submit');
  private readonly statusBadge = this.byTestId('payment-status');

  readonly receiptModal: PaymentReceiptModal;

  constructor(page: Page) {
    super(page);
    this.receiptModal = new PaymentReceiptModal(page);
  }

  async waitForReady(): Promise<void> {
    await expect(this.amountInput).toBeVisible();
  }

  async fillForm(input: {
    amount: number;
    method: PaymentMethod;
    customer?: string;
    description?: string;
  }): Promise<void> {
    await this.amountInput.fill(String(input.amount));
    await this.methodSelect.selectOption(input.method);
    if (input.customer) await this.customerInput.fill(input.customer);
    if (input.description) await this.descriptionInput.fill(input.description);
  }

  async submit(): Promise<void> {
    await this.submitBtn.click();
  }

  async expectStatus(status: string | RegExp): Promise<void> {
    await expect(this.statusBadge).toContainText(status);
  }
}
