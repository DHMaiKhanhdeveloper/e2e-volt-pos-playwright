---
title: Luồng code-gen — Order Pending (/order-pending)
generated-at: 2026-07-06
skill: codegen-flow-map (3/4)
---

# Luồng code-gen — Order Pending (`/order-pending`)

> Đầu ra **Skill 3/4** (`codegen-flow-map`): bản đồ **file → file** của quá trình sinh test
> cho màn Order Pending. Mọi đường dẫn dưới đây đã verify tồn tại thật (2026-07-06). Bản
> giải thích chi tiết từng đoạn code + công nghệ là **Skill 4/4** (`codegen-flow-detail`).

## Sơ đồ (file → file)

```
Linear doc (order-pending-caa07c054f23)
  └─(offline fallback)→ docs/linear/order-pending.md
     └─(Skill 1: linear-feature-spec + quét Playwright MCP)
        → docs/features/order-pending.md  ─┬─ ảnh: docs/features/order-pending-assets/queue.png
           └─(Skill 2: linear-testcase-gen + quét Playwright MCP)
              → docs/testcases/order-pending-testcases.md   (TC-OP-01..11)
                 ├─→ src/pages/pos/OrderPendingPage.ts       (page object, extends BasePage)
                 └─→ tests/regression/orders/order-pending/TC-order-pending.spec.ts  (spec)
                        │  imports:
                        │   ├─ @fixtures/index  → src/fixtures/pages.fixture.ts (orderPendingPage)
                        │   ├─ @/types/testTags → src/types/testTags.ts (Tag)
                        │   ├─ @constants/urls  → src/constants/urls.ts (Urls)
                        │   └─ @pages/pos/OrderPendingPage (ORDER_CODE_RE)
                        └─(khi `npx playwright test`)→ reports/html · reports/json · reports/junit · reports/allure-results
```

## Bảng mắt xích

| #   | File nguồn                                                                                                                 | →   | File đích                                                                                                                              | Khâu tạo                | Ghi chú                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------- |
| 1   | Linear `order-pending` doc                                                                                                 | →   | [docs/linear/order-pending.md](../linear/order-pending.md)                                                                             | có sẵn (offline mirror) | Nguồn spec — Linear MCP chưa auth nên dùng bản offline                      |
| 2   | [docs/linear/order-pending.md](../linear/order-pending.md)                                                                 | →   | [docs/features/order-pending.md](../features/order-pending.md)                                                                         | Skill 1 (feature-spec)  | Tổng hợp spec + quét UI thật qua Playwright MCP                             |
| 3   | quét Playwright MCP                                                                                                        | →   | [docs/features/order-pending-assets/queue.png](../features/order-pending-assets/queue.png)                                             | Skill 1                 | Ảnh chụp queue                                                              |
| 4   | [docs/features/order-pending.md](../features/order-pending.md)                                                             | →   | [docs/testcases/order-pending-testcases.md](../testcases/order-pending-testcases.md)                                                   | Skill 2 (testcase-gen)  | 11 test case, mỗi TC map 1-1 một `test()`                                   |
| 5   | [docs/testcases/order-pending-testcases.md](../testcases/order-pending-testcases.md)                                       | →   | [src/pages/pos/OrderPendingPage.ts](../../src/pages/pos/OrderPendingPage.ts)                                                           | Skill 2                 | Thêm locator toolbar + card + action (search/setSort/…)                     |
| 6   | [docs/testcases/order-pending-testcases.md](../testcases/order-pending-testcases.md)                                       | →   | [tests/regression/orders/order-pending/TC-order-pending.spec.ts](../../tests/regression/orders/order-pending/TC-order-pending.spec.ts) | Skill 2                 | 11 `test()` (TC-OP-01..11)                                                  |
| 7   | [src/pages/pos/OrderPendingPage.ts](../../src/pages/pos/OrderPendingPage.ts)                                               | →   | [src/fixtures/pages.fixture.ts](../../src/fixtures/pages.fixture.ts)                                                                   | có sẵn                  | Fixture `orderPendingPage` (đã đăng ký từ trước)                            |
| 8   | [src/fixtures/pages.fixture.ts](../../src/fixtures/pages.fixture.ts) + [api.fixture.ts](../../src/fixtures/api.fixture.ts) | →   | [src/fixtures/index.ts](../../src/fixtures/index.ts)                                                                                   | có sẵn                  | `mergeTests` → export `test`/`expect` cho spec                              |
| 9   | spec                                                                                                                       | →   | reports/{html,json,junit,allure-results}                                                                                               | khi chạy                | Reporters khai báo trong [playwright.config.ts](../../playwright.config.ts) |

## Phụ thuộc phụ (spec import)

| Import trong spec                   | File thật                                                                    | Vai trò                              |
| ----------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------ |
| `@fixtures/index`                   | [src/fixtures/index.ts](../../src/fixtures/index.ts)                         | `test`, `expect` (fixtures gộp)      |
| `@/types/testTags`                  | [src/types/testTags.ts](../../src/types/testTags.ts)                         | `Tag` (@regression/@ui/@smoke)       |
| `@constants/urls`                   | [src/constants/urls.ts](../../src/constants/urls.ts)                         | `Urls` (ORDER_HISTORY, APPOINTMENT…) |
| `@pages/pos/OrderPendingPage`       | [src/pages/pos/OrderPendingPage.ts](../../src/pages/pos/OrderPendingPage.ts) | `ORDER_CODE_RE`, class page object   |
| `@pages/BasePage` (qua page object) | [src/pages/BasePage.ts](../../src/pages/BasePage.ts)                         | `goto()`, `waitForReady()` cơ sở     |

## Ghi chú

- **Mắt xích đã tồn tại từ trước** (không phải skill này sinh): page object `OrderPendingPage`
  đã có sẵn và **đã đăng ký** trong `pages.fixture.ts`; Skill 2 chỉ **mở rộng** thêm locator/action,
  không cần sửa fixture.
- **Không có helper riêng** trong `src/utils/` cho luồng order-pending (khác với luồng i18n dùng
  `src/utils/i18nScan.ts`). Nếu sau này tách logic parse card ra util, thêm mắt xích tại đây.
- **Report chỉ sinh khi chạy** `npx playwright test`. Lần chạy thử bị chặn do dev server `:1420`
  tắt giữa phiên (môi trường), không liên quan tới code đã gen.
