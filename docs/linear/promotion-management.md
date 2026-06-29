---
title: Promotion Management
linearId: 2ad922c5-bec5-4165-9283-538ff32acfb1
url: https://linear.app/fastboy/document/promotion-management-08b531d2158d
team: VOLT
updatedAt: 2026-06-11T09:59:28.568Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

**Promotion Management Page**

* **Mục tiêu:** Xây dựng một trang quản lý Promotion cho tiệm Nail, cho phép: Tạo và quản lý các chương trình khuyến mãi; Tự động áp dụng vào POS khi phù hợp; Theo dõi lịch sử sử dụng và doanh thu từ promotion.
* **Đối tượng sử dụng:** Chủ tiệm (Merchant); Admin (hỗ trợ vận hành).
* **Phạm vi:** Page gồm 4 nhóm chính: Promotion (giảm giá trực tiếp); Rewards (dùng điểm để đổi ưu đãi); Reminder (nhắc khách quay lại); Birthday (ưu đãi sinh nhật).
* **Tổng quan UI/UX:** 1 màn hình duy nhất, chia thành 4 tab: Promotion | Rewards | Reminder | Birthday. Mỗi tab gồm: Danh sách (list view); Filter theo status và thời gian; Create / Edit / Duplicate (làm sau); View Usage History.

## 1. Promotion

* Mô tả: Giảm giá trực tiếp trên toàn bộ bill.
* POS Behavior: Áp dụng cho toàn bộ bill; Hiển thị danh sách promotion hợp lệ tại checkout; Không hiển thị nếu không thỏa điều kiện; Highlight promotion "tốt nhất" (discount cao nhất) nếu làm được; Cho phép user chọn 1 promotion trên 1 order.
* Rule: Mỗi order chỉ áp dụng 1 promotion; Có thể thay đổi trước khi checkout; Sau checkout: Promotion bị lock; Khi reopen order: Không cho thay đổi hoặc thêm promotion mới.

### 1.1 Promotion listing

Campaign Name; Offer (% order hay fixed amount); Target Audience (group customer); Schedule (Date Send qua sms/email); Valid Period; Action (Update); Button (Add New); Filter (Status Active/Expired default Active, Campaign Name); Sort default desc theo Schedule.

### 1.2 Promotion Detail

* Campaign Name; Campaign Info (Offer, Created, Valid Period, Send To); Performance (Total Delivery Email/SMS/Total, Redemption, Conversion Rate (%) = Total Delivery / Redemption × 100, Income, Redemption amount).
* Customers Who Used This Offer: #, Name, Phone, Used Total, Income, Redemption amount.

### 1.3 Add New Promotion (dialog)

* Title: Add New Campaign. Campaign Type: Promotion | Rewards | Reminder | Birthday → chọn Promotion.
* **Campaign Detail:** Campaign Name (max 50 chars); What do you want to offer? (% trên tổng order hoặc fixed amount); Message to show customer (max 80 chars); Reply STOP to opt out (checkbox); Valid: MM/DD/YYYY (checkbox, lấy từ End Date của How long to offer?).
* **Usage Limit:** Toggle "Promotion for one time use only" — Enable: 1 customer dùng 1 lần; Disable: dùng nhiều lần (1 order chỉ apply 1 promotion).
* **Who to Send To:** Checkbox tất cả group customer + option All.
* **Campaign Schedule:** How long to offer? (Start Date, End Date); When to send? (Date, Time chỉ 8:00–20:00 — TCPA Compliance Notice, Sent Immediately checkbox).
* **Test & Finalize:** Phone number (Test Now); Email (Test Now).
* Button: Add / (X).
* Lưu ý: Không cho phép chọn How long to offer? trong quá khứ; Không cho phép When to send? trong quá khứ hoặc sau End Date.

### 1.4 Update Promotion

* Chỉ update nếu promotion chưa đến thời gian schedule và chưa gửi cho Customer. Nếu đã chạy → disable Save, view only. Cho phép update tất cả thông tin nếu thỏa điều kiện. Promotion đã expired không sử dụng/không update được.

## 2. Rewards

* Mô tả: dạng promotion đổi điểm tích lũy. Cơ chế tích điểm: sau order hoàn thành, mặc định $1 = 1 point (có thể cấu hình).
* POS Behavior: Cho phép chọn 1 reward; Trừ điểm realtime khi checkout.
* Rule: Mỗi order chỉ áp dụng 1 reward; Không hoàn lại point khi refund; Không rollback điểm đã trừ.

### 2.1 Rewards listing

Reward Content; Status (Active/Inactive); Point; Discount Value (% hoặc fixed amount); Action (Update). Lưu ý: Reward không có start/end date, chỉ cần thỏa điều kiện point.

### 2.2 Update Rewards

Cho phép update thoải mái, không phụ thuộc điều kiện, phải lưu log. Không cho Delete, nếu không dùng thì Inactive.

### 2.3 Add New Rewards

Title: Add New Campaign; Campaign Type → Rewards; Reward name (max 50 chars); What is the value of offer? (% hoặc fixed amount $); Point (số điểm để đổi); Status (default Active). Button: Add / (X).

## 3. Reminder

* Mô tả: Gửi thông báo nhắc khách quay lại nếu không phát sinh giao dịch sau một khoảng thời gian.
* Rule: Chỉ gửi 1 lần khi thỏa điều kiện; Không gửi lại; Không reset sau khi gửi.

### 3.1 Reminder listing

Campaign Name; Offer; Target Audience; Schedule (Date quy ra từ "Send to customers who haven't visited for" = [Current Date - Last Visit Date], Time default 09:00AM); Valid Period (từ "How long should this reminder be valid?"); Action (Update); Button (Add New); Filter (Status Active/Inactive, Campaign Name); Sort default desc theo Schedule.

### 3.2 Reminder Detail

Tương tự Promotion Detail (Campaign Name, Campaign Info, Performance, Customers Who Used This Offer).

### 3.3 Add New Reminder (dialog)

Như Promotion, với Campaign Schedule riêng:
* **Send to customers who haven't visited for:** gửi promotion nếu số ngày customer không quay lại = số ngày setting (tính từ lần visit cuối). Input: number (days).
* **How long should this reminder be valid?:** số ngày sử dụng promotion kể từ ngày gửi. Input: number (days).

### 3.4 Update Reminder

Tương tự Reward, không có Start/End Date, update thoải mái. Customer đã được gửi reminder mà vẫn thỏa điều kiện sau update → gửi tiếp. Không cho Delete, nếu không dùng thì Inactive.

## 4. Birthday

* Mô tả: Tự động gửi ưu đãi vào dịp sinh nhật khách hàng.
* Logic: Gửi trước sinh nhật X ngày; Promotion có hiệu lực trong X ngày sau sinh nhật.
* Rule: Tự động gửi; Bỏ qua nếu customer không có ngày sinh.

### 4.1 Birthday listing

Campaign Name; Offer; Target Audience; Schedule (Date quy ra từ "Send this promotion before birthday", Time default 09:00AM); Valid Period (phụ thuộc "Promotion valid how long after birthday?"); Action (Update); Button (Add New); Filter (Status Active/Inactive, Campaign Name); Sort default desc theo Schedule.

### 4.2 Birthday Detail

Tương tự Promotion Detail.

### 4.3 Add New Birthday (dialog)

Như Promotion, với Campaign Schedule riêng:
* **Send this promotion before birthday:** gửi trước ngày sinh nhật X ngày. Input: number (days).
* **Promotion valid how long after birthday?:** số ngày sử dụng kể từ ngày gửi. Input: number (days).

### 4.4 Update Birthday

Tương tự Reward, không có Start/End Date, update thoải mái. Customer đã gửi mà vẫn thỏa điều kiện sau update → gửi tiếp. Không cho Delete, nếu không dùng thì Inactive.

---

*Source: Google Docs — "Promotion Management" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
