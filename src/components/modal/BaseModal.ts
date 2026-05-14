import { Page, expect } from '@playwright/test';
import { BaseComponent } from '@components/BaseComponent';

export class BaseModal extends BaseComponent {
  private readonly closeBtn = this.root.getByTestId('modal-close');
  private readonly confirmBtn = this.root.getByTestId('modal-confirm');
  private readonly cancelBtn = this.root.getByTestId('modal-cancel');
  private readonly title = this.root.getByTestId('modal-title');

  constructor(page: Page, rootTestId = 'modal-root') {
    super(page, page.getByTestId(rootTestId));
  }

  async getTitle(): Promise<string> {
    return (await this.title.textContent())?.trim() ?? '';
  }

  async confirm(): Promise<void> {
    await this.confirmBtn.click();
    await this.waitForHidden();
  }

  async cancel(): Promise<void> {
    await this.cancelBtn.click();
    await this.waitForHidden();
  }

  async close(): Promise<void> {
    await this.closeBtn.click();
    await this.waitForHidden();
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}
