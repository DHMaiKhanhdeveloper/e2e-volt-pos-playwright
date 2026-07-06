---
title: Luồng code-gen — Order History (/order-history)
generated-at: 2026-07-06
skill: codegen-flow-map (3/4)
---

# Luồng code-gen — Order History (`/order-history`)

> Đầu ra **Skill 3/4** (`codegen-flow-map`): bản đồ **file → file** của quá trình sinh test
> cho màn Order History. Mọi đường dẫn dưới đây đã verify tồn tại thật (2026-07-06). Bản
> giải thích chi tiết từng đoạn code + công nghệ là **Skill 4/4** (`codegen-flow-detail`).

## Sơ đồ (file → file)

```
Linear doc (portal-order-history-ba2903a15df5)
  └─(offline fallback)→ docs/linear/portal-order-history.md
     └─(Skill 1: linear-feature-spec + quét Playwright MCP)
        → docs/features/order-history.md
           └─(Skill 2: linear-testcase-gen + quét Playwright MCP)
              → docs/testcases/order-history-testcases.md   (TC-OH-01..21)
                 ├─→ src/pages/pos/OrderHistoryPage.ts       (page object, extends BasePage — MỞ RỘNG)
                 │      imports:
                 │       ├─ @pages/BasePage                  → src/pages/BasePage.ts
                 │       ├─ @components/modal/PasscodeDialog  → src/components/modal/PasscodeDialog.ts
                 │       └─ @utils/orderDetail                → src/utils/orderDetail.ts
                 └─→ tests/regression/order-history/TC-order-history.spec.ts   (spec, 20 test())
                        │  imports:
                        │   ├─ @fixtures/index  → src/fixtures/index.ts → pages.fixture.ts (orderHistoryPage)
                        │   └─ @/types/testTags → src/types/testTags.ts (Tag)
                        └─(khi `npx playwright test`)→ reports/html · reports/json · reports/junit · reports/allure-results
```

## Bảng mắt xích

| #   | File nguồn                                                                                                                 | →   | File đích                                                                                                                | Khâu tạo                | Ghi chú                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Linear `portal-order-history` doc                                                                                          | →   | [docs/linear/portal-order-history.md](../linear/portal-order-history.md)                                                 | có sẵn (offline mirror) | Nguồn spec — Linear MCP chưa auth nên dùng bản offline                                                |
| 2   | [docs/linear/portal-order-history.md](../linear/portal-order-history.md)                                                   | →   | [docs/features/order-history.md](../features/order-history.md)                                                           | Skill 1 (feature-spec)  | Tổng hợp business rules + quét UI thật qua Playwright MCP (list + detail panel)                       |
| 3   | [docs/features/order-history.md](../features/order-history.md)                                                             | →   | [docs/testcases/order-history-testcases.md](../testcases/order-history-testcases.md)                                     | Skill 2 (testcase-gen)  | 21 test case; mỗi TC map 1-1 một `test()` (trừ TC-OH-21 i18n)                                         |
| 4   | [docs/testcases/order-history-testcases.md](../testcases/order-history-testcases.md)                                       | →   | [src/pages/pos/OrderHistoryPage.ts](../../src/pages/pos/OrderHistoryPage.ts)                                             | Skill 2 (mở rộng)       | Thêm locator toolbar/filter/receipt + action đọc-only (search/openFilter/openReceipt/openFirstOrder…) |
| 5   | [docs/testcases/order-history-testcases.md](../testcases/order-history-testcases.md)                                       | →   | [tests/regression/order-history/TC-order-history.spec.ts](../../tests/regression/order-history/TC-order-history.spec.ts) | Skill 2                 | 20 `test()` (TC-OH-01..20); chạy pass 20/20                                                           |
| 6   | [src/pages/pos/OrderHistoryPage.ts](../../src/pages/pos/OrderHistoryPage.ts)                                               | →   | [src/fixtures/pages.fixture.ts](../../src/fixtures/pages.fixture.ts)                                                     | có sẵn                  | Fixture `orderHistoryPage` (đã đăng ký từ trước — Skill 2 KHÔNG sửa)                                  |
| 7   | [src/fixtures/pages.fixture.ts](../../src/fixtures/pages.fixture.ts) + [api.fixture.ts](../../src/fixtures/api.fixture.ts) | →   | [src/fixtures/index.ts](../../src/fixtures/index.ts)                                                                     | có sẵn                  | `mergeTests` → export `test`/`expect` cho spec                                                        |
| 8   | spec                                                                                                                       | →   | reports/{html,json,junit,allure-results}                                                                                 | khi chạy                | Reporters khai báo trong [playwright.config.ts](../../playwright.config.ts)                           |

## Phụ thuộc phụ (import thật)

| Import                             | File thật                                                                              | Vai trò                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `@fixtures/index`                  | [src/fixtures/index.ts](../../src/fixtures/index.ts)                                   | `test`, `expect` (fixtures gộp)                                    |
| `@/types/testTags`                 | [src/types/testTags.ts](../../src/types/testTags.ts)                                   | `Tag` (@regression/@ui)                                            |
| `@pages/BasePage`                  | [src/pages/BasePage.ts](../../src/pages/BasePage.ts)                                   | `goto()`, `waitForReady()`, locator factory cơ sở                  |
| `@components/modal/PasscodeDialog` | [src/components/modal/PasscodeDialog.ts](../../src/components/modal/PasscodeDialog.ts) | Nhập passcode khi void/refund (dùng trong cancelOrder/refundOrder) |
| `@utils/orderDetail`               | [src/utils/orderDetail.ts](../../src/utils/orderDetail.ts)                             | `parseOrderDetailFromText`, type `OrderDetail` (đọc breakdown đơn) |

## Ghi chú

- **Mắt xích đã tồn tại từ trước** (không phải skill này sinh): page object `OrderHistoryPage`
  đã có sẵn (phục vụ cluster refund/cancel) và **đã đăng ký** trong `pages.fixture.ts`; Skill 2 chỉ
  **mở rộng** thêm locator/action đọc-only + helper filter sub-popover, **không** sửa fixture.
- **Thư mục spec mới**: `tests/regression/order-history/` do Skill 2 tạo (trước đó chưa có).
- **Không có helper `src/utils/i18nOrderHistory.ts` trong luồng functional này** — file đó thuộc
  luồng i18n riêng ([TC-i18n-order-history-vietnamese-scan.spec.ts](../../tests/regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts)),
  sẽ là đầu ra của Skill i18n-vietnamese-scan, không phải spec functional này.
- **Report sinh khi chạy** `npx playwright test tests/regression/order-history/`. Lần chạy thật:
  **20/20 pass** (dev server `:1420` có tắt/bật lại giữa phiên nhưng cuối cùng chạy đủ).
