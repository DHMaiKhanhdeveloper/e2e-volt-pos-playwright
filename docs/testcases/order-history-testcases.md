---
title: Test Cases — Order History (/order-history)
source-linear: 'offline: docs/linear/portal-order-history.md + docs/features/order-history.md'
scanned-at: 2026-07-06
scanned-by: playwright-mcp (app live http://localhost:1420/order-history)
skill: linear-testcase-gen (2/4)
---

# Test Cases — Order History (`/order-history`)

> Đầu ra **Skill 2/4**. Nguồn: feature spec [order-history.md](../features/order-history.md) +
> business rules Linear + quét live bằng Playwright MCP (2026-07-06).
>
> ⚠️ **An toàn dữ liệu:** app chạy 1 worker, **chia sẻ state backend thật**. Các hành động
> **phá huỷ** (xác nhận Huỷ đơn / Hoàn tiền / Chỉnh tip / Mở lại) **KHÔNG** được auto-confirm.
> Test chỉ **mở dialog rồi đóng an toàn** (Escape / nút "Keep Order"/"Close"), tuyệt đối không
> bấm nút chứa "Confirm". Kịch bản confirm-thật được ghi lại (P?) nhưng để chạy thủ công/cluster riêng.

## Bảng test case

| ID       | Tiêu đề                                           | Tiền điều kiện                | Các bước                                                                     | Kết quả mong đợi                                                                                           | Loại       | Ưu tiên |
| -------- | ------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | ------- |
| TC-OH-01 | Trang tải & thanh công cụ                         | Đã đăng nhập                  | 1. Vào `/order-history`                                                      | Header "Order History", nút DatePicker (dải ngày), nút "Filter", ô Search đều hiển thị                     | e2e        | P1      |
| TC-OH-02 | Danh sách đơn render theo ngày                    | Có đơn trong khoảng ngày      | 1. Vào trang 2. Xem cột trái                                                 | Có ≥1 tiêu đề ngày (vd "Jul 1, 2026") và ≥1 thẻ đơn; thẻ chứa mã `OD…`, trạng thái, tiền `$…`, tên NV, giờ | e2e        | P1      |
| TC-OH-03 | Empty state panel chi tiết                        | Chưa chọn đơn                 | 1. Vào trang, không click đơn                                                | Panel phải hiển thị "Select an order to view details."                                                     | e2e        | P2      |
| TC-OH-04 | Mở chi tiết đơn                                   | Có ≥1 đơn                     | 1. Click thẻ đơn đầu                                                         | URL đổi thành `/order-history/<id>`; nút "Receipt" hiển thị                                                | e2e        | P1      |
| TC-OH-05 | Section Order Information                         | Đã mở 1 đơn                   | 1. Mở đơn 2. Xem panel                                                       | Hiển thị "Order Information" + nhãn Status, Order ID, Cashier, Order Date, Customer, Phone                 | e2e        | P1      |
| TC-OH-06 | Section Order Summary                             | Đã mở 1 đơn                   | 1. Mở đơn                                                                    | Hiển thị "Order Summary" + Subtotal, Total Discount, Tax, Tip, Total (mỗi dòng có giá `$…`)                | e2e        | P1      |
| TC-OH-07 | Các section còn lại                               | Đã mở 1 đơn                   | 1. Mở đơn                                                                    | Hiển thị "Service Details", "Payment Details", "Order Note"                                                | e2e        | P2      |
| TC-OH-08 | Nút hành động — đơn Settled                       | Có đơn "Successful - Settled" | 1. Mở đơn settled                                                            | Hiển thị nút "Receipt" và "Refund"                                                                         | e2e        | P1      |
| TC-OH-09 | Nút hành động — đơn đã đóng (Canceled/Refunded)   | Có đơn Canceled hoặc Refunded | 1. Mở đơn đó                                                                 | Chỉ có "Receipt"; KHÔNG có "Refund"/"Cancel Order"                                                         | e2e        | P2      |
| TC-OH-10 | Search theo mã đơn (partial)                      | Biết 1 mã đơn hiển thị        | 1. Gõ 1 phần mã vào Search                                                   | Danh sách chỉ còn (các) đơn khớp; đơn đã gõ vẫn hiện                                                       | e2e        | P1      |
| TC-OH-11 | Search không khớp                                 | —                             | 1. Gõ chuỗi rác "ZZZNOMATCH999"                                              | Danh sách rỗng (không thẻ đơn nào)                                                                         | e2e        | P2      |
| TC-OH-12 | Dialog Filter mở & có đủ nhóm                     | —                             | 1. Click "Filter"                                                            | Dialog mở, có nhóm Sort by / Staff / Payment method / Status                                               | e2e        | P1      |
| TC-OH-13 | Filter — options Payment method                   | Dialog Filter mở              | 1. Mở nhóm Payment method                                                    | Có Card, Cash, Gift Card, Other                                                                            | e2e        | P2      |
| TC-OH-14 | Filter — options Status                           | Dialog Filter mở              | 1. Mở nhóm Status                                                            | Có Successful-Unsettled, Successful-Settled, Canceled, … (Settled/Unsettled tách riêng)                    | e2e        | P2      |
| TC-OH-15 | Filter — Clear/Confirm & đóng an toàn             | Dialog Filter mở              | 1. Thấy nút Clear + Confirm 2. Đóng dialog (Escape)                          | Có 2 nút; dialog đóng, không thay đổi dữ liệu                                                              | e2e        | P2      |
| TC-OH-16 | DatePicker mở lịch 2 tháng                        | —                             | 1. Click nút dải ngày                                                        | Popover lịch mở, có nút Today / Cancel / Apply                                                             | e2e        | P2      |
| TC-OH-17 | Dialog Receipt mở & đóng an toàn                  | Đã mở 1 đơn                   | 1. Mở đơn 2. Click "Receipt" 3. Đóng                                         | Dialog Hoá đơn mở (In / SMS / Email); đóng được, không mất state                                           | e2e        | P2      |
| TC-OH-18 | Dialog Refund mở rồi HUỶ (không confirm)          | Có đơn Settled                | 1. Mở đơn settled 2. Click "Refund" 3. Đóng bằng "Cancel"/Escape             | Dialog Hoàn tiền mở; đóng an toàn KHÔNG thực hiện hoàn tiền                                                | e2e        | P1      |
| TC-OH-19 | Dialog Cancel/Void mở rồi GIỮ đơn (không confirm) | Có đơn Unsettled              | 1. Mở đơn unsettled 2. Click "Cancel Order" 3. Đóng bằng "Keep Order"/Escape | Dialog Huỷ mở; đóng an toàn, đơn KHÔNG bị huỷ                                                              | e2e        | P1      |
| TC-OH-20 | Mặc định loại trừ đơn Pending                     | —                             | 1. Vào trang, xem list                                                       | Không có thẻ đơn trạng thái "Pending"                                                                      | e2e        | P2      |
| TC-OH-21 | i18n (tham chiếu chéo)                            | —                             | Xem skill i18n-vietnamese-scan                                               | Không còn chuỗi EN giữa UI Tiếng Việt (báo cáo riêng)                                                      | regression | P2      |

### Ghi chú map code

- Mỗi TC ánh xạ 1-1 sang một `test(...)` trong spec (trừ TC-OH-21 thuộc bộ i18n riêng).
- TC status-dependent (08/09/18/19) dùng `test.skip(...)` khi không có đơn đúng trạng thái trong data hiện tại.
