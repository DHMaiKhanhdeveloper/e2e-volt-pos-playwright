/**
 * PURE income-calculation core — the single source of truth for the Income
 * Summary "Staff Payout / Salon Earnings / Supply Fee split / Salary" math.
 *
 * Lifted verbatim from `IncomeSummaryRederive.ts` (itself a faithful port of the
 * backend `report.rs`) so two callers can share ONE implementation:
 *   - `IncomeSummaryRederive` — gathers inputs from the local SQLite tables.
 *   - the UI pipeline (TC-RECON) — gathers the same inputs by SCRAPING the app
 *     (Daily Sale Report orders, Settings → Compensation, Time Tracking check-in,
 *     Business Info pay period).
 *
 * Whatever the source, both build the input shapes below and call
 * `computeIncomeSummary`, so the derived numbers can never drift apart.
 *
 * All money values are integer cents.
 */

/** round-half-up integer division (matches report.rs `rdiv`). */
export const rdiv = (n: number, d: number): number =>
  d <= 0 ? 0 : Math.floor((n + Math.floor(d / 2)) / d);

/** A staff's compensation rule (the fields the payout math needs). */
export interface CompInput {
  /** `commission` | `salary` | `commission_salary` (`-`/unknown allowed). */
  compType: string;
  /** For Service — Staff share (%), i.e. `percent_service_staff`. */
  percentService: number;
  /** Pay 1 / Pay 2 split (%), i.e. `cash_check_split`. */
  pay1Split: number;
  /** Card Fee Charge on staff commission (%), i.e. `percent_staff_commission`. */
  cardFeeCommissionPct: number;
  /** Deduction Per Day (cents), i.e. `deduction_per_day`. */
  deductionPerDay: number;
  /** Salary amount (cents), i.e. `salary_amount`. */
  salaryAmount: number;
  /** `salary_by_period` | `wage_per_day` | `wage_per_hour` (or ''). */
  salarySetting: string;
  /** `enable_payroll_tip` — when true the tip is excluded from total income. */
  enablePayrollTip: boolean;
}

/** Per-staff inputs to the payout loop (source-agnostic: SQLite or scraped UI). */
export interface StaffInput {
  staffId: string;
  name: string;
  /** Net service revenue (sale − refund), before supply fee. */
  serviceNet: number;
  /** Supply fee on this staff's service items (sale − refund). */
  supplyNet: number;
  /** Tip share for the day. */
  tip: number;
  /** Service-net on card-paid orders — the card-fee charge base. */
  cardBase: number;
  /** Whether the staff has any check-in for the day (Time Tracking). */
  checkedIn: boolean;
  /** Minutes worked (check-out − check-in), for `wage_per_hour`. */
  workedMinutes: number;
  comp: CompInput;
  /**
   * Finalized payroll for a LOCKED period: the staff's settled salary + the
   * work-days used to prorate it. Omit when the period isn't locked.
   */
  finalizedSalary?: { salary: number; workDays: number };
}

/** Store-level sale figures (whole-day, not per staff). */
export interface StoreSaleInput {
  serviceSale: number;
  serviceRefund: number;
  productSale: number;
  productRefund: number;
  giftCardSale: number;
  totalDiscount: number;
  /** Total supply fee (sale − refund) across all service items. */
  supplyTotal: number;
}

/** Pay-period context (Business Info). */
export interface PeriodInput {
  /** Number of days in the active pay period — the salary proration divisor. */
  periodDays: number;
  /** Whether the active payroll period is locked/finalized. */
  finalized: boolean;
}

export interface StaffPayoutRow {
  staffId: string;
  name: string;
  percentService: number;
  compType: string;
  serviceNet: number;
  supplyNet: number;
  commission: number;
  supplyShare: number;
  salonCommission: number;
  tip: number;
  cleanUp: number;
  cardFee: number;
  salary: number;
  total: number;
  pay1: number;
  pay2: number;
}

export interface IncomeSummaryResult {
  // Sale side
  serviceSale: number;
  serviceRefund: number;
  productSale: number;
  productRefund: number;
  giftCardSale: number;
  totalDiscount: number;
  totalService: number;
  // Supply fee
  supplyTotal: number;
  staffSupplyShare: number;
  salonSupplyShare: number;
  // Staff Payout (store rollup = Σ per-staff)
  commission: number;
  payoutTip: number;
  cleanUp: number;
  cardCharge: number;
  salary: number;
  payoutTotal: number;
  pay1: number;
  pay2: number;
  // Salon Earnings
  salonCommission: number;
  netEarnings: number;
  totalEarning: number;
  // Per-staff breakdown
  staff: StaffPayoutRow[];
}

/** Daily salary for one staff (port of report.rs / rederive `dailySalary`). */
const dailySalary = (s: StaffInput, period: PeriodInput): number => {
  const c = s.comp;
  const fin = s.finalizedSalary ?? { salary: 0, workDays: 0 };
  const wd = fin.workDays > 0 ? fin.workDays : period.periodDays;
  if (c.salarySetting === 'wage_per_hour') return rdiv(c.salaryAmount * s.workedMinutes, 60);
  if (c.salarySetting === 'wage_per_day')
    return !s.checkedIn ? 0 : period.finalized ? rdiv(fin.salary, wd) : c.salaryAmount;
  const amt = period.finalized ? fin.salary : c.salaryAmount;
  return rdiv(amt, period.periodDays);
};

/**
 * Compute the Income Summary Staff Payout / Salon Earnings / Supply split from
 * per-staff inputs + store sale totals + pay-period context. Pure — no I/O.
 */
export const computeIncomeSummary = (
  store: StoreSaleInput,
  staffInputs: StaffInput[],
  period: PeriodInput,
): IncomeSummaryResult => {
  const P = {
    comm: 0,
    tip: 0,
    clean: 0,
    card: 0,
    salary: 0,
    total: 0,
    pay1: 0,
    pay2: 0,
    supplyShare: 0,
    salonComm: 0,
  };
  const staff: StaffPayoutRow[] = [];

  for (const s of staffInputs) {
    const c = s.comp;
    const commission = rdiv((s.serviceNet - s.supplyNet) * c.percentService, 100);
    const supplyShare = rdiv(s.supplyNet * c.percentService, 100);
    const salonCommSt = rdiv(s.serviceNet * (100 - c.percentService), 100);
    P.supplyShare += supplyShare;
    P.salonComm += salonCommSt;
    const cleanUp = s.checkedIn ? c.deductionPerDay : 0;
    const tip = s.tip;
    const effTip = c.enablePayrollTip ? 0 : tip;
    const isSalaried = c.compType === 'salary' || c.compType === 'commission_salary';
    const salaryDay = dailySalary(s, period);
    const salaryReport =
      c.compType === 'salary'
        ? salaryDay
        : c.compType === 'commission_salary'
          ? period.finalized
            ? salaryDay
            : salaryDay > commission
              ? salaryDay
              : 0
          : 0;
    const staffSalaryBase = isSalaried ? salaryDay : 0;
    const cardFee =
      c.cardFeeCommissionPct > 0 && c.compType === 'commission'
        ? rdiv(rdiv(s.cardBase * c.percentService, 100) * c.cardFeeCommissionPct, 100)
        : 0;
    const base = isSalaried ? staffSalaryBase : commission;
    const totalInc = base - cleanUp - cardFee + effTip;
    const pay1 = rdiv(base * c.pay1Split, 100) - cleanUp - (c.compType === 'commission' ? cardFee : 0);
    const pay2 = totalInc - pay1;
    P.comm += commission;
    // Staff Payout "Tip" is the EFFECTIVE tip (a staff with Exclude Tips ON has
    // their whole tip removed), matching report.rs / the app's Staff Payout Tip.
    P.tip += effTip;
    P.clean += cleanUp;
    P.card += cardFee;
    P.salary += salaryReport;
    P.total += totalInc;
    P.pay1 += pay1;
    P.pay2 += pay2;
    staff.push({
      staffId: s.staffId,
      name: s.name,
      percentService: c.percentService,
      compType: c.compType,
      serviceNet: s.serviceNet,
      supplyNet: s.supplyNet,
      commission,
      supplyShare,
      salonCommission: salonCommSt,
      tip: effTip,
      cleanUp,
      cardFee,
      salary: salaryReport,
      total: totalInc,
      pay1,
      pay2,
    });
  }

  const staffSupplyShare = P.supplyShare;
  const salonSupplyShare = store.supplyTotal - staffSupplyShare;
  const salonCommission = P.salonComm - salonSupplyShare;
  const totalService = store.serviceSale - store.serviceRefund;
  const netEarnings =
    salonCommission + store.productSale - store.productRefund - store.totalDiscount;
  const totalEarning = netEarnings + staffSupplyShare + P.clean - P.salary + P.card;

  return {
    serviceSale: store.serviceSale,
    serviceRefund: store.serviceRefund,
    productSale: store.productSale,
    productRefund: store.productRefund,
    giftCardSale: store.giftCardSale,
    totalDiscount: store.totalDiscount,
    totalService,
    supplyTotal: store.supplyTotal,
    staffSupplyShare,
    salonSupplyShare,
    commission: P.comm,
    payoutTip: P.tip,
    cleanUp: P.clean,
    cardCharge: P.card,
    salary: P.salary,
    payoutTotal: P.total,
    pay1: P.pay1,
    pay2: P.pay2,
    salonCommission,
    netEarnings,
    totalEarning,
    staff: staff.sort((x, y) => y.total - x.total),
  };
};
