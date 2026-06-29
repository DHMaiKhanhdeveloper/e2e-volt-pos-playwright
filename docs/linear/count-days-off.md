---
title: Count Days Off
linearId: 9d25b6e0-c84b-45f6-b112-e81260ace54a
url: https://linear.app/fastboy/document/count-days-off-8a55b2dcc45e
team: VOLT
updatedAt: 2026-06-25T17:50:51.257Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

**Feature Definition — Count Days Off**

# **1. Business Purpose**

Tính năng **Count Days Off** được sử dụng để hỗ trợ cơ chế thỏa thuận trả lương giữa Chủ tiệm (Owner) và Nhân viên/Thợ (Staff).

Trong mô hình này, Staff có thể được áp dụng: Salary cố định; Commission theo doanh thu/dịch vụ.

Tính năng này cho phép Owner kiểm soát điều kiện nghỉ làm của Staff để xác định Staff có đủ điều kiện nhận Commission hay không.

# **2. Feature Overview**

Setting Name: Limit days off for this staff

Mục đích: cho phép giới hạn Số ngày nghỉ tối đa; Các ngày không được phép nghỉ.

Nếu Staff vi phạm bất kỳ điều kiện nào, Staff sẽ không đủ điều kiện nhận Commission và chỉ được nhận Salary.

# **3. Settings Configuration**

3.1. Enable/Disable Count Days Off — Field: Limit days off for this staff. Values: OFF → Không áp dụng kiểm tra; ON → Áp dụng kiểm tra ngày nghỉ.

3.2. Maximum Days Allowed to Be Off — Field: Max days off allowed. Số ngày nghỉ tối đa trong một payroll period. Example: Max = 2 → Staff chỉ được nghỉ tối đa 2 ngày.

| Total Day Off | Result |
| -- | -- |
| ≤ 2 | Valid |
| > 2 | Violated |

3.3. Days Not Allowed to Be Off — Field: Days not allowed to be off. Các ngày trong tuần Staff không được phép nghỉ. Example: Friday, Saturday, Sunday → nghỉ vào bất kỳ ngày nào trong danh sách → Vi phạm rule.

# **4. Time Keeping Integration**

Để xác định Staff có nghỉ làm hay không, hệ thống dùng dữ liệu từ **Time Keeping**. Staff bắt buộc: Check-in khi đến làm việc; Check-out khi kết thúc ca (optional).

# **5. Day Off Definition**

Một ngày được xem là **Day Off** khi: Staff không có check-in/check-out hợp lệ trong ngày làm việc được yêu cầu.

# **6. Valid Attendance Definition**

Một ngày hợp lệ khi: có check-in hợp lệ; có check-out hợp lệ (optional); HOẶC hệ thống Auto Check-out thành công.

6.1. Auto Check-out Mechanism — Nếu Staff đã check-in nhưng quên check-out, hệ thống tự động `Auto Check-out at end of day`. Ngày đó vẫn `Valid Attendance` và KHÔNG bị tính là Day Off.

6.2. Day Off Definition (Updated) — Một ngày chỉ tính là Day Off khi Staff không có check-in hợp lệ. Có check-in nhưng quên check-out → vẫn hợp lệ nhờ Auto Check-out; Không có check-in → mới bị xem là Day Off.

# **7. Violation Rules**

Staff vi phạm nếu: `Total Day Off > Max days off allowed` HOẶC `Staff takes off on restricted weekdays`. Ví dụ: nghỉ Friday/Saturday/Sunday dù tổng ngày nghỉ chưa vượt mức → vẫn vi phạm.

# **8. Payroll Calculation Logic**

**Case 1 — Count Days Off = OFF**: so sánh Salary vs Commission.

| Condition | Final Payment |
| -- | -- |
| Commission > Salary | Pay Commission |
| Commission ≤ Salary | Pay Salary |

`Final Payment = MAX(Salary, Commission)`

**Case 2 — Count Days Off = ON**: kiểm tra Maximum days allowed + Days not allowed to be off.

8.1. Staff KHÔNG vi phạm — Total Day Off ≤ Max và không nghỉ restricted weekdays → `Final Payment = MAX(Salary, Commission)`.

8.2. Staff VI PHẠM — `Total Day Off > Max` HOẶC nghỉ restricted weekdays → Staff mất quyền Commission → `Final Payment = Salary` (kể cả khi Commission > Salary).

# **9. Payroll Rule Priority**

| Priority | Rule |
| -- | -- |
| Highest | Count Days Off validation |
| Secondary | Salary vs Commission comparison |

Nếu Staff vi phạm day-off rules → bỏ qua Commission calculation → chỉ trả Salary.

# **10. Payroll Flow**

```
Step 1: Check if Count Days Off is enabled
Step 2: If OFF → Final Payment = MAX(Salary, Commission)
Step 3: If ON → Validate attendance from Time Keeping
Step 4: Check: Total Day Off, Restricted weekdays off
Step 5: If violation exists → Final Payment = Salary only
        Else → Final Payment = MAX(Salary, Commission)
```

# **11. Examples**

**Example 1 — Count Days Off OFF**

| Salary | Commission | Result |
| -- | -- | -- |
| $1,000 | $1,500 | Receive $1,500 |
| $1,000 | $800 | Receive $1,000 |

**Example 2 — ON and NO violation**: Max=2, restricted=Fri/Sat. Staff nghỉ 1 ngày, không nghỉ Fri/Sat. Salary $1,000, Commission $1,500 → `Final Payment = $1,500`.

**Example 3 — Violate Maximum Days Off**: Max=2. Staff nghỉ 3 ngày. Salary $1,000, Commission $1,500 → `Final Payment = $1,000`.

**Example 4 — Violate Restricted Weekday**: restricted=Saturday. Staff nghỉ Saturday. Salary $1,000, Commission $2,000 → `Final Payment = $1,000`.

# **12. Edge Cases / Clarification Needed**

12.1. **Missing Check-out** — Có check-in, cuối ngày auto checkout → attendance hợp lệ, không tính Day Off.

12.2. **Manual Attendance Adjustment** — Owner/Manager có thể chỉnh sửa Time Keeping, approve attendance thủ công; attendance đã approve được xem là hợp lệ.

12.3. **Non-working Schedule** — Nếu Staff không được schedule làm việc trong ngày đó → ngày đó không tính là Day Off.

12.4. **Count days off không apply cho Salary by Period.** Với staff Compensation = Commission + Salary và Salary type = Salary by Period, hệ thống luôn so sánh `Final Payroll = Max(Commission, Salary by Period)`. Không xét ngày nghỉ, không cần check-in/check-out. Count days off vẫn giữ setting nhưng chỉ apply cho salary Wage per day / Wage per Hour.

Lý do: Salary by Period là "lương cứng theo kỳ", nếu đã không cần checkin/checkout chính xác thì không nên dùng Count days off để tự động phạt/thay đổi cách tính.

---

*Source: Google Docs — "Count Days Off" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
