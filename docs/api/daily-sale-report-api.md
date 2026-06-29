# Daily Sale Report — API Reference

Screen: **`/incomes/income-daily`** · Source: `volt-pos/src/routes/_app/incomes/income-daily/`

GraphQL defined in [`-shared/income-daily.gql.ts`]; invoked by
[`-shared/use-income-daily.ts`]. Single-day report (one date at a time).

---

## Operations overview

| Operation                             | Type  | Used when                                    | Key arg                                                 |
| ------------------------------------- | ----- | -------------------------------------------- | ------------------------------------------------------- |
| `storeDailyIncomeLive`                | query | Selected date **is today**                   | `reportDate` (RFC3339), `fromUTC`                       |
| `storeDailyIncome`                    | query | Selected date **is a past day**              | `from`/`to` (`YYYY-MM-DD`), `fromUTC`/`toUTC` (RFC3339) |
| `getOrderDetails`                     | query | Clicking an order row (Order Details dialog) | `id` (orderId)                                          |
| `transactionByPk` / `transactionList` | query | Card/transaction info in order detail        | `id` / `ids`                                            |

The current row is `liveData.storeDailyIncomeLive` (today) or
`currentData.reportStoreDailyIncomeList[0]` (past). The **previous** day is
always fetched via `storeDailyIncome` for the `%vs Yesterday` comparison.

---

## 1. `storeDailyIncome` (settled / past day)

```graphql
query storeDailyIncome($from: String, $to: String, $fromUTC: String, $toUTC: String) {
  reportStoreDailyIncomeList(where: { date: { gte: $from, lte: $to } }, orderBy: [{ date: desc }]) {
    ...storeDailyIncome
    incomeTaxAmount
    incomeTotalPayment
    paymentTaxCard
    paymentTaxCash
    paymentTaxOthers
    paymentTaxGiftCardRedemption
    saleIncomeTaxAmount
    saleIncomeTotalPayment
    salonEarningsTaxAmount
  }
  reportStoreDailyIncomeOrderList(where: { reportDate: { gte: $from, lte: $to } }, orderBy: [{ reportDate: desc }]) {
    ...storeDailyIncomeOrder
  }
  orderList(where: { _and: [
    { completedAt: { gte: $fromUTC, lte: $toUTC } }
    { reportOrderStatusTrackingListById: { status: { eq: "successful" } } }
    { _not: { reportOrderStatusTrackingListById: { status: { eq: "canceled" } } } }
  ] }) { ...orderListDaily taxAmount }
  orderAggregate(where: { /* same filter */ }) { aggregate { count } }
}
```

**Variables** (from `use-income-daily.ts`):

- `from`, `to` — merchant-local date `YYYY-MM-DD` (via `formatDateRangeToISO`).
- `fromUTC`, `toUTC` — RFC3339 UTC bounds of the merchant day (via `dateRangeToUTCTimezone`).

**Returns:** the settled income row (`reportStoreDailyIncomeList[0]`), the
per-order rows (`reportStoreDailyIncomeOrderList`), and a count of orders
created in the window (`orderAggregate`, excludes canceled).

---

## 2. `storeDailyIncomeLive` (today, unsettled)

```graphql
query storeDailyIncomeLive($reportDate: String!, $fromUTC: String) {
  storeDailyIncomeLive(reportDate: $reportDate) { ...storeDailyIncomeLive }
  storeDailyIncomeOrdersLive(reportDate: $reportDate) { ...storeDailyIncomeOrderLive taxAmount }
  orderList(where: { _and: [
    { completedAt: { gte: $fromUTC } }
    { reportOrderStatusTrackingListById: { status: { eq: "successful" } } }
    { _not: { reportOrderStatusTrackingListById: { status: { eq: "canceled" } } } }
  ] }) { ...orderListDaily taxAmount }
  orderAggregate(where: { /* same filter */ }) { aggregate { count } }
}
```

**Variables:**

- `reportDate` — **RFC3339** start-of-merchant-day in UTC (e.g. `2026-06-09T17:00:00+00:00`). Required.
- `fromUTC` — same instant; lower bound for live order list.

> Note: for an unsettled day, per-order **tax** is folded into Sale and the
> aggregate `incomeTaxAmount` stays 0 until settlement — tax only itemizes on
> settled days (drives the e2e read-only tax test against a past day).

---

## 3. Income-row fields (`ReportStoreDailyIncome` / `StoreDailyIncomeLive`)

`fragment storeDailyIncome` + `storeDailyIncomeLive` share these fields:

| Field                                                                                     | Meaning                             |
| ----------------------------------------------------------------------------------------- | ----------------------------------- |
| `date`                                                                                    | Report date                         |
| `currencyCode`, `id`, `createdAt`, `updatedAt`                                            | (settled only) metadata             |
| `dailySaleSale`                                                                           | Sale (Income Detail)                |
| `dailySaleTip`                                                                            | Tip                                 |
| `dailySalePaymentCash`                                                                    | Payment — Cash                      |
| `dailySalePaymentCard`                                                                    | Payment — Card                      |
| `dailySalePaymentOthers`                                                                  | Payment — Others                    |
| `dailySalePaymentGiftCardRedemption`                                                      | Gift Card Redemption                |
| `dailySalePaymentAmountCollected`                                                         | Amount Collected (Card+Cash+Others) |
| `dailySaleTotalPayment`                                                                   | Total Payment                       |
| `incomeTaxAmount`                                                                         | Tax Collected (Income Detail)       |
| `incomeTotalPayment`                                                                      | Income Detail Total Payment         |
| `paymentTaxCard` / `paymentTaxCash` / `paymentTaxOthers` / `paymentTaxGiftCardRedemption` | Tax per tender                      |
| `saleIncomeTaxAmount` / `saleIncomeTotalPayment`                                          | Sale-side tax / total               |
| `salonEarningsTaxAmount`                                                                  | Salon earnings tax                  |

### Per-order rows

`fragment storeDailyIncomeOrder` (settled) / `storeDailyIncomeOrderLive` (live):
`id, orderId, saleAmount, refundAmount, tipAmount, giftCardSaleRedemptionAmount,
total, transactionType, reportDate, occurredAt, taxAmount` (settled embeds
`order { ...orderDetails }`; live adds `orderCode`).

`fragment orderListDaily on Order { id createdAt settled status }`.

---

## 4. Order Details dialog — `getOrderDetails`

Clicking an order row opens the Order Details dialog (sets `?orderId=`).
Source: `volt-pos/src/shared/graphql/order.gql.ts`.

```graphql
query getOrderDetails($id: String!) {
  orderByPk(id: $id) {
    ...orderDetails
  }
}
```

`fragment orderDetails on Order` is large — key parts: `orderCode, subtotal,
taxAmount, total, tipAmount, totalDiscount, status, settled, customer {…},
orderItemListById { ...orderItem }, orderTransactionListById { ...orderTransaction },
giftCardHistoryListById { ...giftCardHistory }`.

Supporting transaction queries: `transactionByPk($id)` and
`transactionList($ids)` (card last-four / batch info).

---

## Field → UI map (reconciliation)

| UI label (Income/Payment Details) | GraphQL field                                |
| --------------------------------- | -------------------------------------------- |
| Income · Sale                     | `dailySaleSale`                              |
| Income · Tip                      | `dailySaleTip`                               |
| Income · Tax Collected            | `incomeTaxAmount`                            |
| Income · Total Payment            | `incomeTotalPayment` (= Sale+Tip+Tax)        |
| Payment · Card / Cash / Others    | `dailySalePaymentCard` / `…Cash` / `…Others` |
| Payment · Amount Collected        | `dailySalePaymentAmountCollected`            |
| Payment · Gift Card Redemption    | `dailySalePaymentGiftCardRedemption`         |
| Payment · Total Payment           | `dailySaleTotalPayment`                      |
