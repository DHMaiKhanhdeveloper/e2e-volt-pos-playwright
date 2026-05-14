import { Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { env } from '@configs/env/loadEnv';

export class LoginPage extends BasePage {
  protected readonly path = env.LOGIN_PATH;

  private readonly username = this.byTestId('login-username');
  private readonly password = this.byTestId('login-password');
  private readonly submit = this.byTestId('login-submit');
  private readonly rememberMe = this.byTestId('login-remember-me');
  private readonly errorBanner = this.byTestId('login-error');

  constructor(page: Page) {
    super(page);
  }

  async waitForReady(): Promise<void> {
    await expect(this.username).toBeVisible();
  }

  async fillCredentials(user: string, pass: string): Promise<void> {
    await this.username.fill(user);
    await this.password.fill(pass);
  }

  async submitForm(): Promise<void> {
    await this.submit.click();
  }

  async login(user: string, pass: string, opts: { remember?: boolean } = {}): Promise<void> {
    await this.fillCredentials(user, pass);
    if (opts.remember) {
      await this.rememberMe.check();
    }
    await this.submitForm();
  }

  async expectError(message?: string | RegExp): Promise<void> {
    await expect(this.errorBanner).toBeVisible();
    if (message) {
      await expect(this.errorBanner).toContainText(message);
    }
  }
}
