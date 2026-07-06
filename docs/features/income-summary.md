---
title: Income Summary (/incomes/income-summary)
source-linear: 'https://linear.app/fastboy/document/income-report-cd80210c48f3 (đọc bản offline docs/linear/income-report.md — Linear MCP chưa xác thực trong phiên này)'
scanned-at: 2026-07-06
scanned-by: playwright-mcp trên app live http://localhost:1420/incomes/income-summary
skill: linear-feature-spec (1/4)
---

# Income Summary (`/incomes/income-summary`) — Đặc tả tính năng

> File này là đầu ra **Skill 1/4** (`linear-feature-spec`) cho màn hình **Income Summary** (Tổng hợp thu nhập theo khoảng thời gian).
> Nguồn: spec offline Linear (`docs/linear/income-report.md`, mục **Income Summary**) + **quét màn hình thật** bằng
> Playwright MCP trên app đang chạy (2026-07-06). Không sinh test case / code ở skill này.

## 1. Mục tiêu & phạm vi

Màn `/incomes/income-summary` tổng hợp thu nhập theo **khoảng thời gian** (không chỉ 1 ngày):

- Chọn **date range** + nhóm dữ liệu theo **Day / Week / Month**.
- **Total Income** của khoảng đã chọn, luôn **so sánh với khoảng liền trước** (vs. Same day/period last week...).
- Biểu đồ 3 thông số **Gross Income / Net Income / Total Tip**.
- Bảng tổng theo mốc thời gian; click 1 dòng → mở **panel chi tiết** (Payment / Sale / Supply Fee / Staff Payout / Salon Earnings).
- **In** báo cáo (nút Print trong panel chi tiết).

Đây là báo cáo đối soát sâu nhất trong nhóm Income — dùng để chốt payout nhân viên và earnings của salon.

## 2. Các luồng chính (từ Linear)

- **Income Summary chart** — filter date range + xem theo **Day/Week**; **Total Income** compare với kỳ trước:
  - **Gross Income:** tổng sale trước refund; **không** gồm tip, không gồm gift card load/activation.
  - **Net Income:** tổng sale sau refund/partial refund; **không** tính Tip, order Cancel, sale giftcard.
  - **Total Tip.**
- **Total Income table:** `Date`; `Sale`; `Tip`; `Net Income`; `Total Payment`. _(UI thực tế: Date / Sale / Tip / Tax / Total Payment — xem §6.)_
- **Income Summary detail** — 5 khối:
  - **PAYMENT DETAILS:** Card/Cash/Others mỗi loại = Sale − Refund + Tip + Tax; **Amount Collected = Card+Cash+Others**; Gift Card Redemption (Sale/Tip/Tax); **TOTAL PAYMENT = Amount Collected + Gift Card Redemption**.
  - **SALE DETAILS:** **Total Sale = Gift card + Service + Product Sale**; **Total Refund = Service + Product Refund**; **Subtotal = Sale − Refund**; Discount = Discount − Discount Reversed; **Net Total = Subtotal − Discount**; Tip; Tax Collected; **TOTAL PAYMENT = Net Total + Tax + Tip**.
  - **SUPPLY FEE:** Total Supply Fee; **Staff Supply Share = Total × 0.6**; Salon Supply Share = phần còn lại.
  - **STAFF PAYOUT:** Total Service = Service Sale − Service Refund; Staff Supply Share; **Staff Commission (60%) = Total Service×60% − Staff Supply Share**; Tip; Clean up fee; Staff Salary; **TOTAL STAFF PAYOUT = Commission + Tip − Clean up + Salary** → chia **Pay 1 / Pay 2**.
  - **SALON EARNINGS:** Salon Commission (40%); Product Sale/Refund; Total Discount; **Net Earnings**; Staff Supply Share; Clean up fee; Staff Salary; **TOTAL EARNING**; Tax Collected.

## 3. Thành phần UI thực tế (quét bằng Playwright MCP, 2026-07-06)

Ảnh: [income-summary-assets/income-summary-detail.png](income-summary-assets/income-summary-detail.png) (đã click 1 dòng để bung panel chi tiết)

### 3.1 Khu filter + tổng + bảng

| Thành phần                                       | Vai trò                                 | Trạng thái | Ghi chú                                                   |
| ------------------------------------------------ | --------------------------------------- | ---------- | --------------------------------------------------------- |
| Tiêu đề **Income Summary**                       | Nhãn màn hình                           | Hoạt động  |                                                           |
| Combobox preset (**Today**)                      | Chọn khoảng ngày nhanh                  | Hoạt động  | Đi kèm calendar                                           |
| Nút **calendar `07/06/2026`**                    | Date-picker                             | Hoạt động  | Accessible name `MM/DD/YYYY`                              |
| Tabs **Day / Week / Month**                      | Nhóm dữ liệu                            | Hoạt động  | URL `groupBy=day`; **Day** selected mặc định              |
| **Total Income** (heading + `$0.00`)             | Tổng thu nhập khoảng đã chọn            | Hoạt động  | Kèm `100.00%` + "vs. Same day last week"                  |
| 3 nhãn **Gross Income / Net Income / Total tip** | Legend chart                            | Hoạt động  |                                                           |
| **Chart** (application, trục $0–$100)            | Biểu đồ theo khoảng                     | Hoạt động  |                                                           |
| **Bảng tổng**                                    | Date / Sale / Tip / Tax / Total Payment | Hoạt động  | Click 1 dòng → mở detail; URL thêm `detailId=<from>-<to>` |

### 3.2 Panel chi tiết (sau khi click 1 dòng)

| Khối                 | Các dòng quét được                                                                                                                                                                                                                                                                              | Ghi chú                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Header               | Heading ngày + nút **Print**                                                                                                                                                                                                                                                                    |                                                        |
| **Payment Details**  | **Cash / Card / Others** (mỗi loại: Sale, Refund, Tip, Tax) → **Amount Collected** → **Gift Card Redemption** (Sale, Tip, Tax) → **Total Payment**                                                                                                                                              | Khớp spec                                              |
| **Sale Details**     | **Total Sale** (Service Sale, Product Sale, Gift Card Sale) → **Total Refund** (Service Refund, Product Refund) → **Subtotal** → **Total Discount** (Discount, Discount Reversed) → **Net Total** → Tip → Tax Collected → **Total Payment**                                                     | Khớp spec                                              |
| **Supply Fee**       | Total supply fee, Staff Supply Share, Salon Supply Share                                                                                                                                                                                                                                        | Khớp spec                                              |
| **Staff Payout**     | Total Service, Staff Supply Share, Staff Commission, Tip, Clean Up Fee, **Discount Charge**, **Card Charge - Commission**, **Card Charge - Tip**, Staff Salary → **Total Staff Payout** (Pay 1, Pay 2)                                                                                          | ⚠️ 3 dòng in đậm là **mới**, chưa có trong spec Linear |
| Toggle **Show less** | Thu gọn khối Staff Payout                                                                                                                                                                                                                                                                       | UI element mới                                         |
| **Salon Earnings**   | Total Service, Salon Supply Share, Salon Commission, Product Sale, Product Refund, Total Discount (Discount, Discount Reversed), **Net Earnings**, Staff Supply Share, Clean Up Fee, **Discount Charge**, **Card Charge - Commission**, **Card Charge - Tip**, Staff Salary, **Total Earnings** | ⚠️ 3 dòng "Charge" là mới so với spec                  |

## 4. Nghiệp vụ & ràng buộc

- **Total Income** luôn kèm phần trăm so với **kỳ liền trước** (nhãn phụ thuộc groupBy: "same day last week"...).
- Panel chi tiết **chỉ hiện khi chọn 1 dòng** trong bảng; `detailId` được ghi lên URL → deep-link được.
- Công thức chốt payout: `Staff Commission (60%)`, `Salon Commission (40%)` dựa trên Staff Compensation split; `Staff Supply Share = Total Supply Fee × 0.6`.
- **Total Staff Payout** tách thành **Pay 1 / Pay 2** theo setting Pay 1 – Pay 2 Split của từng staff.
- Ba dòng **Card Charge - Commission / Card Charge - Tip / Discount Charge** phản ánh phí thẻ & discount phân bổ — cần PO bổ sung công thức chính thức (chưa có trong Linear).

## 5. Trạng thái / quyền / edge case

- **Quyền:** owner passcode (đã bypass 30 phút trong phiên quét này nên không hiện lại dialog).
- **Empty state bảng:** vẫn có 1 dòng cho mốc đang xem với toàn `$0.00`; panel chi tiết mặc định "No detail to show — Select a period from the table to view income details."
- **Group By:** Day/Week/Month đổi cách gom dòng bảng và mốc chart.
- **Refund/Discount:** ảnh hưởng Subtotal (âm), Discount Reversed cộng ngược khi refund.

## 6. Đối chiếu Linear ↔ UI thực tế (khớp / lệch)

| Mục              | Linear                                                  | UI thực tế                                                            | Kết luận                                                                      |
| ---------------- | ------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Group By         | Day / **Week**                                          | Day / Week / **Month**                                                | ⚠️ UI có thêm **Month** — spec chỉ nêu Day/Week                               |
| Cột bảng tổng    | Date / Sale / Tip / **Net Income** / Total Payment      | Date / Sale / Tip / **Tax** / Total Payment                           | ⚠️ **Lệch cột**: UI hiển thị **Tax** thay vì **Net Income**. Cần PO xác nhận. |
| 3 thông số chart | Gross / Net / Total Tip                                 | Gross Income / Net Income / Total tip                                 | ✅ Khớp                                                                       |
| Payment Details  | Card/Cash/Others + Amount Collected + Gift Card + Total | Đủ, thêm Sale/Refund/Tip/Tax breakdown mỗi loại                       | ✅ Khớp (UI chi tiết hơn)                                                     |
| Sale Details     | đầy đủ các dòng                                         | Khớp từng dòng                                                        | ✅ Khớp                                                                       |
| Staff Payout     | Commission / Tip / Clean up / Salary / Pay1 / Pay2      | Thêm **Discount Charge, Card Charge - Commission, Card Charge - Tip** | ⚠️ **UI thừa 3 dòng** so với spec                                             |
| Salon Earnings   | Net Earnings / Total Earning ...                        | Thêm **Discount Charge, Card Charge - Commission/Tip**                | ⚠️ **UI thừa 3 dòng** so với spec                                             |

## 7. Nguồn tham chiếu

- Spec Linear (offline): [docs/linear/income-report.md](../linear/income-report.md) — mục **Income Summary**.
- Linear document gốc: https://linear.app/fastboy/document/income-report-cd80210c48f3 (team VOLT, updated 2026-06-11).
- Page object hiện có: `src/pages/pos/IncomeSummaryPage.ts`.
- Test suite hiện có: `tests/regression/incomes/income-summary*/` (summary, summary-past, summary-reconciliation, summary-ui).
- Công thức chi tiết: `src/reports/incomeCalcCore.ts`, `docs/report-field-formulas.md`.
- Ảnh quét: [income-summary-assets/income-summary-detail.png](income-summary-assets/income-summary-detail.png).
