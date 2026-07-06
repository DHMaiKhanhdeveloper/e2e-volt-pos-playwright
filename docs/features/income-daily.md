---
title: Daily Sale Report (/incomes/income-daily)
source-linear: 'https://linear.app/fastboy/document/income-report-cd80210c48f3 (đọc bản offline docs/linear/income-report.md — Linear MCP chưa xác thực trong phiên này)'
scanned-at: 2026-07-06
scanned-by: playwright-mcp trên app live http://localhost:1420/incomes/income-daily
skill: linear-feature-spec (1/4)
---

# Daily Sale Report (`/incomes/income-daily`) — Đặc tả tính năng

> File này là đầu ra **Skill 1/4** (`linear-feature-spec`) cho màn hình **Daily Sale Report** (Báo cáo doanh thu theo ngày).
> Nguồn: spec offline Linear (`docs/linear/income-report.md`, mục **Daily Sale Report**) + **quét màn hình thật**
> bằng Playwright MCP trên app đang chạy (2026-07-06). Không sinh test case / code ở skill này.

## 1. Mục tiêu & phạm vi

Màn `/incomes/income-daily` là **Daily Sale Report** — báo cáo doanh thu **của MỘT ngày** cho owner/tenant:

- Xem nhanh 4 chỉ số tổng của ngày (**Total Order, Sale, Total Tip, Total Payment**) kèm so sánh với **hôm qua**.
- Biểu đồ theo giờ/khung của ngày, có thể chuyển chỉ số hiển thị (Sale / Order / Tip / Payment).
- Danh sách order chi tiết trong ngày + panel **Income Details** và **Payment Details** để đối soát.
- **In** báo cáo ngày (nút Print).

Màn được bảo vệ bằng **passcode dialog** (owner passcode) khi truy cập lần đầu — cùng cơ chế với các màn Income khác.

## 2. Các luồng chính (từ Linear)

Trích mục **Daily Sale Report** trong spec:

- **Daily Sale Report Chart** — 4 chỉ số:
  - **Orders** — _Total number of order, refunds, and manual refunds_ (UI hiển thị "Total Order" với mô tả "excluding cancel/refunds/manual refunds").
  - **Sale** = tổng sale/refund/partial refund, **không** tính Tip, Tax, **không** tính order Cancel (Card/Cash/Other/GiftCard).
  - **Total Tips** = tổng Tip (không tính order Cancel).
  - **Total Payment** — final revenue, **bao gồm** Gift Card Redemption.
- **Daily Sale Report detail — List Order Detail** (mỗi order): `Order #` (orderCode); `Sale` (service sale/refund sau Discount); `Tax`; `Tip`; `Total = Sale + Tip + Tax`.
  - Order Refund/Partial Refund: Sale/Refund là **số âm**; `Total = Sale − Discount + Tip` (âm).
- **INCOME DETAIL:** `Sale` (tổng Sale/Refund sau Discount); `Tip`; `Tax Collected` (tổng Tax); **`Total Payment = Sale + Tip + Tax Collected`**.
- **PAYMENT DETAIL:** `Card = Sale Card − Refund Card`; `Cash = Sale Cash − Refund Cash`; `Others = Sale Others − Refund Others`;
  **`Amount Collected = Card + Cash + Others`**; `Gift Card Redemption`; **`TOTAL PAYMENT = Amount Collected + Gift Card Redemption`**.

## 3. Thành phần UI thực tế (quét bằng Playwright MCP, 2026-07-06)

Ảnh: [income-daily-assets/income-daily-empty.png](income-daily-assets/income-daily-empty.png) (trạng thái ngày chưa có data — 07/06/2026)

| Thành phần                      | Vai trò                                                                        | Trạng thái                  | Ghi chú                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------ |
| Tiêu đề **Daily Sale Report**   | Nhãn màn hình                                                                  | Hoạt động                   | Góc trên bảng chart                                                                        |
| Nút **Today**                   | Reset filter về hôm nay                                                        | Hoạt động                   | URL nhận `from`/`to` = midnight → end-of-day                                               |
| Nút **calendar `07/06/2026`**   | Date-picker chọn 1 ngày                                                        | Hoạt động                   | Accessible name = `MM/DD/YYYY`                                                             |
| Card **Total Order**            | Chỉ số + %vs Yesterday                                                         | Hoạt động                   | Mô tả: _Total number of order, excluding cancel/refunds/ manual refunds_                   |
| Card **Sale**                   | Chỉ số tiền + %vs Yesterday                                                    | Hoạt động (click đổi chart) | `$0.00` khi trống; mô tả khớp spec                                                         |
| Card **Total tip**              | Chỉ số tip + %vs Yesterday                                                     | Hoạt động                   | Mô tả: _…not included in sales revenue but counted in collected amounts_                   |
| Card **Total Payment**          | Chỉ số payment + %vs Yesterday                                                 | Hoạt động                   | Mô tả: _The final revenue includes Gift Card Redemption_                                   |
| **Chart "Sale"**                | Biểu đồ theo chỉ số đang chọn                                                  | Hoạt động                   | URL `activeChart=sale`; trống → "No chart data available / Try selecting a different date" |
| Heading ngày **"Jul 06, 2026"** | Tiêu đề panel chi tiết                                                         | Hoạt động                   | Bên phải                                                                                   |
| Nút **Print**                   | In báo cáo ngày                                                                | Hoạt động (enabled)         | Kể cả khi không có data                                                                    |
| Bảng **order detail**           | Danh sách order trong ngày                                                     | Hoạt động                   | Trống → "No data available"; Order # dạng `OD\d{6}-\d+`                                    |
| Panel **Income Details**        | Sale / Tip / Tax Collected / Total Payment                                     | Hoạt động                   | Tax Collected có mô tả _(Sales tax collected, adjusted for refunds)_                       |
| Panel **Payment Details**       | Card / Cash / Others / Amount Collected / Gift Card Redemption / Total Payment | Hoạt động                   | 6 dòng, khớp spec PAYMENT DETAIL                                                           |
| Banner **connection**           | "Internet connection restored."                                                | Hoạt động                   | Liên quan Offline Mode                                                                     |

**Chi tiết chỉ số card** (khớp spec Linear):

| Card          | Giá trị trống | %-so-sánh | Nhãn so sánh |
| ------------- | ------------- | --------- | ------------ |
| Total Order   | `0`           | 100%      | vs Yesterday |
| Sale          | `$0.00`       | 0%        | vs Yesterday |
| Total tip     | `$0.00`       | 0%        | vs Yesterday |
| Total Payment | `$0.00`       | 0%        | vs Yesterday |

## 4. Nghiệp vụ & ràng buộc

- **Sale** loại trừ Tip, Tax và order **Cancel**; refund/partial refund tính giá trị âm sau Discount.
- **Total Payment** = doanh thu cuối, **có** cộng Gift Card Redemption (khác với Amount Collected chỉ gồm Card+Cash+Others).
- Công thức panel: `Income Details.Total Payment = Sale + Tip + Tax Collected` và `Payment Details.Total Payment = Amount Collected + Gift Card Redemption` — hai con số này phải khớp nhau.
- `from`/`to` (epoch) lưu trên URL → filter ngày **bền qua reload / share link** (URL persistence).
- Mọi phép so sánh %vs Yesterday dựa trên cùng chỉ số của ngày liền trước.

## 5. Trạng thái / quyền / edge case

- **Quyền:** cần **owner passcode** (mặc định `8888`) qua passcode dialog; có tùy chọn _"Do not require passcode for the next 30 minutes"_.
- **Empty state:** ngày không có order → chart "No chart data available", bảng "No data available", tất cả chỉ số `$0.00`/`0`, Print vẫn enabled.
- **Refund/Cancel:** Sale/Total của order refund là số âm; order Cancel **không** vào Sale/Tip.
- **Live delta:** chỉ số cập nhật khi có order mới trong ngày đang xem (xem TC live-delta hiện có).
- **Lưu ý UI:** helper text của mỗi card là `<p>` **luôn hiển thị** dưới heading — **không** phải tooltip hover, **không** có nút ⓘ.

## 6. Đối chiếu Linear ↔ UI thực tế (khớp / lệch)

| Mục                | Linear                                                                         | UI thực tế                                     | Kết luận                                                                                                |
| ------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 4 chỉ số card      | Orders / Sale / Total Tips / Total Payment                                     | Total Order / Sale / Total tip / Total Payment | ✅ Khớp (khác biệt nhỏ về cách viết hoa/nhãn)                                                           |
| Mô tả "Orders"     | _Total number of order, refunds, and manual refunds_                           | _excluding cancel/refunds/ manual refunds_     | ⚠️ **Lệch câu chữ** — UI ghi "excluding", spec ghi "refunds and manual refunds". Cần PO xác nhận nghĩa. |
| Income Details     | Sale / Tip / Tax Collected / Total Payment                                     | Đủ 4 dòng                                      | ✅ Khớp                                                                                                 |
| Payment Details    | Card / Cash / Others / Amount Collected / Gift Card Redemption / Total Payment | Đủ 6 dòng                                      | ✅ Khớp                                                                                                 |
| Print              | (không nêu rõ)                                                                 | Có nút Print                                   | ✅ UI bổ sung, hợp lý                                                                                   |
| Tax Collected note | _total Tax_                                                                    | _(Sales tax collected, adjusted for refunds)_  | ✅ Khớp về ý (UI diễn giải rõ hơn)                                                                      |

## 7. Nguồn tham chiếu

- Spec Linear (offline): [docs/linear/income-report.md](../linear/income-report.md) — mục **Daily Sale Report**.
- Linear document gốc: https://linear.app/fastboy/document/income-report-cd80210c48f3 (team VOLT, updated 2026-06-11).
- Page object hiện có: `src/pages/pos/DailySaleReportPage.ts`.
- Test suite hiện có: `tests/regression/incomes/daily-sale-report/` (TC01–TC44).
- Ảnh quét: [income-daily-assets/income-daily-empty.png](income-daily-assets/income-daily-empty.png).
