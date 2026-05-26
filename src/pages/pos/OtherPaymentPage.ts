import { type Locator, type Page, expect } from '@playwright/test';
import { CheckoutPage } from '@pages/pos/CheckoutPage';

/**
 * Page Object for the "Other" payment sub-flow on the Checkout page.
 *
 * When the cashier picks "Other", a textbox appears so they can label the
 * tender (e.g. Bank Transfer, Zelle, Venmo). Tax stays applied — the amount
 * matches Card ($16.50 for a $15 service) and not Cash ($15.00). The custom
 * label is then echoed on the Payment Success page as "Other (<name>)".
 */
export class OtherPaymentPage extends CheckoutPage {
  readonly otherButton: Locator;
  readonly methodNameInput: Locator;

  constructor(page: Page) {
    super(page);
    this.otherButton = page.getByRole('button', { name: /^Other/ });
    this.methodNameInput = page.getByPlaceholder('Input payment method name');
  }

  /** Activate Other payment method and wait for the custom-name input. */
  async selectOther(): Promise<void> {
    await this.selectPaymentMethod('Other');
    await expect(this.methodNameInput).toBeVisible({ timeout: 2_000 });
  }

  async enterMethodName(name: string): Promise<void> {
    await this.methodNameInput.fill(name);
  }

  async getMethodNameValue(): Promise<string> {
    return this.methodNameInput.inputValue();
  }

  /**
   * One-shot helper: select Other, fill the custom name, click Complete Payment.
   * The downstream passcode dialog is left for the caller to handle.
   */
  async payWithOther(methodName: string): Promise<void> {
    await this.selectOther();
    await this.enterMethodName(methodName);
    await this.clickCompletePayment();
  }
}
