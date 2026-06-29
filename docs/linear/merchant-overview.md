---
title: Merchant Overview
linearId: 8e891c1c-83f4-4c5d-9088-d6f4afa9b68c
url: https://linear.app/fastboy/document/merchant-overview-48df980f19e3
team: VOLT
updatedAt: 2026-06-11T09:59:47.102Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

**Merchant Overview** (xem [Settings](./settings.md))

Sau khi login Admin site, chọn Merchant thì sẽ hiển thị page overview của merchant trước, thể hiện những thông tin cơ bản của merchant, để có cái nhìn tổng quát về tiệm, rồi sau đó muốn vào một page cụ thể nào đó thì sẽ chọn từ thanh menu bên trái.

## **Mô tả:**

Merchant overview gồm những thông tin cơ bản:

1. **Merchant Information:** Merchant Avatar; Merchant Name; Merchant Whmcs ID; Merchant Status; POS Package; Active Date.
2. **Merchant Contact:** Merchant Owner name; Merchant Owner phone; Merchant Owner email; Merchant address.
3. **Device Overview:** Tổng số device; Danh sách device (Device name / ID: POS / DOT / Printer / Cash Drawer; Device type Bamboo POS / Bamboo Terminal / Printer / Cash Drawer...; Device status Connected / Disconnected).
4. **Order Report:** Order report tổng hợp (summary): Total order; Total Appointment; … Số liệu phản ánh tình trạng hiện tại của merchant.
5. **Batch History (Summary):** Giúp Admin biết merchant đã close batch gần nhất hay chưa. Batch Date gần nhất (today); Batch Status (Open / Closed).

## **Tổng quan bố cục (1 screen)**

**Header:** Merchant Name + Status

### **Block 1: Today Summary**

Cho phép Admin xem nhanh tình trạng hoạt động trong ngày.

* Total Orders: tổng order create thành công, không tính Cancel/Refund/Partial Refund.
* Total Tips: tổng tiền tip trên total order.
* Average Order: trung bình mỗi order khách thanh toán.
* Total Refunds: tổng tiền bị refund/partial refund.
* Total Appointments: tổng appointment được book trong ngày hôm nay.
* Total Payment (Revenue) = **Sale - Refund + Tip + Tax Collected** (final revenue includes Gift Card Redemption).
* Button View All → redirect đến Income Report menu.

Lưu ý: All Today Summary data must follow Merchant Timezone.

### **Block 2: Merchant Information**

* Merchant Profile: Merchant Avatar; Merchant Name; WHMCS ID; Status; POS Package; Active Date.
* Merchant Contact: Owner Name; Owner Phone; Owner Email; Merchant Address.
* Card này không cần action, chỉ để nhận diện & kiểm soát trạng thái.

### **Block 3: Device Summary**

Giúp Admin theo dõi tình trạng kết nối và hoạt động của thiết bị merchant.

* Device Structure: Mỗi Bamboo POS gồm 1 Bamboo DOT/Bamboo Terminal + 1 Printer.
* Device Status Sync: sync mỗi 1 tiếng/lần.
* Device Summary Display: Bamboo POS name/ID; POS status (Online/Offline); Bamboo DOT status (Connected/Disconnected); Printer status (Connected/Disconnected).
* Device Detail Drawer (khi click vào một Bamboo POS): Device Name; Device Status; Device ID; Terminal Serial; Last Connected; Last Disconnected; Uptime (7 ngày gần nhất).
* Connection History: Date; Uptime %; Status (Online/Offline).
* UX: Device offline/disconnected hiển thị warning state; không có dữ liệu connection history → empty state.

### **Block 4: Batch History**

Giúp Admin nhanh chóng xác định merchant đã close batch hay chưa.

* Thông tin: Batch Date; Batch Number; Amount; Status (Open / Closed).
* Button View All → redirect đến menu Batch History (xem toàn bộ batch history + chi tiết).

---

*Source: Google Docs — "Merchant Overview" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
