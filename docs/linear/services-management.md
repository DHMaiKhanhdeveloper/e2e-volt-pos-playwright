---
title: Services Management
linearId: c882ec10-a767-41bf-b03e-958c37a4000e
url: https://linear.app/fastboy/document/services-management-bb5c06fb3976
team: VOLT
updatedAt: 2026-06-11T09:59:42.957Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

**Services Management** (xem [Settings](./settings.md))

### 1. Services Management listing page

* The left menu (navigation sidebar) sẽ hiển thị option Services Management. Khi click hiển thị các action:
* List of Items: default view showing all services/products. Ngoài category Product là item type Product, còn lại là item type Service.
* Table/card list of all items với options Add, Edit, Delete.
* Gồm: Button Import Service; Search bar (service name); Category list (Button Add Category; Status Active/Inactive default Active; Category Name; Category color; Action Edit); Service field (Button Add Service; Filter status default Active; Service Name - Description; Price; Duration; Supply Fee; Status; Action Edit).

### 2. Add New Category

* Form: Title "Create Category"; Category Information (Category Name required, Unlimited; Status Toggle Active/Inactive default Active); Category Color (default first color); Buttons Add / Cancel.

### 3. Add New Service

* Form SERVICE: Service Name; Category Selection (Dropdown); Price; Flexible Pricing (checkbox); Duration; Supply Fee; Description; Visibility Setting (toggle: Active, Shown on Go Checkin, Shown on Web Booking, Shown on Go POS).
* Form PRODUCT: Product Name; Category Selection; Price; Flexible Pricing (checkbox); Description; Visibility Setting (toggle: Active).
* Buttons: Add / Cancel.

### 4. Edit an existing Category

* Form pre-filled: Title "Create Category"; Category Information (Category Name required Unlimited; Status Toggle Active/Inactive default Active); Category Color. Buttons: Save / Cancel.

### 5. Edit an existing Service

* Pre-filled fields: Service/Product Name; Category Selection; Price; Flexible Pricing; Duration; Supply Fee; Description; Visibility Setting. Buttons: Save / Cancel.

### 6. Import Service

6.1 Mục tiêu — bổ sung tính năng Import Service trong Service Management, import hàng loạt Service/Product bằng file Excel thay vì tạo từng item thủ công.

6.2 Vị trí — POS Portal → Service Management. Thêm: Button Download Template; Button Import Service.

6.3 User Flow: vào Service Management → Download Template → điền dữ liệu → Import Service → upload file Excel → validate (invalid → error popup; valid → Preview) → Confirm/Cancel → xử lý import → hiển thị kết quả.

6.4 Import Template — Chỉ support Excel (.xlsx). Template: (xem link Google Sheets trong Linear).

| Column | Required | Rule |
| -- | -- | -- |
| STT | No | Dùng để tham chiếu |
| Category (*) | Yes | Tên category |
| ~~Service Item Type (*)~~ | ~~Yes~~ | ~~Service / Product~~ |
| Services Name (*) | Yes | Max 50 ký tự |
| Price | No | Blank → 0 |
| Service Description | No | Max 80 ký tự |
| Duration (Minutes) | No | Blank → 0 |
| Supply Share | No | Blank → 0 |
| Show On Checkin | No | 0 / 1 |
| Show On Booking | No | 0 / 1 |
| Show On POS | No | 0 / 1 |

6.5 Business Rules:
* **Category:** Import bằng tên; nếu tồn tại → dùng lại; chưa tồn tại → auto create; không để trống. Nếu tiệm có sẵn 2 category trùng name → báo lỗi khi review file import.
* **Services Name:** Bắt buộc; Max 50 ký tự; cho phép trùng với data hiện tại; Import luôn tạo mới record (không update record cũ); Trống/quá 50 ký tự → fail.
* **Service Description:** Optional; Max 80 ký tự; quá 80 → fail.
* **Price:** Optional; Blank → 0; có value phải là số hợp lệ ≥ 0.
* **Duration (Minutes):** Optional; Blank → 0; phải là số nguyên ≥ 0.
* **Supply Share:** Optional; Blank → 0; phải là số ≥ 0.
* **Boolean Fields** (Show On Checkin/Booking/POS): chỉ nhận 0 (Hide) hoặc 1 (Show); value khác → fail.

6.6 Import Logic — Rule: All or Nothing. Tất cả rows hợp lệ → import toàn bộ; có ít nhất 1 row lỗi → không import row nào.

6.7 Preview Screen — Hiển thị sau khi upload file hợp lệ. Show toàn bộ data; không cho chỉnh sửa; Button Confirm (import) / Cancel (hủy).

6.8 Error Handling — Show popup lỗi tổng quát, chỉ rõ row bị lỗi. VD: "Import failed. Please check row 3, row 7."

6.9 Permission — User có thể import nếu có quyền **Create Staff**.

6.10 Audit Log — Mỗi lần import lưu: User; Thời gian; Tổng record thành công; Tổng record failed; Status (Success: success = total rows, failed = 0; Failed: success = 0, failed = số row lỗi).

### **7. Export Service**

7.1 Objective — Cho phép user export danh sách Service/Product theo nhu cầu cụ thể (chọn định dạng file, lọc dữ liệu, chọn trường cần export).

7.2 Location — POS Portal → Service Management. Thêm: Button Export Service.

7.3 User Flow: vào Service Management → Export Service → Export Modal → cấu hình (format, filters, columns) → Export → generate file và download.

7.4 Export Modal UI:
* **Export Format:** CSV (.csv) / Excel (.xlsx). Default: Excel.
* **Filters:** Service Item Type (Service/Product, multi-select, default tất cả); Category (multi-select, default tất cả); Visibility (Show On Checkin/Booking/POS, default không giới hạn).
* **Select Columns to Export:** Basic Information (Category, Service Item Type, Services Name); Pricing & Duration (Price, Duration, Supply Share); Description (Service Description); Visibility (Show On Checkin/Booking/POS). Default: tất cả columns.
* **Modal Actions:** Cancel (đóng modal); Export (trigger export, disabled nếu không chọn column nào).

7.5 Business Rules:
* Column Selection: phải chọn ít nhất 1 column; không chọn → disable Export.
* Filter Logic: AND logic giữa các nhóm filter.
* Data Scope: không chọn filter → export toàn bộ.
* Boolean Fields: 1 = enabled/hiển thị, 0 = disabled/ẩn.
* Output Format: CSV (plain text, không format); Excel (có header, format bold).
* Data Snapshot: data export là snapshot tại thời điểm click Export.

7.6 File Naming Convention: Excel `service_export_YYYYMMDD_HHMM.xlsx`; CSV `service_export_YYYYMMDD_HHMM.csv`.

7.7 Permission — User có thể export nếu có quyền **View Service Management**.

7.8 Audit Log — lưu: User; Thời gian; File name; Trạng thái (Success/Failed).

7.9 Error Handling — Không chọn column → disable Export. Không generate được file → message "Export failed. Please try again."

---

*Source: Google Docs — "Services Management" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
