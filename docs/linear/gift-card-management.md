---
title: Gift Card Management
linearId: 9b5a34e6-53c7-4ad3-a884-e3a9bf994720
url: https://linear.app/fastboy/document/gift-card-management-aac032d6e34a
team: VOLT
updatedAt: 2026-06-11T09:59:37.939Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

**Gift Card Management**

1. **Listing page**

Gồm: Search (Gift Card Code); Filter Status; Giftcard Code; Status (Active / Inactive / Not Sold Yet / Used Up); Balance (current balance); Action (View Detail = Giftcard history / Edit / Reset / Logs).

Ví dụ (Merchant: Luna Nail Spa):

| Code | Status | Balance | Action |
| -- | -- | -- | -- |
| 484377128970 | Active | $75.00 | View Detail / Edit / Reset / Logs |
| 045775308821 | Used Up | $0.00 | View Detail / Edit / Logs |
| 930670412317 | Inactive | $75.00 | View Detail / Edit / Logs |
| 537574237772 | Not sold yet | $100.00 | View Detail / Edit / Logs |

2. **Action - View Detail (Check Balance)**

* Mục đích: Admin kiểm tra nhanh tình trạng tiền/history của gift card để support merchant/customer.
* Click mở page giftcard detail: Gift Card Code; Status; Current Balance; Balance detail (click show list order có thông tin giftcard đó); Last Updated At.
* Rule: Action read-only; Áp dụng cho mọi status.

3. **Action - Edit**

* Edit Balance (Adjust): Admin điều chỉnh balance (Add / Deduct). Edit status của giftcard.
* Click mở dialog: Title "Edit Giftcard"; Balance; Status; Reason (required); Button Cancel / Save Changes.
* Rule: Remaining Balance sau adjust không được < 0; Không cho adjust khi Status = Used Up; Sau mỗi lần adjust → Update Remaining Balance + Ghi log đầy đủ.

4. **Action - Reset Balance**

* Admin reset balance (vd xử lý lỗi hệ thống / support đặc biệt).
* Click Reset apply: Balance về $0.00; Price về $0.00; Status = Not Sold Yet.
* UI: Action riêng, confirm modal, bắt buộc nhập reason.
* Rule: Reset ghi log là action riêng (không gộp với adjust).

5. **Action - View Logs**

* Log khi có action từ site Admin (không phải Giftcard History). Tập trung vào hành vi của Admin.
* Nội dung log: Time; Admin user; Action (Check balance / Edit balance / Reset balance / Change status); Old value → New value; Reason.
* Rule: Log không được chỉnh sửa; Không cho delete; Luôn hiển thị đầy đủ (compliance-friendly).
* UI: filter theo Admin user / Action type / Date range.

---

*Source: Google Docs — "Gift Card Management" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
