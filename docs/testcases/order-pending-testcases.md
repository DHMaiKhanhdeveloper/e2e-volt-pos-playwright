---
title: Test Cases — Order Pending (/order-pending)
source-linear: 'https://linear.app/fastboy/document/order-pending-caa07c054f23 (offline: docs/linear/order-pending.md)'
feature-doc: docs/features/order-pending.md
scanned-at: 2026-07-06
scanned-by: playwright-mcp (http://localhost:1420/order-pending)
skill: linear-testcase-gen (2/4)
---

# Test Cases — Order Pending (`/order-pending`)

> Đầu ra **Skill 2/4** (`linear-testcase-gen`). Nguồn: [feature spec 1/4](../features/order-pending.md)
>
> - quét Playwright MCP. Selector đều bắt nguồn từ kết quả quét thật (không bịa).
>
> **Cấu trúc spec (cập nhật 2026-07-06):** đã gộp thành **1 test lớn** kiểu Home
> (`TC-OP-ALL`) — mỗi TC dưới đây là một `test.step` chạy qua helper `check(...)`, kết quả
> xuất ra `reports/order-pending/order-pending-scan.{html,json}` (xem skill `screen-suite-report`).
> File: [TC-order-pending.spec.ts](../../tests/regression/orders/order-pending/TC-order-pending.spec.ts).

## Ma trận test case

| ID       | Tiêu đề                            | Tiền điều kiện         | Các bước                                                    | Kết quả mong đợi                                                                                     | Loại              | Ưu tiên |
| -------- | ---------------------------------- | ---------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------- | ------- |
| TC-OP-01 | Tải màn hình & toolbar hiển thị    | App đã đăng nhập       | 1. `goto('/order-pending')`                                 | Heading "Pending Orders" hiển thị; toolbar có Search, Staff filter, Sort, Date range, Quick Checkout | regression, smoke | P1      |
| TC-OP-02 | Card đơn chờ đúng cấu trúc         | Có ≥1 Pending Order    | 1. Mở màn 2. Đọc card đầu                                   | Card có mã dạng `OD######-########`, giờ tạo, trạng thái "Processing"                                | regression        | P1      |
| TC-OP-03 | Tìm theo Order ID lọc đúng         | Có ≥1 order, biết 1 mã | 1. Gõ 8 số cuối của 1 mã vào Search                         | Chỉ còn card khớp; các card khác biến mất                                                            | regression, ui    | P1      |
| TC-OP-04 | Tìm không khớp → rỗng              | Có ≥1 order            | 1. Gõ chuỗi không tồn tại `ZZZ000000`                       | Danh sách card = 0                                                                                   | regression        | P2      |
| TC-OP-05 | Sort Latest ↔ Oldest đảo thứ tự    | Có ≥2 order khác giờ   | 1. Ghi mã card đầu (Latest) 2. Chọn "Oldest"                | Card đầu sau khi đổi khác card đầu ban đầu                                                           | regression        | P2      |
| TC-OP-06 | Sort chỉ có 2 lựa chọn             | App mở                 | 1. Mở combobox Sort                                         | Options đúng là `Latest`, `Oldest`                                                                   | regression        | P3      |
| TC-OP-07 | Quick Checkout khả dụng            | App mở                 | 1. Quan sát toolbar                                         | Nút "Quick Checkout" hiển thị & enabled                                                              | regression        | P2      |
| TC-OP-08 | Staff filter có badge đếm          | App mở                 | 1. Quan sát nút Staff                                       | Nút "Staff" hiển thị kèm số đếm (vd 15)                                                              | regression        | P3      |
| TC-OP-09 | Date range mặc định = Today        | App mở                 | 1. Quan sát cụm date                                        | Combobox preset "Today"; nút calendar hiện ngày `MM/DD/YYYY`                                         | regression        | P3      |
| TC-OP-10 | Điều hướng chéo từ header          | App mở                 | 1. Click "Order History" 2. Quay lại 3. Click "Appointment" | URL đổi sang `/order-history` rồi `/appointment`                                                     | regression        | P2      |
| TC-OP-11 | Đơn đã thanh toán rời khỏi Pending | Biết 1 mã chưa tồn tại | 1. `expectOrderAbsent(<mã lạ>)`                             | Order không xuất hiện trong list (count 0)                                                           | regression        | P3      |

## Ghi chú thực thi

- **Trạng thái rỗng:** nếu shop không có Pending Order nào, TC-02/03/05 tự **skip an toàn**
  (guard theo số lượng card) thay vì fail giả.
- **i18n:** chuỗi tiếng Anh còn lộ (Quick Checkout, Latest/Oldest, Today, Processing…) do
  **Skill 5** xử lý — không assert nội dung dịch ở đây.
- Không tạo order mới / không checkout thật trong suite này (đọc-hiểu queue). Luồng tạo đơn
  end-to-end đã có ở [bulkCreateOrders.regression.spec.ts](../../tests/regression/orders/bulkCreateOrders.regression.spec.ts).

## Cách chạy

```bash
npx playwright test tests/regression/orders/order-pending/TC-order-pending.spec.ts --project=chromium
```
