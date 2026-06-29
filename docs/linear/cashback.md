---
title: Cashback
linearId: 8bd5bb3e-2a05-4c48-8952-7a58b3d0a74b
url: https://linear.app/fastboy/document/cashback-07289dfa5ed2
team: VOLT
updatedAt: 2026-06-11T09:59:20.907Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

**Cashback** là tính năng cho phép tiệm **hoàn lại giá trị giao dịch cho khách hàng dưới dạng point**, được tính **theo % của giá trị dịch vụ hoặc trên amount cụ thể**, thay vì cách tính point cố định truyền thống (ví dụ: $1 = 1 point).

1. **Cách hoạt động**

* Thực hiện create order, đến bước apply Promo/Reward > Chọn Cashback
* Hệ thống xác định **eligible amount** (số tiền đủ điều kiện tích điểm)
* Áp dụng **cashback** tương ứng
* Quy đổi % cashback thành Cash tích lũy và cộng vào current Cash của customer sau khi complete order
* Số tiền tích lũy được sử dụng cho các giao dịch tiếp theo theo rule đã cấu hình

2. **Cashback Rule Configuration**

* Available Store Credit = Số dư cashback của customer, được tích lũy sau mỗi order success:
  * Setting Rule: Hệ thống tự động quy đổi Cashback dựa trên tổng giá trị đơn hàng (Order Total) và Cashback Percentage do tiệm cấu hình.
    * `cashback_amount = order_total × cashback_percentage / 100`
    * Lưu ý: Order_total = giá trị order sau Discount/Cashback Redeem và chưa tính Tax/Tip
* Setting:
  * **Minimum redeemable amount:** số tiền balance tối thiểu được sử dụng để trừ ngược vào order đang thanh toán
  * **Maximum redeem per transaction:** Ngưỡng max được apply số dư cashback vào order (VD setting $20, nếu số dư Cash là $50 thì chỉ được sử dụng $20 cho order). *Description: Cap per use regardless of balance*
  * **Cashback percentage (%):** phần trăm được apply cashback trên order total. *Description: If total bill is $100 and cashback percentage will be 10%, customer can redeem up to $10.*

3. **Workflow - Apply Cash back: tích lũy Cash**

* Create Order: chọn staff - Service
* Chọn Reward > chọn tab Cashback > chọn Setting Cashback
* Tại field Cashback Percentage (%) > nhập số %
* Complete Order: dựa vào total order × % cashback → tính được số Cash tích lũy: `cashback_amount = order_total × cashback_percentage / 100`
* Số tiền tích lũy sẽ được sử dụng vào những order sau, nếu đã đủ điều kiện sử dụng

4. **Workflow - Apply Reward - Cash back: sử dụng số dư Cash Back vào order**

* Create Order: chọn staff - Service
* Chọn Reward > chọn tab Cashback
* Nhập Amount muốn trừ trực tiếp cho order, số amount phải thỏa điều kiện được apply. VD:
  * Minimum: $10
  * Maximum: $200
  * Available Store Credit (Current Cash balance): $573.11
  * Amount được cho phép: $10 - $200
* Cash back sẽ được trừ trực tiếp vào order, tương tự như apply Reward
* Cashback không áp dụng cho tax, tip.

5. **Giao diện những vị trí ảnh hưởng**

* **Create Order:** Thêm field **Cashback Redeemed** tại order summary (field con của Total Discount), thể hiện số tiền cashback được sử dụng redeem cho order hiện tại.
* **Order History:** cộng chung vào Total Discount.
* **Report:** Cashback Redeemed sẽ được tính chung vào Discount của order (bao gồm cả Promotion/Reward).

6. **Workflow khi có Re-open / Cancel / Refund / Partial Refund**

* **Re-open Order:** Cashback chưa finalize → recalculate lại Earn Cashback theo total mới khi order close lại. Cashback đã redeem tạm thời giữ nguyên, sẽ tính lại nếu order thay đổi giá trị.
* **Cancel Order / Full Refund:** Return toàn bộ cashback đã redeem vào wallet của customer; Reverse toàn bộ cashback earn từ order đó.
* **Partial Refund:** Cashback earn bị reverse theo tỷ lệ giá trị refund so với tổng order ban đầu; Cashback redeem được hoàn lại theo tỷ lệ refund tương ứng.

**Tóm lại:** Earn cashback → reverse theo phần order bị huỷ/refund. Redeem cashback → hoàn lại cho customer theo phần order bị huỷ/refund.

**Lưu ý:**

* Không xoá transaction cashback cũ; hệ thống nên tạo transaction đảo chiều (adjustment/reverse) để đảm bảo audit rõ ràng.
* Cashback nên được quản lý theo ledger transaction (earn / redeem / reverse / restore) để tránh sai lệch số dư wallet.
* Trường hợp cashback earn của order đã được customer dùng cho order khác trước khi refund → hệ thống vẫn phải reverse cashback của order gốc, và có thể cần xử lý balance adjustment trong wallet.

7. **Cashback Wallet (Cashback history)** — xem [Customer Management](./customer-management.md)

8. **Một số lưu ý**

* Luồng apply Cash Back cho order và sử dụng số dư Cash Back vào order là khác nhau.
* Khi chọn Reward: chỉ được chọn apply 1 trong 2 option - Reward hoặc Cash Back, không apply cùng lúc cả 2 options.
* Sau khi Complete order:
  * Available Store Credit bị trừ đi khoản Amount đã được sử dụng trong order trước đó.
  * Available Store Credit sẽ được cộng thêm tiền theo % cashback nếu có setting.
  * Point: vẫn sẽ được cộng theo Total Order đã complete (đổi điểm theo setting của tiệm, vd $1 = 1 point).

---

*Source: Google Docs — "Cashback" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
