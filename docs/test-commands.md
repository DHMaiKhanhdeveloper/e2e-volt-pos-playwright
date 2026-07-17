# Test Commands

> Tổng: **258 test case** trong **65 file**.
>
> Tự động sinh bởi `node scripts/generate-test-commands.mjs` (skill `test-commands-sync`). Không sửa tay — chạy lại script để cập nhật.

## Chạy toàn bộ / theo nhóm

```bash
npx playwright test                      # chạy tất cả test case
npm run test                              # alias (ENV=local)
npm run test:smoke                        # chỉ tag @smoke
npm run test:regression                   # chỉ tag @regression
npm run test:api                          # chỉ project api
npm run test:e2e                          # chỉ thư mục tests/e2e
```

## Theo từng file / từng test case

### `Bug/createCashOrder.bug.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test Bug/createCashOrder.bug.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Bug — cash order should leave Pending Orders @regression @payment › completed cash order (product + service + tip) is removed from Pending Orders | `npx playwright test Bug/createCashOrder.bug.spec.ts:31` |

### `Bug/createCashOrderLoop.bug.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test Bug/createCashOrderLoop.bug.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Bug — cash order soak loop @regression @payment › repeatedly creates & pays cash orders (infinite loop) | `npx playwright test Bug/createCashOrderLoop.bug.spec.ts:36` |

### `api/daily-sale-report.api.spec.ts` _(project: api)_

Chạy cả file:

```bash
npx playwright test api/daily-sale-report.api.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | API — Daily Sale Report @api @regression › storeDailyIncomeLive (aggregate) › returns a row whose money fields are all integer cents | `npx playwright test api/daily-sale-report.api.spec.ts:34` |
| 2 | API — Daily Sale Report @api @regression › storeDailyIncomeLive (aggregate) › Payment Details sum to Amount Collected and Total Payment | `npx playwright test api/daily-sale-report.api.spec.ts:44` |
| 3 | API — Daily Sale Report @api @regression › storeDailyIncomeLive (aggregate) › Income Detail reconciles with Payment Detail (TC-21) | `npx playwright test api/daily-sale-report.api.spec.ts:60` |
| 4 | API — Daily Sale Report @api @regression › storeDailyIncomeLive (aggregate) › computeTotals mirrors the raw row and reconciles | `npx playwright test api/daily-sale-report.api.spec.ts:80` |
| 5 | API — Daily Sale Report @api @regression › storeDailyIncomeOrdersLive (per-order) › returns an array | `npx playwright test api/daily-sale-report.api.spec.ts:99` |
| 6 | API — Daily Sale Report @api @regression › storeDailyIncomeOrdersLive (per-order) › every row is a well-formed sale/refund line that obeys total = parts | `npx playwright test api/daily-sale-report.api.spec.ts:104` |
| 7 | API — Daily Sale Report @api @regression › storeDailyIncomeOrdersLive (per-order) › rows are sorted by occurredAt descending | `npx playwright test api/daily-sale-report.api.spec.ts:144` |
| 8 | API — Daily Sale Report @api @regression › staffDailyIncomeListLive (per-staff) › returns an array | `npx playwright test api/daily-sale-report.api.spec.ts:156` |
| 9 | API — Daily Sale Report @api @regression › staffDailyIncomeListLive (per-staff) › every staff row is well-formed | `npx playwright test api/daily-sale-report.api.spec.ts:161` |
| 10 | API — Daily Sale Report @api @regression › staffDailyIncomeListLive (per-staff) › staffId values are unique within the day | `npx playwright test api/daily-sale-report.api.spec.ts:182` |
| 11 | API — Daily Sale Report @api @regression › staffDailyIncomeOrdersLive (per-staff per-order) › returns an array | `npx playwright test api/daily-sale-report.api.spec.ts:193` |
| 12 | API — Daily Sale Report @api @regression › staffDailyIncomeOrdersLive (per-staff per-order) › every row is a well-formed staff sale/refund line | `npx playwright test api/daily-sale-report.api.spec.ts:198` |
| 13 | API — Daily Sale Report @api @regression › staffDailyIncomeOrdersLive (per-staff per-order) › order-line ids are unique | `npx playwright test api/daily-sale-report.api.spec.ts:215` |

### `api/income-reports/cross-report.api.spec.ts` _(project: api)_

Chạy cả file:

```bash
npx playwright test api/income-reports/cross-report.api.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | API — Income Reports cross-report integration @api @regression › Daily Sale Report ↔ Income Summary › Sale & Tax are identical across both reports (AC6) | `npx playwright test api/income-reports/cross-report.api.spec.ts:64` |
| 2 | API — Income Reports cross-report integration @api @regression › Daily Sale Report ↔ Income Summary › Total Payment reconciles across both reports (AC6) | `npx playwright test api/income-reports/cross-report.api.spec.ts:85` |
| 3 | API — Income Reports cross-report integration @api @regression › Staff Income → Income Summary Staff Payout › store Staff Payout components = Σ per-staff settled rows | `npx playwright test api/income-reports/cross-report.api.spec.ts:107` |
| 4 | API — Income Reports cross-report integration @api @regression › Staff Income → Income Summary Staff Payout › store Staff Payout Total = Σ per-staff (Pay 1 + Pay 2) | `npx playwright test api/income-reports/cross-report.api.spec.ts:143` |
| 5 | API — Income Reports cross-report integration @api @regression › Staff Income → Income Summary Staff Payout › store Staff card-fee charge = Σ per-staff card fee | `npx playwright test api/income-reports/cross-report.api.spec.ts:158` |

### `api/income-summary.api.spec.ts` _(project: api)_

Chạy cả file:

```bash
npx playwright test api/income-summary.api.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | API — Income Summary @api @regression › overview row (table) › returns a row whose money fields are all integer cents | `npx playwright test api/income-summary.api.spec.ts:38` |
| 2 | API — Income Summary @api @regression › overview row (table) › table Total Payment = Net Total + Tax + Tip (TC-17/34) | `npx playwright test api/income-summary.api.spec.ts:50` |
| 3 | API — Income Summary @api @regression › overview row (table) › Net Total = Subtotal − Total Discount (TC-32) | `npx playwright test api/income-summary.api.spec.ts:68` |
| 4 | API — Income Summary @api @regression › detail panel (settled day, 5 sections) › all money fields are integer cents | `npx playwright test api/income-summary.api.spec.ts:88` |
| 5 | API — Income Summary @api @regression › detail panel (settled day, 5 sections) › Payment Details: per-tender total = Sale + Refund + Tip + Tax (TC-20/21/22) | `npx playwright test api/income-summary.api.spec.ts:98` |
| 6 | API — Income Summary @api @regression › detail panel (settled day, 5 sections) › Payment Details: Amount Collected = Cash + Card + Others (TC-23) | `npx playwright test api/income-summary.api.spec.ts:126` |
| 7 | API — Income Summary @api @regression › detail panel (settled day, 5 sections) › Payment Details: Total Payment = Amount Collected + Gift Card Redemption (TC-25) | `npx playwright test api/income-summary.api.spec.ts:140` |
| 8 | API — Income Summary @api @regression › detail panel (settled day, 5 sections) › Sale Details: Total Sale / Total Refund / Subtotal / Discount / Net Total (TC-28…32) | `npx playwright test api/income-summary.api.spec.ts:153` |
| 9 | API — Income Summary @api @regression › detail panel (settled day, 5 sections) › Sale Details: Total Payment = Net Total + Tax + Tip (TC-34) | `npx playwright test api/income-summary.api.spec.ts:177` |
| 10 | API — Income Summary @api @regression › detail panel (settled day, 5 sections) › Supply Fee: Total = Staff Share + Salon Share (TC-36/37) | `npx playwright test api/income-summary.api.spec.ts:189` |
| 11 | API — Income Summary @api @regression › detail panel (settled day, 5 sections) › Staff Payout: Total = Pay 1 + Pay 2 (TC-44/47) | `npx playwright test api/income-summary.api.spec.ts:201` |
| 12 | API — Income Summary @api @regression › detail panel (settled day, 5 sections) › Salon Earnings: Net & Total earnings formulas (TC-53/54) | `npx playwright test api/income-summary.api.spec.ts:214` |
| 13 | API — Income Summary @api @regression › cross-query consistency & range › overview and detail agree on Total Payment & Net Total for the same day (TC-56/57) | `npx playwright test api/income-summary.api.spec.ts:249` |
| 14 | API — Income Summary @api @regression › cross-query consistency & range › range query returns rows sorted by date descending | `npx playwright test api/income-summary.api.spec.ts:270` |

### `api/staff.api.spec.ts` _(project: api)_

Chạy cả file:

```bash
npx playwright test api/staff.api.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | API — staff @api @smoke › GraphQL staffList returns the seeded staff | `npx playwright test api/staff.api.spec.ts:6` |
| 2 | API — staff @api @smoke › findByNickname returns Elise Terry with the expected staff code | `npx playwright test api/staff.api.spec.ts:14` |

### `e2e/orders/createOrder.e2e.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test e2e/orders/createOrder.e2e.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Orders — create order @regression @payment › creates an order with cash payment and completes it | `npx playwright test e2e/orders/createOrder.e2e.spec.ts:10` |
| 2 | Orders — create order @regression @payment › does not allow pay without selecting a service | `npx playwright test e2e/orders/createOrder.e2e.spec.ts:59` |
| 3 | Orders — create order @regression @payment › creates an order with multiple services | `npx playwright test e2e/orders/createOrder.e2e.spec.ts:64` |
| 4 | Orders — create order @regression @payment › creates order with single service and pays with cash | `npx playwright test e2e/orders/createOrder.e2e.spec.ts:88` |

### `e2e/orders/deleteOrder.e2e.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test e2e/orders/deleteOrder.e2e.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Orders — delete order @regression › deletes an order before payment | `npx playwright test e2e/orders/deleteOrder.e2e.spec.ts:9` |

### `e2e/orders/otherPayment.e2e.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test e2e/orders/otherPayment.e2e.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Orders — Other payment method @regression @payment › pays with Other (Chase wire) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 2 | Orders — Other payment method @regression @payment › pays with Other (Bank of America ACH) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 3 | Orders — Other payment method @regression @payment › pays with Other (Wells Fargo transfer) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 4 | Orders — Other payment method @regression @payment › pays with Other (Zelle) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 5 | Orders — Other payment method @regression @payment › pays with Other (Venmo) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 6 | Orders — Other payment method @regression @payment › pays with Other (Cash App) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 7 | Orders — Other payment method @regression @payment › pays with Other (PayPal) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 8 | Orders — Other payment method @regression @payment › pays with Other (Apple Pay) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 9 | Orders — Other payment method @regression @payment › pays with Other (Personal Check) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 10 | Orders — Other payment method @regression @payment › pays with Other (Money Order) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 11 | Orders — Other payment method @regression @payment › pays with Other (numeric label) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 12 | Orders — Other payment method @regression @payment › pays with Other (special characters) | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:12` |
| 13 | Orders — Other payment method @regression @payment › Other payment input becomes visible only after selecting Other | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:43` |
| 14 | Orders — Other payment method @regression @payment › Other payment with multiple services | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:57` |
| 15 | Orders — Other payment method @regression @payment › changing the typed name updates the field value before submit | `npx playwright test e2e/orders/otherPayment.e2e.spec.ts:80` |

### `regression/appointment/TC-appointment-create-edit.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/appointment/TC-appointment-create-edit.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Appointment — create/edit/confirm/cancel scan @regression @ui › TC-APPT-ALL: Appointment form — full check | `npx playwright test regression/appointment/TC-appointment-create-edit.spec.ts:29` |

### `regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | i18n — Home Vietnamese deep scan @regression › TC-I18N-VI-HOME: Home screen + popups still in English | `npx playwright test regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts:38` |

### `regression/i18n/TC-i18n-incomes-vietnamese-scan.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/i18n/TC-i18n-incomes-vietnamese-scan.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | i18n — Incomes (reports) Vietnamese deep scan @regression › TC-I18N-VI-INCOMES: Daily/Summary/Staff income screens still in English | `npx playwright test regression/i18n/TC-i18n-incomes-vietnamese-scan.spec.ts:41` |

### `regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | i18n — Order History Vietnamese deep scan @regression › TC-I18N-VI-ORDER-HISTORY: Order History screen + dialogs still in English | `npx playwright test regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts:42` |

### `regression/i18n/TC-i18n-order-pending-vietnamese-scan.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/i18n/TC-i18n-order-pending-vietnamese-scan.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | i18n — Order Pending Vietnamese deep scan @regression › TC-I18N-VI-ORDER-PENDING: Order Pending screen + dialogs still in English | `npx playwright test regression/i18n/TC-i18n-order-pending-vietnamese-scan.spec.ts:42` |

### `regression/i18n/TC-i18n-screen-compare.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/i18n/TC-i18n-screen-compare.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | i18n — so sánh EN↔VI theo màn @regression › TC-I18N-COMPARE: home | `npx playwright test regression/i18n/TC-i18n-screen-compare.spec.ts:42` |

### `regression/i18n/TC-i18n-vietnamese-scan.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/i18n/TC-i18n-vietnamese-scan.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | i18n — Vietnamese coverage scan @regression › TC-I18N-VI-SCAN: list screens not yet translated to Vietnamese | `npx playwright test regression/i18n/TC-i18n-vietnamese-scan.spec.ts:64` |

### `regression/incomes/daily-sale-report/TC-income-daily-ALL.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC-income-daily-ALL.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — full scan @regression @ui › TC-DSR-ALL: Daily Sale Report — full check | `npx playwright test regression/incomes/daily-sale-report/TC-income-daily-ALL.spec.ts:23` |

### `regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — defaults & card descriptions @regression › TC-1: default filter is Today and the full layout renders | `npx playwright test regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts:41` |
| 2 | Daily Sale Report — defaults & card descriptions @regression › TC-3/5/7/9: card description — Total Order | `npx playwright test regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts:69` |
| 3 | Daily Sale Report — defaults & card descriptions @regression › TC-3/5/7/9: card description — Sale | `npx playwright test regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts:69` |
| 4 | Daily Sale Report — defaults & card descriptions @regression › TC-3/5/7/9: card description — Total Tip | `npx playwright test regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts:69` |
| 5 | Daily Sale Report — defaults & card descriptions @regression › TC-3/5/7/9: card description — Total Payment | `npx playwright test regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts:69` |
| 6 | Daily Sale Report — defaults & card descriptions @regression › TC-10: every card shows a `<n>% vs Yesterday` label | `npx playwright test regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts:80` |
| 7 | Daily Sale Report — defaults & card descriptions @regression › TC-14: first order row carries an orderCode in the `OD…` format | `npx playwright test regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts:89` |
| 8 | Daily Sale Report — defaults & card descriptions @regression › TC-25: Print button is enabled and a click does not crash the page | `npx playwright test regression/incomes/daily-sale-report/TC01.03.05.07.09.10.14.25-defaults.spec.ts:105` |

### `regression/incomes/daily-sale-report/TC02.04.06.08.22.23.37-refund-cancel.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC02.04.06.08.22.23.37-refund-cancel.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — refund & cancel @regression @payment @slow › TC-23 + TC-2 + TC-6: cancelling an unsettled order leaves no trace in today's totals | `npx playwright test regression/incomes/daily-sale-report/TC02.04.06.08.22.23.37-refund-cancel.spec.ts:99` |
| 2 | Daily Sale Report — refund & cancel @regression @payment @slow › TC-22 + TC-4 + TC-37: refunding a settled order reduces Sale and renders the row in red | `npx playwright test regression/incomes/daily-sale-report/TC02.04.06.08.22.23.37-refund-cancel.spec.ts:152` |
| 3 | Daily Sale Report — refund & cancel @regression @payment @slow › TC-8: Total Payment stays consistent across order lifecycle (create → cancel) | `npx playwright test regression/incomes/daily-sale-report/TC02.04.06.08.22.23.37-refund-cancel.spec.ts:216` |

### `regression/incomes/daily-sale-report/TC11.27.28.29.30-chart-switching.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC11.27.28.29.30-chart-switching.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — chart switching @regression › TC-11: defaults to the Sale chart on first load | `npx playwright test regression/incomes/daily-sale-report/TC11.27.28.29.30-chart-switching.spec.ts:38` |
| 2 | Daily Sale Report — chart switching @regression › TC-27/28/29: clicking "Total Order" sets activeChart=totalOrder and updates chart heading | `npx playwright test regression/incomes/daily-sale-report/TC11.27.28.29.30-chart-switching.spec.ts:45` |
| 3 | Daily Sale Report — chart switching @regression › TC-27/28/29: clicking "Sale" sets activeChart=sale and updates chart heading | `npx playwright test regression/incomes/daily-sale-report/TC11.27.28.29.30-chart-switching.spec.ts:45` |
| 4 | Daily Sale Report — chart switching @regression › TC-27/28/29: clicking "Total Tip" sets activeChart=totalTip and updates chart heading | `npx playwright test regression/incomes/daily-sale-report/TC11.27.28.29.30-chart-switching.spec.ts:45` |
| 5 | Daily Sale Report — chart switching @regression › TC-27/28/29: clicking "Total Payment" sets activeChart=totalPayment and updates chart heading | `npx playwright test regression/incomes/daily-sale-report/TC11.27.28.29.30-chart-switching.spec.ts:45` |
| 6 | Daily Sale Report — chart switching @regression › TC-30: only the clicked card carries the selected visual state | `npx playwright test regression/incomes/daily-sale-report/TC11.27.28.29.30-chart-switching.spec.ts:55` |

### `regression/incomes/daily-sale-report/TC12.13.39-date-filter.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC12.13.39-date-filter.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — date filter @regression › TC-12: picking yesterday loads yesterday's data and Today no longer looks active | `npx playwright test regression/incomes/daily-sale-report/TC12.13.39-date-filter.spec.ts:26` |
| 2 | Daily Sale Report — date filter @regression › TC-13: a day with no orders shows $0.00 everywhere | `npx playwright test regression/incomes/daily-sale-report/TC12.13.39-date-filter.spec.ts:56` |
| 3 | Daily Sale Report — date filter @regression › TC-39: past-date row matches the settled GraphQL snapshot | `npx playwright test regression/incomes/daily-sale-report/TC12.13.39-date-filter.spec.ts:87` |

### `regression/incomes/daily-sale-report/TC15.17.18-orders-table.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC15.17.18-orders-table.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — orders table column math @regression › TC-18: Total = Sale + Tip + Tax on every row | `npx playwright test regression/incomes/daily-sale-report/TC15.17.18-orders-table.spec.ts:25` |
| 2 | Daily Sale Report — orders table column math @regression › TC-15 + TC-17: Sale & Tip cells parse cleanly to a money value | `npx playwright test regression/incomes/daily-sale-report/TC15.17.18-orders-table.spec.ts:47` |

### `regression/incomes/daily-sale-report/TC16.24-payment-types.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC16.24-payment-types.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — tax (settled, real DB) @regression › TC-16: a settled day breaks tax out into Income Detail Tax Collected | `npx playwright test regression/incomes/daily-sale-report/TC16.24-payment-types.spec.ts:65` |
| 2 | Daily Sale Report — gift card (live, real DB) @regression @payment @slow › TC-24: a gift-card redemption inflates Total Payment & Gift Card Redemption but NOT Sale | `npx playwright test regression/incomes/daily-sale-report/TC16.24-payment-types.spec.ts:112` |

### `regression/incomes/daily-sale-report/TC19.20.21.26-math.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC19.20.21.26-math.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — math & reconciliation @regression › TC-19 + TC-20 + TC-21: Income / Payment Details match GraphQL + reconcile | `npx playwright test regression/incomes/daily-sale-report/TC19.20.21.26-math.spec.ts:22` |
| 2 | Daily Sale Report — math & reconciliation @regression › TC-26: every money value renders as $#,##0.00 | `npx playwright test regression/incomes/daily-sale-report/TC19.20.21.26-math.spec.ts:87` |

### `regression/incomes/daily-sale-report/TC19.21.38-live-delta.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC19.21.38-live-delta.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — live delta @regression @payment @slow › TC-38: cash order increases Sale, Cash, and Total Payment by the order amount | `npx playwright test regression/incomes/daily-sale-report/TC19.21.38-live-delta.spec.ts:77` |
| 2 | Daily Sale Report — live delta @regression @payment @slow › TC-19 (live): tip goes to Total Tip & Amount Collected, NOT to Sale | `npx playwright test regression/incomes/daily-sale-report/TC19.21.38-live-delta.spec.ts:137` |

### `regression/incomes/daily-sale-report/TC31-url-persistence.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC31-url-persistence.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — URL persistence @regression › TC-31: reload keeps activeChart + from/to in the URL and the UI reflects them | `npx playwright test regression/incomes/daily-sale-report/TC31-url-persistence.spec.ts:29` |

### `regression/incomes/daily-sale-report/TC32.33.34-permission.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC32.33.34-permission.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — permission & passcode @regression @auth › TC-32: opening the route shows the passcode dialog before data renders | `npx playwright test regression/incomes/daily-sale-report/TC32.33.34-permission.spec.ts:24` |
| 2 | Daily Sale Report — permission & passcode @regression @auth › TC-33: a wrong passcode keeps the dialog open and does not unlock data | `npx playwright test regression/incomes/daily-sale-report/TC32.33.34-permission.spec.ts:39` |
| 3 | Daily Sale Report — permission & passcode @regression @auth › TC-34: ticking "Remember 30m" lets you re-enter without a second passcode prompt | `npx playwright test regression/incomes/daily-sale-report/TC32.33.34-permission.spec.ts:55` |
| 4 | Daily Sale Report — permission & passcode @regression @auth › TC-34 (expired): after 30 minutes the passcode prompt must return | `npx playwright test regression/incomes/daily-sale-report/TC32.33.34-permission.spec.ts:78` |

### `regression/incomes/daily-sale-report/TC35.36-order-detail-dialog.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC35.36-order-detail-dialog.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — Order Detail dialog @regression › TC-35: clicking a row opens the Order Details dialog and sets ?orderId | `npx playwright test regression/incomes/daily-sale-report/TC35.36-order-detail-dialog.spec.ts:23` |
| 2 | Daily Sale Report — Order Detail dialog @regression › TC-36: dialog closes via the × button and clears ?orderId | `npx playwright test regression/incomes/daily-sale-report/TC35.36-order-detail-dialog.spec.ts:41` |
| 3 | Daily Sale Report — Order Detail dialog @regression › TC-36: dialog closes via ESC and clears ?orderId | `npx playwright test regression/incomes/daily-sale-report/TC35.36-order-detail-dialog.spec.ts:56` |
| 4 | Daily Sale Report — Order Detail dialog @regression › TC-36: reopening with another row replaces ?orderId without leaking state | `npx playwright test regression/incomes/daily-sale-report/TC35.36-order-detail-dialog.spec.ts:71` |

### `regression/incomes/daily-sale-report/TC40.41.42-edge-cases.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC40.41.42-edge-cases.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — edge cases (mocked) @regression › TC-40: skeleton appears while data is loading | `npx playwright test regression/incomes/daily-sale-report/TC40.41.42-edge-cases.spec.ts:53` |
| 2 | Daily Sale Report — edge cases (mocked) @regression › TC-41: error fallback when GraphQL returns 500 | `npx playwright test regression/incomes/daily-sale-report/TC40.41.42-edge-cases.spec.ts:77` |
| 3 | Daily Sale Report — edge cases (mocked) @regression › TC-42: %vs Yesterday does not show Infinity/NaN when yesterday = 0 | `npx playwright test regression/incomes/daily-sale-report/TC40.41.42-edge-cases.spec.ts:103` |

### `regression/incomes/daily-sale-report/TC43.44-mocked-scenarios.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/daily-sale-report/TC43.44-mocked-scenarios.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — mocked scenarios @regression › TC-43: a split-tender order shows across Card / Cash / Gift Card buckets | `npx playwright test regression/incomes/daily-sale-report/TC43.44-mocked-scenarios.spec.ts:102` |
| 2 | Daily Sale Report — mocked scenarios @regression › TC-44: timezone boundary — UI honours the merchant-local day window | `npx playwright test regression/incomes/daily-sale-report/TC43.44-mocked-scenarios.spec.ts:142` |

### `regression/incomes/income-reports/cross-report.regression.spec.ts` _(project: no-retry)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-reports/cross-report.regression.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Reports — cross-report UI consistency @regression › Daily Sale Report and Income Summary show the same Tax & Total Payment (AC6) | `npx playwright test regression/incomes/income-reports/cross-report.regression.spec.ts:20` |

### `regression/incomes/income-staff/TC-IST-staff-income.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Staff Income — structure & permission @regression › TC-IST-01: opening the route shows the passcode dialog before data renders | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:31` |
| 2 | Staff Income — structure & permission @regression › after unlock › TC-IST-02: correct passcode unlocks and shows the "Staff Income" title | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:47` |
| 3 | Staff Income — structure & permission @regression › after unlock › TC-IST-03: default filter is Today and the URL carries from/to | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:53` |
| 4 | Staff Income — structure & permission @regression › after unlock › TC-IST-04: the aggregate bar shows all 6 stats | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:58` |
| 5 | Staff Income — structure & permission @regression › after unlock › TC-IST-05: the Search staff box accepts input | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:64` |
| 6 | Staff Income — structure & permission @regression › after unlock › TC-IST-06: period preset dropdown defaults to "Today" | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:70` |
| 7 | Staff Income — structure & permission @regression › after unlock › TC-IST-07: the calendar button shows a MM/DD/YYYY date | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:74` |
| 8 | Staff Income — structure & permission @regression › after unlock › TC-IST-08: detail panel is empty until a staff is selected | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:78` |
| 9 | Staff Income — structure & permission @regression › after unlock › TC-IST-12: aggregate money stats render as $#,##0.00 | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:84` |
| 10 | Staff Income — filter & URL @regression › TC-IST-09: a day with no staff shows "No results found." and zeroed totals | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:98` |
| 11 | Staff Income — filter & URL @regression › TC-IST-10 + TC-IST-11: gotoDate updates from/to and survives reload | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:121` |
| 12 | Staff Income — data-dependent [data] @regression › TC-IST-13: staff listing exposes the 6 spec columns | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:150` |
| 13 | Staff Income — data-dependent [data] @regression › TC-IST-14: search filters the listing by nickname | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:158` |
| 14 | Staff Income — data-dependent [data] @regression › TC-IST-15: clicking a staff opens the detail panel with Print enabled | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:165` |
| 15 | Staff Income — data-dependent [data] @regression › TC-IST-18: Total staff income equals the sum of each staff Total Income | `npx playwright test regression/incomes/income-staff/TC-IST-staff-income.spec.ts:173` |

### `regression/incomes/income-staff/TC-income-staff-ALL.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-staff/TC-income-staff-ALL.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Staff Income — full scan @regression @ui › TC-IST-ALL: Staff Income — full check | `npx playwright test regression/incomes/income-staff/TC-income-staff-ALL.spec.ts:32` |

### `regression/incomes/income-summary-past/TC-PAST-pipeline.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary-past/TC-PAST-pipeline.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — past day pipeline @regression › TC-PAST-PIPELINE: order history (date) → compensation → income summary | `npx playwright test regression/incomes/income-summary-past/TC-PAST-pipeline.spec.ts:39` |

### `regression/incomes/income-summary-reconciliation/TC-RECON-orders-into-income-summary.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary-reconciliation/TC-RECON-orders-into-income-summary.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Daily Sale Report — Income Summary from JSON @regression › TC-RECON: scrape DSR → update JSON → compute Income Summary from the JSON | `npx playwright test regression/incomes/income-summary-reconciliation/TC-RECON-orders-into-income-summary.spec.ts:47` |
| 2 | Daily Sale Report — Income Summary from JSON @regression › TC-RECON: every order row satisfies Total = Sale + Tip + Tax | `npx playwright test regression/incomes/income-summary-reconciliation/TC-RECON-orders-into-income-summary.spec.ts:158` |

### `regression/incomes/income-summary-reconciliation/TC-RECON-pipeline.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary-reconciliation/TC-RECON-pipeline.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — full pipeline (today) @regression › TC-RECON-PIPELINE: orders+staff+product → compensation → income summary | `npx playwright test regression/incomes/income-summary-reconciliation/TC-RECON-pipeline.spec.ts:52` |

### `regression/incomes/income-summary-reconciliation/TC-RECON-sections-from-compensation.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary-reconciliation/TC-RECON-sections-from-compensation.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary sections from compensation @regression › TC-RECON: derive Supply Fee / Staff Payout / Salon Earnings from compensation | `npx playwright test regression/incomes/income-summary-reconciliation/TC-RECON-sections-from-compensation.spec.ts:32` |

### `regression/incomes/income-summary-reconciliation/TC-RECON-staff-compensation.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary-reconciliation/TC-RECON-staff-compensation.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Staff Compensation from Settings → JSON @regression › TC-RECON: scrape each staff compensation → JSON | `npx playwright test regression/incomes/income-summary-reconciliation/TC-RECON-staff-compensation.spec.ts:56` |

### `regression/incomes/income-summary-ui/TC-IS-UI.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary-ui/TC-IS-UI.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — app-faithful HTML @regression › TC-IS-UI: render the Income Summary screen to HTML | `npx playwright test regression/incomes/income-summary-ui/TC-IS-UI.spec.ts:25` |

### `regression/incomes/income-summary/TC-RD-staff-salon-rederive.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC-RD-staff-salon-rederive.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — Staff Payout & Salon re-derived from DB (Cách 2) @regression › TC-RD1: re-derived Staff Payout & Salon Earnings are internally consistent | `npx playwright test regression/incomes/income-summary/TC-RD-staff-salon-rederive.spec.ts:37` |
| 2 | Income Summary — Staff Payout & Salon re-derived from DB (Cách 2) @regression › TC-RD2: re-derive reproduces the app on sale/supply/tip; divergences reported | `npx playwright test regression/incomes/income-summary/TC-RD-staff-salon-rederive.spec.ts:89` |

### `regression/incomes/income-summary/TC-income-summary-ALL.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC-income-summary-ALL.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — full scan @regression @ui › TC-IS-ALL: Income Summary — full check | `npx playwright test regression/incomes/income-summary/TC-income-summary-ALL.spec.ts:22` |

### `regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — overview (real data) @regression › TC-1: default filter is Day + Today with a single period row | `npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts:53` |
| 2 | Income Summary — overview (real data) @regression › TC-15 + TC-16: the table has a Tax column and no Net Income column | `npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts:66` |
| 3 | Income Summary — overview (real data) @regression › TC-17: every row Total Payment = Sale + Tip + Tax | `npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts:77` |
| 4 | Income Summary — overview (real data) @regression › TC-3: Day grouping over a date range shows one row per day | `npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts:102` |
| 5 | Income Summary — overview (real data) @regression › TC-4 + TC-6: Week and Month grouping switch the URL and reshape the table | `npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts:118` |
| 6 | Income Summary — overview (real data) @regression › TC-9: the comparison label is present and changes with the period mode | `npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts:134` |
| 7 | Income Summary — overview (real data) @regression › TC-19 + sections: clicking a period opens the detail panel with all five sections | `npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts:151` |
| 8 | Income Summary — overview (real data) @regression › TC-25 + TC-34 + TC-56: Total Payment reconciles across table, Payment & Sale Details | `npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts:173` |
| 9 | Income Summary — overview (real data) @regression › TC-48: Staff Payout Show more / Show less toggles the Pay split | `npx playwright test regression/incomes/income-summary/TC01.03.04.06.09.15.16.17.18.19.25.34.48.56-overview.spec.ts:199` |

### `regression/incomes/income-summary/TC02.05.07-filter.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC02.05.07-filter.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — Filter (real data) @regression › TC-2: switching to Week surfaces a year selector (not the "Today" preset) | `npx playwright test regression/incomes/income-summary/TC02.05.07-filter.spec.ts:22` |
| 2 | Income Summary — Filter (real data) @regression › TC-5: Week grouping lists at most 53 week rows (≥ 1) | `npx playwright test regression/incomes/income-summary/TC02.05.07-filter.spec.ts:32` |
| 3 | Income Summary — Filter (real data) @regression › TC-7: Month grouping lists at most 12 month rows (≥ 1) | `npx playwright test regression/incomes/income-summary/TC02.05.07-filter.spec.ts:43` |

### `regression/incomes/income-summary/TC08.09.11.12.13.14-total-income.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC08.09.11.12.13.14-total-income.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — Total Income (real data) @regression › TC-8 + TC-9: a comparison label and percentage are shown | `npx playwright test regression/incomes/income-summary/TC08.09.11.12.13.14-total-income.spec.ts:20` |
| 2 | Income Summary — Total Income (real data) @regression › TC-11: Total Income renders its value with the correct sign | `npx playwright test regression/incomes/income-summary/TC08.09.11.12.13.14-total-income.spec.ts:33` |
| 3 | Income Summary — Total Income (real data) @regression › TC-12 + TC-13 + TC-14: Gross / Net exclude Gift Card sale | `npx playwright test regression/incomes/income-summary/TC08.09.11.12.13.14-total-income.spec.ts:52` |

### `regression/incomes/income-summary/TC20.21.22.23.24.25.26.27-payment-details.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC20.21.22.23.24.25.26.27-payment-details.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — Payment Details (real data) @regression › TC-20 + TC-22: Card & Others = Sale + Refund + Tip + Tax (with sub-rows) | `npx playwright test regression/incomes/income-summary/TC20.21.22.23.24.25.26.27-payment-details.spec.ts:61` |
| 2 | Income Summary — Payment Details (real data) @regression › TC-21 + TC-26: Cash = Sale + Refund + Tip + Tax, sub-rows keep their sign | `npx playwright test regression/incomes/income-summary/TC20.21.22.23.24.25.26.27-payment-details.spec.ts:100` |
| 3 | Income Summary — Payment Details (real data) @regression › TC-23: Amount Collected = Cash + Card + Others | `npx playwright test regression/incomes/income-summary/TC20.21.22.23.24.25.26.27-payment-details.spec.ts:130` |
| 4 | Income Summary — Payment Details (real data) @regression › TC-24: Gift Card Redemption groups Tip / Tax | `npx playwright test regression/incomes/income-summary/TC20.21.22.23.24.25.26.27-payment-details.spec.ts:150` |
| 5 | Income Summary — Payment Details (real data) @regression › TC-25: TOTAL PAYMENT = Amount Collected + Gift Card Redemption | `npx playwright test regression/incomes/income-summary/TC20.21.22.23.24.25.26.27-payment-details.spec.ts:168` |
| 6 | Income Summary — Payment Details (real data) @regression › TC-27: the fifth header reads "Total Payment", not "Amount Collected" | `npx playwright test regression/incomes/income-summary/TC20.21.22.23.24.25.26.27-payment-details.spec.ts:191` |

### `regression/incomes/income-summary/TC28.29.30.31.32.33.34-sale-details.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC28.29.30.31.32.33.34-sale-details.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — Sale Details (real data) @regression › TC-28 + TC-29: Total Sale = Service+Product+GC; Total Refund = Service+Product | `npx playwright test regression/incomes/income-summary/TC28.29.30.31.32.33.34-sale-details.spec.ts:56` |
| 2 | Income Summary — Sale Details (real data) @regression › TC-30 + TC-31 + TC-32: Subtotal, Total Discount, Net Total math | `npx playwright test regression/incomes/income-summary/TC28.29.30.31.32.33.34-sale-details.spec.ts:80` |
| 3 | Income Summary — Sale Details (real data) @regression › TC-33 + TC-34: Tax Collected matches DB; Total Payment = Net Total + Tax + Tip | `npx playwright test regression/incomes/income-summary/TC28.29.30.31.32.33.34-sale-details.spec.ts:104` |

### `regression/incomes/income-summary/TC35.36.37-supply-fee.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC35.36.37-supply-fee.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — Supply Fee (real data) @regression › TC-35 + TC-36 + TC-37: Total Supply Fee = Staff Share + Salon Share | `npx playwright test regression/incomes/income-summary/TC35.36.37-supply-fee.spec.ts:16` |

### `regression/incomes/income-summary/TC38.39.40.41.42.43.44.45.46.47.48.49.50.51-staff-payout.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC38.39.40.41.42.43.44.45.46.47.48.49.50.51-staff-payout.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — Staff Payout (real data) @regression › TC-38…43: UI renders the API commission / clean-up / salary values | `npx playwright test regression/incomes/income-summary/TC38.39.40.41.42.43.44.45.46.47.48.49.50.51-staff-payout.spec.ts:26` |
| 2 | Income Summary — Staff Payout (real data) @regression › TC-44 + TC-47: Total Staff Payout = Pay 1 + Pay 2 (Salary inside the split) | `npx playwright test regression/incomes/income-summary/TC38.39.40.41.42.43.44.45.46.47.48.49.50.51-staff-payout.spec.ts:44` |
| 3 | Income Summary — Staff Payout (real data) @regression › TC-45 + TC-46: Pay 1 / Pay 2 split values & dynamic % text (needs split-setting fixture) | `npx playwright test regression/incomes/income-summary/TC38.39.40.41.42.43.44.45.46.47.48.49.50.51-staff-payout.spec.ts:72` |
| 4 | Income Summary — Staff Payout (real data) @regression › TC-38(rate)/39/40/41/42/43/49/50/51: commission %, salary types, pay-period close | `npx playwright test regression/incomes/income-summary/TC38.39.40.41.42.43.44.45.46.47.48.49.50.51-staff-payout.spec.ts:77` |

### `regression/incomes/income-summary/TC38.40.41.44-staff-payout-from-staff-income.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC38.40.41.44-staff-payout-from-staff-income.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — Staff Payout from Staff Income (real data) @regression › TC-38/40/41/44: per-staff settled income sums into the Staff Payout section | `npx playwright test regression/incomes/income-summary/TC38.40.41.44-staff-payout-from-staff-income.spec.ts:26` |
| 2 | Income Summary — Staff Payout from Staff Income (real data) @regression › TC-38(rate)/44: Commission / Pay1+Pay2 / Total / Supply Share from per-staff (needs store split rule) | `npx playwright test regression/incomes/income-summary/TC38.40.41.44-staff-payout-from-staff-income.spec.ts:64` |

### `regression/incomes/income-summary/TC52.53.54.55-salon-earnings.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC52.53.54.55-salon-earnings.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — Salon Earnings (real data) @regression › TC-52 + TC-53: UI renders API values; Net Earnings formula holds | `npx playwright test regression/incomes/income-summary/TC52.53.54.55-salon-earnings.spec.ts:28` |
| 2 | Income Summary — Salon Earnings (real data) @regression › TC-54 + TC-55: Total Earnings formula; independent of Staff Payout | `npx playwright test regression/incomes/income-summary/TC52.53.54.55-salon-earnings.spec.ts:52` |
| 3 | Income Summary — Salon Earnings (real data) @regression › TC-55b: Salon ↔ Staff shared anchors are consistent | `npx playwright test regression/incomes/income-summary/TC52.53.54.55-salon-earnings.spec.ts:75` |
| 4 | Income Summary — Salon Earnings (real data) @regression › TC-54 (expanded): Total Earning = Net + Staff Supply Share + Clean Up + Discount Charge − Salary + Card Charge (needs charge fixture) | `npx playwright test regression/incomes/income-summary/TC52.53.54.55-salon-earnings.spec.ts:104` |

### `regression/incomes/income-summary/TC56.57.58-reconciliation.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC56.57.58-reconciliation.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — reconciliation (real data) @regression › TC-56: Total Payment agrees across table, Payment Details & Sale Details | `npx playwright test regression/incomes/income-summary/TC56.57.58-reconciliation.spec.ts:27` |
| 2 | Income Summary — reconciliation (real data) @regression › TC-57: Net agrees — table Sale = Sale Details Net Total = Total Income | `npx playwright test regression/incomes/income-summary/TC56.57.58-reconciliation.spec.ts:46` |
| 3 | Income Summary — reconciliation (real data) @regression › TC-58: Tax agrees — table = Tax Collected = Σ payment-method taxes | `npx playwright test regression/incomes/income-summary/TC56.57.58-reconciliation.spec.ts:67` |

### `regression/incomes/income-summary/TC59.60.61-cross-report.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC59.60.61-cross-report.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — cross-report (real data) @regression › TC-59: Income Summary matches the Daily Sale Report (base) on every shared figure | `npx playwright test regression/incomes/income-summary/TC59.60.61-cross-report.spec.ts:20` |
| 2 | Income Summary — cross-report (real data) @regression › TC-60: Income Summary Total Refund = Service Refund + Product Refund | `npx playwright test regression/incomes/income-summary/TC59.60.61-cross-report.spec.ts:59` |
| 3 | Income Summary — cross-report (real data) @regression › TC-61: Print receipt numbers match the on-screen report | `npx playwright test regression/incomes/income-summary/TC59.60.61-cross-report.spec.ts:75` |

### `regression/incomes/income-summary/TC62.63.64.65-edge.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC62.63.64.65-edge.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — edge cases (real data) @regression › TC-63: periods without transactions render $0.00 (never blank/error) | `npx playwright test regression/incomes/income-summary/TC62.63.64.65-edge.spec.ts:12` |
| 2 | Income Summary — edge cases (real data) @regression › TC-62: a Gift-Card-only day shows Gross/Net = 0 but Total Sale includes GC | `npx playwright test regression/incomes/income-summary/TC62.63.64.65-edge.spec.ts:36` |
| 3 | Income Summary — edge cases (real data) @regression › TC-64: Custom Pay Period — Save is blocked until dates are chosen | `npx playwright test regression/incomes/income-summary/TC62.63.64.65-edge.spec.ts:39` |
| 4 | Income Summary — edge cases (real data) @regression › TC-65: currency rounding is consistent to 2 dp (totals vs line items) | `npx playwright test regression/incomes/income-summary/TC62.63.64.65-edge.spec.ts:42` |

### `regression/incomes/income-summary/TC66.67.68.69.70.71.72-charge-fields.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/incomes/income-summary/TC66.67.68.69.70.71.72-charge-fields.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Income Summary — charge fields & Salon tax (real data) @regression › TC-66…71: charge lines, when rendered, parse as valid money (integer cents) | `npx playwright test regression/incomes/income-summary/TC66.67.68.69.70.71.72-charge-fields.spec.ts:33` |
| 2 | Income Summary — charge fields & Salon tax (real data) @regression › TC-72: Salon Earnings "Tax Collected" = Sale Details total tax | `npx playwright test regression/incomes/income-summary/TC66.67.68.69.70.71.72-charge-fields.spec.ts:56` |
| 3 | Income Summary — charge fields & Salon tax (real data) @regression › TC-66/67/68 (staff, subtracted) + TC-69/70/71 (salon, added): exact charge values & expanded totals (needs Staff Compensation fixture + ⚠️#5 confirmation + API fields) | `npx playwright test regression/incomes/income-summary/TC66.67.68.69.70.71.72-charge-fields.spec.ts:77` |

### `regression/order-history/TC-order-history.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/order-history/TC-order-history.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Order History — screen scan @regression @ui › TC-OH-ALL: Order History screen — full check | `npx playwright test regression/order-history/TC-order-history.spec.ts:36` |

### `regression/orders/bulkCreateOrders.regression.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Orders — bulk create 10 orders @regression @slow › Order 1/10: Gel Removal | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |
| 2 | Orders — bulk create 10 orders @regression @slow › Order 2/10: Dipping Ombre | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |
| 3 | Orders — bulk create 10 orders @regression @slow › Order 3/10: Acrylic Removal | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |
| 4 | Orders — bulk create 10 orders @regression @slow › Order 4/10: Waxing (Lip / Chin) | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |
| 5 | Orders — bulk create 10 orders @regression @slow › Order 5/10: Spa Service | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |
| 6 | Orders — bulk create 10 orders @regression @slow › Order 6/10: Gel Removal + Dipping Ombre | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |
| 7 | Orders — bulk create 10 orders @regression @slow › Order 7/10: Acrylic Removal + Waxing (Lip / Chin) | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |
| 8 | Orders — bulk create 10 orders @regression @slow › Order 8/10: Spa Service + Gel Removal | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |
| 9 | Orders — bulk create 10 orders @regression @slow › Order 9/10: Dipping Ombre + Acrylic Removal | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |
| 10 | Orders — bulk create 10 orders @regression @slow › Order 10/10: Waxing (Lip / Chin) + Spa Service | `npx playwright test regression/orders/bulkCreateOrders.regression.spec.ts:24` |

### `regression/orders/order-pending/TC-order-pending.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/orders/order-pending/TC-order-pending.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Order Pending — queue scan @regression @ui › TC-OP-ALL: Order Pending queue — full check | `npx playwright test regression/orders/order-pending/TC-order-pending.spec.ts:30` |

### `regression/pos/order-flow/checkout.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/pos/order-flow/checkout.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Order Flow — Checkout @regression @ui @payment › TC-ORDERFLOW-39: checkout shows 4 payment methods with amounts | `npx playwright test regression/pos/order-flow/checkout.spec.ts:28` |
| 2 | Order Flow — Checkout @regression @ui @payment › TC-ORDERFLOW-40: Cash quick amounts populate Enter Amount | `npx playwright test regression/pos/order-flow/checkout.spec.ts:43` |
| 3 | Order Flow — Checkout @regression @ui @payment › TC-ORDERFLOW-41/42: Cash button label switches Pay -> Complete Payment once fully tendered | `npx playwright test regression/pos/order-flow/checkout.spec.ts:60` |
| 4 | Order Flow — Checkout @regression @ui @payment › TC-ORDERFLOW-44: Card payment reaches the amount-entry screen | `npx playwright test regression/pos/order-flow/checkout.spec.ts:77` |
| 5 | Order Flow — Checkout @regression @ui @payment › TC-ORDERFLOW-46: Other payment requires a method name and echoes it on success | `npx playwright test regression/pos/order-flow/checkout.spec.ts:88` |
| 6 | Order Flow — Checkout @regression @ui @payment › TC-ORDERFLOW-47: Tip is disabled before a payment method is chosen | `npx playwright test regression/pos/order-flow/checkout.spec.ts:109` |
| 7 | Order Flow — Checkout @regression @ui @payment › TC-ORDERFLOW-43/45/48/49/50/51/52/53: multi-pay, Gift Card redemption, Print preview, Cash Drawer, Payment Success actions, and network-disconnect handling | `npx playwright test regression/pos/order-flow/checkout.spec.ts:120` |

### `regression/pos/order-flow/create-order.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/pos/order-flow/create-order.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-01: Home shows Staff / Service / Cart blocks | `npx playwright test regression/pos/order-flow/create-order.spec.ts:18` |
| 2 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-02: choosing a Service before Staff shows "Select Staff First" | `npx playwright test regression/pos/order-flow/create-order.spec.ts:25` |
| 3 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-03: selecting Staff then Service adds a cart line | `npx playwright test regression/pos/order-flow/create-order.spec.ts:45` |
| 4 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-04: staff search filters the staff list | `npx playwright test regression/pos/order-flow/create-order.spec.ts:52` |
| 5 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-05: service search filters the catalogue | `npx playwright test regression/pos/order-flow/create-order.spec.ts:58` |
| 6 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-06: New Customer — valid phone opens Add New Customer dialog | `npx playwright test regression/pos/order-flow/create-order.spec.ts:64` |
| 7 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-09: Skip customer entry shows "Unknown" | `npx playwright test regression/pos/order-flow/create-order.spec.ts:75` |
| 8 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-13: Quick Pay without a staff shows the guard popup | `npx playwright test regression/pos/order-flow/create-order.spec.ts:84` |
| 9 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-14: Quick Pay dialog exposes Amount / Service Name / Note / Discount / Add | `npx playwright test regression/pos/order-flow/create-order.spec.ts:100` |
| 10 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-15: Quick Pay Add enables only once Amount + Service Name are filled | `npx playwright test regression/pos/order-flow/create-order.spec.ts:116` |
| 11 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-18: Promo & Rewards opens the Add Promo dialog | `npx playwright test regression/pos/order-flow/create-order.spec.ts:133` |
| 12 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-19: Note button opens an order-note editor | `npx playwright test regression/pos/order-flow/create-order.spec.ts:143` |
| 13 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-21: Cart summary shows Subtotal / Tax / Total | `npx playwright test regression/pos/order-flow/create-order.spec.ts:150` |
| 14 | Order Flow — Create Order @regression @ui › TC-ORDERFLOW-07/08/10/11/12/16/17/20/22/23/24: covered by spec — needs seeded data | `npx playwright test regression/pos/order-flow/create-order.spec.ts:158` |

### `regression/pos/order-flow/order-management.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/pos/order-flow/order-management.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-54: Filter dialog exposes Payment Method and Status checkboxes | `npx playwright test regression/pos/order-flow/order-management.spec.ts:22` |
| 2 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-55: Successful - Unsettled order exposes Receipt / Re-Open / Cancel | `npx playwright test regression/pos/order-flow/order-management.spec.ts:37` |
| 3 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-56: Successful - Settled order exposes Receipt / Refund / Partial Refund | `npx playwright test regression/pos/order-flow/order-management.spec.ts:48` |
| 4 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-57: Canceled order shows only Receipt + Cancel Information | `npx playwright test regression/pos/order-flow/order-management.spec.ts:60` |
| 5 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-58: Refunded order shows only Receipt + Refund Information | `npx playwright test regression/pos/order-flow/order-management.spec.ts:71` |
| 6 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-59: Partial Refunded order exposes Receipt + Refund + Partial Refund | `npx playwright test regression/pos/order-flow/order-management.spec.ts:81` |
| 7 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-60: Refund disabled with "Refund Not Available" when card txn not batch-closed | `npx playwright test regression/pos/order-flow/order-management.spec.ts:93` |
| 8 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-63: Refund dialog exposes service selection, method, amount, reason | `npx playwright test regression/pos/order-flow/order-management.spec.ts:106` |
| 9 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-64: Cancel Order confirm dialog opens on an Unsettled order | `npx playwright test regression/pos/order-flow/order-management.spec.ts:119` |
| 10 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-66: "Continue Re-open" shown for an order mid-reopen | `npx playwright test regression/pos/order-flow/order-management.spec.ts:131` |
| 11 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-61/62/65/67/68/69/70: refund autofill math, single-reopen-only rule, Void all, locked fields on reopen, Adjust Tip gating — require destructive mutations on shared demo orders | `npx playwright test regression/pos/order-flow/order-management.spec.ts:142` |
| 12 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-74: global Search exposes 5 result tabs | `npx playwright test regression/pos/order-flow/order-management.spec.ts:156` |
| 13 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-75: searching by Order ID opens the matching Order History row | `npx playwright test regression/pos/order-flow/order-management.spec.ts:178` |
| 14 | Order Flow — Order Management @regression @ui › TC-ORDERFLOW-71/72/73: Cash Drawer / Scan (Barcode/QR Gift Card, Order QR) — hardware/scanner dependent | `npx playwright test regression/pos/order-flow/order-management.spec.ts:189` |

### `regression/pos/order-flow/split-order.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/pos/order-flow/split-order.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Order Flow — Split Order @regression @ui › TC-ORDERFLOW-25: split icon in the cart footer opens Split Order | `npx playwright test regression/pos/order-flow/split-order.spec.ts:23` |
| 2 | Order Flow — Split Order @regression @ui › TC-ORDERFLOW-26: Equally / By Amount / By Items tabs render | `npx playwright test regression/pos/order-flow/split-order.spec.ts:36` |
| 3 | Order Flow — Split Order @regression @ui › TC-ORDERFLOW-27: Equally split defaults to 2 checks summing to the order total | `npx playwright test regression/pos/order-flow/split-order.spec.ts:49` |
| 4 | Order Flow — Split Order @regression @ui › TC-ORDERFLOW-28: Add New Check appends another check | `npx playwright test regression/pos/order-flow/split-order.spec.ts:62` |
| 5 | Order Flow — Split Order @regression @ui › TC-ORDERFLOW-31: selecting a check exposes 4 payment methods and a scoped Pay button | `npx playwright test regression/pos/order-flow/split-order.spec.ts:74` |
| 6 | Order Flow — Split Order @regression @ui › TC-ORDERFLOW-32: Receipt Details mirrors the order Subtotal/Tax/Total | `npx playwright test regression/pos/order-flow/split-order.spec.ts:90` |
| 7 | Order Flow — Split Order @regression @ui › TC-ORDERFLOW-29/30/33: By Amount validation + By Items assignment — needs a multi-item order | `npx playwright test regression/pos/order-flow/split-order.spec.ts:103` |
| 8 | Order Flow — Split Order @regression @ui › TC-ORDERFLOW-34/35/36/37/38: Split Tip — requires a settled multi-staff tipped order | `npx playwright test regression/pos/order-flow/split-order.spec.ts:109` |

### `regression/settings/TC-language-switch.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/settings/TC-language-switch.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Settings — Language switch @regression › TC-LANG-01: default language is English | `npx playwright test regression/settings/TC-language-switch.spec.ts:21` |
| 2 | Settings — Language switch @regression › TC-LANG-02: switch English → Tiếng Việt translates the app | `npx playwright test regression/settings/TC-language-switch.spec.ts:26` |
| 3 | Settings — Language switch @regression › TC-LANG-03: switch back Tiếng Việt → English | `npx playwright test regression/settings/TC-language-switch.spec.ts:46` |
| 4 | Settings — Language switch @regression › TC-LANG-04: Vietnamese persists across in-app navigation | `npx playwright test regression/settings/TC-language-switch.spec.ts:57` |
| 5 | Settings — Language switch @regression › TC-LANG-05: language persists across a full reload (known bug) | `npx playwright test regression/settings/TC-language-switch.spec.ts:83` |

### `regression/settings/business/TC-business-info-ALL.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/settings/business/TC-business-info-ALL.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Settings — Business Info suite @regression @ui › TC-BIZ-ALL: Business Info — full check | `npx playwright test regression/settings/business/TC-business-info-ALL.spec.ts:24` |

### `regression/settings/business/TC-business-info.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test regression/settings/business/TC-business-info.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Settings — Business Info @regression › TC-BIZ-01: passcode gate shows on entry | `npx playwright test regression/settings/business/TC-business-info.spec.ts:39` |
| 2 | Settings — Business Info @regression › TC-BIZ-02: correct passcode unlocks the form | `npx playwright test regression/settings/business/TC-business-info.spec.ts:45` |
| 3 | Settings — Business Info @regression › TC-BIZ-03: five sections render | `npx playwright test regression/settings/business/TC-business-info.spec.ts:57` |
| 4 | Settings — Business Info @regression › TC-BIZ-04: profile fields present | `npx playwright test regression/settings/business/TC-business-info.spec.ts:64` |
| 5 | Settings — Business Info @regression › TC-BIZ-05: Name/Legal/Phone are read-only | `npx playwright test regression/settings/business/TC-business-info.spec.ts:71` |
| 6 | Settings — Business Info @regression › TC-BIZ-06: Website/Address/City are editable | `npx playwright test regression/settings/business/TC-business-info.spec.ts:81` |
| 7 | Settings — Business Info @regression › TC-BIZ-07: Edit button is present | `npx playwright test regression/settings/business/TC-business-info.spec.ts:91` |
| 8 | Settings — Business Info @regression › TC-BIZ-08: Work Hours has all 7 weekday switches | `npx playwright test regression/settings/business/TC-business-info.spec.ts:96` |
| 9 | Settings — Business Info @regression › TC-BIZ-10: Pay Period parses to a known type | `npx playwright test regression/settings/business/TC-business-info.spec.ts:114` |
| 10 | Settings — Business Info @regression › TC-BIZ-11: Store Policies has three inputs | `npx playwright test regression/settings/business/TC-business-info.spec.ts:124` |
| 11 | Settings — Business Info @regression › TC-BIZ-12: Vietnamese scan is clean (no leftover English) | `npx playwright test regression/settings/business/TC-business-info.spec.ts:134` |

### `smoke/voltPos.smoke.spec.ts` _(project: chromium)_

Chạy cả file:

```bash
npx playwright test smoke/voltPos.smoke.spec.ts
```

| # | Test case | Command |
|---|-----------|---------|
| 1 | Volt POS — smoke @smoke › home page loads with title, staff search, and service search | `npx playwright test smoke/voltPos.smoke.spec.ts:15` |
| 2 | Volt POS — smoke @smoke › displays staff members | `npx playwright test smoke/voltPos.smoke.spec.ts:23` |
| 3 | Volt POS — smoke @smoke › displays service categories | `npx playwright test smoke/voltPos.smoke.spec.ts:30` |
| 4 | Volt POS — smoke @smoke › has navigation links to Order History and Appointment | `npx playwright test smoke/voltPos.smoke.spec.ts:36` |
| 5 | Volt POS — smoke @smoke › no critical console errors on load | `npx playwright test smoke/voltPos.smoke.spec.ts:43` |

