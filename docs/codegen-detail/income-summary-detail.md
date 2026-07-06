---
title: Chi tiết luồng code-gen — Income Summary (/incomes/income-summary)
expands: docs/codegen-flow/income-summary-flow.md
generated-at: 2026-07-06
skill: codegen-flow-detail (4/4)
---

# Chi tiết luồng code-gen — Income Summary (`/incomes/income-summary`)

> Đầu ra **Skill 4/4**: mở rộng [income-summary-flow.md](../codegen-flow/income-summary-flow.md). Đoạn trích
> copy đúng từ file thật (verify 2026-07-06).

## Tổng quan công nghệ

| Công nghệ                  | Vai trò trong luồng gen                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Playwright MCP**         | Quét 2 panel: `browser_click` dòng bảng → `detailId` vào URL → `browser_snapshot` bung 5 khối chi tiết               |
| **Playwright Test**        | Runner + locator engine; nhiều spec dùng `page.evaluate` để scrape DOM                                               |
| **Page Object Model**      | `IncomeSummaryPage extends BasePage` — có scraper `readDetailSections()` chạy trong browser                          |
| **Reconciliation engine**  | `src/reports/incomeCalcCore.ts` + `src/utils/incomeSummary*.ts` — tính lại & so khớp UI ↔ orders ↔ compensation ↔ DB |
| **TZ-aware epoch**         | `zonedDayStartUnix/EndUnix` + `shopTimezone`                                                                         |
| **Tag / fixtures / alias** | như các màn Income khác                                                                                              |

## Chi tiết theo file

### 1. `src/pages/pos/IncomeSummaryPage.ts`

```ts
// L42-L61 — locator cốt lõi
export class IncomeSummaryPage extends BasePage {
  protected readonly path = '/incomes/income-summary';
  this.heading = page.getByText('Income Summary', { exact: true });
  this.periodDropdown = page.getByRole('combobox').first();
  this.groupByTabs = page.getByRole('tablist');
  this.totalIncomeHeading = page.getByRole('heading', { name: /^Total Income/ });
  this.table = page.getByRole('table');
```

```ts
// L80-L87 — điều hướng range + groupBy qua URL
async gotoRange(from: Date, to: Date, groupBy: GroupBy = 'Day'): Promise<void> {
  const f = zonedDayStartUnix(from, SHOP_TZ);
  const t = zonedDayEndUnix(to, SHOP_TZ);
  await this.page.goto(`${this.path}?from=${f}&to=${t}&groupBy=${groupBy.toLowerCase()}`, {
    waitUntil: 'domcontentloaded' });
}
```

```ts
// L188-L192 — click 1 dòng → chờ detailId + panel
async openPeriodDetail(index = 0): Promise<void> {
  await this.tableRows().nth(index).click();
  await expect(this.page).toHaveURL(/detailId=/);
  await expect(this.sectionHeading('Payment Details')).toBeVisible();
}
```

- **Giải thích:** panel chi tiết chỉ mount sau khi chọn dòng (URL thêm `detailId`). Đây là lý do Skill 1
  phải `browser_click` dòng bảng khi quét mới thấy 5 khối.

```ts
// L249-L297 — scraper chạy trong trang (page.evaluate)
const flat = await this.page.evaluate(() => {
  const SECTIONS = [
    'Payment Details',
    'Sale Details',
    'Supply Fee',
    'Staff Payout',
    'Salon Earnings',
  ];
  document.querySelectorAll('button,[role="button"],span,div').forEach((el) => {
    if ((el.textContent || '').trim() === 'Show more') (el as HTMLElement).click();
  });
  // ... duyệt div.justify-between, lấy label + money value, cờ bold (fontWeight>=600)
});
```

- **Công nghệ:** **`page.evaluate`** — chạy JS trong context trình duyệt để scrape toàn panel thành
  `{section, rows[]}`; tự click "Show more" để bung Staff Payout. Dùng cho reconciliation nhiều nguồn.

### 2. Engine tính lại — `src/reports/incomeCalcCore.ts` + `src/utils/incomeSummary*.ts`

- **Vai trò:** các spec `TC-RECON-*`, `staff-payout`, `salon-earnings` **không** chỉ đọc UI mà còn
  **tính lại** từ orders/compensation rồi so khớp (chống app tính sai lặng lẽ).
- **Công nghệ:** TypeScript thuần (không chạm DOM) — `incomeFromOrders`, `staffPayout`, `payPeriod`,
  `incomeSummaryFromCompensation`, `sectionsFromScrape` (parse output của scraper trên).

### 3. Spec + helpers

```ts
// tests/regression/incomes/income-summary/*.spec.ts
test.describe(`Income Summary — Payment Details (real data) ${Tag.REGRESSION}`, () => { ... });
```

- **Công nghệ:** `incomeSummary.helpers.ts` gói bước mở màn + chọn range + đọc panel dùng chung nhiều spec.

## So với bản map (Skill 3)

- Chi tiết thêm: kỹ thuật **`page.evaluate` scraper** cho panel 5 khối, và tầng **reconciliation** tính lại
  bằng util thuần — thứ mà bản map chỉ liệt kê tên file.
