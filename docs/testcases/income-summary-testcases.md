---
title: Test Cases — Income Summary (/incomes/income-summary)
source-linear: 'https://linear.app/fastboy/document/income-report-cd80210c48f3 (offline docs/linear/income-report.md)'
feature-doc: docs/features/income-summary.md
scanned-at: 2026-07-06
code-status: 'ĐÃ CÓ SẴN — page object src/pages/pos/IncomeSummaryPage.ts + bộ TC lớn trong tests/regression/incomes/income-summary*, incomeCalcCore.ts. Skill 2 tài liệu-hoá coverage, KHÔNG regen/đè.'
---

# Test Cases — Income Summary (`/incomes/income-summary`)

> Đầu ra **Skill 2/4**. Màn này **đã có bộ test rất lớn** (~70 TC + reconciliation pipeline). File này
> tài liệu-hoá coverage theo nhóm (section) để đối chiếu spec Linear. Không sinh/đè code.

## Cách chạy

```bash
npx playwright test tests/regression/incomes/income-summary tests/regression/incomes/income-summary-past \
  tests/regression/incomes/income-summary-reconciliation tests/regression/incomes/income-summary-ui
```

## Bảng test case theo nhóm (đã hiện thực)

| Nhóm                        | TC IDs                                      | Trọng tâm kiểm thử                                                                            | Kết quả mong đợi                             | File                           |
| --------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------ |
| Overview                    | TC01,03,04,06,09,15,16,17,18,19,25,34,48,56 | Layout 2 panel, filter mặc định Today, tabs Day/Week/Month, chart 3 series, bảng tổng         | Đúng cấu trúc + giá trị mặc định             | overview                       |
| Filter                      | TC02,05,07                                  | Preset dropdown + date-picker + groupBy                                                       | URL `groupBy=`, range đổi đúng               | filter                         |
| Total Income                | TC08,09,11,12,13,14                         | Total Income + %so kỳ trước (Gross/Net/Tip)                                                   | Compare label + % đúng, không NaN            | total-income                   |
| Payment Details             | TC20–27                                     | Card/Cash/Others (Sale/Refund/Tip/Tax), Amount Collected, Gift Card Redemption, Total Payment | Khớp GraphQL + đẳng thức                     | payment-details                |
| Sale Details                | TC28–34                                     | Total Sale/Refund, Subtotal, Discount, Net Total, Tip, Tax, Total Payment                     | Đẳng thức Net Total = Subtotal − Discount... | sale-details                   |
| Supply Fee                  | TC35,36,37                                  | Total / Staff Share (×0.6) / Salon Share                                                      | Chia đúng tỉ lệ                              | supply-fee                     |
| Staff Payout                | TC38–51                                     | Commission 60%, Tip, Clean up, Salary, Pay 1/Pay 2, Show more/less                            | Khớp công thức payout                        | staff-payout                   |
| Staff Payout ↔ Staff Income | TC38,40,41,44                               | Đối chiếu payout với màn Staff Income                                                         | Nhất quán chéo báo cáo                       | staff-payout-from-staff-income |
| Salon Earnings              | TC52,53,54,55,55b                           | Salon Commission 40%, Net Earnings, Total Earnings, Tax                                       | Khớp công thức                               | salon-earnings                 |
| Charge fields & Salon tax   | TC66–72                                     | Discount Charge, Card Charge - Commission/Tip (fields UI mới)                                 | Giá trị hợp lệ, reconcile                    | charge-fields                  |
| Reconciliation              | TC56,57,58                                  | Panel ↔ tổng bảng ↔ GraphQL                                                                   | Ba nguồn khớp                                | reconciliation                 |
| Cross-report                | TC59,60,61                                  | Income Summary ↔ Daily ↔ Staff                                                                | Nhất quán chéo                               | cross-report                   |
| Edge cases                  | TC62,63,64,65                               | Ngày trống, refund âm, discount reversed                                                      | Xử lý đúng                                   | edge                           |
| Re-derive (Cách 2)          | TC-RD                                       | Staff/Salon re-derive từ DB                                                                   | Khớp giá trị tính lại                        | RD-staff-salon-rederive        |
| Past pipeline               | TC-PAST                                     | Ngày quá khứ full pipeline                                                                    | Khớp snapshot                                | income-summary-past            |
| Recon pipeline              | TC-RECON-\*                                 | orders→income summary, sections-from-compensation, staff-compensation                         | Pipeline đối soát đầu-cuối                   | income-summary-reconciliation  |
| App-faithful HTML / UI      | TC-IS-UI                                    | Render HTML trung thực với app                                                                | Khớp cấu trúc DOM                            | income-summary-ui              |

**Tổng: ~70+ test** trải 15 file spec + helpers (`incomeSummary.helpers.ts`).

## Ghi chú

- Công thức nguồn: `src/reports/incomeCalcCore.ts`; bảng công thức: `docs/report-field-formulas.md`.
- 3 field UI mới (Discount Charge, Card Charge - Commission/Tip) đã được kiểm thử ở nhóm **charge-fields** dù spec Linear chưa mô tả — xem cảnh báo trong `docs/features/income-summary.md §6`.
- i18n: xử lý ở **Skill 5** → `docs/i18n/income-summary-i18n-result.md`.
