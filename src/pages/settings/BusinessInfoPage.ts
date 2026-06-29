import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import type { PayPeriod, PayPeriodType } from '@utils/payPeriod';

/**
 * Settings → Business Info — `/settings/business`
 *
 * The income pipeline (Step 7) reads the **Pay Period** setting here to derive
 * the salary proration window (`computePeriodDays`). The Pay Period is a Radix
 * radiogroup (Weekly / Biweekly / Monthly / Custom); Custom adds a button whose
 * label lists the cut-off day(s) of the month, e.g. "28, 31".
 *
 * Passcode-gated: the route shows the passcode dialog on top, so `goto` does
 * NOT wait for readiness — the caller unlocks first, then calls `waitForReady`.
 */
export class BusinessInfoPage extends BasePage {
  protected readonly path = '/settings/business';

  readonly heading: Locator;
  readonly payPeriodGroup: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Business Info' });
    this.payPeriodGroup = page.locator('[role="radiogroup"]');
  }

  async goto(): Promise<void> {
    this.logger.info(`Navigate to ${this.path}`);
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    // Intentionally NOT calling waitForReady() — caller unlocks the passcode first.
  }

  async waitForReady(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
    await expect(this.payPeriodGroup.first()).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Read the selected Pay Period type and, for Custom, the cut-off day(s). The
   * selected Radix radio carries `data-state="checked"` / `aria-checked="true"`;
   * its label text is the type. The custom-days button text is parsed into the
   * day numbers.
   */
  async readPayPeriod(): Promise<PayPeriod> {
    const raw = await this.payPeriodGroup.first().evaluate((rg) => {
      const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
      const radios = Array.from(rg.querySelectorAll('[role="radio"]')).map((r) => ({
        label: norm(r.parentElement?.textContent ?? r.textContent),
        checked:
          r.getAttribute('aria-checked') === 'true' || r.getAttribute('data-state') === 'checked',
      }));
      // The Custom cut-off days live in a button like "28, 31".
      const buttonTexts = Array.from(rg.querySelectorAll('button'))
        .map((b) => norm(b.textContent))
        .filter(Boolean);
      return { radios, buttonTexts };
    });

    const checked = raw.radios.find((r) => r.checked);
    const KNOWN: PayPeriodType[] = ['Weekly', 'Biweekly', 'Monthly', 'Custom'];
    const type: PayPeriodType =
      KNOWN.find((k) => (checked?.label ?? '').startsWith(k)) ?? 'unknown';

    let customDays: number[] = [];
    if (type === 'Custom') {
      const daysText = raw.buttonTexts.find((t) => /\d/.test(t)) ?? '';
      customDays = (daysText.match(/\d+/g) ?? []).map(Number).filter((n) => n >= 1 && n <= 31);
    }
    return { type, customDays };
  }
}
