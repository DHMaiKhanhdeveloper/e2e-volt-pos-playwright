/**
 * Minimal per-staff income shape shared by the live (`staffDailyIncomeListLive`)
 * and settled (`reportStaffDailyIncomeList`) rows — the live query carries
 * `compensationType`/`salarySetting`, the settled one carries `pay1`/`pay2`, so
 * those are optional here.
 */
export interface StaffIncomeLike {
  staffId: string;
  numberOfOrders: number;
  subtotal: number;
  supplyFee: number;
  staffCommission: number;
  cleanUpFee: number;
  tip: number;
  totalIncome: number;
  staffSalary: number;
  rate: number;
  compensationType?: string;
  salarySetting?: string;
  pay1?: number;
  pay2?: number;
}

/**
 * Build the Income Summary "Staff Payout" view from per-staff daily income
 * (`staffDailyIncomeListLive`) — the API path (approach B). Each row already
 * carries the staff's applied compensation: `rate` (service commission %),
 * `compensationType`, `salarySetting`, plus the computed components.
 *
 * Only Total Service (`subtotal`), `tip`, `cleanUpFee` and `staffSalary` roll up
 * as a plain per-staff SUM into the store-level Staff Payout. `staffCommission`,
 * `supplyFee` and `totalIncome` are kept per-staff too, but the store rollup
 * applies the staff/salon split, so their plain sums are informational only.
 * All amounts are integer cents.
 */

export interface StaffPayoutRow {
  staffId: string;
  rate: number;
  compensationType: string;
  salarySetting: string;
  numberOfOrders: number;
  totalServiceCents: number;
  tipCents: number;
  cleanUpFeeCents: number;
  salaryCents: number;
  commissionCents: number;
  supplyFeeCents: number;
  totalIncomeCents: number;
  pay1Cents: number;
  pay2Cents: number;
  /**
   * Effective service commission rate (%) = commission ÷ Total Service. The
   * settled API leaves `rate` at 0, so this recovers the applied compensation —
   * it matches the staff's Settings → Compensation "For Service" Staff% (e.g.
   * Amelia: 2100 / 4200 = 50%).
   */
  derivedServiceRatePct: number;
}

export interface StaffPayout {
  staffCount: number;
  perStaff: StaffPayoutRow[];
  /** Plain per-staff sums. The first four equal the store Staff Payout exactly. */
  totals: {
    totalServiceCents: number;
    tipCents: number;
    cleanUpFeeCents: number;
    salaryCents: number;
    /** Informational — store rollup applies the staff/salon split, not a plain sum. */
    commissionCents: number;
    supplyFeeCents: number;
    totalIncomeCents: number;
  };
}

export const computeStaffPayout = (rows: StaffIncomeLike[]): StaffPayout => {
  const perStaff: StaffPayoutRow[] = rows.map((r) => ({
    staffId: r.staffId,
    rate: r.rate,
    compensationType: r.compensationType ?? '',
    salarySetting: r.salarySetting ?? '',
    numberOfOrders: r.numberOfOrders,
    totalServiceCents: r.subtotal,
    tipCents: r.tip,
    cleanUpFeeCents: r.cleanUpFee,
    salaryCents: r.staffSalary,
    commissionCents: r.staffCommission,
    supplyFeeCents: r.supplyFee,
    totalIncomeCents: r.totalIncome,
    pay1Cents: r.pay1 ?? 0,
    pay2Cents: r.pay2 ?? 0,
    derivedServiceRatePct:
      r.subtotal !== 0 ? Math.round((r.staffCommission / r.subtotal) * 10000) / 100 : 0,
  }));

  const sum = (pick: (r: StaffPayoutRow) => number): number =>
    perStaff.reduce((acc, r) => acc + pick(r), 0);

  return {
    staffCount: perStaff.length,
    perStaff,
    totals: {
      totalServiceCents: sum((r) => r.totalServiceCents),
      tipCents: sum((r) => r.tipCents),
      cleanUpFeeCents: sum((r) => r.cleanUpFeeCents),
      salaryCents: sum((r) => r.salaryCents),
      commissionCents: sum((r) => r.commissionCents),
      supplyFeeCents: sum((r) => r.supplyFeeCents),
      totalIncomeCents: sum((r) => r.totalIncomeCents),
    },
  };
};
