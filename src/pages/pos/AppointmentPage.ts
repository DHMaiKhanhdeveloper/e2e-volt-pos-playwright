import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { Urls } from '@constants/urls';

/**
 * Appointment Calendar (`/appointment`) — Create/Edit appointment form.
 *
 * Source: docs/test-cases/VP-1615-analysis.md + VP-1615-test-cases.md.
 * The Create/Edit form is a dialog with 3 sections: Customer Information,
 * Service Details (one or more lines), Additional Information (tags/note).
 */
export class AppointmentPage extends BasePage {
  protected readonly path = Urls.APPOINTMENT;

  readonly createAppointmentButton: Locator;
  readonly dialog: Locator;
  readonly closeButton: Locator;
  readonly saveButton: Locator;

  // Customer Information
  readonly customerPhoneInput: Locator;
  readonly customerNameInput: Locator;
  readonly clearPhoneButton: Locator;
  readonly phoneFormatError: Locator;
  readonly createNewClientOption: Locator;
  readonly customerSuggestions: Locator;

  // Date field
  readonly datePrevButton: Locator;
  readonly dateNextButton: Locator;
  readonly dateValueText: Locator;

  // Service Details (first line)
  readonly startTimeInput: Locator;
  readonly staffSelectButton: Locator;
  readonly serviceSelectButton: Locator;
  readonly addMoreButton: Locator;

  // Additional Information
  readonly requestedTag: Locator;
  readonly highlightTag: Locator;
  readonly noShowTag: Locator;
  readonly repeatTag: Locator;
  readonly noteInput: Locator;

  constructor(page: Page) {
    super(page);
    this.createAppointmentButton = page.getByRole('button', { name: /Create Appointment/i });
    this.dialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: /Create Appointment|Update Appointment/i }),
    });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
    this.saveButton = this.dialog.getByRole('button', { name: /Save Appointment/i });

    this.customerPhoneInput = this.dialog.getByPlaceholder('Search for Customer Phone');
    this.customerNameInput = this.dialog.getByPlaceholder('Search for Customer Name');
    this.clearPhoneButton = this.dialog.getByRole('button', { name: /clear/i });
    this.phoneFormatError = this.dialog.getByText(/Phone number must be 10 or 11 digits/i);
    this.createNewClientOption = this.dialog.getByText(/\+\s*Create new client/i);
    this.customerSuggestions = this.dialog.getByText(/\(\*{3}\)\s*\*{3}-\d{4}/);

    this.datePrevButton = this.dialog.getByRole('button', { name: /previous/i }).first();
    this.dateNextButton = this.dialog.getByRole('button', { name: /next/i }).first();
    this.dateValueText = this.dialog.getByText(/\d{1,2}\/\d{1,2}\/\d{2,4}/).first();

    // Start time renders as the 3rd textbox in the dialog (after phone + name).
    this.startTimeInput = this.dialog.getByRole('textbox').nth(2);
    this.staffSelectButton = this.dialog.getByRole('button', { name: /Select staff/i }).first();
    this.serviceSelectButton = this.dialog.getByRole('button', { name: /Select service/i }).first();
    this.addMoreButton = this.dialog.getByRole('button', { name: /Add more/i });

    this.requestedTag = this.dialog.getByRole('checkbox').nth(0);
    this.highlightTag = this.dialog.getByRole('checkbox').nth(1);
    this.noShowTag = this.dialog.getByRole('checkbox').nth(2);
    this.repeatTag = this.dialog.getByRole('checkbox', { name: /Repeat/i });
    this.noteInput = this.dialog.getByPlaceholder('Add an appointment note');
  }

  async waitForReady(): Promise<void> {
    await expect(this.createAppointmentButton).toBeVisible({ timeout: 10_000 });
  }

  async openCreateForm(): Promise<void> {
    await this.createAppointmentButton.click();
    await expect(this.dialog).toBeVisible({ timeout: 10_000 });
  }

  async closeForm(): Promise<void> {
    // Dismiss any nested popover (staff/service picker) still open on top.
    await this.page.keyboard.press('Escape').catch(() => undefined);
    // The calendar behind the dialog keeps re-rendering (live appointment
    // counts via websocket), which occasionally detaches the Close button
    // mid-click. Retry the click a few times before falling back to Escape.
    for (let attempt = 0; attempt < 3; attempt++) {
      const closed = await this.closeButton
        .click({ timeout: 3_000 })
        .then(() => true)
        .catch(() => false);
      if (closed && (await this.dialog.isHidden({ timeout: 1_000 }).catch(() => false))) return;
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await expect(this.dialog).toBeHidden({ timeout: 5_000 });
  }

  async fillCustomerPhone(phone: string): Promise<void> {
    await this.customerPhoneInput.fill(phone);
  }

  async selectFirstCustomerSuggestion(): Promise<void> {
    await this.customerSuggestions.first().click();
  }

  /** Every appointment card currently rendered on the calendar grid. */
  appointmentCards(): Locator {
    return this.page.locator('[class*="appointment-card"], [class*="event-card"]');
  }
}
