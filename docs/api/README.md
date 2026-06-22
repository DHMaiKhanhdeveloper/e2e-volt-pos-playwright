# Volt POS — Income Reports API Reference

GraphQL APIs powering the **Daily Sale Report** and **Income Summary** screens,
extracted from the Volt POS app source (`volt-pos/src/routes/_app/incomes/**`).

These are the operations the e2e suite reconciles the UI against (see
`src/api/services/*`). All amounts are **integer cents**.

## Documents

| File                                                 | Screen            | Route                     |
| ---------------------------------------------------- | ----------------- | ------------------------- |
| [daily-sale-report-api.md](daily-sale-report-api.md) | Daily Sale Report | `/incomes/income-daily`   |
| [income-summary-api.md](income-summary-api.md)       | Income Summary    | `/incomes/income-summary` |

## Shared concepts

### Access gate

Both routes are wrapped in `PermissionProtectedRoute` — a **passcode dialog**
(owner passcode) gates the screen on the client. It is not a GraphQL call; the
report queries only fire after the gate unlocks.

### Merchant timezone

Days are bucketed by the **merchant timezone** (e.g. `Asia/Ho_Chi_Minh`,
UTC+7), not the browser/runner timezone. A "day" therefore spans
`00:00→23:59:59` in merchant-local time, which converts to a UTC instant
offset from local midnight.

### Live vs. settled (the two-query pattern)

Every income screen splits its data across two backend sources:

|             | Source                                            | When used                                                              | Date arg                                                                                                 |
| ----------- | ------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Live**    | `storeDailyIncomeLive(reportDate)`                | The selected range **includes today** (today has no finalized row yet) | `reportDate`: **RFC3339** start-of-merchant-day in UTC (e.g. `2026-06-09T17:00:00+00:00`)                |
| **Settled** | `reportStoreDailyIncomeList(where: date gte/lte)` | Any **past** day in the range                                          | `from`/`to`: **`YYYY-MM-DD`** (merchant-local date); some queries also take `fromUTC`/`toUTC` as RFC3339 |

When a range ends _today_, the app fetches settled rows for the past days and
**merges** the live row for today (see `use-income-summary.ts`).

> ⚠️ The backend rejects a bare `YYYY-MM-DD` for `reportDate` (RFC3339 only).
> This caused the e2e `fetch`-level failures fixed in `ReportService`.

### Date-format summary

- `reportDate` → RFC3339 timestamp (`…T00:00:00+07:00` / `…Z`).
- `from` / `to` (settled list) → `YYYY-MM-DD`.
- `fromUTC` / `toUTC` (order filters) → RFC3339.
- URL search params `from` / `to` → **Unix seconds** (merchant-day boundaries).
