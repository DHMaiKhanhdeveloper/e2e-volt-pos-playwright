---
title: Device Pending
linearId: 032147b6-9d0a-4ee3-bd1d-3cdb10ed2224
url: https://linear.app/fastboy/document/device-pending-a98d6c65061a
team: VOLT
updatedAt: 2026-06-11T09:59:34.218Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# **POS Portal - Device Management & POS Login Control**

## **1. Summary**

Xây dựng trang **Device Management** trên Portal để quản lý tập trung toàn bộ thiết bị POS, bao gồm: Kiểm soát trạng thái thiết bị (Pending / Active / Inactive); Thiết lập workflow phê duyệt device trước khi login POS; Hỗ trợ login POS bằng OTP khi scan QR lỗi; Theo dõi thông tin device, merchant và app version.

## **2. Problem**

Hiện tại: Không có cơ chế quản lý tập trung device POS; Device có thể login mà không có bước xác thực/phê duyệt; Login QR lỗi không có fallback; Không kiểm soát được device nào đang hoạt động.

## **3. Goal**

Kiểm soát toàn bộ device POS; Đảm bảo chỉ device được phê duyệt mới sử dụng POS; Hỗ trợ login nhanh bằng OTP; Tăng bảo mật và khả năng vận hành.

## **4. Scope**

### **4.1. Device Management Page (Portal)**

* Menu **không phụ thuộc Merchant Selector**; Hiển thị toàn bộ device trong hệ thống.
* Fields: Device ID; Merchant Name; WHMCS ID; Status (Pending / Active / Inactive); App Version (POS version gần nhất); Registered At; Last Active At (đề xuất); Action.

### **4.2. Actions**

| Status | Available Actions |
| -- | -- |
| Pending | Activate / Inactive |
| Active | Inactive / Get Merchant Login OTP |
| Inactive | Activate |

### **4.3. Search & Filter**

* Search: Device ID; Merchant Name; WHMCS ID.
* Filter: Status; App Version; Date (Registered At).
* Sort: Registered At; Last Active At.

## **5. Device Lifecycle & Flow**

### **5.1. Tạo device (Auto registration)**

* Khi user login POS, app gửi Device ID lên Portal. Nếu device chưa tồn tại → tạo mới với Status = Pending, lưu Merchant, App Version, Registered At.

### **5.2. Login control**

* Device Pending → Không login được; Device Active → Login thành công; Device Inactive → Không login được.

### **5.3. Cập nhật device**

* Nếu device đã tồn tại: Update App Version, Last Active At; Không thay đổi status.

## **6. Status & Transition Rule**

* **Pending:** Device mới, chưa phê duyệt, không login.
* **Active:** Đã phê duyệt, được login POS, có thể generate OTP.
* **Inactive:** Bị vô hiệu hóa, không login được.

Transition: Pending → Active / Inactive; Active → Inactive only; Inactive → Active only. Không cho phép chuyển về Pending trong mọi trường hợp.

## **7. OTP Login Flow**

* **7.1. Use case:** Device Active nhưng POS bị logout; Login QR lỗi → dùng OTP để login nhanh.
* **7.2. Portal action:** Button "Get Merchant Login OTP" — chỉ áp dụng cho device Status = Active.
* **7.3. OTP Rule:** Hiệu lực 5 phút; Dùng 1 lần duy nhất; Gắn với 1 device cụ thể; Generate OTP mới → invalidate OTP cũ; Mỗi device chỉ có 1 OTP active tại 1 thời điểm.
* **7.4. UI OTP Modal:** Device ID; Merchant Name; OTP Code; Countdown (5 phút); Action (Copy OTP / Close).
* **7.5. POS Login Flow:** Thêm option Login by OTP (new) bên cạnh Login by QR Code (existing). Validate: OTP hợp lệ; OTP chưa hết hạn; Đúng device; Device = Active.
* **7.6. Error message:** Invalid OTP; OTP expired; Device not activated; OTP not valid for this device.

## **8. Device Status Actions (UI)**

* **Activate** (Pending, Inactive): Confirm "This device will be allowed to use POS".
* **Deactivate** (Active): Confirm "This device will no longer be allowed to log in to POS".
* **Get OTP** (Active only).

## **9. Data Rules**

* Device uniqueness: Device ID là unique.
* Merchant mapping: 1 device chỉ thuộc 1 merchant; Không auto change merchant khi login khác merchant.
* Tracking: Update Last Active At khi device call lên system; App Version khi có thay đổi.

## **10. Audit Log**

Track: Device created; Activate / Deactivate; OTP generated. Fields: Device ID; Merchant; Action; Performed by; Timestamp.

## **11. Edge Cases**

* Pending login nhiều lần → vẫn fail.
* Active → Inactive khi đang login: đề xuất không force logout, chỉ chặn login tiếp theo.
* OTP: Generate liên tục → chỉ OTP mới nhất valid; OTP hết hạn khi đang nhập → fail.
* Device gửi sai ID → cần validate/log.
* Attempt chuyển status về Pending → reject.

---

*Source: Google Docs — "Device Pending" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
