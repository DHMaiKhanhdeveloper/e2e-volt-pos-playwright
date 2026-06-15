import { GraphQLClient } from '@api/clients/GraphQLClient';
import {
  DailyIncomeTotals,
  StaffDailyIncomeListLiveResponse,
  StaffDailyIncomeOrderRow,
  StaffDailyIncomeOrdersLiveResponse,
  StaffDailyIncomeRow,
  StoreDailyIncomeListResponse,
  StoreDailyIncomeLiveResponse,
  StoreDailyIncomeOrderRow,
  StoreDailyIncomeOrdersLiveResponse,
  StoreDailyIncomeRow,
} from '@api/models/Report';

const STORE_DAILY_INCOME_QUERY = `
  query storeDailyIncome($from: String, $to: String) {
    reportStoreDailyIncomeList(
      where: { date: { gte: $from, lte: $to } }
      orderBy: [{ date: desc }]
    ) {
      date
      dailySaleSale
      dailySaleTip
      dailySalePaymentCash
      dailySalePaymentCard
      dailySalePaymentOthers
      dailySalePaymentGiftCardRedemption
      dailySalePaymentAmountCollected
      dailySaleTotalPayment
      incomeTaxAmount
      incomeTotalPayment
      paymentTaxCard
      paymentTaxCash
      paymentTaxOthers
      paymentTaxGiftCardRedemption
      saleIncomeTaxAmount
      saleIncomeTotalPayment
    }
  }
`;

const STORE_DAILY_INCOME_LIVE_QUERY = `
  query storeDailyIncomeLive($reportDate: String!) {
    storeDailyIncomeLive(reportDate: $reportDate) {
      date
      dailySaleSale
      dailySaleTip
      dailySalePaymentCash
      dailySalePaymentCard
      dailySalePaymentOthers
      dailySalePaymentGiftCardRedemption
      dailySalePaymentAmountCollected
      dailySaleTotalPayment
      incomeTaxAmount
      incomeTotalPayment
      paymentTaxCard
      paymentTaxCash
      paymentTaxOthers
      paymentTaxGiftCardRedemption
      saleIncomeTaxAmount
      saleIncomeTotalPayment
    }
  }
`;

/**
 * The three per-row "live" reports below have NO settled-snapshot variant in
 * the app — they are real-time and only meaningful for *today*. Each takes the
 * same `reportDate` (a full RFC3339 timestamp = start of merchant-local day).
 */
const STORE_DAILY_INCOME_ORDERS_LIVE_QUERY = `
  query storeDailyIncomeOrdersLive($reportDate: String!) {
    storeDailyIncomeOrdersLive(reportDate: $reportDate) {
      id
      orderId
      saleAmount
      refundAmount
      tipAmount
      giftCardSaleRedemptionAmount
      taxAmount
      total
      transactionType
      reportDate
      occurredAt
      orderCode
    }
  }
`;

const STAFF_DAILY_INCOME_LIST_LIVE_QUERY = `
  query staffDailyIncomeListLive($reportDate: String!) {
    staffDailyIncomeListLive(reportDate: $reportDate) {
      staffId
      date
      numberOfOrders
      sale
      refund
      subtotal
      supplyFee
      staffCommission
      cleanUpFee
      tip
      totalIncome
      staffSalary
      rate
      compensationType
      salarySetting
    }
  }
`;

const STAFF_DAILY_INCOME_ORDERS_LIVE_QUERY = `
  query staffDailyIncomeOrdersLive($reportDate: String!) {
    staffDailyIncomeOrdersLive(reportDate: $reportDate) {
      id
      orderId
      staffId
      reportDate
      saleAmount
      refundAmount
      supplyFee
      tipAmount
      transactionType
      occurredAt
      orderCode
    }
  }
`;

const isSameLocalDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDayIso = (d: Date): string => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};

const endOfDayIso = (d: Date): string => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
};

/**
 * GraphQL service for the Daily Sale Report.
 *
 * Today vs past behaves differently in the app:
 *  - Today  → `storeDailyIncomeLive` (real-time, not yet settled)
 *  - Past   → `reportStoreDailyIncomeList` (settled snapshot)
 *
 * `getDailyIncome` auto-picks the right query so tests don't have to.
 */
export class ReportService {
  constructor(private readonly client: GraphQLClient) {}

  /** Fetches a single day's income row. Returns `null` if no data exists for that day. */
  async getDailyIncome(date: Date = new Date()): Promise<StoreDailyIncomeRow | null> {
    if (isSameLocalDay(date, new Date())) {
      const data = await this.client.query<StoreDailyIncomeLiveResponse>(
        STORE_DAILY_INCOME_LIVE_QUERY,
        {
          operationName: 'storeDailyIncomeLive',
          // `reportDate` must be a full RFC3339 timestamp (the backend rejects a
          // bare `YYYY-MM-DD`). The app sends start-of-merchant-local-day in UTC,
          // which is exactly what `startOfDayIso` yields.
          variables: { reportDate: startOfDayIso(date) },
        },
      );
      return data.storeDailyIncomeLive;
    }

    const data = await this.client.query<StoreDailyIncomeListResponse>(STORE_DAILY_INCOME_QUERY, {
      operationName: 'storeDailyIncome',
      variables: { from: startOfDayIso(date), to: endOfDayIso(date) },
    });
    return data.reportStoreDailyIncomeList[0] ?? null;
  }

  /**
   * Per-order breakdown for the store's day (`storeDailyIncomeOrdersLive`).
   * Live-only — pass today (the default) for meaningful data. Newest first.
   */
  async getDailyIncomeOrders(date: Date = new Date()): Promise<StoreDailyIncomeOrderRow[]> {
    const data = await this.client.query<StoreDailyIncomeOrdersLiveResponse>(
      STORE_DAILY_INCOME_ORDERS_LIVE_QUERY,
      {
        operationName: 'storeDailyIncomeOrdersLive',
        variables: { reportDate: startOfDayIso(date) },
      },
    );
    return data.storeDailyIncomeOrdersLive;
  }

  /** Per-staff income for the day (`staffDailyIncomeListLive`). Live-only. */
  async getStaffDailyIncomeList(date: Date = new Date()): Promise<StaffDailyIncomeRow[]> {
    const data = await this.client.query<StaffDailyIncomeListLiveResponse>(
      STAFF_DAILY_INCOME_LIST_LIVE_QUERY,
      {
        operationName: 'staffDailyIncomeListLive',
        variables: { reportDate: startOfDayIso(date) },
      },
    );
    return data.staffDailyIncomeListLive;
  }

  /** Per-staff per-order lines for the day (`staffDailyIncomeOrdersLive`). Live-only. */
  async getStaffDailyIncomeOrders(date: Date = new Date()): Promise<StaffDailyIncomeOrderRow[]> {
    const data = await this.client.query<StaffDailyIncomeOrdersLiveResponse>(
      STAFF_DAILY_INCOME_ORDERS_LIVE_QUERY,
      {
        operationName: 'staffDailyIncomeOrdersLive',
        variables: { reportDate: startOfDayIso(date) },
      },
    );
    return data.staffDailyIncomeOrdersLive;
  }

  /**
   * Derives the totals the UI is expected to display, from a raw row.
   * Use this to compute expected values then assert UI matches — see TC-19, 20, 21.
   */
  computeTotals(row: StoreDailyIncomeRow): DailyIncomeTotals {
    const incomeSale = row.dailySaleSale;
    const incomeTip = row.dailySaleTip;
    const incomeTaxCollected = row.incomeTaxAmount;
    const incomeTotalPayment = incomeSale + incomeTip + incomeTaxCollected;

    const paymentCard = row.dailySalePaymentCard;
    const paymentCash = row.dailySalePaymentCash;
    const paymentOthers = row.dailySalePaymentOthers;
    const paymentAmountCollected = paymentCard + paymentCash + paymentOthers;
    const paymentGiftCardRedemption = row.dailySalePaymentGiftCardRedemption;
    const paymentTotalPayment = paymentAmountCollected + paymentGiftCardRedemption;

    return {
      incomeSale,
      incomeTip,
      incomeTaxCollected,
      incomeTotalPayment,
      paymentCard,
      paymentCash,
      paymentOthers,
      paymentAmountCollected,
      paymentGiftCardRedemption,
      paymentTotalPayment,
    };
  }
}
