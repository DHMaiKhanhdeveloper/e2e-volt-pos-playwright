import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export type AppLanguage = 'en' | 'vi';

/**
 * Settings → Language — `/settings/language`
 *
 * A Radix radiogroup with two options whose visible labels stay constant
 * regardless of the active language ("English" / "Tiếng Việt"), which makes them
 * reliable anchors. Selecting an option re-renders the whole app in that
 * language immediately (client-side); it is NOT gated by a passcode.
 *
 * NOTE: the choice is currently not persisted across a full reload (known bug) —
 * see `TC-language-switch.spec.ts`.
 */
export class LanguageSettingsPage extends BasePage {
  protected readonly path = '/settings/language';

  readonly radiogroup: Locator;
  readonly englishRow: Locator;
  readonly vietnameseRow: Locator;

  /** Stable anchor strings that only appear when a given language is active. */
  static readonly ANCHORS = {
    en: { nav: 'Pending Orders', sidebar: 'Setting', subtitle: 'Choose your primary language' },
    vi: { nav: 'Đơn đang chờ', sidebar: 'Cài đặt', subtitle: 'Chọn ngôn ngữ chính của bạn' },
  } as const;

  constructor(page: Page) {
    super(page);
    this.radiogroup = page.locator('[role="radiogroup"]');
    this.englishRow = page.getByText('English', { exact: true });
    this.vietnameseRow = page.getByText('Tiếng Việt', { exact: true });
  }

  async waitForReady(): Promise<void> {
    // Both option labels are language-independent, so they are safe to wait on.
    await expect(this.vietnameseRow).toBeVisible({ timeout: 15_000 });
    await expect(this.englishRow).toBeVisible({ timeout: 15_000 });
  }

  private row(lang: AppLanguage): Locator {
    return lang === 'vi' ? this.vietnameseRow : this.englishRow;
  }

  /** Click a language option and wait for the app to re-render in that language. */
  async select(lang: AppLanguage): Promise<void> {
    await this.row(lang).click();
    // The header/nav re-renders — wait for that language's nav anchor.
    await expect(
      this.page.getByText(LanguageSettingsPage.ANCHORS[lang].nav, { exact: true }).first(),
    ).toBeVisible({ timeout: 10_000 });
  }

  /** Which language radio is currently selected, read from the radio state. */
  async selectedLanguage(): Promise<AppLanguage> {
    return this.radiogroup.first().evaluate((rg) => {
      const radios = Array.from(rg.querySelectorAll('[role="radio"]'));
      const checked = radios.find(
        (r) =>
          r.getAttribute('aria-checked') === 'true' || r.getAttribute('data-state') === 'checked',
      );
      const label = (checked?.parentElement?.textContent ?? '').trim();
      return /Việt/.test(label) ? 'vi' : 'en';
    }) as Promise<AppLanguage>;
  }

  /** True when the app chrome (nav + sidebar) is rendered in the given language. */
  async isLanguageActive(lang: AppLanguage): Promise<boolean> {
    const a = LanguageSettingsPage.ANCHORS[lang];
    const nav = await this.page
      .getByText(a.nav, { exact: true })
      .first()
      .isVisible()
      .catch(() => false);
    const subtitle = await this.page
      .getByText(a.subtitle, { exact: true })
      .first()
      .isVisible()
      .catch(() => false);
    return nav && subtitle;
  }
}
