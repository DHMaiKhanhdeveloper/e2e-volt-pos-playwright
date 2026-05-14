import { Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { Sidebar } from '@components/sidebar/Sidebar';
import { env } from '@configs/env/loadEnv';

export class DashboardPage extends BasePage {
  protected readonly path = env.DASHBOARD_PATH;

  readonly sidebar: Sidebar;

  private readonly welcomeMessage = this.byTestId('dashboard-welcome');
  private readonly todaySales = this.byTestId('dashboard-today-sales');
  private readonly recentTransactions = this.byTestId('dashboard-recent-txn');

  constructor(page: Page) {
    super(page);
    this.sidebar = new Sidebar(page);
  }

  async waitForReady(): Promise<void> {
    await expect(this.welcomeMessage).toBeVisible();
  }

  async getTodaySales(): Promise<string> {
    return (await this.todaySales.textContent())?.trim() ?? '';
  }

  async getWelcomeText(): Promise<string> {
    return (await this.welcomeMessage.textContent())?.trim() ?? '';
  }

  async expectLoaded(): Promise<void> {
    await expect(this.welcomeMessage).toBeVisible();
    await expect(this.recentTransactions).toBeVisible();
  }
}
