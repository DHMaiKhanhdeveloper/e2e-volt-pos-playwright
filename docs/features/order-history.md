---
title: Order History (/order-history)
source-linear: 'Linear MCP chưa xác thực trong phiên này → dùng offline docs/linear/portal-order-history.md (linearId 09314f50-bf15-4369-ac55-3f8a37c2e830, url https://linear.app/fastboy/document/portal-order-history-ba2903a15df5)'
scanned-at: 2026-07-06
scanned-by: playwright-mcp (app live http://localhost:1420/order-history)
skill: linear-feature-spec (1/4)
---

# Order History (`/order-history`) — Đặc tả tính năng

> Đầu ra **Skill 1/4** (`linear-feature-spec`) cho màn hình **Lịch sử đơn hàng**. Nguồn:
> business rules offline trên Linear (`portal-order-history.md`) + **quét màn hình thật**
> bằng Playwright MCP trên app POS đang chạy (2026-07-06, đơn `#OD260701-12504800`).
> Linear mô tả _Portal_ Order History nhưng theo **POS Parity Notes §14**, data shape &
> điều kiện hành động (refund/cancel/reopen/tip) là **giống hệt** giữa POS và Portal —
> nên các business rule ở đây áp dụng cho cả màn POS `/order-history`.

## 1. Mục tiêu & phạm vi

Màn hình cho phép nhân viên/chủ tiệm **tra cứu lại các đơn đã xử lý** (loại trừ đơn
`pending`), xem **chi tiết đơn**, và thực hiện **hành động sau thanh toán** tuỳ trạng thái:
hoá đơn, hoàn tiền, huỷ/void, mở lại đơn, chỉnh tip, gửi hoá đơn. Phạm vi gồm:

- Trang danh sách `/order-history` (thanh lọc + danh sách đơn theo ngày).
- Trang chi tiết `/order-history/<orderId>` (panel phải).
- Các popup/dialog: **DatePicker** (lịch), **Bộ lọc** (+4 dropdown con), **Hoá đơn**
  (receipt preview + In/SMS/Email), **Hoàn tiền**, **Huỷ đơn**, **Chỉnh tip**, **Mở lại đơn**.

## 2. Các luồng chính (từ Linear)

- **Danh sách & lọc (§8):** mặc định ẩn đơn `pending`, sort mới nhất theo ngày tạo,
  20 đơn/trang. Lọc theo: mã đơn (partial, case-insensitive), khách (tên/SĐT/email),
  location, trạng thái (multi-select, Settled/Unsettled tách riêng), phương thức TT,
  nhân viên, khoảng ngày (Hôm nay / Hôm qua / 7 ngày / 30 ngày / Tháng này / tuỳ chọn).
- **Settled vs Unsettled (§2):** cờ `settled` quyết định nút nào hiện — ràng buộc của
  payment processor, không chỉ là luật nghiệp vụ.
- **Vòng đời trạng thái (§3):** `pending → successful`; unsettled → `canceling`/`re_open`;
  settled → `refunding`; các nhánh `canceled`/`cancel_issue`/`refunded`/`partial_refunded`/
  `refund_issue`. Khi đang `refunding`/`canceling` → **chặn mọi hành động** (transitional).
- **Hành động (§4):** Full/Partial Refund, Cancel/Void, Reopen, Adjust Tip, Send Receipt,
  Export — mỗi hành động có bộ điều kiện riêng (xem §4 tài liệu này).

## 3. Thành phần UI thực tế (quét bằng Playwright MCP, 2026-07-06)

| Thành phần                | Vai trò                                                                     | Trạng thái                     | Ghi chú                                                                    |
| ------------------------- | --------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| Header (banner)           | Sidebar · Đơn chờ · Order History · Appointment · Scanner · Search · 3 icon | Hiện                           | Dùng chung layout với Home                                                 |
| Nút **DatePicker**        | Mở popover lịch 2 tháng, chọn khoảng ngày                                   | Hiện                           | Nhãn `06/28/2026 - 07/05/2026`, aria `icon-calendar`                       |
| Nút **Filter**            | Mở dialog Bộ lọc                                                            | Hiện                           | 4 nhóm: Sort / Nhân viên / Phương thức TT / Trạng thái                     |
| Ô **Search**              | Tìm mã đơn / tên khách / SĐT                                                | Hiện                           | placeholder "Search order ID, customer name or phone"                      |
| **Danh sách đơn** (trái)  | Tiêu đề ngày (`Jul 1, 2026`) + thẻ đơn                                      | Hiện                           | Thẻ: mã · trạng thái · khách/SĐT · phương thức TT · tiền · nhân viên · giờ |
| **Panel rỗng**            | Khi chưa chọn đơn                                                           | Hiện                           | "Select an order to view details."                                         |
| **Panel chi tiết** (phải) | Khi chọn 1 đơn                                                              | Hiện                           | Header `Order #OD…` + nút hành động theo trạng thái                        |
| → **Order Information**   | Status · Order ID · Cashier · Order Date · Customer · Phone                 | Hiện                           |                                                                            |
| → **Order Summary**       | Subtotal · Total Discount · Tax · Tip · Total                               | Hiện                           |                                                                            |
| → **Service Details**     | Staff + dòng dịch vụ (service-name / price) + "Last updated"                | Hiện                           |                                                                            |
| → **Tip**                 | Danh sách chia tip theo nhân viên (`Andy - $20.00`)                         | Hiện                           | Ẩn nếu không có tip                                                        |
| → **Payment Details**     | Dòng thanh toán (Cash/Card) + "Got: $X (Change… - Tip…)"                    | Hiện                           |                                                                            |
| → **Order Note**          | Ghi chú đơn                                                                 | Hiện                           | "No note for this order." nếu trống                                        |
| Nút **Receipt**           | Mở dialog Hoá đơn (In / SMS / Email)                                        | Hiện (mọi trạng thái)          | tái dùng receipt-preview của /settings/receipt                             |
| Nút **Refund**            | Mở dialog Hoàn tiền                                                         | Chỉ khi settled + đủ điều kiện |                                                                            |

### 3a. Bộ nút hành động theo TRẠNG THÁI (xác minh live)

| Trạng thái đơn             | Nút hiển thị                                 |
| -------------------------- | -------------------------------------------- |
| Successful - **Unsettled** | Adjust Tip · Receipt · Reopen Order · Cancel |
| Successful - **Settled**   | Receipt · Refund                             |
| **Canceled**               | Receipt                                      |
| **Refunded**               | Receipt                                      |

## 4. Nghiệp vụ & ràng buộc (từ Linear §4)

- **Full Refund:** settled=true; status `successful`/`partial_refunded`; có ≥1 payment không phải gift-card; không transitional; quyền `refund`. Cần **Reason**. → `refunding` → `refunded`/`refund_issue` (không auto-retry).
- **Partial Refund:** settled=true; transaction còn remaining balance > 0; nếu card thì batch đã đóng; amount ≤ remaining; quyền `refund`. Reason **optional**.
- **Cancel/Void:** settled=false; status `successful`/`pending`/`partial_refunded`/`cancel_issue`; quyền `cancel_order_void`. Cần **Reason**. → `canceling` → `canceled`/`cancel_issue` (có thể retry từ portal).
- **Reopen:** settled=false; status `successful`/`re_open`; quyền `edit_order`. Nếu đang `re_open` → nhãn "Continue Re-open".
- **Adjust Tip:** settled=false; status `successful`; tip timing = `AFTER_PAYMENT`; có ≥1 staff; quyền `adjust_tip`.
- **Send Receipt:** mọi trạng thái; quyền `view_orders`; validate email/phone (10+ digits).
- **Export:** quyền `export_orders`; theo filter hiện tại; format csv/pdf.
- **Money (§12):** mọi số tiền lưu integer cents, hiển thị qua `money()`.
- **Reasons (§5):** Customer Request / Service Issue / Incorrect Order / Duplicate Payment / Promotion-Discount Error / Staff Mistake / Other.

## 5. Trạng thái / quyền / edge case

- **Quyền:** thiếu quyền → nút hành động **bị ẩn** (không disable). Ma trận quyền §6 Linear.
- **Transitional blocking:** `refunding`/`canceling` → chặn tất cả hành động.
- **Multi-location (§7):** mặc định xem mọi đơn trong các location được cấp; đơn thuộc location không có quyền → coi như not found.
- **Issue status (§9):** `cancel_issue` retry được từ portal; `refund_issue` phải xử lý thủ công.
- **Edge cột hiển thị:** khách/SĐT có thể là `-`; SĐT ẩn dạng `***-***-2052`; phương thức TT có thể ghép "Card, Cash".
- ⚠️ **Cảnh báo tự động hoá:** dialog Huỷ đơn có nút "Confirm Cancel" — khi đóng dialog tuyệt đối **không** bấm nút xác nhận, chỉ Escape / "Keep Order", tránh huỷ đơn thật.

## 6. Đối chiếu Linear ↔ UI thực tế (khớp / lệch)

- **Khớp:** cấu trúc list + filter + detail panel + bộ nút theo settled/status đúng như
  ma trận eligibility §15 Linear. Các trạng thái quan sát live (Settled/Unsettled/Canceled/
  Refunded) và nút tương ứng khớp §4.
- **Lệch / chưa xác minh live:**
  - **Export** (§4.7) và **Location filter** (§7): Linear có nhưng phiên quét POS chưa
    thấy nút Export riêng; dialog Bộ lọc live gồm Sort/Nhân viên/Phương thức TT/Trạng thái
    (chưa thấy Location — có thể do 1 location trong data test).
  - **Audit Log** (§10): Linear mô tả log theo thời gian trong order detail — chưa thấy
    section audit log trên panel chi tiết POS (có thể là tính năng riêng của Portal).
  - **i18n:** một số chuỗi còn tiếng Anh khi bật Tiếng Việt (lịch, phương thức TT ở thẻ đơn,
    vài nhãn hoá đơn) — chi tiết ở [order-history-translation-map.md](../i18n/order-history-translation-map.md), là đầu vào cho Skill i18n-vietnamese-scan.

## 7. Nguồn tham chiếu

- Linear (offline): [docs/linear/portal-order-history.md](../linear/portal-order-history.md)
- i18n map: [docs/i18n/order-history-translation-map.md](../i18n/order-history-translation-map.md)
- Test i18n hiện có: [tests/regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts](../../tests/regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts)
- Helper: [src/utils/i18nOrderHistory.ts](../../src/utils/i18nOrderHistory.ts)
- Ảnh quét: `reports/i18n-audit/screens/order-history.png`, `reports/i18n-audit/screens/order-history-chi-ti-t.png`
