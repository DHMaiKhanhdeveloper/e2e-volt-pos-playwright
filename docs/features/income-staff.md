---
title: Staff Income (/incomes/income-staff)
source-linear: 'https://linear.app/fastboy/document/income-report-cd80210c48f3 (đọc bản offline docs/linear/income-report.md — Linear MCP chưa xác thực trong phiên này)'
scanned-at: 2026-07-06
scanned-by: playwright-mcp trên app live http://localhost:1420/incomes/income-staff
skill: linear-feature-spec (1/4)
---

# Staff Income (`/incomes/income-staff`) — Đặc tả tính năng

> File này là đầu ra **Skill 1/4** (`linear-feature-spec`) cho màn hình **Staff Income** (Thu nhập nhân viên).
> Nguồn: spec offline Linear (`docs/linear/income-report.md`, mục **Staff Income**) + **quét màn hình thật** bằng
> Playwright MCP trên app đang chạy (2026-07-06). Không sinh test case / code ở skill này.

## 1. Mục tiêu & phạm vi

Màn `/incomes/income-staff` (tiêu đề UI: **Staff Income**) là **report dự trù thu nhập của từng nhân viên** theo ngày/khoảng ngày:

- Danh sách staff kèm chỉ số thu nhập; search theo **nickname**; filter theo ngày/khoảng.
- Bảng tổng đầu trang: Total staff, Total orders, Total subtotal, Total supply fee, Total tip, Total staff income.
- Click 1 staff → panel chi tiết thu nhập theo **setting Compensation** của staff đó (Commission / Salary / Commission+Salary) + **Print**.

> Lưu ý nghiệp vụ: Staff Income chỉ là **report dự trù**; con số chính xác chốt ở **Payroll** khi đóng kỳ lương.

## 2. Các luồng chính (từ Linear)

- **Staff listing:** Search (Staff Nickname); Filter (ngày xem report); cột: **Staff (nickname); Orders; Subtotal (= Sale − Refund); Supply Fee; Tip; Total Income**.
- **Staff Income detail** — 2 biến thể theo Compensation:
  1. **STAFF INCOME – Commission**
     - Staff Info: Name (Nickname); Date (1 ngày hoặc range + No. of WD).
     - Order listing: Order#; Sale/Refund; Supply; Tip.
     - Detail: Sale; Refund; **Subtotal = Sale − Refund**; Supply Fee; **Staff Commission = (Subtotal − Supply fee) × 60%**; Clean Up Fee/Deduction; Tip; **TOTAL INCOME = Commission − Clean up + Tip**.
  2. **STAFF INCOME – Salary / Commission + Salary** (Pay by Hour/Day/Period)
     - Staff Info: Name; Date; Clock In; Clock Out; Working Hours.
     - Order listing: Order#; Sale/Refund; Tip.
     - Detail: Sale; Refund; **Subtotal**; **Rate** (theo setting: Salary by Period / Wage Per Hour / Wage Per Day); **Gross Income = [ngày/giờ] × rate**; Clean Up Fee; Tip; **TOTAL INCOME = Gross Income − Clean Up + Tip**.
- **Lưu ý:** nếu staff set **Salary** hoặc **Commission + Salary** → luôn show cả Commission lẫn Salary, nhưng Total Income lấy phần Salary (phụ thuộc **Staff Days Off Setting**). Wage Per Hour cần Checkin–Checkout; Wage Per Day cần Checkin.

## 3. Thành phần UI thực tế (quét bằng Playwright MCP, 2026-07-06)

Ảnh: [income-staff-assets/income-staff-empty.png](income-staff-assets/income-staff-empty.png) (ngày 07/06/2026 chưa có staff data)

| Thành phần                      | Vai trò                                                        | Trạng thái                                                                             | Ghi chú                          |
| ------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------- |
| Tiêu đề **Staff Income**        | Nhãn màn hình                                                  | Hoạt động                                                                              |                                  |
| **Search staff** (textbox)      | Lọc theo nickname                                              | Hoạt động                                                                              | placeholder "Search staff"       |
| Combobox preset (**Today**)     | Chọn khoảng ngày nhanh                                         | Hoạt động                                                                              | Đi kèm calendar                  |
| Nút **calendar `07/06/2026`**   | Date-picker                                                    | Hoạt động                                                                              | Accessible name `MM/DD/YYYY`     |
| Thẻ tổng **Total staff**        | Đếm số staff                                                   | Hoạt động                                                                              | `0` khi trống                    |
| Thẻ tổng **Total orders**       | Tổng order                                                     | Hoạt động                                                                              | `0`                              |
| Thẻ tổng **Total subtotal**     | Tổng subtotal                                                  | Hoạt động                                                                              | `$0.00`                          |
| Thẻ tổng **Total supply fee**   | Tổng supply fee                                                | Hoạt động                                                                              | `$0.00`                          |
| Thẻ tổng **Total tip**          | Tổng tip                                                       | Hoạt động                                                                              | `$0.00`                          |
| Thẻ tổng **Total staff income** | Tổng thu nhập staff                                            | Hoạt động                                                                              | `$0.00`                          |
| **Danh sách staff**             | Bảng staff (Staff/Orders/Subtotal/Supply Fee/Tip/Total Income) | Trống → **"No results found."**                                                        | Cột hiện khi có data (theo spec) |
| **Panel chi tiết**              | Chi tiết thu nhập 1 staff + Print                              | Trống → "No detail to show — Select staff to preview income details or print reports." | Cần chọn staff                   |

## 4. Nghiệp vụ & ràng buộc

- **Subtotal = Sale − Refund**; **Staff Commission = (Subtotal − Supply fee) × 60%** (60% theo Staff Compensation split; nếu chỉ set Salary → Commission = 0).
- **Clean Up Fee/Deduction = $ setting Deduction Per Day × số ngày xem report.**
- **TOTAL INCOME (Commission) = Commission − Clean up + Tip**; **TOTAL INCOME (Salary) = Gross Income − Clean up + Tip**.
- **Rate** phụ thuộc kiểu lương: Salary by Period (lương kỳ ÷ số ngày trong kỳ), Wage Per Hour, Wage Per Day.
- Report là **dự trù**; số chốt nằm ở **Payroll**.

## 5. Trạng thái / quyền / edge case

- **Quyền:** owner passcode (đã bypass 30 phút trong phiên quét).
- **Empty state:** không có staff phát sinh trong ngày → "No results found." + panel "No detail to show".
- **Salary/Commission+Salary:** hiển thị cả Commission và Salary; Total Income phụ thuộc **Staff Days Off Setting**.
- **Wage Per Hour/Day:** cần dữ liệu Checkin/Checkout để tính giờ/ngày làm việc.

## 6. Đối chiếu Linear ↔ UI thực tế (khớp / lệch)

| Mục                  | Linear                                            | UI thực tế                                                           | Kết luận                                                         |
| -------------------- | ------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Tên màn              | "Staff Income"                                    | Tiêu đề UI "Staff Income"                                            | ✅ Khớp                                                          |
| Search               | Search theo Nickname                              | textbox "Search staff"                                               | ✅ Khớp                                                          |
| Cột listing          | Staff/Orders/Subtotal/Supply Fee/Tip/Total Income | Chưa quan sát được (empty) — thanh tổng phản ánh đúng các chỉ số này | ⚠️ **Chưa xác nhận cột trên data thật** (cần chạy ngày có staff) |
| Thanh tổng đầu trang | (spec không liệt kê rõ)                           | Total staff/orders/subtotal/supply fee/tip/staff income              | ✅ UI bổ sung, khớp ý các chỉ số spec                            |
| Detail 2 biến thể    | Commission / Salary                               | Chưa quan sát được (empty)                                           | ⚠️ **Chưa xác nhận trên data thật**                              |

> **TODO cho skill 2 (testcase-gen):** cần chọn 1 ngày có staff phát sinh để xác nhận cột bảng + 2 biến thể panel chi tiết (Commission vs Salary) trước khi sinh assertion.

## 7. Nguồn tham chiếu

- Spec Linear (offline): [docs/linear/income-report.md](../linear/income-report.md) — mục **Staff Income**.
- Linear document gốc: https://linear.app/fastboy/document/income-report-cd80210c48f3 (team VOLT, updated 2026-06-11).
- Liên quan: `docs/linear/payroll.md`, `docs/linear/time-keeping.md`, `docs/linear/staff-management.md`, `docs/linear/count-days-off.md`.
- Công thức: `src/reports/incomeCalcCore.ts`, `docs/report-field-formulas.md`.
- Ảnh quét: [income-staff-assets/income-staff-empty.png](income-staff-assets/income-staff-empty.png).
