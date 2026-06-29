---
title: Customer Management
linearId: b8656c71-958a-4c4a-b8ff-7ef70443a0eb
url: https://linear.app/fastboy/document/customer-management-5a2f35d3c8fc
team: VOLT
updatedAt: 2026-06-11T09:59:35.264Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

1. **Tổng quan**

Customer Management cho phép Admin (toàn hệ thống) và Merchant: Xem danh sách customer theo từng merchant; Xem order history; Quản lý Loyalty (chỉnh điểm thủ công); Xem lịch sử thay đổi điểm; Tier auto tính theo rule. Customer unique theo phone number trong từng merchant.

2. **Cấu trúc menu**

* Customer List
* Customer Detail (Profile tab / Order History tab / Points History tab)

3. **Customer Listing Page**

* Column: Name; Phone (unique – không cho edit); Email; Total Visit; Current Points; Cashback Balance (số tiền tích từ Cashback); ~~Tier~~; Last Visit Date; Action (View Detail).
* Search theo Phone / Name. Filter theo Tier / Last Visit Date (date range). Sort mặc định theo Created At (DESC).

4. **Customer Detail Page** — chia 3 tabs:

* **Profile tab:** Customer Name (editable); Phone (read-only); Email (editable); Total Visit (editable); Current Points (editable); Reward balance (từ Cashback); Tier (editable); Birthday (editable); Note (editable); Created At.
  * Rule khi update: Lưu Audit Log; Không gửi notification; Không cho update Phone.
* **Order History tab:** Default hiển thị 30 ngày gần nhất; Chỉ View; Không có action (refund, edit…); Có thể paginate. Gồm: Checkin At; Checkout At; Point (sau khi checkout success); Reward/Discount (total amount trong order); Checkout By (staff complete order); Staff; Services/Products.
* **Points History tab:** Current Points; Tier (auto tính, read-only); Data table columns:
  * Content: Complete order #ODcode / Reward title / Update point (Manual Adjustment từ Volt POS) / Update point (Manual update từ DTS).
  * Action Type: Redeem; Checkout; Review (Pending - new feature); Update (volt_pos_update manual từ Portal); Update (chủ tiệm update từ Admin POS DTS).
  * Points; Update By (Account email cho Volt POS update từ portal / System cho các case còn lại); Updated At (datetime).

| Content | Action Type | Point | Updated By |
| -- | -- | -- | -- |
| Redeem: Free Gel Manicure | Redeem | +20 | System |
| Complete order #OD20260315-001 | Checkout | +50 | System |
| Update point (-5) | Manual Adjustment | -5 | User đang login Portal |
| Update point (+5) | Update | +5 | System |
| * | Review (Pending - new feature) | * | * |

5. **Points History - Loyalty Logic:**

* **Points Adjustment:** Admin/Merchant update trực tiếp Point từ Portal. Nhập số điểm >= 0, không cho tổng điểm âm. Nếu muốn trừ quá số hiện tại → chỉ được đưa về 0.
* **Points Adjustment Rules:** Không cần nhập Reason; Không gửi notification; Bắt buộc lưu Points History Log.

6. **Tier Logic**

* **Tier gồm:**
  * New: Visit Count = 1 & Last Visit < 14 Days
  * At Risk: Khác VIP & Last Visit > 60 Days
  * Regular: Khác VIP & Visit Count > 2 & Last Visit < 14 Days
  * Vip: 10 Visit Count hoặc 1000 Point
  * Normal: Visit Count = 0 hoặc Last Visit > 15 Days và < 60
  * Import: Customer Import lần đầu
  * Booking: Customer Booking lần đầu
* **Rule:** Tier auto tính; Không cho chỉnh tay; Không override rule; Khi point/visit count thay đổi → tier tự động update theo rule.

7. **Customer Group Management** (một tab trong menu Customer)

**Mục tiêu:** Cho phép tạo và quản lý các Customer Group phục vụ quản lí khách và chọn nhóm khách hàng khi tạo Campaign. Campaign gửi đến customer thuộc những group đã chọn.

1. **Customer Group Listing:** Group Name; Description; Total Customers; Created At; Action (View / Edit / Delete). Search theo Customer Group Name. Button: Create Group.
2. **Create Customer Group** (modal): Group Name (required); Description (optional). Buttons: Cancel / Create Group. Validation: không cho tạo nếu chưa nhập Group Name.
3. **Update Customer Group** (modal): Group Name (required); Description (optional). Buttons: Cancel / Update Group. Validation: không cho update nếu Group Name trống.
4. **Delete Customer Group** (modal confirm): "Are you sure you want to delete this customer group? This action will remove the group only. Customers currently in this group will not be deleted from the system." Buttons: Cancel / Delete Group. Validation: nếu group có customer vẫn cho xóa, customer không còn group đó (group là optional).
5. **View Customer Group Detail:** Group information (Group Name, Description, Total Customers); Customer listing (Name, Phone, Email, Added At).
6. **Manage Group Members:**
   * **Add Member:** hiển thị customer chưa thuộc group hiện tại; cho chọn một hoặc nhiều để add.
   * **Remove Member:** mỗi customer có checkbox; chọn rồi click Remove Member. Chỉ xóa khỏi group, không xóa khỏi hệ thống.
7. **Business Purpose:** Merchant phân loại customer theo mục đích chăm sóc/marketing; Khi tạo Campaign chọn một/nhiều Customer Group làm đối tượng nhận; Hệ thống gửi campaign đến toàn bộ customer thuộc group đã chọn.

8. **Cashback History**

Lưu Cashback log khi có thay đổi số dư ví cashback: Date/Time (order create date/time); Type (Earn / Redeem / Reverse / Restore); Amount; Balance (số tiền tích lũy tại thời điểm đó); Order; Description; Sort default DESC theo Date/Time.

VD Re-open Order:

| Time | Type | Amount | Balance | Order | Description |
| -- | -- | -- | -- | -- | -- |
| 10:00 | Earn | +5 | 5 | #1001 | Earn cashback |
| 10:10 | Reverse | -5 | 0 | #1001 | Re-open order → reverse cashback |
| 10:15 | Earn | +3 | 3 | #1001 | Recalculated cashback |

VD Full Refund:

| Time | Type | Amount | Balance | Order | Description |
| -- | -- | -- | -- | -- | -- |
| 09:00 | Earn | +5 | 5 | #1001 | Earn cashback |
| 09:30 | Redeem | -3 | 2 | #1002 | Redeem cashback |
| 10:00 | Reverse | -5 | -3 | #1001 | Full refund → reverse earn |
| 10:00 | Restore | +3 | 0 | #1002 | Refund Order #1001 → restore redeem |

---

*Source: Google Docs — "Customer Management" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
