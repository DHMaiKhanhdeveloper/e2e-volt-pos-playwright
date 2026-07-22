import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

/**
 * Settings → General → Accessibility — `/settings/accessibility`
 *
 * VP-2400: hosts the "Passcode Setting" section, a single switch that lets a
 * merchant turn off the passcode-verification modal for gated actions across
 * the whole POS. Also hosts the unrelated "Keyboard Setting" switch.
 */
export class AccessibilitySettingsPage extends BasePage {
  protected readonly path = '/settings/accessibility';

  readonly heading: Locator;
  readonly enablePasscodeSwitch: Locator;
  readonly showVirtualKeyboardSwitch: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Accessibility' });
    this.enablePasscodeSwitch = page.getByRole('switch', { name: 'Enable Passcode Verification' });
    this.showVirtualKeyboardSwitch = page.getByRole('switch', {
      name: 'Show the virtual keyboard',
    });
  }

  async waitForReady(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
    await expect(this.enablePasscodeSwitch).toBeVisible();
  }

  async isPasscodeEnabled(): Promise<boolean> {
    return (await this.enablePasscodeSwitch.getAttribute('aria-checked')) === 'true';
  }

  /** Set the "Enable Passcode Verification" switch to the given state. */
  async setPasscodeEnabled(enabled: boolean): Promise<void> {
    if ((await this.isPasscodeEnabled()) !== enabled) {
      await this.enablePasscodeSwitch.click();
      await expect(this.enablePasscodeSwitch).toHaveAttribute('aria-checked', String(enabled));
    }
  }

  async isVirtualKeyboardEnabled(): Promise<boolean> {
    return (await this.showVirtualKeyboardSwitch.getAttribute('aria-checked')) === 'true';
  }
}
