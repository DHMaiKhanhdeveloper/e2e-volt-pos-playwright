---
title: Luồng code-gen — Daily Sale Report (/incomes/income-daily)
generated-at: 2026-07-06
skill: codegen-flow-map (3/4)
---

# Luồng code-gen — Daily Sale Report (`/incomes/income-daily`)

> Đầu ra **Skill 3/4** (`codegen-flow-map`): bản đồ **file → file** của quá trình sinh test cho màn
> Daily Sale Report. Mọi đường dẫn đã verify tồn tại thật (2026-07-06). Bản giải thích chi tiết từng
> đoạn code + công nghệ là **Skill 4/4** (`codegen-flow-detail`).

## Sơ đồ (file → file)

```
Linear doc "Income Report" (income-report-cd80210c48f3)
  └─(offline fallback)→ docs/linear/income-report.md   (mục Daily Sale Report)
     └─(Skill 1: linear-feature-spec + quét Playwright MCP)
        → docs/features/income-daily.md
           └─(Skill 2: linear-testcase-gen + quét Playwright MCP)
              → docs/testcases/income-daily-testcases.md   (TC-1..TC-44 — tài liệu-hoá code có sẵn)
                 ├─→ src/pages/pos/DailySaleReportPage.ts   (page object, extends BasePage)
                 │      imports:
                 │       ├─ @pages/BasePage            → src/pages/BasePage.ts
                 │       ├─ @utils/moneyUtils          → src/utils/moneyUtils.ts
                 │       ├─ @utils/incomeFromOrders    → src/utils/incomeFromOrders.ts
                 │       ├─ @utils/orderDetail         → src/utils/orderDetail.ts
                 │       ├─ @utils/dateUtils           → src/utils/dateUtils.ts
                 │       └─ @data/static/shops         → src/data/static/shops.ts
                 └─→ tests/regression/incomes/daily-sale-report/TC*.spec.ts   (13 file, 44 test())
                        │  imports:
                        │   ├─ @fixtures/index  → src/fixtures/index.ts → pages.fixture.ts (dailySaleReportPage, passcodeDialog)
                        │   ├─ @/types/testTags → src/types/testTags.ts (Tag)
                        │   └─ @data/static/staff → src/data/static/staff.ts (OWNER_PASSCODE)
                        └─(khi `npx playwright test`)→ reports/html · reports/json · reports/junit · reports/allure-results
```

## Bảng mắt xích

| #   | File nguồn                                                   | →   | File đích                                                                          | Khâu tạo                | Ghi chú                                                    |
| --- | ------------------------------------------------------------ | --- | ---------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| 1   | Linear "Income Report"                                       | →   | [docs/linear/income-report.md](../linear/income-report.md)                         | có sẵn (offline mirror) | Linear MCP chưa auth → dùng bản offline                    |
| 2   | [docs/linear/income-report.md](../linear/income-report.md)   | →   | [docs/features/income-daily.md](../features/income-daily.md)                       | Skill 1                 | Tổng hợp business rules + quét UI thật (KPI cards, panels) |
| 3   | [docs/features/income-daily.md](../features/income-daily.md) | →   | [docs/testcases/income-daily-testcases.md](../testcases/income-daily-testcases.md) | Skill 2                 | 44 TC; tài liệu-hoá coverage đã có (không đè code)         |
| 4   | testcases.md                                                 | →   | [src/pages/pos/DailySaleReportPage.ts](../../src/pages/pos/DailySaleReportPage.ts) | có sẵn                  | Page object 2 cột (cards+chart / table+details)            |
| 5   | testcases.md                                                 | →   | tests/regression/incomes/daily-sale-report/ (13 spec)                              | có sẵn                  | 44 `test()` chia cluster                                   |
| 6   | spec                                                         | →   | reports/html, reports/json, reports/junit, reports/allure-results                  | runtime                 | Playwright reporters (playwright.config.ts)                |

## Ghi chú

- **Không có mắt xích thiếu** — màn này đã có đủ page object + spec trước khi chạy skill.
- Report gộp-1-test kiểu Home là đầu ra riêng của **Skill 6** (`screen-suite-report`) → `reports/income-daily/`.
