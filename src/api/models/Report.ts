/**
 * Volt POS — Daily Sale Report types.
 *
 * All money values are integer **cents** (matches the volt-pos rule:
 * `All amounts stored as integer cents`).
 *
 * Mirrors fragments `storeDailyIncome` / `storeDailyIncomeLive` in
 * `volt-pos/src/routes/_app/incomes/income-daily/-shared/income-daily.gql.ts`.
 */
export interface StoreDailyIncomeRow {
  date: string;
  dailySaleSale: number;
  dailySaleTip: number;
  dailySalePaymentCash: number;
  dailySalePaymentCard: number;
  dailySalePaymentOthers: number;
  dailySalePaymentGiftCardRedemption: number;
  dailySalePaymentAmountCollected: number;
  dailySaleTotalPayment: number;
  incomeTaxAmount: number;
  incomeTotalPayment: number;
  paymentTaxCard: number;
  paymentTaxCash: number;
  paymentTaxOthers: number;
  paymentTaxGiftCardRedemption: number;
  saleIncomeTaxAmount: number;
  saleIncomeTotalPayment: number;
}

export interface StoreDailyIncomeListResponse {
  reportStoreDailyIncomeList: StoreDailyIncomeRow[];
}

export interface StoreDailyIncomeLiveResponse {
  storeDailyIncomeLive: StoreDailyIncomeRow | null;
}

/**
 * One row from `storeDailyIncomeOrdersLive` — the per-order breakdown of the
 * store's day. Each order contributes a `sale` row and/or a `refund` row; the
 * backend guarantees `total = saleAmount + refundAmount + taxAmount + tipAmount`
 * with exactly one of sale/refund being non-zero per row (see
 * `query_live_income_orders` in volt-pos `report.rs`).
 */
export interface StoreDailyIncomeOrderRow {
  id: string;
  orderId: string;
  saleAmount: number;
  refundAmount: number;
  tipAmount: number;
  giftCardSaleRedemptionAmount: number;
  taxAmount: number;
  total: number;
  transactionType: 'sale' | 'refund';
  reportDate: string;
  occurredAt: string;
  orderCode: string | null;
}

export interface StoreDailyIncomeOrdersLiveResponse {
  storeDailyIncomeOrdersLive: StoreDailyIncomeOrderRow[];
}

/** One staff member's income for the day (`staffDailyIncomeListLive`). */
export interface StaffDailyIncomeRow {
  staffId: string;
  date: string;
  numberOfOrders: number;
  sale: number;
  refund: number;
  subtotal: number;
  supplyFee: number;
  staffCommission: number;
  cleanUpFee: number;
  tip: number;
  totalIncome: number;
  staffSalary: number;
  rate: number;
  /** `commission` | `salary` | `commission_salary` */
  compensationType: string;
  /** `salary_by_period` | `wage_per_day` | `wage_per_hour` */
  salarySetting: string;
}

export interface StaffDailyIncomeListLiveResponse {
  staffDailyIncomeListLive: StaffDailyIncomeRow[];
}

/** One staff member's per-order line (`staffDailyIncomeOrdersLive`). */
export interface StaffDailyIncomeOrderRow {
  id: string;
  orderId: string;
  staffId: string;
  reportDate: string;
  saleAmount: number;
  refundAmount: number;
  supplyFee: number;
  tipAmount: number;
  transactionType: 'sale' | 'refund';
  occurredAt: string;
  orderCode: string | null;
}

export interface StaffDailyIncomeOrdersLiveResponse {
  staffDailyIncomeOrdersLive: StaffDailyIncomeOrderRow[];
}

/**
 * Derived totals used in assertions. Matches the formulas the UI is
 * expected to satisfy (see TC-19, 20, 21 in
 * `docs/test-cases/VP-1048-daily-sale-report-test-cases.md`).
 */
export interface DailyIncomeTotals {
  incomeSale: number;
  incomeTip: number;
  incomeTaxCollected: number;
  /** Income Detail: Sale + Tip + Tax Collected */
  incomeTotalPayment: number;

  paymentCard: number;
  paymentCash: number;
  paymentOthers: number;
  /** Card + Cash + Others — excludes Gift Card */
  paymentAmountCollected: number;
  paymentGiftCardRedemption: number;
  /** Payment Detail: Amount Collected + Gift Card Redemption */
  paymentTotalPayment: number;
}
