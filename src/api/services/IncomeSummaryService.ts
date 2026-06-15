import { GraphQLClient } from '@api/clients/GraphQLClient';
import {
  IncomeSummaryDetailLiveResponse,
  IncomeSummaryDetailListResponse,
  IncomeSummaryDetailRow,
  IncomeSummaryOverviewLiveResponse,
  IncomeSummaryOverviewListResponse,
  IncomeSummaryOverviewRow,
} from '@api/models/IncomeSummary';

/** Field set shared by the live & settled detail fragments (captured from the app). */
const DETAIL_FIELDS = `
  incomeSummaryTotalPayment
  incomeSummaryPaymentAmountCollected
  incomeSummaryPaymentTotalCash
  incomeSummaryPaymentCashSale
  incomeSummaryPaymentCashRefund
  incomeSummaryPaymentCashTip
  incomeSummaryPaymentTotalCard
  incomeSummaryPaymentCardSale
  incomeSummaryPaymentCardRefund
  incomeSummaryPaymentCardTip
  incomeSummaryPaymentTotalOthers
  incomeSummaryPaymentOthersSale
  incomeSummaryPaymentOthersRefund
  incomeSummaryPaymentOthersTip
  incomeSummaryPaymentGiftCardSale
  incomeSummaryPaymentGiftCardRedemption
  incomeSummaryPaymentGiftCardTip
  incomeTotalPayment
  paymentTaxCard
  paymentTaxCash
  paymentTaxOthers
  paymentTaxGiftCardRedemption
  incomeServiceSale
  incomeProductSale
  incomeGiftCardSale
  incomeTotalSale
  incomeServiceRefund
  incomeProductRefund
  incomeTotalRefund
  incomeSubtotal
  incomeDiscount
  incomeDiscountReversed
  incomeTotalDiscount
  incomeNetTotal
  incomeTip
  incomeNet
  incomeTaxAmount
  saleIncomeTotalPayment
  supplyFeeTotal
  supplyFeeStaffShare
  supplyFeeSalonShare
  staffPayoutTotalService
  staffPayoutSupplyShare
  staffPayoutCommission
  staffPayoutTip
  staffPayoutCleanUpFee
  staffPayoutSalary
  staffPayoutTotal
  staffPayoutPay1
  staffPayoutPay2
  salonEarningsTotalService
  salonEarningsSupplyShare
  salonEarningsCommission
  salonEarningsProductSale
  salonEarningsProductRefund
  salonEarningsDiscount
  salonEarningsDiscountReversed
  salonEarningsTotalDiscount
  salonEarningsNet
  salonEarningsStaffSupplyShare
  salonEarningsCleanUpFee
  salonEarningsStaffSalary
  salonEarningsTotal
`;

const OVERVIEW_FIELDS = `
  date
  dailySaleSale
  incomeTotalSale
  incomeDiscount
  incomeSubtotal
  incomeTotalDiscount
  incomeSummaryTotalPayment
  incomeNet
  incomeNetTotal
  incomeTip
  incomeTaxAmount
  incomeSummaryPaymentAmountCollected
`;

const DETAIL_LIVE_QUERY = `
  query getIncomeSummaryDetailLive($reportDate: String!) {
    storeDailyIncomeLive(reportDate: $reportDate) { ${DETAIL_FIELDS} }
  }
`;

const DETAIL_LIST_QUERY = `
  query getIncomeSummaryDetail($from: String, $to: String) {
    reportStoreDailyIncomeList(where: { date: { gte: $from, lte: $to } }, orderBy: [{ date: desc }]) {
      ${DETAIL_FIELDS}
    }
  }
`;

const OVERVIEW_LIVE_QUERY = `
  query getIncomeSummaryLive($reportDate: String!) {
    storeDailyIncomeLive(reportDate: $reportDate) { ${OVERVIEW_FIELDS} }
  }
`;

const OVERVIEW_LIST_QUERY = `
  query getIncomeSummary($from: String, $to: String) {
    reportStoreDailyIncomeList(where: { date: { gte: $from, lte: $to } }, orderBy: [{ date: desc }]) {
      ${OVERVIEW_FIELDS}
    }
  }
`;

/**
 * Volt POS runs in the merchant timezone (`Asia/Ho_Chi_Minh`, UTC+7, no DST) —
 * see `playwright.config.ts` `use.timezoneId`. The live report keys on a precise
 * `reportDate` = merchant midnight, so we MUST send the merchant-local day, not
 * the test runner's machine-local day (CI nodes are frequently UTC/US), or the
 * 24h window slides and returns a different/partial day's data.
 */
const MERCHANT_TZ = 'Asia/Ho_Chi_Minh';
const MERCHANT_OFFSET = '+07:00';

/** The merchant-local calendar date (YYYY-MM-DD) for an instant. */
const merchantYmd = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: MERCHANT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

const isSameLocalDay = (a: Date, b: Date): boolean => merchantYmd(a) === merchantYmd(b);

/** Merchant midnight as an offset-qualified ISO, e.g. `2026-06-15T00:00:00+07:00`. */
const startOfDayIso = (d: Date): string => `${merchantYmd(d)}T00:00:00${MERCHANT_OFFSET}`;

/** The settled-range query filters on a `date` column by bare merchant calendar date. */
const dayKey = (d: Date): string => merchantYmd(d);

/**
 * GraphQL service for the Income Summary report. Like the Daily Sale Report,
 * "today" reads the live (un-settled) row and past days read the settled
 * snapshot — `getDetail` / `getOverview` pick the right query automatically.
 */
export class IncomeSummaryService {
  constructor(private readonly client: GraphQLClient) {}

  /** Full detail row (all 5 sections) for a single day. `null` if no data. */
  async getDetail(date: Date = new Date()): Promise<IncomeSummaryDetailRow | null> {
    if (isSameLocalDay(date, new Date())) {
      const data = await this.client.query<IncomeSummaryDetailLiveResponse>(DETAIL_LIVE_QUERY, {
        operationName: 'getIncomeSummaryDetailLive',
        variables: { reportDate: startOfDayIso(date) },
      });
      return data.storeDailyIncomeLive;
    }
    const data = await this.client.query<IncomeSummaryDetailListResponse>(DETAIL_LIST_QUERY, {
      operationName: 'getIncomeSummaryDetail',
      variables: { from: dayKey(date), to: dayKey(date) },
    });
    return data.reportStoreDailyIncomeList[0] ?? null;
  }

  /** Overview row (table-level Sale/Tip/Tax/Total Payment) for a single day. */
  async getOverview(date: Date = new Date()): Promise<IncomeSummaryOverviewRow | null> {
    if (isSameLocalDay(date, new Date())) {
      const data = await this.client.query<IncomeSummaryOverviewLiveResponse>(OVERVIEW_LIVE_QUERY, {
        operationName: 'getIncomeSummaryLive',
        variables: { reportDate: startOfDayIso(date) },
      });
      return data.storeDailyIncomeLive;
    }
    const data = await this.client.query<IncomeSummaryOverviewListResponse>(OVERVIEW_LIST_QUERY, {
      operationName: 'getIncomeSummary',
      variables: { from: dayKey(date), to: dayKey(date) },
    });
    return data.reportStoreDailyIncomeList[0] ?? null;
  }

  /**
   * Find the most recent SETTLED past day that has data. Past days are
   * immutable, so their detail matches the UI exactly — unlike "today", whose
   * live totals drift while orders are still being taken. Calculation tests
   * should anchor on this instead of today.
   */
  async findRecentDetailDay(
    maxDaysBack = 30,
  ): Promise<{ date: Date; row: IncomeSummaryDetailRow } | null> {
    for (let i = 1; i <= maxDaysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const row = await this.getDetail(date);
      if (row && row.incomeSummaryTotalPayment !== 0) return { date, row };
    }
    return null;
  }

  /** Overview rows across a date range (one per settled day), newest first. */
  async getOverviewRange(from: Date, to: Date): Promise<IncomeSummaryOverviewRow[]> {
    const data = await this.client.query<IncomeSummaryOverviewListResponse>(OVERVIEW_LIST_QUERY, {
      operationName: 'getIncomeSummary',
      variables: { from: dayKey(from), to: dayKey(to) },
    });
    return data.reportStoreDailyIncomeList;
  }
}
