# Income Summary — API Reference

Screen: **`/incomes/income-summary`** · Source: `volt-pos/src/routes/_app/incomes/income-summary/`

Range-based report grouped by Day/Week/Month, with a per-period **detail panel**.
Two GraphQL definition files:

- Overview (table + chart + total): [`-shared/income-summary.gql.ts`] via [`-shared/use-income-summary.ts`]
- Detail panel (right side): [`-income-summary-detail/income-summary-detail.gql.ts`] via [`-income-summary-detail/use-income-summary-detail.ts`]

---

## Operations overview

| Operation                    | Type  | Scope        | Used when                | Key arg                    |
| ---------------------------- | ----- | ------------ | ------------------------ | -------------------------- |
| `getIncomeSummary`           | query | Overview     | past days in range       | `from`/`to` (`YYYY-MM-DD`) |
| `getIncomeSummaryLive`       | query | Overview     | range includes today     | `reportDate` (RFC3339)     |
| `getIncomeSummaryDetail`     | query | Detail panel | selected period is past  | `from`/`to` (`YYYY-MM-DD`) |
| `getIncomeSummaryDetailLive` | query | Detail panel | selected period is today | `reportDate` (RFC3339)     |

All four select from `reportStoreDailyIncomeList` (settled) or
`storeDailyIncomeLive` (today). The overview also fetches the **previous
period** via `getIncomeSummary` for the comparison %, and **merges** the live
today-row into the settled rows when the range ends today.

---

## 1. Overview — `getIncomeSummary` / `getIncomeSummaryLive`

```graphql
query getIncomeSummary($from: String, $to: String) {
  reportStoreDailyIncomeList(where: { date: { gte: $from, lte: $to } }, orderBy: [{ date: desc }]) {
    ...storeIncomeSummaryOverview
  }
}

query getIncomeSummaryLive($reportDate: String!) {
  storeDailyIncomeLive(reportDate: $reportDate) {
    ...storeIncomeSummaryOverviewLive
  }
}
```

`fragment storeIncomeSummaryOverview(Live)` — drives the table & chart:

| Field                                   | UI                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `date`                                  | Period date                                                                   |
| `dailySaleSale`                         | (raw sale)                                                                    |
| `incomeTotalSale`                       | Total Sale; **summed → Total Income** (`INCOME_SUMMARY_DATA_KEYS.TOTAL_SALE`) |
| `incomeDiscount`, `incomeTotalDiscount` | Discounts                                                                     |
| `incomeSubtotal`                        | Subtotal                                                                      |
| `incomeNet`, `incomeNetTotal`           | Net / Net Total                                                               |
| `incomeSummaryTotalPayment`             | Table **Total Payment** column                                                |
| `incomeTip`                             | Table **Tip** column                                                          |
| `incomeTaxAmount`                       | Table **Tax** column                                                          |
| `incomeSummaryPaymentAmountCollected`   | Amount Collected                                                              |

Table columns: `Date | Sale | Tip | Tax | Total Payment` (the old **Net Income**
column was replaced by **Tax** — VP-1048 AC5).

---

## 2. Detail panel — `getIncomeSummaryDetail` / `getIncomeSummaryDetailLive`

```graphql
query getIncomeSummaryDetail($from: String, $to: String) {
  reportStoreDailyIncomeList(where: { date: { gte: $from, lte: $to } }, orderBy: [{ date: desc }]) {
    ...storeIncomeSummary
  }
}

query getIncomeSummaryDetailLive($reportDate: String!) {
  storeDailyIncomeLive(reportDate: $reportDate) {
    ...storeIncomeSummaryLive
  }
}
```

Fires when a table row is clicked (URL gains `detailId=<from>-<to>`). The
`fragment storeIncomeSummary(Live)` returns **5 grouped blocks**:

### Payment Details

`incomeSummaryTotalPayment`, `incomeSummaryPaymentAmountCollected`,
`incomeSummaryPaymentTotalCash` (+ `CashSale`/`CashRefund`/`CashTip`),
`incomeSummaryPaymentTotalCard` (+ `CardSale`/`CardRefund`/`CardTip`),
`incomeSummaryPaymentTotalOthers` (+ `OthersSale`/`OthersRefund`/`OthersTip`),
`incomeSummaryPaymentGiftCardSale`, `incomeSummaryPaymentGiftCardRedemption`,
`incomeSummaryPaymentGiftCardTip`, `incomeTotalPayment`,
`paymentTaxCash`/`paymentTaxCard`/`paymentTaxOthers`/`paymentTaxGiftCardRedemption`.

### Sale Details

`incomeServiceSale`, `incomeProductSale`, `incomeGiftCardSale`,
`incomeTotalSale`, `incomeServiceRefund`, `incomeProductRefund`,
`incomeTotalRefund`, `incomeSubtotal`, `incomeDiscount`,
`incomeDiscountReversed`, `incomeTotalDiscount`, `incomeNetTotal`, `incomeTip`,
`incomeNet`, `incomeTaxAmount`, `saleIncomeTotalPayment`.

### Supply Fee

`supplyFeeTotal`, `supplyFeeStaffShare`, `supplyFeeSalonShare`.

### Staff Payout

`staffPayoutTotalService`, `staffPayoutSupplyShare`, `staffPayoutCommission`,
`staffPayoutTip`, `staffPayoutCleanUpFee`, `staffPayoutSalary`,
`staffPayoutTotal`, `staffPayoutPay1`, `staffPayoutPay2`.

### Salon Earnings

`salonEarningsTotalService`, `salonEarningsSupplyShare`,
`salonEarningsCommission`, `salonEarningsProductSale`,
`salonEarningsProductRefund`, `salonEarningsDiscount`,
`salonEarningsDiscountReversed`, `salonEarningsTotalDiscount`,
`salonEarningsNet`, `salonEarningsStaffSupplyShare`,
`salonEarningsCleanUpFee`, `salonEarningsStaffSalary`, `salonEarningsTotal`.

---

## 3. Filter / grouping behavior (`use-income-summary.ts`)

- **Group By** (`?groupBy=`): `day` | `week` | `month` (`GROUP_BY_OPTIONS`).
  Switching to Day → range = **Last 30 Days**; Week/Month → range = the
  **selected year** (`startOfYear`→`endOfYear`).
- **Row click** → `detailId = <fromUnix>-<toUnix>` (`getSummaryDetailId`).
- Aggregation across the range is client-side (`aggregateByGrouping`).

### Comparison label (`PRESET_COMPARISON_LABELS`)

The "vs." label depends on the matched preset, **not** simply Day/Week/Month:

| Preset            | Label                |
| ----------------- | -------------------- |
| Today / Yesterday | `Same day last week` |
| This Week         | `Last week`          |
| Last Week         | `Week before last`   |
| This Month        | `Last month`         |
| Last Month        | `Month before last`  |
| This Year         | `Last year`          |
| Last Year         | `Year before last`   |
| Last 7 Days       | `Previous 7 days`    |
| Last 30 Days      | `Previous 30 days`   |
| Custom            | `Previous period`    |

% change = `calculatePercentageChange(totalIncome, totalIncomePrevious)`, where
`totalIncome = Σ incomeTotalSale` over the aggregated current rows.

---

## Notes for automation

- Detail sections render **`$0.00` placeholders** until the detail query
  resolves — poll for a known value before reading (see `IncomeSummaryPage`).
- For an unsettled **today** detail, tax is folded into Sale (not itemized);
  formula-exact assertions should target a **settled past day**.
- Reconciliation invariants (UI-only, no API needed):
  `Total Payment` (table) = Payment Details total = Sale Details total;
  `Net Total` = Sale = Total Income; `Tax` (table) = `Tax Collected` = Σ tax per tender.
