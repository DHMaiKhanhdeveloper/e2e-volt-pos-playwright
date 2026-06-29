---
title: Time Keeping
linearId: 65af5d69-4a4e-4e33-bc0d-c4fe7d4ef102
url: https://linear.app/fastboy/document/time-keeping-e0f3efd072d0
team: VOLT
updatedAt: 2026-06-11T09:59:52.399Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

1. **Time Keeping**

## **1. Mục đích**

* Ghi nhận thời gian làm việc thực tế của nhân viên (Check-In / Check-Out).
* Dùng dữ liệu này để: Tính giờ làm việc (Working Hours); Tính Tip / Commission / Payroll; Tính giờ làm – lương (Salary per hour); Quản lý ca làm (shift) và attendance (đi trễ / về sớm).
* Menu nằm chung với home.

## **2. Tích hợp với các module**

* **Payroll:** Lấy dữ liệu giờ làm × rate để tính tổng lương.
* **Staff Report:** Hiển thị tổng giờ, doanh thu, tip, commission trong ngày/tuần/tháng.
* **Permission:** chỉ user có permission mới được view và action trên Time Keeping management.

## 3. **Workflow**

1. **Check-In:** nhân viên đến tiệm → mở POS → chọn "Check In". Hệ thống lưu: Giờ Check-In (Local Time); Nickname staff. (Nếu POS Dual Screen, có thể cho nhập staff code hoặc quét QR để Check-In — Optional).
2. **Check-Out:** kết thúc ca → chọn "Check Out". Hệ thống lưu: Giờ Check-Out (Local Time); Total Hours (= Check-Out – Check-In). Chưa Check-In thì không Check-Out được.
3. **Auto Check-Out:** Nếu quên Check-Out, hệ thống tự động Check-Out lúc 23:59:59 (Local Time). Owner có quyền chỉnh sửa ca làm thủ công.
4. **Một số lưu ý:**
   * Quên Check-Out → ca đó không được tính cho đến khi Owner xác nhận hoặc auto Checkout lúc 23:59:59 cùng ngày.
   * Có checkin → tính là ngày đó có đi làm.
   * Dual Screen Support: cho nhân viên Check-In/Out trên màn hình khách (optional, support sau).
   * Không block create order với staff không Check-In/Check-Out (vì có staff tính lương theo Commission).
   * Offline Mode: POS offline vẫn lưu local và sync lại khi có mạng.
5. **Các TH không cho phép update thời gian CHECK-IN/CHECK-OUT:**
   * Đã khóa kỳ Payroll (Payroll Locked).
   * Không có permission.

## **4. Giao diện Check in / Check out Staff**

* Chỉ hiển thị list Staff - Active.
* **Unavailable Staff:** Staff nickname; Staff avatar; OUT date gần nhất; Sắp xếp theo nickname alphabet.
* **Available Staff:** Staff nickname; Staff avatar; IN date; Sắp xếp theo thời gian checkin (mới nhất trên cùng).
* Action: Click staff ở tab Unavailable Staff → Check In; Click staff ở tab Available Staff → Check Out.

2. **Time Tracking**

* Thông tin staff sau khi Check-In/Check-Out được quản lý trong Time Keeping management.
* Edit Time Keeping: Chỉ Owner có quyền chỉnh sửa giờ Check-In/Check-Out (khi nhân viên quên thao tác); Lý do chỉnh sửa cần được ghi lại (log).
* Vị trí: 1 tab nằm trong home, dưới Time Keeping.

1. **Time Keeping listing:** Staff nickname; Date IN [mm/dd/yyyy hh:mm AM/PM]; Date OUT [mm/dd/yyyy hh:mm AM/PM]; Total Hours (= CheckOut – CheckIn, đơn vị giờ); Created At; Updated At; Action (Edit / Delete); Filter date range (Date IN - Date OUT); Search (staff nickname); Button (Add / Export later).
   * Note: Hiển thị tất cả Staff kể cả Inactive; Vẫn cho action trên record của inactive staff nếu không thuộc kì payroll đã locking.
2. **Action Add** (modal): Title "Add new time keeping"; Staff (required, status Active); Date IN (required); Date OUT (optional); Note (optional, max 255 chars); Button Submit / Cancel.
3. **Action Edit** (modal): Title "Edit time keeping"; Staff (nickname, disable); Date IN; Date OUT; Note (max 255 chars); Button Submit / Cancel.
4. **Action Delete:** Title "Delete Timekeeping Record"; Description "Are you sure you want to delete this time record of Staff: {Staff Nickname}? This action cannot be undone."; Button Delete / Cancel.
   * Không cho phép delete nếu time keeping thuộc Payroll locked → message "This record cannot be deleted because it's included in locked payroll."
5. **Một số lưu ý:**
   * Một nhân viên chỉ có 1 ca đang mở (Check-In); không Check-In lần nữa nếu chưa Check-Out ca trước.
   * Cho phép 1 staff Check-In/Check-Out nhiều lần trong 1 ngày (nhiều ca), nhưng không được trùng thời gian trước đó (chỉ xảy ra khi owner add manual).
   * Không cho phép Check-In/Check-Out là 2 ngày khác nhau.
   * Log: Mọi thay đổi thời gian phải có log (ai chỉnh, lúc nào, note).

---

*Source: Google Docs — "Time Keeping" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
