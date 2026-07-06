---
title: Chi tiết luồng code-gen — Order History (/order-history)
expands: docs/codegen-flow/order-history-flow.md
generated-at: 2026-07-06
skill: codegen-flow-detail (4/4)
---

# Chi tiết luồng code-gen — Order History (`/order-history`)

> Đầu ra **Skill 4/4** (`codegen-flow-detail`): mở rộng bản đồ file→file của
> [order-history-flow.md](../codegen-flow/order-history-flow.md) thành giải thích **từng đoạn
> code + công nghệ**. Mọi đoạn trích copy đúng từ file thật (kèm số dòng, verify 2026-07-06).

## Tổng quan công nghệ

| Công nghệ                                 | Vai trò trong luồng gen                                                                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Linear (MCP `linear-server`)**          | Đọc spec gốc; phiên này chưa auth → fallback bản offline `docs/linear/portal-order-history.md`                                                           |
| **Playwright MCP** (`mcp__playwright__*`) | Quét UI thật khi gen: `browser_navigate`, `browser_snapshot` (a11y tree), `browser_click`, `browser_evaluate` → lấy label/role/selector THẬT (không bịa) |
| **Playwright Test** (`@playwright/test`)  | Runner chạy spec; `expect`, `test()`, `test.describe`, `test.skip`, locator engine (`getByRole`/`getByText`/`getByPlaceholder`)                          |
| **Page Object Model**                     | `OrderHistoryPage extends BasePage` — gói locator + action, spec không chạm DOM trực tiếp                                                                |
| **Custom fixtures** (`mergeTests`)        | `@fixtures/index` bơm `orderHistoryPage` vào mỗi test                                                                                                    |
| **TypeScript path alias**                 | `@fixtures`, `@pages`, `@utils`, `@/` (khai trong `tsconfig.json` → resolve khi `tsc`/Playwright chạy)                                                   |
| **shadcn/Radix UI** (app đích)            | Dialog/Popover render `role="dialog"`, checkbox render `role="checkbox"` → quyết định cách viết locator                                                  |
| **Tag system**                            | `Tag.REGRESSION`, `Tag.UI` chèn vào title để lọc `--grep`                                                                                                |
| **Reporters**                             | list / html / json / junit / **allure-playwright** (khai trong `playwright.config.ts`)                                                                   |

## Chi tiết theo file

### 1. `docs/linear/portal-order-history.md` → `docs/features/order-history.md` (Skill 1)

- **Vai trò:** nguồn business rules. Skill 1 đọc spec + dùng **Playwright MCP** quét màn thật.
- **Công nghệ quét (MCP):** ví dụ lệnh đã chạy khi gen —
  ```js
  await page.goto('http://localhost:1420/order-history'); // browser_navigate
  // browser_snapshot → a11y tree: heading "Order History", button "Filter",
  //   textbox "Search order ID, customer name or phone", list các <a href="/order-history/…">
  ```
- **Giải thích:** `browser_snapshot` trả về cây accessibility (role + name) — chính là nguồn để
  chọn `getByRole('heading', {name:'Order History'})`, `getByRole('button',{name:'Filter'})`…
  Detail panel quét được: `Order Information / Order Summary / Service Details / Payment Details / Order Note`,
  và bộ nút theo trạng thái (Settled → Receipt+Refund; Unsettled → Adjust Tip/Receipt/Re-Open/Cancel).

### 2. `docs/testcases/order-history-testcases.md` (Skill 2)

- **Vai trò:** liệt kê 21 TC, mỗi TC map 1-1 một `test()`. Đây là **nguồn sự thật** khi sinh code.
- **Công nghệ:** không phải code — là bảng Markdown; nhưng ràng buộc "mỗi TC → 1 `test()`" ép cấu trúc spec.

### 3. `src/pages/pos/OrderHistoryPage.ts` — page object (Skill 2 MỞ RỘNG)

- **Vai trò:** khai locator + action đọc-only cho spec. Kế thừa `BasePage` (có `goto()`).
- **Khai báo locator** ([dòng 28-48](../../src/pages/pos/OrderHistoryPage.ts#L28-L48)):

  ```ts
  this.searchInput = page.getByPlaceholder(/search order id/i);
  this.filterButton = page.getByRole('button', { name: /^Filter$/i });
  this.receiptButton = page.getByRole('button', { name: /^Receipt$/i });
  this.emptyDetailMessage = page.getByText(/Select an order to view details/i);
  this.orderCards = page.locator('a[href*="/order-history/"]');
  ```

  - **Giải thích:** `getByPlaceholder(/search order id/i)` phân biệt ô search của trang với ô
    "Search..." toàn cục ở header (điểm sửa sau khi chạy thử). `orderCards` bám vào `href` route
    `/order-history/<uuid>` — bền hơn text vì card render từng ký tự mã đơn thành `<generic>` riêng.
  - **Công nghệ:** Playwright locator engine + regex (case-insensitive, anchored `^…$`).

- **Chọn đơn theo trạng thái** ([dòng 279-286](../../src/pages/pos/OrderHistoryPage.ts#L279-L286)):

  ```ts
  async openFirstOrderWithStatus(statusText: RegExp): Promise<boolean> {
    const match = this.orderCards.filter({ hasText: statusText }).first();
    if ((await match.count()) === 0) return false;
    await match.click();
    await expect(this.page).toHaveURL(/\/order-history\/[^?]+/);
    ...
  ```

  - **Giải thích + bài học gen:** ban đầu dùng `/Settled/` → **dính** "Un**settled**" (đơn đầu list
    là Unsettled, không có nút Refund) → test fail. Sửa caller sang `/Successful - Settled/`. Đây là
    kiểu lỗi chỉ lộ ra khi **chạy thật**, minh hoạ vì sao skill 2 phải run spec chứ không chỉ gen.
  - **Công nghệ:** `Locator.filter({hasText})` + `.first()` + `toHaveURL` (assert điều hướng).

- **Filter sub-popover** ([dòng 323-335](../../src/pages/pos/OrderHistoryPage.ts#L323-L335)):
  ```ts
  async openFilterPaymentMethods(): Promise<void> {
    await this.filterDialog.getByRole('button', { name: /Select payment method/i }).click();
    // exact — "Card" would otherwise also match the "Gift Card" checkbox.
    await expect(this.page.getByRole('checkbox', { name: 'Card', exact: true })).toBeVisible();
  }
  ```

  - **Giải thích:** Payment/Status **không** render sẵn trong dialog Filter — phải click nút
    "Select payment method"/"Select status" để mở **popover thứ hai** (`role="dialog"` khác) chứa
    `role="checkbox"`. `exact:true` vì accessible-name "Card" là substring của "Gift Card" (đã gây
    strict-mode violation khi chạy thử → phải thêm `exact`).
  - **Công nghệ:** shadcn/Radix Popover + Checkbox; Playwright `getByRole('checkbox',{exact})`.

### 4. `tests/regression/order-history/TC-order-history.spec.ts` — spec (Skill 2)

- **Import & setup** ([dòng 1-23](../../tests/regression/order-history/TC-order-history.spec.ts#L1-L23)):

  ```ts
  import { test, expect } from '@fixtures/index';
  import { Tag } from '@/types/testTags';
  ...
  test.describe(`Order History — functional ${Tag.REGRESSION} ${Tag.UI}`, () => {
    test.beforeEach(async ({ orderHistoryPage }) => {
      await orderHistoryPage.goto();
      await orderHistoryPage.waitForReady();
    });
  ```

  - **Công nghệ:** `@fixtures/index` (alias → `src/fixtures/index.ts` `mergeTests(pagesFixture, apiFixture)`)
    bơm `orderHistoryPage`. Tag chèn vào tên describe để `playwright test --grep @regression` lọc được.

- **Ví dụ TC đọc-only an toàn** (TC-OH-18, mở dialog Refund rồi Escape, KHÔNG confirm):
  ```ts
  const found = await orderHistoryPage.openFirstOrderWithStatus(/Successful - Settled/i);
  test.skip(!found, 'No settled order to open the refund dialog on');
  test.skip(!(await orderHistoryPage.canRefund()), 'Refund not available on this order');
  await orderHistoryPage.openRefundDialogOnly();
  await orderHistoryPage.dismissActiveDialog(); // Escape — không bấm Confirm
  ```

  - **Giải thích:** app dùng **1 worker + backend thật dùng chung** → không được xác nhận hành động
    phá huỷ. `test.skip` làm test tự bỏ qua khi data không có đơn đúng trạng thái (bền với seed đổi).
  - **Công nghệ:** Playwright `test.skip(condition, reason)` (skip động tại runtime).

### 5. `playwright.config.ts` — cấu hình chạy

- **Vai trò:** `baseURL` (`http://localhost:1420`), `workers:1` (chống race backend chung),
  `trace:'on'`, `screenshot:'on'`, và 5 reporter (list/html/json/junit/allure).
- **Công nghệ:** allure-playwright → `reports/allure-results`; timezone lái theo `SHOP` để "Today" khớp.

## So với bản map (Skill 3)

- Skill 3 chỉ vẽ **file → file**. Bản này đi tới **từng đoạn code + số dòng** và nêu **công nghệ**
  đằng sau mỗi mắt xích: MCP a11y snapshot → cách chọn locator; Radix popover 2 lớp → vì sao cần
  `openFilterPaymentMethods`; strict-mode "Card"/"Gift Card" → vì sao `exact:true`; single-worker
  backend → vì sao test chỉ mở-rồi-Escape. Đây là các quyết định **chỉ thấy khi chạy thật**, không
  suy ra được từ sơ đồ file→file.
