import { Locator, Page, expect } from '@playwright/test';
import { BaseComponent } from '@components/BaseComponent';

/**
 * Generic data table abstraction. Assumes columns are addressable via
 * data-column attribute and rows via data-testid="row-{id}".
 */
export class DataTable extends BaseComponent {
  private readonly rows: Locator;
  private readonly emptyState: Locator;

  constructor(page: Page, rootSelector: string | Locator) {
    super(page, rootSelector);
    this.rows = this.root.locator('tbody tr');
    this.emptyState = this.root.getByTestId('table-empty');
  }

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  row(index: number): Locator {
    return this.rows.nth(index);
  }

  cell(rowIndex: number, columnKey: string): Locator {
    return this.row(rowIndex).locator(`[data-column="${columnKey}"]`);
  }

  async getCellText(rowIndex: number, columnKey: string): Promise<string> {
    return (await this.cell(rowIndex, columnKey).textContent())?.trim() ?? '';
  }

  async findRowByText(text: string): Promise<Locator> {
    const row = this.rows.filter({ hasText: text });
    await expect(row).toHaveCount(1);
    return row;
  }

  async clickRowAction(rowIndex: number, action: string): Promise<void> {
    await this.row(rowIndex).getByTestId(`action-${action}`).click();
  }

  async expectEmpty(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  async expectRowCount(count: number): Promise<void> {
    await expect(this.rows).toHaveCount(count);
  }
}
