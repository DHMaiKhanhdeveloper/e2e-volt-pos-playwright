---
title: Chi tiết luồng code-gen — Staff Income (/incomes/income-staff)
expands: docs/codegen-flow/income-staff-flow.md
generated-at: 2026-07-06
skill: codegen-flow-detail (4/4)
---

# Chi tiết luồng code-gen — Staff Income (`/incomes/income-staff`)

> Đầu ra **Skill 4/4**: mở rộng [income-staff-flow.md](../codegen-flow/income-staff-flow.md). Màn **sinh mới**
> hoàn toàn trong phiên này → đây là bản giải thích code do skill 2 vừa tạo. Đoạn trích copy đúng từ file thật.

## Tổng quan công nghệ

| Công nghệ                  | Vai trò trong luồng gen                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Playwright MCP**         | Quét màn: `browser_navigate` → `/incomes/income-staff`; `browser_snapshot` → title "Staff Income", ô "Search staff", 6 thẻ tổng, empty "No results found." + "No detail to show" |
| **Playwright Test**        | Runner; 9 test structural đã chạy **PASS** để verify selector                                                                                                                    |
| **Page Object Model**      | `IncomeStaffPage extends BasePage` (SINH MỚI)                                                                                                                                    |
| **Custom fixtures**        | Thêm `incomeStaffPage` vào `pages.fixture.ts`                                                                                                                                    |
| **TZ-aware epoch**         | `zonedDayStartUnix/EndUnix` + `shopTimezone` cho `gotoRange`/`gotoDate`                                                                                                          |
| **test.skip có điều kiện** | 6 TC `[data]` tự bỏ qua khi ngày không có staff                                                                                                                                  |

## Chi tiết theo file

### 1. Quét MCP (Skill 1 & 2) — nguồn selector

```js
await page.goto('http://localhost:1420/incomes/income-staff'); // browser_navigate
// browser_snapshot a11y tree:
//   text "Staff Income"; textbox "Search staff"; combobox "Today"; button "…07/06/2026"
//   6 stat: Total staff / Total orders / Total subtotal / Total supply fee / Total tip / Total staff income
//   heading "No results found." (list rỗng) ; heading "No detail to show"
```

- **Giải thích:** vì tài khoản quét hôm nay không có staff phát sinh → chỉ thấy empty-state. Đây là lý do
  6 TC `[data]` được viết dạng **tự-skip**.

### 2. `src/pages/pos/IncomeStaffPage.ts` (SINH MỚI)

```ts
// L48-L60 — locator từ snapshot
export class IncomeStaffPage extends BasePage {
  protected readonly path = '/incomes/income-staff';
  this.heading = page.getByText('Staff Income', { exact: true });
  this.searchInput = page.getByRole('textbox', { name: 'Search staff' });
  this.periodDropdown = page.getByRole('combobox').first();
  this.emptyResults = page.getByRole('heading', { name: 'No results found.' });
  this.noDetail = page.getByRole('heading', { name: 'No detail to show', exact: true });
```

```ts
// waitForReady — chờ stat bar (mount sau khi passcode mở)
async waitForReady(): Promise<void> {
  await expect(this.heading).toBeVisible({ timeout: 15_000 });
  await expect(this.statLabel('Total staff income')).toBeVisible({ timeout: 15_000 });
}
```

```ts
// statValue — lấy value là sibling ngay sau label
statValue(name: StaffIncomeStat): Locator {
  return this.statLabel(name).locator('xpath=following-sibling::*[1]');
}
```

- **Công nghệ:** cùng khuôn gated-route như DailySaleReportPage/IncomeSummaryPage (goto không ready,
  caller mở passcode); locator dựa **role + visible text** (app chưa có `data-testid`); XPath sibling để
  gắn value với label.

### 3. `src/fixtures/pages.fixture.ts` (THÊM)

```ts
import { IncomeStaffPage } from '@pages/pos/IncomeStaffPage';
// interface PagesFixture { ... incomeStaffPage: IncomeStaffPage; ... }
incomeStaffPage: async ({ page }, use) => { await use(new IncomeStaffPage(page)); },
```

- **Công nghệ:** Playwright fixture — mỗi test nhận `incomeStaffPage` mới (isolation theo test).

### 4. `tests/regression/incomes/income-staff/TC-IST-staff-income.spec.ts` (SINH MỚI, 18 test)

```ts
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';

test.beforeEach(async ({ incomeStaffPage, passcodeDialog }) => {
  await incomeStaffPage.goto();
  await passcodeDialog.enterPasscode(OWNER_PASSCODE);
  await incomeStaffPage.waitForReady();
});
```

```ts
// TC [data] — tự skip khi không có staff
test('TC-IST-15: clicking a staff opens the detail panel with Print enabled', async ({
  incomeStaffPage,
}) => {
  test.skip((await incomeStaffPage.rowCount()) === 0, 'No staff rows for the current day.');
  await incomeStaffPage.openStaffDetail(0);
  await expect(incomeStaffPage.printButton).toBeEnabled();
});
```

- **Công nghệ:** `test.skip(condition, reason)` — data-agnostic; suite xanh cả khi tenant/ngày rỗng.

## So với bản map (Skill 3)

- Chi tiết thêm: **các đoạn code sinh mới** (locator, `waitForReady`, `statValue` XPath, fixture entry,
  mẫu `test.skip` cho TC [data]) — bản map chỉ đánh dấu "★ SINH MỚI" ở mức file.
- **Kết quả verify:** `npx playwright test …/income-staff --grep "structure & permission"` → **9 passed**.
