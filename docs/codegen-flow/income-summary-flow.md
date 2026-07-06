---
title: Luồng code-gen — Income Summary (/incomes/income-summary)
generated-at: 2026-07-06
skill: codegen-flow-map (3/4)
---

# Luồng code-gen — Income Summary (`/incomes/income-summary`)

> Đầu ra **Skill 3/4** (`codegen-flow-map`): bản đồ **file → file**. Đường dẫn đã verify (2026-07-06).

## Sơ đồ (file → file)

```
Linear doc "Income Report" (income-report-cd80210c48f3)
  └─(offline fallback)→ docs/linear/income-report.md   (mục Income Summary)
     └─(Skill 1: linear-feature-spec + quét Playwright MCP)
        → docs/features/income-summary.md
           └─(Skill 2: linear-testcase-gen + quét Playwright MCP)
              → docs/testcases/income-summary-testcases.md   (~70 TC — tài liệu-hoá code có sẵn)
                 ├─→ src/pages/pos/IncomeSummaryPage.ts   (page object, extends BasePage)
                 │      imports:
                 │       ├─ @pages/BasePage       → src/pages/BasePage.ts
                 │       ├─ @data/static/shops    → src/data/static/shops.ts
                 │       └─ @utils/dateUtils      → src/utils/dateUtils.ts
                 ├─→ tests/regression/incomes/income-summary/            (15 spec + incomeSummary.helpers.ts)
                 ├─→ tests/regression/incomes/income-summary-past/       (TC-PAST-pipeline)
                 ├─→ tests/regression/incomes/income-summary-reconciliation/  (4 spec TC-RECON-*)
                 └─→ tests/regression/incomes/income-summary-ui/         (TC-IS-UI)
                        │  reports engine + helpers:
                        │   ├─ @utils/incomeSummaryDetail            → src/utils/incomeSummaryDetail.ts
                        │   ├─ @utils/incomeSummaryFromCompensation  → src/utils/incomeSummaryFromCompensation.ts
                        │   ├─ @utils/incomeSummaryHtml              → src/utils/incomeSummaryHtml.ts
                        │   ├─ @utils/incomeSummaryUi                → src/utils/incomeSummaryUi.ts
                        │   ├─ @utils/staffPayout                    → src/utils/staffPayout.ts
                        │   ├─ @utils/payPeriod                      → src/utils/payPeriod.ts
                        │   ├─ @utils/sectionsFromScrape             → src/utils/sectionsFromScrape.ts
                        │   ├─ @utils/incomeFromOrders               → src/utils/incomeFromOrders.ts
                        │   ├─ @utils/comparePage · @utils/reportPages · @utils/moneyUtils · @utils/dateUtils
                        │   └─ src/reports/incomeCalcCore.ts          (công thức lõi)
                        └─(khi `npx playwright test`)→ reports/html · reports/json · reports/junit · reports/allure-results · reports/income-summary/
```

## Bảng mắt xích

| #   | File nguồn                 | →   | File đích                                                                              | Khâu tạo       | Ghi chú                                 |
| --- | -------------------------- | --- | -------------------------------------------------------------------------------------- | -------------- | --------------------------------------- |
| 1   | Linear "Income Report"     | →   | [docs/linear/income-report.md](../linear/income-report.md)                             | offline mirror | mục Income Summary                      |
| 2   | linear/income-report.md    | →   | [docs/features/income-summary.md](../features/income-summary.md)                       | Skill 1        | Quét cả panel chi tiết (5 khối)         |
| 3   | features/income-summary.md | →   | [docs/testcases/income-summary-testcases.md](../testcases/income-summary-testcases.md) | Skill 2        | ~70 TC theo nhóm section                |
| 4   | testcases.md               | →   | [src/pages/pos/IncomeSummaryPage.ts](../../src/pages/pos/IncomeSummaryPage.ts)         | có sẵn         | Scrape detail sections + reconciliation |
| 5   | testcases.md               | →   | tests/regression/incomes/income-summary{,-past,-reconciliation,-ui}/                   | có sẵn         | 4 folder spec                           |
| 6   | spec + helpers             | →   | src/reports/incomeCalcCore.ts, src/utils/incomeSummary\*.ts                            | có sẵn         | Engine tính lại & so khớp               |
| 7   | spec                       | →   | reports/\* + reports/income-summary/                                                   | runtime        | Reporters + report riêng                |

## Ghi chú

- Đây là màn có chuỗi util **dày nhất** trong nhóm Income (reconciliation nhiều nguồn: UI ↔ orders ↔ compensation ↔ DB).
- Report gộp-1-test là đầu ra **Skill 6** → `reports/income-summary/`.
