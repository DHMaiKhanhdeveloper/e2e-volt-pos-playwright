/**
 * Derive the pay-period LENGTH (in days) that contains a given date, from the
 * Pay Period setting scraped off Settings → Business Info.
 *
 * The length is the salary proration divisor used by the income core
 * (`salary_by_period` salary = salaryAmount ÷ periodDays). For the live "today"
 * pipeline the active period is never locked, so this UI-derived length is the
 * divisor; for a LOCKED period the backend stores the exact window in
 * `payroll_period` (used by the SQLite re-derive) — prefer that when available.
 */

export type PayPeriodType = 'Weekly' | 'Biweekly' | 'Monthly' | 'Custom' | 'unknown';

export interface PayPeriod {
  type: PayPeriodType;
  /** For Custom: the cut-off day(s) of the month that END each period (e.g. [28, 31]). */
  customDays: number[];
}

const daysInMonth = (year: number, monthIndex0: number): number =>
  new Date(year, monthIndex0 + 1, 0).getDate();

/**
 * Number of days in the pay period that contains `date`.
 *
 * - Weekly → 7, Biweekly → 14.
 * - Monthly → the calendar month's length.
 * - Custom → the cut-off days are the LAST day of each in-month period (a value
 *   ≥ the month length means "end of month"). Periods partition the month: the
 *   first starts on the 1st, each subsequent one starts the day after the prior
 *   cut. Returns the length of the period whose [start..end] contains the date.
 * - unknown → falls back to the calendar month length (a safe non-zero divisor).
 */
export const computePeriodDays = (pp: PayPeriod, date: Date): number => {
  switch (pp.type) {
    case 'Weekly':
      return 7;
    case 'Biweekly':
      return 14;
    case 'Monthly':
      return daysInMonth(date.getFullYear(), date.getMonth());
    case 'Custom': {
      const monthLen = daysInMonth(date.getFullYear(), date.getMonth());
      const day = date.getDate();
      // Cut-off days, clamped to the month length, unique, ascending. Always
      // include the month end so the last period is bounded.
      const cuts = Array.from(new Set(pp.customDays.map((d) => Math.min(d, monthLen))))
        .filter((d) => d >= 1)
        .sort((a, b) => a - b);
      if (!cuts.includes(monthLen)) cuts.push(monthLen);
      let start = 1;
      for (const end of cuts) {
        if (day <= end) return end - start + 1;
        start = end + 1;
      }
      return monthLen; // shouldn't happen (month-end is a cut), but stay safe
    }
    default:
      return daysInMonth(date.getFullYear(), date.getMonth());
  }
};
