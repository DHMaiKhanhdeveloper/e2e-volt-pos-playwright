---
title: Order Management
linearId: 0ce3807f-e79b-4e1f-bb86-82a76f6c914f
url: https://linear.app/fastboy/document/order-management-afeb73979dd4
team: VOLT
updatedAt: 2026-06-11T09:59:38.933Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# **PORTAL DOCUMENTATION: ORDER MANAGEMENT** (xem [Order Flow](./order-flow.md))

## **1. Tổng quan (Overview)**

Module **Order Management** trên Portal cho phép Admin/Owner theo dõi toàn bộ lịch sử giao dịch tại cửa hàng theo thời gian thực. Tại đây, người quản trị có thể tra cứu chi tiết đơn hàng, kiểm tra trạng thái thanh toán và thực hiện các nghiệp vụ xử lý sau bán hàng (Void/Refund) mà không cần thao tác trực tiếp trên máy POS.

## **2. Danh sách đơn hàng (Order Listing)**

### **2.1. Bộ lọc và Tìm kiếm (Filter & Search)**

* **Search:** theo Order ID hoặc Tên/Số điện thoại khách hàng.
* **Date Range:** theo ngày tạo đơn (Created At) hoặc ngày cập nhật trạng thái (Updated At).
* **Payment Method:** Cash, Card, Gift Card, Other.
* **Status:** Successful, Refunded, Canceled, v.v.

### **2.2. Thông tin hiển thị (Columns)**

Order ID (VD #OD10023); Date/Time; Customer (hoặc "Walk-in"); Total Amount; Payment Method; Status (mã hóa màu sắc).

## **3. Chi tiết đơn hàng (Order Details)**

### **3.1. Thông tin chung (Order Info)**

* **Order Summary:** Subtotal; Discount; Tax (nếu có); Tip; **Total**.
* **Customer Info:** Tên, Số điện thoại, Nhóm khách hàng.

### **3.2. Chi tiết dịch vụ (Service Details)**

Tên dịch vụ/sản phẩm; Nhân viên thực hiện (Staff name); Giá tiền (giá cuối cùng và phần -số tiền/% đã giảm).

### **3.3. Chi tiết thanh toán (Payment Details)**

* **Card:** Loại thẻ (Visa/Master...), 4 số cuối, Mã giao dịch (Auth Code/Trans ID).
* **Cash:** Số tiền khách đưa và tiền thừa (Change).
* **Gift Card:** Mã thẻ quà tặng đã sử dụng.

### **3.4. Lịch sử hoàn tiền/hủy (Refund/Void Logs)**

Người thực hiện (By Staff); Thời gian; Số tiền (Amount); Lý do (Reason: Staff mistake, Customer request, v.v.).

## **4. Định nghĩa trạng thái đơn hàng (Order Status Definitions)**

| Trạng thái | Mô tả | Hành động cho phép trên Portal |
| -- | -- | -- |
| **Successful - Unsettled** | Đã thanh toán nhưng chưa chốt sổ (Batch Close), thường là giao dịch trong ngày hiện tại | View, Void (Cancel), Adjust Tip |
| **Successful - Settled** | Đã hoàn tất và đã chốt sổ (tiền đã về hoặc đang xử lý bank) | View, Refund (Full/Partial) |
| **Canceled (Void)** | Đã bị hủy toàn bộ giao dịch trước khi chốt sổ | View Only |
| **Refunded** | Đã hoàn tiền 100% | View Only |
| **Partial Refunded** | Đã hoàn tiền một phần | View, Partial Refund |
| **Refund Issue** | Giao dịch hoàn tiền qua thẻ bị lỗi từ phía Gateway | Retry Refund |

*Lưu ý: Refund Issue chỉ xảy ra với thẻ (Card). Trên POS không thể xử lý lại, bắt buộc Admin vào Portal để Retry trên Gateway.*

## **5. Các tính năng quản trị (Admin Actions)**

### **5.1. Void Order (Hủy đơn hàng)**

* Điều kiện: Chỉ áp dụng cho đơn **Successful - Unsettled**.
* Tác động: Hủy toàn bộ giao dịch (Void transaction). Tiền không bị trừ khỏi thẻ (đối với thẻ) hoặc ghi nhận trả lại tiền mặt.
* Báo cáo: Ghi nhận trạng thái Canceled, không tính vào doanh thu.

### **5.2. Refund / Partial Refund (Hoàn tiền)**

* Điều kiện: Áp dụng cho đơn **Successful - Settled**. Nếu trong 1 Order có credit transaction chưa Batch/Close → disable nút Refund.
* **Partial Refund:** Bắt buộc chọn service/product (Item). Chọn All = full refund; chọn ít hơn = partial refund.
  * Special case discount/TAX: refund trên giá service sau discount, phần discount apply cho order chia tỉ lệ % trên từng service.
  * Special case promotion (vd rule ≥$100): Promotion vẫn giữ vì đã chốt tại checkout (settled).
* **Quy tắc tiền Tip:** Giao dịch gốc Auth → chỉ hoàn tối đa Base Amount, không hoàn Tip khi Partial Refund. Giao dịch gốc Sale → có thể hoàn cả Tip.
* **Full Refund:** Hoàn 100% bao gồm Tip và Service Fee.

### **5.3. Adjust Tip**

Chỉnh sửa số tiền Tip sau khi order thanh toán thành công. Điều kiện:

* Status order: **Successful - Unsettled**
* Payment method: **Card / Cash / Other**
* Riêng Card: status payment = **Auth**
* Order nhiều payment method: hiển thị list và phải select 1 payment method cụ thể.

Lưu ý: Gift Card KHÔNG cho phép Adjust Tip; Sau khi Adjust Tip, order nhiều Staff → auto update lại Split Tip; Chỉ cho add Tip khi có Staff trong order.

### **5.4. Xử lý sự cố giao dịch (Issue Handling)**

* **Retry Refund:** với đơn Refund Issue, Admin dùng Portal gửi lại lệnh hoàn tiền trên Gateway.
* **View Receipt:** Xem và in lại hóa đơn (gửi email cho khách nếu cần).

## **6. Logic Báo cáo liên quan (Report Impact)**

* **Net Income** = (Total Sale - Total Refund) - Total Discount + Tip - Gift Card Sale.
* **Amount Collected** (Tiền thực thu) = Card + Cash + Others + Tip.
* **Gift Card Sales:** Doanh thu bán Gift Card chưa tính là thu nhập (Income) cho đến khi thẻ được dùng thanh toán cho đơn hàng khác (Redeemed).

---

*Source: Google Docs — "Order Management" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
