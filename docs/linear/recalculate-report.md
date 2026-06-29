---
title: Recalculate Report
linearId: e83825f4-bff4-4792-970e-02623d2352af
url: https://linear.app/fastboy/document/recalculate-report-84a21a4ac2ce
team: VOLT
updatedAt: 2026-06-11T09:59:22.841Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# **Recalculate Report for Unprinted Payroll Period**

# **Overview**

Cho phép Owner/Admin thực hiện **Recalculate Payroll** đối với các kỳ lương chưa được Print Check nhằm xử lý các trường hợp Payroll được generate trước khi Compensation của staff được cấu hình đầy đủ hoặc được cập nhật chính xác.

Sau khi Compensation được cập nhật, hệ thống cho phép tính toán lại Payroll và đồng bộ toàn bộ dữ liệu liên quan để đảm bảo các báo cáo luôn phản ánh số liệu mới nhất.

# **Business Problem**

Hiện tại có thể xảy ra trường hợp: Payroll Period đã được generate; Một hoặc nhiều staff chưa được cấu hình Compensation; Payroll được tính ra không chính xác; Sau đó Owner mới cập nhật Compensation cho staff.

Trong trường hợp này, hệ thống cần cho phép tính lại Payroll mà không cần tạo lại Payroll Period.

# **Scope**

**In Scope:** Recalculate Payroll Period chưa Print Check; Áp dụng lại Compensation hiện tại của staff; Cập nhật lại Payroll data; Đồng bộ lại các báo cáo liên quan; Giữ nguyên các dữ liệu nhập thủ công; Ghi nhận Audit Log.

**Out of Scope:** Payroll đã Print Check.

# **Permission**

Cho phép các role có quyền Payroll thực hiện trên Portal.

# **UI Proposal**

Payroll Detail hiển thị action: **Recalculate Payroll**.

Điều kiện hiển thị: khi Payroll chưa Print Check. Ẩn hoặc Disable khi Payroll đã Print Check. Tooltip: "Payroll cannot be recalculated after checks have been printed."

# **Recalculate Flow**

* **Step 1:** Tại kì Payroll đang xem, click chọn Recalculate Payroll
* **Step 2:** Hiển thị Confirmation Dialog — Title "Recalculate Payroll", Message: "Payroll amounts will be recalculated using current compensation settings. Manual adjustments will remain unchanged. Do you want to continue?". Actions: Cancel / Recalculate.
* **Step 3:** System thực hiện Recalculate.
* **Step 4:** Hiển thị kết quả, ví dụ "Payroll recalculated successfully."

# **Business Rules**

* **Rule 1 – Compensation:** Khi Recalculate, hệ thống áp dụng tất cả các setting trong Compensation hiện tại của staff.
* **Rule 2 – Staff chưa có Compensation:** Vẫn hiển thị trong Payroll; Payroll Amount = $0; Không chặn quá trình Recalculate; Không phát sinh lỗi.
* **Rule 3 – Các khoản được tính lại:** Commission, Salary, Pay1/Pay2, các setting khác phát sinh từ Compensation.
* **Rule 4 – Recalculate nhiều lần:** Cho phép Recalculate nhiều lần; Mỗi lần sử dụng Compensation hiện tại; Ghi đè kết quả Payroll do hệ thống tự động tính trước đó.

# **Data Synchronization**

Sau khi Recalculate thành công, hệ thống phải đồng bộ lại tất cả module liên quan: Staff Payroll; Staff Income Report; Income Summary Report.

# **Processing Sequence**

```
Recalculate Staff Payroll
        ↓
Update Staff Income Report
        ↓
Update Income Summary Report
        ↓
Save Audit Log
```

Chỉ được xem là thành công khi toàn bộ các bước hoàn tất.

# **Transaction Rule**

Toàn bộ quá trình phải thực hiện trong cùng một action. Nếu bất kỳ bước nào thất bại: Rollback toàn bộ dữ liệu; Không lưu dữ liệu một phần. Ví dụ không được xảy ra: Staff Payroll = dữ liệu mới, Staff Income = dữ liệu cũ, Income Summary = dữ liệu cũ.

# **Audit Log**

Bắt buộc lưu Audit Log cho user thực hiện action Recalculate.

# **Error Handling**

* Payroll đã Print Check: Không cho phép Recalculate, disable button. Message "Payroll cannot be recalculated after checks have been printed."
* Không có thay đổi dữ liệu: Message "Payroll recalculated successfully. No payroll changes detected."

# **Acceptance Criteria**

* **AC01** — Payroll chưa Print Check → cho phép Recalculate.
* **AC02** — Payroll đã Print Check → không cho phép Recalculate.
* **AC03** — Compensation đã cập nhật → Payroll Amount tính lại theo Compensation mới nhất.
* **AC04** — Staff chưa có Compensation → Payroll Amount = $0.
* **AC05** — Payroll có Bonus/Deduction nhập thủ công → giữ nguyên.
* **AC06** — Recalculate hoàn tất → lưu Audit Log.
* **AC07** — Recalculate nhiều lần → luôn dùng Compensation hiện tại.
* **AC08** — Recalculate thành công → Staff Payroll phản ánh kết quả mới nhất.
* **AC09** — Recalculate thành công → Staff Income Report phản ánh kết quả mới nhất.
* **AC10** — Recalculate thành công → Income Summary Report phản ánh kết quả mới nhất.
* **AC11** — Một bước cập nhật thất bại → rollback toàn bộ transaction.
* **AC12** — Recalculate thành công → số liệu giữa Payroll, Staff Income và Income Summary đồng nhất, không lệch.

---

*Source: Google Docs — "Recalculate Report" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
