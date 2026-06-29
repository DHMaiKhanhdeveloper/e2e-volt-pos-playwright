import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { shopTimezone } from '@data/static/shops';
import { zonedDayStartUnix, zonedDayEndUnix } from '@utils/dateUtils';

/** One Time Tracking row — a staff's check-in/out for the selected day. */
export interface TimeTrackingRow {
  staff: string;
  /** Raw "Date IN" cell text (e.g. "06/26/2026 09:43 AM"), or null when absent. */
  dateIn: string | null;
  /** Raw "Date OUT" cell text, or null when not yet checked out. */
  dateOut: string | null;
  /** Raw "Total Hours" cell text (e.g. "8h 30m", "—"). */
  totalHoursText: string;
  /** Parsed worked minutes (0 when not checked out / unparseable). */
  workedMinutes: number;
  /** True when the staff has a Date IN for the day. */
  checkedIn: boolean;
}

/**
 * Time Tracking — `/time-tracking` (passcode-gated).
 *
 * A table of the day's clock-ins:
 *   # | Staff | Date IN | Date OUT | Total Hours | Created At | Updated At | Note | Action
 *
 * Used by the income pipeline (Step 3) to find which staff checked in — the
 * `wage_per_day` / `wage_per_hour` salary inputs depend on it. Like the report
 * pages, the route shows the passcode dialog on top, so `goto` does NOT wait for
 * readiness — the caller unlocks first, then calls `waitForReady`.
 */
export class TimeTrackingPage extends BasePage {
  protected readonly path = '/time-tracking';

  readonly heading: Locator;
  readonly table: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Time Tracking' });
    this.table = page.getByRole('table');
    this.searchInput = page.getByPlaceholder(/search staff/i);
  }

  async goto(): Promise<void> {
    this.logger.info(`Navigate to ${this.path}`);
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    // Intentionally NOT calling waitForReady() — caller unlocks the passcode first.
  }

  /**
   * Navigate to a specific day. The page defaults to today; passing a date sets
   * the same `?from=&to=` unix-second window the other income routes use. For
   * the live "today" pipeline `goto()` (no date) is enough.
   */
  async gotoDate(date: Date): Promise<void> {
    // Day boundaries in the SHOP's timezone (not the machine's).
    const tz = shopTimezone(process.env.SHOP);
    const from = zonedDayStartUnix(date, tz);
    const to = zonedDayEndUnix(date, tz);
    this.logger.info(`Navigate to ${this.path}?from=${from}&to=${to}`);
    await this.page.goto(`${this.path}?from=${from}&to=${to}`, { waitUntil: 'domcontentloaded' });
  }

  async waitForReady(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
    await expect(this.table).toBeVisible({ timeout: 15_000 });
  }

  /** Parse a "Total Hours" cell to minutes. Handles "8h 30m", "8h", "30m", "8:30", "8.5", "—". */
  static parseHoursToMinutes(text: string): number {
    const t = (text || '').trim();
    if (!t || t === '—' || t === '-') return 0;
    const hm = t.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?(?:\s*(\d+)\s*m)?/i);
    if (hm) return Math.round(parseFloat(hm[1]) * 60 + (hm[2] ? parseInt(hm[2], 10) : 0));
    const mOnly = t.match(/^(\d+)\s*m(?:in)?/i);
    if (mOnly) return parseInt(mOnly[1], 10);
    const colon = t.match(/^(\d+):(\d{1,2})$/);
    if (colon) return parseInt(colon[1], 10) * 60 + parseInt(colon[2], 10);
    const dec = t.match(/^(\d+(?:\.\d+)?)$/);
    if (dec) return Math.round(parseFloat(dec[1]) * 60);
    return 0;
  }

  /**
   * Scrape every row of the Time Tracking table for the selected day, mapping
   * columns by their header text so column re-ordering doesn't break it.
   */
  async readCheckIns(): Promise<TimeTrackingRow[]> {
    await expect(this.table).toBeVisible({ timeout: 15_000 });
    const raw = await this.table.evaluate((tableEl) => {
      const norm = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();
      const headers = Array.from(tableEl.querySelectorAll('thead th')).map((th) =>
        norm(th.textContent),
      );
      const idx = (name: string): number => headers.findIndex((h) => h === name);
      const cStaff = idx('Staff');
      const cIn = idx('Date IN');
      const cOut = idx('Date OUT');
      const cHours = idx('Total Hours');
      return Array.from(tableEl.querySelectorAll('tbody tr')).map((tr) => {
        const cells = Array.from(tr.querySelectorAll('td')).map((td) => norm(td.textContent));
        return {
          staff: cStaff >= 0 ? cells[cStaff] : '',
          dateIn: cIn >= 0 ? cells[cIn] : '',
          dateOut: cOut >= 0 ? cells[cOut] : '',
          totalHoursText: cHours >= 0 ? cells[cHours] : '',
        };
      });
    });

    const isBlank = (v: string): boolean => !v || v === '-' || v === '—';
    return raw
      .filter((r) => r.staff)
      .map((r) => ({
        staff: r.staff,
        dateIn: isBlank(r.dateIn) ? null : r.dateIn,
        dateOut: isBlank(r.dateOut) ? null : r.dateOut,
        totalHoursText: r.totalHoursText,
        workedMinutes: TimeTrackingPage.parseHoursToMinutes(r.totalHoursText),
        checkedIn: !isBlank(r.dateIn),
      }));
  }
}
