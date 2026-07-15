/**
 * Derive the Income Summary "Staff Payout" / "Salon Earnings" / "Supply Fee"
 * CONTRIBUTIONS of each staff from their Settings → Compensation rules + that
 * staff's settled daily income.
 *
 * Verified rule (from real data — Amelia, Teri):
 *   staff service commission = (Total Service − Supply Fee) × serviceStaffRate%
 * The salon keeps the rest of the service revenue:
 *   salon service commission = (Total Service − Supply Fee) − staff commission
 *
 * All amounts are integer cents. We aggregate over the staff we have
 * compensation for (the day's order-staff), so these are their CONTRIBUTIONS to
 * the store sections, not necessarily the whole-store totals (which would need
 * every staff's compensation).
 */

/** Per-staff settled income (subset of `StaffDailyIncomeSettledRow`) needed here. */
export interface StaffIncomeForSections {
  staffId: string;
  subtotal: number; // Total Service
  supplyFee: number;
  staffCommission: number; // backend-computed (the truth to verify against)
  tip: number;
  cleanUpFee: number;
  staffSalary: number;
  totalIncome: number;
}

/** Compensation rates needed to derive commission. */
export interface CompRate {
  staffId: string | null;
  staff: string;
  compensationType: string;
  serviceStaffPct: number | null;
}

export interface StaffSectionRow {
  staffId: string;
  staff: string;
  compensationType: string;
  serviceRatePct: number | null;
  totalServiceCents: number;
  supplyFeeCents: number;
  netServiceCents: number; // service − supply fee (commission base)
  computedCommissionCents: number | null; // netService × rate
  apiCommissionCents: number; // backend value
  commissionMatches: boolean;
  salonCommissionCents: number; // netService − apiCommission
  tipCents: number;
  cleanUpFeeCents: number;
  salaryCents: number;
}

export interface IncomeSummaryFromCompensation {
  matchedStaff: number;
  commissionVerified: number; // how many staff's computed == api commission
  /** Staff Payout contributions (Σ over matched staff). */
  staffPayout: {
    totalServiceCents: number;
    supplyFeeCents: number;
    commissionCents: number;
    tipCents: number;
    cleanUpFeeCents: number;
    salaryCents: number;
    totalCents: number;
  };
  /** Salon Earnings contributions. */
  salonEarnings: {
    serviceCommissionCents: number;
  };
  /** Supply Fee total (Σ over matched staff). */
  supplyFee: {
    totalCents: number;
  };
  perStaff: StaffSectionRow[];
}

export const computeSectionsFromCompensation = (
  income: StaffIncomeForSections[],
  compByStaffId: Record<string, CompRate>,
): IncomeSummaryFromCompensation => {
  const perStaff: StaffSectionRow[] = [];

  for (const r of income) {
    const comp = compByStaffId[r.staffId];
    if (!comp) continue; // no compensation for this staff — skip
    const rate = comp.serviceStaffPct;
    const netServiceCents = r.subtotal - r.supplyFee;
    const computedCommissionCents =
      rate === null ? null : Math.round((netServiceCents * rate) / 100);
    perStaff.push({
      staffId: r.staffId,
      staff: comp.staff,
      compensationType: comp.compensationType,
      serviceRatePct: rate,
      totalServiceCents: r.subtotal,
      supplyFeeCents: r.supplyFee,
      netServiceCents,
      computedCommissionCents,
      apiCommissionCents: r.staffCommission,
      commissionMatches: computedCommissionCents === r.staffCommission,
      salonCommissionCents: netServiceCents - r.staffCommission,
      tipCents: r.tip,
      cleanUpFeeCents: r.cleanUpFee,
      salaryCents: r.staffSalary,
    });
  }

  const sum = (pick: (s: StaffSectionRow) => number): number =>
    perStaff.reduce((acc, s) => acc + pick(s), 0);

  return {
    matchedStaff: perStaff.length,
    commissionVerified: perStaff.filter((s) => s.commissionMatches).length,
    staffPayout: {
      totalServiceCents: sum((s) => s.totalServiceCents),
      supplyFeeCents: sum((s) => s.supplyFeeCents),
      commissionCents: sum((s) => s.apiCommissionCents),
      tipCents: sum((s) => s.tipCents),
      cleanUpFeeCents: sum((s) => s.cleanUpFeeCents),
      salaryCents: sum((s) => s.salaryCents),
      totalCents: sum((s) => s.apiCommissionCents + s.tipCents + s.cleanUpFeeCents + s.salaryCents),
    },
    salonEarnings: {
      serviceCommissionCents: sum((s) => s.salonCommissionCents),
    },
    supplyFee: {
      totalCents: sum((s) => s.supplyFeeCents),
    },
    perStaff,
  };
};
