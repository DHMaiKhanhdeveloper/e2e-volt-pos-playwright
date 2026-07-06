---
title: Chi tiết luồng code-gen — Daily Sale Report (/incomes/income-daily)
expands: docs/codegen-flow/income-daily-flow.md
generated-at: 2026-07-06
skill: codegen-flow-detail (4/4)
---

# Chi tiết luồng code-gen — Daily Sale Report (`/incomes/income-daily`)

> Đầu ra **Skill 4/4**: mở rộng [income-daily-flow.md](../codegen-flow/income-daily-flow.md) thành giải
> thích **từng đoạn code + công nghệ**. Mọi đoạn trích copy đúng từ file thật (kèm số dòng, verify 2026-07-06).

## Tổng quan công nghệ

| Công nghệ                                 | Vai trò trong luồng gen                                                                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Linear (MCP `linear-server`)**          | Đọc spec "Income Report"; phiên này chưa auth → fallback `docs/linear/income-report.md`                                                                                |
| **Playwright MCP** (`mcp__playwright__*`) | Quét UI thật: `browser_navigate` → `/incomes/income-daily`, `browser_snapshot` (a11y tree) → lấy label/role của 4 KPI card + 2 panel, `browser_click` để nhập passcode |
| **Playwright Test** (`@playwright/test`)  | Runner: `expect`, `test()`, locator engine `getByRole`/`getByText`                                                                                                     |
| **Page Object Model**                     | `DailySaleReportPage extends BasePage` — gói locator + action                                                                                                          |
| **Custom fixtures** (`mergeTests`)        | `@fixtures/index` bơm `dailySaleReportPage`, `passcodeDialog`                                                                                                          |
| **TypeScript path alias**                 | `@fixtures`, `@pages`, `@utils`, `@data`, `@/` (khai trong tsconfig)                                                                                                   |
| **Timezone-aware epoch**                  | `zonedDayStartUnix/EndUnix` + `shopTimezone` → cửa sổ ngày theo TZ của shop                                                                                            |
| **shadcn/Radix (app đích)**               | Passcode dialog = `role="dialog"`; order detail = `role="dialog" name="Order Details"`                                                                                 |
| **Reporters**                             | list / html / json / junit / allure-playwright (playwright.config.ts)                                                                                                  |

## Chi tiết theo file

### 1. Quét MCP khi gen (Skill 1 & 2)

- **Vai trò:** lấy selector THẬT. Lệnh MCP đã chạy:

```js
await page.goto('http://localhost:1420/incomes/income-daily'); // browser_navigate → hiện passcode dialog
// browser_click các nút "8" → nhập 8888; tick "Do not require passcode for the next 30 minutes"
// browser_snapshot → a11y tree: 4 card heading level=4 (Total Order/Sale/Total tip/Total Payment),
//   panel "Income Details" (Sale/Tip/Tax Collected/Total Payment), "Payment Details" (Card/Cash/Others/…)
```

- **Công nghệ:** `browser_snapshot` trả cây accessibility → nguồn quyết định `getByRole('heading',{level:4})`.

### 2. `src/pages/pos/DailySaleReportPage.ts` (page object)

- **Vai trò:** locator + action, không assert.

```ts
// L28-L29, L44-L46
export class DailySaleReportPage extends BasePage {
  protected readonly path = '/incomes/income-daily';
  // ...
  this.heading = page.getByText('Daily Sale Report', { exact: true });
  this.todayButton = page.getByRole('button', { name: 'Today', exact: true });
  this.printButton = page.getByRole('button', { name: 'Print' });
```

```ts
// L67-L71 — route gated, KHÔNG waitForReady ở goto()
async goto(): Promise<void> {
  this.logger.info(`Navigate to ${this.path}`);
  await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
  // Intentionally NOT calling waitForReady() — caller unlocks first.
}
```

- **Giải thích:** route bọc `PermissionProtectedRoute` → dialog passcode che layout. `goto()` cố tình
  **không** chờ readiness để caller mở passcode trước, rồi mới `waitForReady()` (chờ card "Sale").
- **Công nghệ:** Playwright locator (text/role) + kỹ thuật "gated route": tách navigate ↔ ready.

```ts
// L350-L357 — điều hướng theo ngày qua URL (bỏ qua calendar popover)
async gotoDate(date: Date, activeChart: ChartKey = 'sale'): Promise<void> {
  const tz = shopTimezone(process.env.SHOP);
  const from = zonedDayStartUnix(date, tz);
  const to = zonedDayEndUnix(date, tz);
  await this.page.goto(`${this.path}?from=${from}&to=${to}&activeChart=${activeChart}`);
}
```

- **Công nghệ:** URL là single-source-of-truth của filter → set thẳng epoch theo **TZ shop** (`dateUtils` + `shops`).

### 3. `tests/regression/incomes/daily-sale-report/TC*.spec.ts` (44 test)

```ts
// TC01…-defaults.spec.ts (đầu file)
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';

test.beforeEach(async ({ dailySaleReportPage, passcodeDialog }) => {
  await dailySaleReportPage.goto();
  await passcodeDialog.enterPasscode(OWNER_PASSCODE);
  await dailySaleReportPage.waitForReady();
});
```

- **Giải thích:** mẫu chuẩn — `goto()` (chưa ready) → `enterPasscode(8888)` (điền digit qua Radix keypad) → `waitForReady()`.
- **Công nghệ:** custom fixtures (`mergeTests`), tag `${Tag.REGRESSION}` để `--grep`, `PasscodeDialog` component.

### 4. `src/fixtures/index.ts` + `pages.fixture.ts`

```ts
export const test = mergeTests(pagesFixture, apiFixture); // index.ts
// pages.fixture.ts
dailySaleReportPage: async ({ page }, use) => { await use(new DailySaleReportPage(page)); },
```

- **Công nghệ:** Playwright `mergeTests` gộp fixtures → một `test` duy nhất inject page object.

## So với bản map (Skill 3)

- Skill 3 chỉ liệt kê file→file. Ở đây đi tới **đoạn code cụ thể**: cơ chế gated-route (`goto` không ready),
  URL-driven filter theo TZ shop, mẫu `beforeEach` passcode, và cách MCP `browser_snapshot` quyết định locator.
