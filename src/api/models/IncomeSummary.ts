/**
 * Volt POS — Income Summary report types.
 *
 * All money values are integer **cents** (volt-pos rule: amounts stored as
 * integer cents). Mirrors the `storeIncomeSummary` / `storeIncomeSummaryLive`
 * fragments used by `/incomes/income-summary` (captured from the live GraphQL
 * `getIncomeSummaryDetail(Live)` operation).
 *
 * The Income Summary detail panel groups these fields into five sections:
 *   Payment Details · Sale Details · Supply Fee · Staff Payout · Salon Earnings
 */
export interface IncomeSummaryDetailRow {
  // ---- Payment Details ----
  incomeSummaryTotalPayment: number;
  incomeSummaryPaymentAmountCollected: number;

  incomeSummaryPaymentTotalCash: number;
  incomeSummaryPaymentCashSale: number;
  incomeSummaryPaymentCashRefund: number;
  incomeSummaryPaymentCashTip: number;

  incomeSummaryPaymentTotalCard: number;
  incomeSummaryPaymentCardSale: number;
  incomeSummaryPaymentCardRefund: number;
  incomeSummaryPaymentCardTip: number;

  incomeSummaryPaymentTotalOthers: number;
  incomeSummaryPaymentOthersSale: number;
  incomeSummaryPaymentOthersRefund: number;
  incomeSummaryPaymentOthersTip: number;

  incomeSummaryPaymentGiftCardSale: number;
  incomeSummaryPaymentGiftCardRedemption: number;
  incomeSummaryPaymentGiftCardTip: number;

  incomeTotalPayment: number;
  paymentTaxCard: number;
  paymentTaxCash: number;
  paymentTaxOthers: number;
  paymentTaxGiftCardRedemption: number;

  // ---- Sale Details ----
  incomeServiceSale: number;
  incomeProductSale: number;
  incomeGiftCardSale: number;
  incomeTotalSale: number;
  incomeServiceRefund: number;
  incomeProductRefund: number;
  incomeTotalRefund: number;
  incomeSubtotal: number;
  incomeDiscount: number;
  incomeDiscountReversed: number;
  incomeTotalDiscount: number;
  incomeNetTotal: number;
  incomeTip: number;
  incomeNet: number;
  incomeTaxAmount: number;
  saleIncomeTotalPayment: number;

  // ---- Supply Fee ----
  supplyFeeTotal: number;
  supplyFeeStaffShare: number;
  supplyFeeSalonShare: number;

  // ---- Staff Payout ----
  staffPayoutTotalService: number;
  staffPayoutSupplyShare: number;
  staffPayoutCommission: number;
  staffPayoutTip: number;
  staffPayoutCleanUpFee: number;
  staffPayoutSalary: number;
  staffPayoutTotal: number;
  staffPayoutPay1: number;
  staffPayoutPay2: number;

  // ---- Salon Earnings ----
  salonEarningsTotalService: number;
  salonEarningsSupplyShare: number;
  salonEarningsCommission: number;
  salonEarningsProductSale: number;
  salonEarningsProductRefund: number;
  salonEarningsDiscount: number;
  salonEarningsDiscountReversed: number;
  salonEarningsTotalDiscount: number;
  salonEarningsNet: number;
  salonEarningsStaffSupplyShare: number;
  salonEarningsCleanUpFee: number;
  salonEarningsStaffSalary: number;
  salonEarningsTotal: number;
}

/** One row of the Income Summary overview table (`Date | Sale | Tip | Tax | Total Payment`). */
export interface IncomeSummaryOverviewRow {
  date: string;
  dailySaleSale: number;
  incomeTotalSale: number;
  incomeDiscount: number;
  incomeSubtotal: number;
  incomeTotalDiscount: number;
  incomeSummaryTotalPayment: number;
  incomeNet: number;
  incomeNetTotal: number;
  incomeTip: number;
  incomeTaxAmount: number;
  incomeSummaryPaymentAmountCollected: number;
}

export interface IncomeSummaryDetailLiveResponse {
  storeDailyIncomeLive: IncomeSummaryDetailRow | null;
}

export interface IncomeSummaryDetailListResponse {
  reportStoreDailyIncomeList: IncomeSummaryDetailRow[];
}

export interface IncomeSummaryOverviewLiveResponse {
  storeDailyIncomeLive: IncomeSummaryOverviewRow | null;
}

export interface IncomeSummaryOverviewListResponse {
  reportStoreDailyIncomeList: IncomeSummaryOverviewRow[];
}
