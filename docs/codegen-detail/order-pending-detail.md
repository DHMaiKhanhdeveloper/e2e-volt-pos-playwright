---
title: Chi tiết luồng code-gen — Order Pending (/order-pending)
expands: docs/codegen-flow/order-pending-flow.md
generated-at: 2026-07-06
skill: codegen-flow-detail (4/4)
---

# Chi tiết luồng code-gen — Order Pending (`/order-pending`)

> Đầu ra **Skill 4/4** (`codegen-flow-detail`): mở rộng [bản map 3/4](../codegen-flow/order-pending-flow.md)
> xuống mức **từng đoạn code + công nghệ**. Mọi đoạn trích copy đúng từ file thật (kèm số dòng).

## Tổng quan công nghệ

| Công nghệ                                       | Vai trò trong luồng gen                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Linear MCP** (`linear-server`)                | Đọc spec gốc; phiên này chưa auth → fallback `docs/linear/order-pending.md`                                                     |
| **Playwright MCP** (`mcp__playwright__*`)       | Quét UI thật (`browser_navigate` + `browser_snapshot`) để lấy role/label/placeholder → nền tảng cho locator, chống bịa selector |
| **Playwright Test** (`@playwright/test`)        | Runner chạy spec; `expect` web-first assertions (auto-retry)                                                                    |
| **Page Object Model** (`BasePage`)              | Đóng gói locator + action theo màn hình                                                                                         |
| **Custom fixtures** (`mergeTests`)              | Bơm `orderPendingPage` vào test qua DI                                                                                          |
| **TypeScript path alias**                       | `@fixtures`, `@pages`, `@constants`, `@/` — map trong `tsconfig.json`                                                           |
| **Tag system** (`Tag`)                          | Gắn `@regression`/`@ui`/`@smoke` vào tên test để lọc khi chạy                                                                   |
| **Reporters** (list/html/json/junit/**allure**) | Sinh report khi `npx playwright test`                                                                                           |
| **ESLint + Prettier**                           | `npx eslint --fix` verify style sau khi gen                                                                                     |

## Chi tiết theo file

### 1. `docs/linear/order-pending.md` — nguồn spec

- **Vai trò:** bản mirror offline của Linear doc `order-pending-caa07c054f23`. Cung cấp
  định nghĩa Pending Order, 3 nguồn tạo đơn, lifecycle, offline mode.
- **Công nghệ:** Markdown + frontmatter (`linearId`, `url`). Đọc bằng `Read`. Đây là fallback
  khi **Linear MCP** chưa xác thực trong phiên non-interactive.

### 2. `docs/features/order-pending.md` — feature spec (Skill 1)

- **Vai trò:** tổng hợp spec + đối chiếu với UI thật đã quét.
- **Công nghệ dùng để gen:** **Playwright MCP** — `browser_navigate('http://localhost:1420/order-pending')`
  rồi `browser_snapshot()` trả accessibility tree. Từ tree rút ra card fields và toolbar. Ảnh
  `order-pending-assets/queue.png` chụp bằng `browser_take_screenshot`.
- **Bằng chứng quét (trích snapshot MCP):**
  ```yaml
  - button "OD260706-01297238 In Use Unknown N/A 0 Pts 07:21 PM Processing Regular Pedicure Linda"
  - textbox "Search order ID, customer name or phone"
  - combobox: Latest # options: Latest / Oldest
  - button "Quick Checkout"
  ```

### 3. `src/pages/pos/OrderPendingPage.ts` — page object (Skill 2)

- **Vai trò:** locator + action cho màn hình; **không** chứa assert nghiệp vụ (trừ helper
  `expect*` kế thừa sẵn có).
- **Đoạn — hằng regex + kế thừa BasePage** ([:6-13](../../src/pages/pos/OrderPendingPage.ts#L6-L13)):
  ```ts
  export const ORDER_CODE_RE = /OD\d{6}-\d{8}/;
  export type SortOrder = 'Latest' | 'Oldest';
  export class OrderPendingPage extends BasePage {
    protected readonly path = Urls.ORDER_PENDING;
  ```

  - **Giải thích:** `path` được `BasePage.goto()` dùng để `page.goto(path)`. `ORDER_CODE_RE`
    chuẩn hoá format mã đơn thấy khi quét (`OD######-########`).
- **Đoạn — locator bắt nguồn từ scan** ([:39-52](../../src/pages/pos/OrderPendingPage.ts#L39-L52)):
  ```ts
  this.searchInput = page.getByRole('textbox', {
    name: /Search order ID, customer name or phone/i,
  });
  this.sortCombobox = page.getByRole('combobox').filter({ hasText: /Latest|Oldest/ });
  this.quickCheckoutButton = page.getByRole('button', { name: 'Quick Checkout' });
  ```

  - **Công nghệ:** Playwright **role-based locator** (`getByRole`) + `.filter({hasText})` — bền hơn
    CSS selector; đúng chuỗi lấy từ snapshot MCP (không bịa).
- **Đoạn — action `setSort` / `sortOptions`** ([:118-140](../../src/pages/pos/OrderPendingPage.ts#L118-L140)):
  ```ts
  async setSort(order: SortOrder): Promise<void> {
    await this.sortCombobox.click();
    await this.page.getByRole('option', { name: order, exact: true }).click();
  }
  ```

  - **Giải thích:** mô phỏng combobox tuỳ biến (click mở listbox → click `option`). `role=option`
    xác nhận từ snapshot (`option "Latest" [selected]`, `option "Oldest"`).

### 4. `tests/regression/orders/order-pending/TC-order-pending.spec.ts` — spec (Skill 2)

- **Vai trò:** mỗi TC trong file testcase `.md` → một `test()`.
- **Đoạn — import qua alias + fixtures** ([:1-4](../../tests/regression/orders/order-pending/TC-order-pending.spec.ts#L1-L4)):
  ```ts
  import { test, expect } from '@fixtures/index';
  import { Tag } from '@/types/testTags';
  import { Urls } from '@constants/urls';
  import { ORDER_CODE_RE } from '@pages/pos/OrderPendingPage';
  ```

  - **Công nghệ:** **TS path alias** (resolve qua `tsconfig.json` "paths" + `tsconfig-paths`/vite).
    `test` là bản `mergeTests(pagesFixture, apiFixture)` nên có sẵn `orderPendingPage`.
- **Đoạn — describe + beforeEach + tag** ([:15-18](../../tests/regression/orders/order-pending/TC-order-pending.spec.ts#L15-L18)):
  ```ts
  test.describe(`Order Pending — queue ${Tag.REGRESSION} ${Tag.UI}`, () => {
    test.beforeEach(async ({ orderPendingPage }) => {
      await orderPendingPage.goto();
    });
  ```

  - **Công nghệ:** template string nhúng `Tag` → lọc bằng `--grep @regression`. `beforeEach`
    dùng **fixture DI** `orderPendingPage` (không `new` thủ công).
- **Đoạn — TC dựa trên dữ liệu quét, skip an toàn** ([:40-53](../../tests/regression/orders/order-pending/TC-order-pending.spec.ts#L40-L53)):
  ```ts
  const count = await orderPendingPage.orderCardCount();
  test.skip(count === 0, 'No pending orders to search');
  const code = await orderPendingPage.orderCodeAt(0);
  const fragment = code!.split('-')[1]; // the 8-digit suffix
  await orderPendingPage.search(fragment);
  await expect(orderPendingPage.orderCards()).toHaveCount(1);
  ```

  - **Giải thích:** hành vi search này đã **verify live qua Playwright MCP** (gõ `01297238` →
    còn đúng 1 card). `test.skip` runtime tránh fail giả khi shop rỗng.
  - **Công nghệ:** `expect(locator).toHaveCount()` — web-first assertion auto-retry tới timeout.

### 5. `src/fixtures/pages.fixture.ts` + `index.ts` — DI (có sẵn)

- **Đoạn** ([pages.fixture.ts:36-38](../../src/fixtures/pages.fixture.ts#L36-L38)):
  ```ts
  orderPendingPage: async ({ page }, use) => {
    await use(new OrderPendingPage(page));
  },
  ```

  - **Công nghệ:** Playwright `base.extend<PagesFixture>` — tạo instance page object mỗi test,
    tự dọn sau `use`. `index.ts` gộp page + api fixture bằng `mergeTests`.

### 6. `playwright.config.ts` — cấu hình chạy

- **Đoạn** ([:34-43](../../playwright.config.ts#L34-L43)): reporters `list/html/json/junit/allure-playwright`.
- **Đoạn** ([:45-58](../../playwright.config.ts#L45-L58)): `baseURL: env.BASE_URL` (mặc định
  `http://localhost:1420`), `timezoneId` theo shop → "Today" của app khớp date math của test.
  - **Công nghệ:** Playwright config + `loadEnv()` (dotenv). `trace/screenshot/video: 'on'` để
    dashboard replay.

## So với bản map (Skill 3)

- Skill 3 chỉ nêu **file → file**; bản này đi tới **đoạn code cụ thể + số dòng** và **công nghệ**
  đứng sau từng đoạn (role locator, fixture DI, tag filter, web-first assertion, MCP scan).
- Bổ sung **bằng chứng quét MCP** (yaml snapshot) chứng minh locator không bịa.
- Ghi rõ điểm **có sẵn vs sinh mới**: `pages.fixture.ts`/`index.ts`/`playwright.config.ts` là hạ
  tầng có sẵn; Skill 2 chỉ thêm locator/action vào `OrderPendingPage.ts` và sinh mới spec.
