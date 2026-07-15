/**
 * Compute the Income Summary "Supply Fee / Staff Payout / Salon Earnings"
 * sections for TODAY directly from scraped order data + Settings compensation
 * (no settled per-staff API — today isn't settled, and the live per-staff query
 * isn't available on this backend).
 *
 * Per staff:
 *   net service     = Σ item price − Σ item supply fee
 *   staff commission = net service × serviceStaffRate%   (Staff Payout)
 *   salon commission = net service − staff commission     (Salon Earnings)
 * Salary-only staff (rate null) take no service commission — the salon keeps it.
 * All amounts are integer cents.
 */

export interface StaffAgg {
  staff: string;
  serviceRatePct: number | null;
  compensationType: string;
  serviceRevenueCents: number;
  supplyFeeCents: number;
  tipCents: number;
  itemCount: number;
}

export interface SectionRowFromScrape {
  staff: string;
  serviceRatePct: number | null;
  compensationType: string;
  serviceRevenueCents: number;
  supplyFeeCents: number;
  netServiceCents: number;
  commissionCents: number;
  salonCommissionCents: number;
  tipCents: number;
}

export interface SectionsFromScrape {
  matchedStaff: number;
  supplyFee: { totalCents: number };
  staffPayout: {
    totalServiceCents: number;
    supplyFeeCents: number;
    commissionCents: number;
    tipCents: number;
    totalCents: number;
  };
  salonEarnings: { serviceCommissionCents: number };
  perStaff: SectionRowFromScrape[];
}

export const computeSectionsFromScrape = (staff: StaffAgg[]): SectionsFromScrape => {
  const perStaff: SectionRowFromScrape[] = staff.map((s) => {
    const netServiceCents = s.serviceRevenueCents - s.supplyFeeCents;
    const commissionCents =
      s.serviceRatePct === null ? 0 : Math.round((netServiceCents * s.serviceRatePct) / 100);
    return {
      staff: s.staff,
      serviceRatePct: s.serviceRatePct,
      compensationType: s.compensationType,
      serviceRevenueCents: s.serviceRevenueCents,
      supplyFeeCents: s.supplyFeeCents,
      netServiceCents,
      commissionCents,
      salonCommissionCents: netServiceCents - commissionCents,
      tipCents: s.tipCents,
    };
  });

  const sum = (pick: (r: SectionRowFromScrape) => number): number =>
    perStaff.reduce((acc, r) => acc + pick(r), 0);
  const commission = sum((r) => r.commissionCents);
  const tip = sum((r) => r.tipCents);

  return {
    matchedStaff: perStaff.length,
    supplyFee: { totalCents: sum((r) => r.supplyFeeCents) },
    staffPayout: {
      totalServiceCents: sum((r) => r.serviceRevenueCents),
      supplyFeeCents: sum((r) => r.supplyFeeCents),
      commissionCents: commission,
      tipCents: tip,
      totalCents: commission + tip,
    },
    salonEarnings: { serviceCommissionCents: sum((r) => r.salonCommissionCents) },
    perStaff,
  };
};
