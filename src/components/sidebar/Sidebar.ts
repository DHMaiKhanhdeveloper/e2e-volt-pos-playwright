import { Page, expect } from '@playwright/test';
import { BaseComponent } from '@components/BaseComponent';

export type SidebarItem =
  | 'dashboard'
  | 'payments'
  | 'orders'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'logout';

export class Sidebar extends BaseComponent {
  constructor(page: Page) {
    super(page, page.getByTestId('app-sidebar'));
  }

  async goTo(item: SidebarItem): Promise<void> {
    await this.root.getByTestId(`sidebar-${item}`).click();
  }

  async expectActive(item: SidebarItem): Promise<void> {
    await expect(this.root.getByTestId(`sidebar-${item}`)).toHaveAttribute('aria-current', 'page');
  }

  async logout(): Promise<void> {
    await this.goTo('logout');
  }
}
