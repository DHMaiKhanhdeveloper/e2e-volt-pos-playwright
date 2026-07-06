---
title: Luồng code-gen — Staff Income (/incomes/income-staff)
generated-at: 2026-07-06
skill: codegen-flow-map (3/4)
---

# Luồng code-gen — Staff Income (`/incomes/income-staff`)

> Đầu ra **Skill 3/4** (`codegen-flow-map`): bản đồ **file → file**. Đây là màn **được sinh mới hoàn toàn**
> trong phiên này (page object + spec chưa từng tồn tại). Đường dẫn đã verify (2026-07-06).

## Sơ đồ (file → file)

```
Linear doc "Income Report" (income-report-cd80210c48f3)
  └─(offline fallback)→ docs/linear/income-report.md   (mục Staff Income)
     └─(Skill 1: linear-feature-spec + quét Playwright MCP)
        → docs/features/income-staff.md
           └─(Skill 2: linear-testcase-gen + quét Playwright MCP)
              → docs/testcases/income-staff-testcases.md   (TC-IST-01..18)
                 ├─→ src/pages/pos/IncomeStaffPage.ts   ★ SINH MỚI (page object, extends BasePage)
                 │      imports:
                 │       ├─ @pages/BasePage        → src/pages/BasePage.ts
                 │       ├─ @data/static/shops     → src/data/static/shops.ts (shopTimezone)
                 │       └─ @utils/dateUtils       → src/utils/dateUtils.ts (zonedDayStartUnix/EndUnix)
                 │   └─(wire vào)→ src/fixtures/pages.fixture.ts   ★ THÊM incomeStaffPage
                 └─→ tests/regression/incomes/income-staff/TC-IST-staff-income.spec.ts   ★ SINH MỚI (18 test())
                        │  imports:
                        │   ├─ @fixtures/index   → src/fixtures/index.ts → pages.fixture.ts (incomeStaffPage, passcodeDialog)
                        │   ├─ @/types/testTags  → src/types/testTags.ts (Tag.REGRESSION)
                        │   └─ @data/static/staff → src/data/static/staff.ts (OWNER_PASSCODE)
                        └─(khi `npx playwright test`)→ reports/html · reports/json · reports/junit · reports/allure-results
```

## Bảng mắt xích

| #   | File nguồn               | →   | File đích                                                                                                                                    | Khâu tạo        | Ghi chú                                                |
| --- | ------------------------ | --- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------ |
| 1   | Linear "Income Report"   | →   | [docs/linear/income-report.md](../linear/income-report.md)                                                                                   | offline mirror  | mục Staff Income                                       |
| 2   | linear/income-report.md  | →   | [docs/features/income-staff.md](../features/income-staff.md)                                                                                 | Skill 1         | Quét empty-state + spec 2 biến thể (Commission/Salary) |
| 3   | features/income-staff.md | →   | [docs/testcases/income-staff-testcases.md](../testcases/income-staff-testcases.md)                                                           | Skill 2         | 18 TC (12 structural + 6 [data] tự-skip)               |
| 4   | testcases.md             | →   | [src/pages/pos/IncomeStaffPage.ts](../../src/pages/pos/IncomeStaffPage.ts)                                                                   | ★ Skill 2 (mới) | Search + stat bar + listing + detail                   |
| 5   | IncomeStaffPage          | →   | [src/fixtures/pages.fixture.ts](../../src/fixtures/pages.fixture.ts)                                                                         | ★ Skill 2 (mới) | Đăng ký fixture `incomeStaffPage`                      |
| 6   | testcases.md             | →   | [tests/regression/incomes/income-staff/TC-IST-staff-income.spec.ts](../../tests/regression/incomes/income-staff/TC-IST-staff-income.spec.ts) | ★ Skill 2 (mới) | 18 `test()`; 9 structural đã chạy PASS                 |
| 7   | spec                     | →   | reports/html, reports/json, reports/junit, reports/allure-results                                                                            | runtime         | Reporters                                              |

## Ghi chú

- **Mắt xích trước đây thiếu (nay đã bổ sung):** page object, fixture entry, spec — tất cả sinh mới ở phiên này.
- Khác income-summary/daily: **không** dùng util reconciliation (`incomeCalcCore`, `staffPayout`) — mới ở mức structural. Các TC-IST [data] để ngỏ cho vòng sau khi có ngày phát sinh staff, sẽ dùng `payPeriod`/`staffPayout` để đối chiếu công thức.
- Report gộp-1-test là đầu ra **Skill 6** → `reports/income-staff/`.
