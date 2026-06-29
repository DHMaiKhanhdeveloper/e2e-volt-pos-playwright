---
title: Settings
linearId: efc46a16-ceb1-482b-933f-e598888037b1
url: https://linear.app/fastboy/document/settings-6fe2b4cc81a4
team: VOLT
updatedAt: 2026-06-11T09:59:56.338Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# [Volt POS] POS Setting

# POS_Business Account

## Business Info

### Information

* Business Name: read-only; Legal Name: read-only; Phone Number: read-only; Website: optional; Address: max 50 characters; Country: select; State: select theo country; City: max 50 characters; Postal / Zip Code: không validate, lấy theo CRM.
* Note: trừ những field read-only lấy từ page Admin, còn lại là required.

### Work Hours

* Configuration of open/close hours cho từng ngày trong tuần. Ngày nào Inactive → show Closed và không show setting time.
* Fields: YES/NO toggle (Active/Inactive); Day; Open Time (Time picker); Close Time (Time picker).

### Pay Period

* **Start Date:** ngày bắt đầu tính kỳ lương đầu tiên. Weekly & Biweekly → cần Start Date; Monthly & Custom → không dùng Start Date.
* **Các kiểu Pay Period:**
  * **Weekly (7 ngày):** Chọn Sunday là ngày chốt kì lương, không quan tâm Start Date.
  * **Biweekly (14 ngày):** Chọn Sunday là ngày chốt kì lương, không quan tâm Start Date.
  * **Monthly:** ngày 01 → ngày cuối tháng (28/30/31), không dùng Start Date.
  * **Custom (ngày cố định):** vd chọn ngày 20 → mỗi tháng ngày 20 chốt lương. Chọn 31 nhưng tháng chỉ có 28 → chốt vào ngày cuối tháng.
* **Cách hệ thống chạy Pay Period:** Kỳ hiện tại kết thúc → block lại; Hệ thống tự tạo kỳ tiếp theo ngay lập tức; Không bao giờ bị "hở ngày" giữa 2 kỳ.
* **Đổi setting trong lúc kỳ đang chạy:** đổi staff setting hoặc loại Pay Period → popup "Changes will apply to Next Period" + lưu log.
* **Bị block sau khi qua kỳ payroll:** Không chỉnh setting liên quan (update order, update check…); Print Check / Payroll chỉ chọn được kỳ đã block.
* **Compensation liên quan Pay Period:** Luôn đánh dấu ngày cuối kỳ; Chỉnh Compensation trong kỳ hiện tại → hỏi "Apply for This Period hay Next Period?".

### Store Branding

* Store Logo (JPG/PNG ≤5MB); Cover Photo (JPG/PNG ≤5MB).

### Store Policies

* Description: thêm liability policies để customer agree khi check-in/check-out. Liability Policies; Cancellation Policies; Other Policies.

## Passcode (không còn menu này trên Setting)

* Admin Passcode: Admin password cho internal [Admin@Admin!] → dùng để thoát ra khỏi app.

# POS_Employees Management

* Staff Role: Owner / Manager / Partner / Staff.
* Permission: thêm option Technician (toggle) — staff được enable thì hiển thị trong POS / Booking để create order/booking.
* Sau khi create merchant success → auto gen Owner code (4 digits) lưu chung với account trên Insight. Support create staff đầu tiên với Role Owner, Code = Owner code → gửi passcode cho owner để access tất cả menu trên app POS.

1. **Employees** — show list employee. List staff (Avatar + Nick Name; status Active/Inactive; Search nick name; Filter status All/Active/Inactive default Active; Button Add New Staff; Sort Created At/Updated At). Detail information 5 sections:
   * Avatar / Nick Name / Status Staff.
   * **Information tab:** Appointment Staff; Profile (First/Last Name, Nick Name, Phone, Email, SSN optional, Staff Code, Address, Country, State, City, Postal/Zip); Staff Role (Role Manager/Partner/Staff; Extra Permission).
   * **Compensation:** 3 types:
     * **Commission:** Commission Setting (For Service/Product/Gift Card: Staff % - Owner %); Pay 1 - Pay 2 Split; Deduction Per Day; Card Fee Charge (On Staff Commission %, On Credit Card Tip %, checkbox "Add credit card tips to staff paycheck").
     * **Commission + Salary:** Salary Setting (input amount, radio Salary by Period / Wage Per Day / Wage Per Hour); Commission Setting; Pay 1 - Pay 2 Split; Deduction Per Day; Card Fee Charge; Staff Days Off Setting (checkbox "Limit days off for this staff", Max days off allowed, Days not allowed to be off Mon–Sun).
     * **Salary:** Salary Setting (radio Salary By Period / Wage Per Day / Wage Per Hour); Pay 1 - Pay 2 Split; Deduction Per Day; Staff Days Off Setting.
   * **Service Skills:** list services grouped by Category (từ Setting Service), checkbox chọn individual services và entire categories.
   * **Work Hours:** bookable hours theo từng ngày (YES/NO toggle, Day, In Time, Out Time).

   **Add New Staff:** Title "Add New Staff". Profile Information (Avatar; First Name required max 25; Last Name required max 25; Nick Name required max 25; SSN optional; Phone required format (xxx) xxx xxxx; Email required unique; Staff Code required 4 digits; Address/Country/State/City/Zip optional). Staff Role (Role dropdown Manager/Partner/Staff; Extra Permission). Color. Button Create / (X). Sau khi Create → Staff Detail để setting Compensation / Service Skills / Work Hours.
   * Compensation business flow: Không cho phép đóng tất cả option (luôn có 1 option mở); Mở option nào → option đó được chọn; Trong quá trình chỉnh sửa, option chưa có dữ liệu → reset về default. Không có trường hợp staff không có compensation.

   **Update Staff:** update tất cả thông tin (cùng cấu trúc Add New Staff, pre-filled). Buttons Cancel / Save.

   **Lưu ý Extra Permission:** Chỉ Additive (chỉ thêm permission so với role); Không remove quyền có sẵn của role. Khi Change Role → System reset toàn bộ Extra Permission hiện tại, apply permission mặc định của role mới; muốn thêm quyền phải assign lại Extra Permission.

2. **Role** — Xem các role mặc định; Xem list employee của từng role; Update role cho employee trực tiếp. Permission không edit ở page này (edit ở Permission Page).

3. **Permissions** — Hệ thống chỉ có 4 role mặc định: Owner / Manager / Partner / Staff. Không tạo thêm role; Không xóa role; Mỗi Employee bắt buộc có đúng 1 Role.

## Services & Products

### Service Listing Page

* **Category:** 2 tabs Active / Inactive (Category Color, Category Name, Action Update, Button Add New Category).
* **Service Listing:** services thuộc Category được chọn (Service Name & Description, Price, Duration, Supply Fee, Active Status, Action Update, Button Add New Service, Filter status All/Active/Inactive default Active).

### Add New Category

* Title "Create Category". Fields: Category Information (Category Name required Unlimited; Status Toggle Active/Inactive default Active); Category Color (default first color). Buttons Create / (X).

### Add New Service

* **Add Service:** Title "Add New Item". Item Type (radio Service - Product). Information: Name (required max 50); Category Name; Price (max $9,999,999.99); Flexible Pricing checkbox (checked → disable + Price = $0); Service Duration (Hour dropdown, Minute dropdown); Supply Fee (max $9,999,999.99); Service Description (optional max 255). Visibility Setting (PENDING): Active; Shown on Web Booking; Shown on Go Check In; Shown on Go POS. Buttons Add / (X).
* **Add Product:** Title "Add New Item". Item Type (radio). Information: Name (required max 50); Category Name; Price (max $9,999,999.99); Flexible Pricing checkbox; Service Description (optional max 255); Visibility Setting (PENDING): Active. Buttons Add / (X).

### Update Category / Update Service

* Cùng cấu trúc Create Category / Add New Service với pre-filled data. Buttons Update / (X).

# POS_Payment & Transactions

## Tipping Settings

* Setting tip khi thanh toán, hiển thị ở customer screen. Chỉ active tối đa 4 items.
* Tip Suggestions (Set Default %, Allow Custom Amount); Tip Timing (Before Payment / After Payment); Tip Payment Methods (Gift Card, Cash, Credit, Other); Tip Type (Percentage và Dollar).

## Cash Discount

* Cash Discount setting: Toggle Enable/Disable; Discount Type % or Fixed Amount ($); Hard setting Enable - 3%.
* Service Fee: Toggle Enable/Disable; Discount Type % or Fixed Amount ($); Hard setting Enable - 3%.

## Signature Setting

* Require Signature: Always require e-signature / Require e-signature for amounts over [amount] / Always require physical receipt (disables "When to ask for signature").
* When ask for signature: Before process payment / After payment successfully.

## Receipt & Split Check

1. **Receipt Setting:**
   * Printing Preferences (ON/OFF toggle): Auto-print customer receipt after each order; ~~Auto-print owner receipt~~; Auto-print customer receipt after each split check; ~~Auto-print owner receipt after split check~~; ~~Print staff receipt at check-out~~; Auto-print cancel/refund receipts; Print separate gift card receipts at check-out.
   * Logo & Branding: Business logo or custom image; Business name; Business address; Business phone.
   * Receipt Message: Header text (max 512); Footer text (max 512); Marketing opt-in prompt (max 512).
   * Display Options: Cashier name; Order ID; Check-in time; Customer info; Current points; Visit Time; Group items by staff or guest; Items (Services & Products); Subtotal / Total Discount / Tip / Total; Show payment method; Signature; Business note; Barcode (print receipts only).
2. **Receipt Preview.**

## Cash Drawer

* Enable/Disable Cash Drawer; Test Drawer Button; Permission Control: Require Staff Code to Open Drawer or check-out order pay by cash.

## Other Setting

* Setting max Price Service & Amount Order: Max Price Per Service (default $1K); Max Order Amount (default $10K); vượt quá → popup "This amount seems unusually high. Please confirm or contact manager."
* Service Fee: Toggle Enable/Disable; Discount Type % or Fixed Amount ($).
* Tax Setting: Service Tax (%); Product Tax (%).

# POS_Hardware Setting

## Terminal

* Add/Manage Payment Terminal Devices; Show Device ID and name; Test Terminal Connection; Show Terminal Status.

## Printer

* Add/Manage Multiple Printers; Test Printer Button; Printer Status Connected / Disconnected.
* **Last Updated:** 09/09/2025 08:24:11 GMT+07:00. Updater @thom_mac.
* **Driver Detection:** check printer driver name để xác định connectivity. Target printer driver phải tên chính xác **POS-80-Series** (default name khi setup).
* **Header Status Indicator:** main app header hiển thị printer real-time connection status (duration 5000ms): "Connected" khi POS-80-Series detected và responsive; "Disconnected" khi driver không được cài/không tìm thấy.

## Dual Screen Display

* Enable/Disable Dual Screen; Upload image for display screen; Show Cart info khi creating order; Enable/Disable num-pad to check-in.

# POS_Network Connections

* Wi-Fi / Network Settings; Show Current Connection Status.

# POS_General Setting

## Language Setting

* Language Selector; Default English; Other Options Vietnamese, etc.

## Software Update

* Show Current App Version; Last Update Date/Time. Actions: Manual Update Button. Logs: Version History; Notes / Fixes / Changes.

## Appearance Setting

* Show Theme/Layout; Action Select Theme/Layout.

# POS_Fastboy Support

* Show: Fastboy Support Phone; Customer ID; Ultraviewer ID.

# Conflict Data

| Data Type | Critical Level | Conflict Handling |
| -- | -- | -- |
| Orders ID | Critical | Must resolve immediately before continuing |
| Payments (Only use Cash) | Critical | Must resolve immediately before continuing |
| Reports (Store income, Staff income, Payroll) | Critical | Must resolve immediately before continuing |
| Rewards & Promotion | Semi-critical | Allow continue, but flag conflict and resolve later |
| Customer Info (Phone, email, points) | Semi-critical | Allow continue, but flag conflict and resolve later |
| Settings_Business Setting (Store & Account) | Semi-critical | Allow continue, but flag conflict and resolve later |
| Settings_Service & Staff Setting | Semi-critical | Allow continue, but flag conflict and resolve later |
| Settings_Device & Integration | Non-critical | Can auto-resolve or ignore, minimal impact |
| Settings_Receipt & Payment | Non-critical | Can auto-resolve or ignore, minimal impact |
| Dual Screen Content | Non-critical | Can auto-resolve or ignore, minimal impact |

---

*Source: Google Docs — "Settings" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
