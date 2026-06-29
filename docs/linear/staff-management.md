---
title: Staff Management
linearId: 5b8b466a-c274-4948-814b-aa4e03c4fa86
url: https://linear.app/fastboy/document/staff-management-e01aa8aef908
team: VOLT
updatedAt: 2026-06-11T09:59:44.778Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# VOLT POS — Staff Management Portal Module (xem [Settings](./settings.md))

## Overview

Central HR management system for Business Owners and Managers to configure employee data and sync to POS devices.

## Module Scope

| Section | Description |
| -- | -- |
| Staff Directory | List/grid view of all employees with search, filter, sort |
| Staff Detail Form | 5-tab form for complete employee configuration |
| Timekeeping | Check-in/out tracking via staff code |
| Payroll Config | Period management with lock/unlock functionality |
| Staff Income Report | Commission + Tips + Salary − Deductions breakdown |

## Staff Directory

* Search by: Name, nickname, email. Filter by: All / Active (default) / Inactive. Sort by: Created At, Updated At.

**Import/Export Staff:**
* **Import Staff:** tải lên file (CSV) để nhập nhân viên mới hoặc cập nhật nhân viên hiện có. Cần template chuẩn. Các trường chính: Nickname, first name, last name, Phone, Email, staff code, Status (Active/Inactive)...
* **Export Staff:** tải về file (CSV) chứa thông tin chi tiết toàn bộ nhân viên (backup hoặc chỉnh sửa hàng loạt rồi re-import).

**Per-row actions:** View / Edit Staff; Activate / Deactivate; Toggle Technician ON/OFF.

## Staff Detail Form (5 Tabs)

### Tab 1: Profile Information

| Field | Rules |
| -- | -- |
| Avatar | JPG/PNG ≤5MB |
| First Name | Required, max 25 chars |
| Last Name | Required, max 25 chars |
| Nick Name | Required, unique |
| Staff Code | Required, 4 digits, unique (auth key) |
| Phone | Required |
| Email | Required, unique |
| SSN | Optional |
| Display Color | Required |

### Tab 2: Role & Permissions

* **Fixed Roles:** Owner, Manager, Partner, Staff. Show dropdown gồm 3 option Manager / Partner / Staff.

| Permission | Owner | Manager | Partner | Staff |
| -- | -- | -- | -- | -- |
| Turn Management | ✓ | ✓ | ✓ | ✓ |
| View Income | ✓ | ✓ | ✓ | ✓ |
| Staff Daily Income | ✓ | ✓ | ✓ | — |
| Payroll Access | ✓ | ✓ | ✓ | — |
| Batch Close / History | ✓ | ✓ | — | — |
| Void / Refund (Critical) | ✓ | — | — | — |
| Cash Drawer | ✓ | ✓ | — | — |

* **Extra Permission:** show list permission không thuộc role đang chọn, để add thêm cho employee đó. UI hiển thị tương tự tab permission nhưng chỉ hiển thị permission không thuộc role đang chọn; chọn Role khác thì fetch lại list extra permission tương ứng.
  * Page Admin: tất cả đều phải lưu log, cũng như lưu log khi có thay đổi từ POS rồi sync lên page Admin. Ví dụ log: Employee John; Role: Staff → Manager; Extra Permission Added: Refund; Source: POS / POS Admin; Created/Updated By; Created/Updated At.

### Tab 3: Compensation Configuration

* **Model A — Commission Only:** Service Commission %; Product Commission %; Gift Card Commission %.
* **Model B — Salary Only:** Amount ($); Type (Per Hour / Per Day / Per Period).
* **Model C — Commission + Salary:** Combination of above.
* **Sub-settings:** Paycheck Split (toggle); Deduction Per Day ($); Card Fee Charge (toggle); Tips on Check (default ON); Days Off Limit.

### Tab 4: Service Skills

* Checkbox tree: Category → Services. Maps which services staff can perform.

### Tab 5: Work Hours

* Weekly schedule per staff. Per day: Active toggle, In Time, Out Time.

## Staff Status Rules

| Status | Login POS | Check-in/out | Assign Orders |
| -- | -- | -- | -- |
| Active | ✓ | ✓ | ✓ |
| Inactive | ✗ | ✗ | ✗ |

**Technician Toggle:** Stored status; blocking rules in future phase.

## Timekeeping Module

* Check-in/out via 4-digit Staff Code; No break/lunch tracking; Owner can edit logs (if payroll not locked); View logs by date.

## Employee Management

1. **Employee List** — View All Employees (main screen từ Employee Management). Search Bar (theo name/role); Add Button; Import button (template Google Sheets); Filter (Status Active/Inactive, Role); Table/Grid Layout.
   * Columns: Employee Name; Role; Status (Active/Inactive toggle); Phone Number; Email. Actions: Edit; Change status Employee.
2. **Employee Profile Detail** — Profile Information (Active/Inactive Toggle; Appointment Staff Toggle; First/Last Name, Nickname; Phone/Email/Address; Staff Code; Role; SSN optional; Permission toggles: Summary Income, Staff Payroll, Cancel Order, Open Cash Drawer, Daily Income, Batch History, Refund Order, Staff Income, Edit Order). Compensation (Commission / Salary / Commission + Salary). Service Skills (checkbox). Work Hours. Actions: Edit / Remove.
3. **Add/Edit/View Employee Profile** (Modal hoặc New Screen) — Profile Information Section; Status Section; Permissions Section (toggles); Compensation; Service Skills; Work Hours. Buttons: Save / Cancel.

4. **Import Staff**

4.1 Objective — import hàng loạt Staff qua file Excel (thông tin nhân viên, Role, trạng thái, Compensation logic). Tách riêng Sheet 1 (compensation) và Sheet 2 (staff list).

4.2 Location — POS Portal → Staff Management. UI: Button Download Template; Button Import Staff.

4.3 User Flow: tải template (2 sheets) → fill → upload → validate (lỗi → popup; hợp lệ → preview) → Confirm/Cancel.

4.4 File Format — Support .xlsx, gồm 2 sheets bắt buộc: Compensation Settings; Staff List.

**Sheet 1 — Compensation Settings** (Commission / Salary / Commission + Salary):
* A. Commission Settings: Commission for Service/Product/GiftCard (% Staff/Owner); Pay 1 / Pay 2 Split (tổng = 100%); Deduction per day (≥0); Card Fee – Staff Commission (%); Card Fee – Credit Card Tip (%).
* B. Salary Settings: Salary by period (≥0); Wage per day (≥0); Wage per hour (≥0); Pay split (tổng = 100%); Deduction per day (≥0).
* C. Commission + Salary: kết hợp toàn bộ.
* Validation: mỗi compensation type phải có đầy đủ config nếu được sử dụng; % hợp lệ 0–100; Pay1 + Pay2 = 100%; không để trống field quan trọng.

**Sheet 2 — Staff List** (template Google Sheets):

| Column | Required | Rule |
| -- | -- | -- |
| Employee First Name (*) | Yes | Max 50 |
| Employee Last Name (*) | Yes | Max 50 |
| Employee Nickname (*) | Yes | Max 50 |
| Employee Code (*) | Yes | Unique |
| Employee Role (*) | Yes | Text |
| SSN | No | Text |
| Employee Phone (*) | Yes | Valid |
| Employee Email | No | Valid email |
| Address / Country / State / City / Zip Code | No | Text |
| Compensation (*) | Yes | 3 values |
| Services Active Full / Working Hours Active / Booking Online Active | No | 0 / 1 |

* Compensation Type chỉ nhận: Commission / Salary / Commission + Salary. Mapping: Staff chọn type → System lấy config tương ứng từ Sheet 1.
* Validation: Employee Code (Required, Unique, trùng → fail); Name fields (Required, Max 50); Phone (Required, format hợp lệ); Email (Optional, đúng format); Role (Required); Boolean fields (0/1, blank → 0).
* Business Rules: Không update staff cũ; Luôn create mới; Không dedupe theo email/phone (phase này).

4.7 Import Logic — All or Nothing (1 lỗi → fail toàn bộ, không import partial).

4.8 Preview Screen — Hiển thị toàn bộ staff, không cho edit; Confirm / Cancel.

4.9 Error Handling — Popup "Import failed. Please check row 2, row 5."

4.10 Permission — User cần: Create Staff.

4.11 Audit Log — Lưu: User import; Thời gian; Tổng records success; Tổng records failed; Status.

### 5. Export Staff

5.1 Objective — Cho phép user tùy chọn dữ liệu cần export (linh hoạt, giảm file size, tăng usability).

5.2 Entry Point — POS Portal → Staff Management → Export Staff.

5.3 UX Flow: Export Staff → Export Modal → chọn (format, filter, columns) → Export → generate file.

5.4 Export Modal:
* Export Format: CSV / Excel. Default Excel.
* Filter – Staff Status: Active / Inactive / All (default select all).
* Filter – Compensation Type: Commission / Salary / Commission + Salary (multi-select, default all).
* Filter – Role: Owner / Manager / Partner / Staff (multi-select, default all).
* Select Columns: Basic Info (First/Last Name, Nickname, Code); Contact (Phone, Email, Address, Country, State, City, Zip); Work Info (Role, Compensation); Status (Services Active Full, Working Hours Active, Booking Online Active). Default: select tất cả.

5.5 Business Rules: Phải chọn ít nhất 1 column (không chọn → disable Export); AND logic giữa filter; không chọn filter → export toàn bộ; CSV plain, Excel có header format bold; Boolean fields 0/1; Compensation chỉ export type (không export config).

5.6 File Naming: `staff_export_YYYYMMDD_HHMM.xlsx` / `.csv`.

5.7 Permission — User cần: View Staff Management.

5.8 Audit Log — Lưu: User export; Thời gian; File name; Trạng thái (Success/Failed).

5.9 Error Handling — Không chọn column → disable Export; System fail → "Export failed. Please try again."

---

*Source: Google Docs — "Staff Management" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
