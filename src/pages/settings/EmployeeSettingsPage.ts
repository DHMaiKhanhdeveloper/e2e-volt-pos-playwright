import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

/** A staff member's Compensation tab values, as shown in Settings → Employees. */
export interface StaffCompensation {
  staff: string;
  found: boolean;
  /** The staff record id (from the detail URL) — join key to the income API. */
  staffId: string | null;
  /** `commission` | `salary` | `commission_salary` | `unknown` (best-effort). */
  compensationType: string;
  /** For Service — Staff share (%). `null` for salary-only staff (no commission). */
  serviceStaffPct: number | null;
  /** For Product — Staff share (%). */
  productStaffPct: number | null;
  /** For Gift Card — Staff share (%). */
  giftCardStaffPct: number | null;
  /** Pay 1 / Pay 2 split (%). */
  pay1Pay2Split: number | null;
  /** Card Fee Charge — on staff commission (%). */
  cardFeeOnCommissionPct: number | null;
  /** Card Fee Charge — on credit-card tip (%). */
  cardFeeOnTipPct: number | null;
}

/**
 * Settings → Employees — `/settings/staffs`
 *
 * Drives the employee list (search + select) and reads a staff member's
 * Compensation tab. Not passcode-gated. Selectors lean on the stable input
 * `name` attributes in the Compensation form and the staff-row `<a>` links.
 */
export class EmployeeSettingsPage extends BasePage {
  protected readonly path = '/settings/staffs';

  readonly searchInput: Locator;
  readonly compensationTab: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('input[placeholder*="employee" i]');
    this.compensationTab = page.getByText('Compensation', { exact: true });
  }

  async waitForReady(): Promise<void> {
    await expect(this.searchInput).toBeVisible({ timeout: 15_000 });
  }

  /** All staff-row links currently rendered (filtered by the search box). */
  private staffLinks(): Locator {
    return this.page.locator('a[href*="/settings/staffs/"]');
  }

  /**
   * The candidate name lines of a staff-row link. A row renders as
   * `<avatar-initial>\n<name>\n<Active|Inactive>` (the avatar shows a 1-char
   * initial when there's no photo), so we drop the status line and 1-char
   * initials and keep the real name line(s).
   */
  private static nameLines(text: string): string[] {
    return text
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && !/^(Active|Inactive)$/i.test(s));
  }

  /** True if a row's text identifies `name` (exact, or the row is a prefix of it). */
  private static rowMatches(text: string, name: string): boolean {
    return EmployeeSettingsPage.nameLines(text).some(
      (line) => line === name || (name.startsWith(line) && line.length >= 4),
    );
  }

  /**
   * Filter the list by `name` and open the matching staff. Returns `false` if no
   * row matches (caller should record the staff as not found). Matches the row
   * whose name equals `name`, else one that is a prefix of `name` (the settings
   * list sometimes omits a last-name suffix shown elsewhere).
   */
  async openStaff(name: string): Promise<boolean> {
    await this.searchInput.fill('');
    await this.searchInput.fill(name);

    // Poll the filtered list: the matching row can render a beat after other
    // matches (e.g. "bell" returns "Isabella" first, then "Bell"), so a fixed
    // wait misses it. Match exact name, else a row that is a prefix of `name`
    // (the list may omit a last-name suffix shown elsewhere).
    const links = this.staffLinks();

    let target: Locator | null = null;
    for (let attempt = 0; attempt < 16 && !target; attempt++) {
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        if (EmployeeSettingsPage.rowMatches((await links.nth(i).innerText()) ?? '', name)) {
          target = links.nth(i);
          break;
        }
      }
      if (!target) await this.page.waitForTimeout(300);
    }
    if (!target) return false;
    await target.click();
    await expect(this.page).toHaveURL(/\/settings\/staffs\/[0-9a-f-]+/);
    return true;
  }

  /**
   * Open the Compensation tab and wait for it to mount. "Deduction Per Day"
   * is present for every compensation type (Commission / Commission+Salary /
   * Salary), so it's a reliable signal — unlike the commission % inputs, which
   * are absent for salary-only staff.
   */
  async openCompensationTab(): Promise<void> {
    await this.compensationTab.first().click();
    await expect(this.page.getByText('Deduction Per Day').first()).toBeVisible({ timeout: 10_000 });
  }

  private async pct(name: string): Promise<number | null> {
    const loc = this.page.locator(`input[name="${name}"]`);
    if ((await loc.count()) === 0) return null;
    const raw = (await loc.first().inputValue()).replace(/[^0-9.-]/g, '');
    return raw === '' ? null : Number(raw);
  }

  /**
   * Best-effort compensation type from which accordion section is open. The
   * Commission / Commission + Salary / Salary sections are accordion items; the
   * selected one has `data-state="open"`.
   */
  private async detectCompensationType(): Promise<string> {
    return this.page.evaluate(() => {
      const open = Array.from(document.querySelectorAll('[data-state="open"]'));
      const has = (re: RegExp) => open.some((e) => re.test((e.textContent || '').trim()));
      if (has(/^Commission \+ Salary/)) return 'commission_salary';
      if (has(/^Salary/)) return 'salary';
      if (has(/^Commission/)) return 'commission';
      return 'unknown';
    });
  }

  /** The staff id from the current detail URL (`/settings/staffs/<id>`), or null. */
  private currentStaffId(): string | null {
    return this.page.url().match(/\/settings\/staffs\/([0-9a-f-]+)/)?.[1] ?? null;
  }

  /** Read the Compensation tab values of the currently-open staff. */
  async readCompensation(): Promise<Omit<StaffCompensation, 'staff' | 'found' | 'staffId'>> {
    return {
      compensationType: await this.detectCompensationType(),
      serviceStaffPct: await this.pct('percentServiceStaff'),
      productStaffPct: await this.pct('percentProductStaff'),
      giftCardStaffPct: await this.pct('percentGiftCardStaff'),
      pay1Pay2Split: await this.pct('cashCheckSplit'),
      cardFeeOnCommissionPct: await this.pct('percentStaffCommission'),
      cardFeeOnTipPct: await this.pct('percentCreditCardTip'),
    };
  }

  /** Search → open → read a single staff's compensation. `found:false` if absent. */
  async readCompensationFor(name: string): Promise<StaffCompensation> {
    const opened = await this.openStaff(name);
    if (!opened) {
      return {
        staff: name,
        found: false,
        staffId: null,
        compensationType: 'unknown',
        serviceStaffPct: null,
        productStaffPct: null,
        giftCardStaffPct: null,
        pay1Pay2Split: null,
        cardFeeOnCommissionPct: null,
        cardFeeOnTipPct: null,
      };
    }
    const staffId = this.currentStaffId();
    await this.openCompensationTab();
    return { staff: name, found: true, staffId, ...(await this.readCompensation()) };
  }
}
