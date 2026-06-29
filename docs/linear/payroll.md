---
title: Payroll
linearId: dec81408-5313-4db4-8867-ac81c24b11ac
url: https://linear.app/fastboy/document/payroll-23dadb3e0003
team: VOLT
updatedAt: 2026-06-11T09:59:24.041Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

## **Staff Payroll**

Staff Income detail theo từng staff: theo 2 setting Commission và Salary.

1. **STAFF PAYROLL - Commission**

* **Staff Info:** Staff Name (Nickname); Pay Period (04/15/2025 - 04/30/2025); Working Days (8 days).
* **Order listing:** Date; Sale (total amount order sale trong ngày); Refund (total amount order refund trong ngày, số âm); Supply (total supply trên tất cả service trong order trong ngày); Tip (total tip của tất cả order trong ngày).
* **Staff Income Detail:**
  * Sale = total Sale
  * Refund = total refund
  * **Subtotal = Total (Sale - Refund)**
  * Supply Fee (incl. Sale & Refund) = Total Supply
  * **Staff Commission = (Subtotal - Supply fee) x 60%**
  * Clean Up Fee = deduction fee × số ngày tính lương
  * Tip = Total Tip
  * **TOTAL INCOME = Staff Commission - Clean up fee + Tip**
    * Pay 1 (Staff Commission x 30% - Clean up fee)
    * Pay 2 (Staff Commission x 70% + Tip)
    * *Staff Commission x 30%: dựa trên setting Pay 1 - Pay 2 Split của từng staff*

2. **STAFF PAYROLL - Salary**

* **Staff Info:** Staff Name (Nickname); Pay Period (04/15/2025 - 04/30/2025).
* **Staff Payroll Detail:**
  * Working Days: tổng số ngày làm việc
  * Working Hours: tổng số giờ làm việc
  * **Salary Amount: tổng số lương phải trả**
    * Salary by Period: con số được setting trong Employee Compensation/Salary by Period
    * **Wage Per Day:** Salary Amount = [Wage Per Day] × [Working Days]
    * **Wage Per Hour:** Salary Amount = [Wage Per Hour] × [Working Hour]
  * Deduction/Clean up fee = deduction fee × số ngày tính lương
  * **Tip** = Total Tip
  * **TOTAL INCOME = Salary Amount - Clean up fee + Tip**
    * Pay 1 (Salary x 30% - Clean up fee)
    * Pay 2 (Salary x 70% + Tip)
    * *Salary x 30%: dựa trên setting Pay 1 - Pay 2 Split của từng staff*

**Một số lưu ý:**

* Nếu staff đang setting theo Commission + Salary: tùy thuộc vào staff đó có setting **Staff Days Off Setting** thì mới chốt được staff nhận Commission hay Salary.
* Phần Tip sẽ được cộng vào hoặc trừ ra tùy thuộc vào setting **Exclude Tips From Cash/Check Income** của mỗi staff đang enable hay disable.

---

# Print Check

* "Print Check" là việc in phiếu lương (commission check) từ hệ thống POS, thể hiện thu nhập của từng nhân viên trong một kỳ làm việc (thường 1 hoặc 2 tuần).
* Phát phiếu check giấy (paycheck) để nhân viên mang ra ngân hàng hoặc mobile app deposit vào tài khoản.
* Quy trình thực tế vận hành Print Check trong tiệm nail:
  * Tổng hợp doanh thu & tip (service income, tip, commission rate theo từng nhân viên; dữ liệu từ Order / Report / Time Keepings).
  * Tính toán lương (Commission or Salary): trả tiền mặt hoặc Check.
  * In Check.
  * Nhân viên đem phiếu ra ngân hàng.

Mẫu giấy dùng để in check: (xem link OneDrive trong Linear).

## Bank Account

Danh sách thông tin account ngân hàng của chủ tiệm: Bank Name; Account Name; Account Number; Routing Number; Bank Link. Search: Bank Name / Account Name. Action: Update. Button: Create New.

Create New bank account, form gồm 3 phần:

* Title: **Bank Information**
* **(1) Bank Account Information:**
  * Account Name (required) — tên chủ tài khoản
  * Account Number (required)
  * Bank Name (required)
  * Routing Number (required) — ABA Routing Number, 9 digits
  * Confirm Account Number (required) — phải khớp 100% với Account Number
  * Bank Website (Link) (required)
* **(2) Address Information:** Nick Name (required); Address Line 1 (Optional); Address Line 2 (Optional); City (required); State (required); Zip (required).
* **(3) Contact Information:** Phone (required); Email (required).
* Button: Default (set account default để print check); Create.

## Checks List

### Check List listing

Gồm: ID (count từ 1); Employee Name; Created At (hh:mm mm/dd/yyyy); Check (amount); Memo; Actions (View / Print / Delete / Archive / Void); Filter date (Created At); Filter status (Created default / Printed / Voided / Deleted); Signature; Add Staff button.

### Create Signature

* Là chữ ký của chủ tiệm (Owner)/người có thẩm quyền phát hành chi phiếu (Authorized Signer).
* Mục đích: Check được phê duyệt hợp lệ; Số tiền đã được ngân hàng cấp phép rút; Đây là chi phiếu hợp pháp. Hiển thị trên check.

### Add Staff

Tạo check cho staff. Điều kiện hiển thị list staff:

* Chỉ staff Active mới được trả lương → mới hiện trong danh sách tạo check.
* Staff không có thu nhập trong kỳ → default không xuất hiện (default filter "Has staff income").
* Staff chỉ được chọn nếu thuộc cùng Merchant đang tạo check.
* Nếu staff đã được chọn create check nhưng check chưa process → vẫn hiển thị nhưng bị disable.

Filter: Has Staff Income / All; Bank Account list; Payroll (Select date range theo payroll cố định của tiệm — không cho chọn ngày lẻ). Search: Staff name.

List Staff: Name (First/Last); Income (total Staff Income chưa in check, gồm cả 2 payroll liên tiếp thì show tổng); Staff Role; Latest Check; Sort theo alphabet Name. Option Select All.

**Lưu ý:** nếu payroll đã print check nhưng chỉ xuất cho pay 1, thì xem như payroll đó đã complete print check, không hiển thị số tiền pay 2 chưa in trong Income hiện tại nữa (thường trả 1 pay bằng check, 1 pay bằng cash để giảm thuế).

### Check detail

* **(1) Thông tin merchant:** Avatar; Merchant name; Merchant Address; Bank name; Bank link.
* **(2) Thông tin khởi tạo Check:**
  * Date (Issue Date): ngày tạo check; khi create, Issue Date = current date. Lưu ý: nếu mở lại check chưa print vào ngày khác → Issue Date cập nhật theo ngày mở lại, nhưng Created At ngoài Check List giữ nguyên.
  * Check number: số tăng dần tự động, padding 6 digits (000001…). Mục đích: nhận diện từng tờ check, theo dõi lịch sử, đối chiếu ngân hàng, tránh trùng lặp/gian lận.
* **(3) Thông tin số tiền thanh toán cho staff:**
  * PAY TO THE ORDER OF - Staff Name
  * Amount in Number — số tiền của Pay được chọn (Check 1 Payout / Check 2 Payout / Check 1&2 Payout)
  * Amount in Words — số tiền dạng text theo rules format check ngân hàng Mỹ

### Công thức/Quy tắc chuyển amount → text trên check

Ví dụ $1,902.34 → "ONE THOUSAND NINE HUNDRED TWO AND 34/100" (đúng format payroll check Mỹ).

1. **Phần nguyên (Dollar Amount):** chuyển từng nhóm số: 1–19 (bảng đặc biệt); Tens (twenty, thirty…); Hundred; Thousand; Million; Billion. Ví dụ 1902 → "one thousand nine hundred two".
2. **Phần thập phân (Cents):** cố định XX/100 dựa trên 2 số cuối. Ví dụ 0.34 → 34/100.
3. **Gộp theo format:** [DOLLAR WORDS] AND [CENTS]/100. Không cần thêm "dollars" (từ "DOLLARS" đã in sẵn bên phải).
4. **Tất cả luôn viết IN HOA (uppercase)** để dễ đọc với máy, tránh chỉnh sửa tay, chuẩn ngân hàng.

VD $1276.37 → "One Thousand Two Hundred Seventy-Six and 37/100 Dollars".

* **(4) Thông tin pay period, chữ kí và MICR line:**
  * MEMO: auto fill pay period [mm/dd/yyyy TO mm/dd/yyyy] - Staff Nickname
  * Chữ kí: của owner được setup ở Check List listing page
  * MICR line: vd `000786 |:111000611|: 585883120` — 000786 (Check number), 111000611 (Routing Number), 585883120 (Account Number). Ký tự phân tách `:`, `|`. Mục đích: tự động hóa xử lý check, ngân hàng dùng máy đọc MICR.
* **(5) Thông tin chi tiết staff income trong pay period:** Show Staff Payroll theo từng ngày (DATE / SALE / SUPPLY / COMMISSION / TIP / TOTAL). Summary: Total Sale; Supplies; Net Sale (= Total Sale - Supplies); Commission (60%); Clean Up Fee; Total tip; Pay 1; Pay 2; Total Pay.
* **(6) Một số action:**
  * Edit Info Check (chỉ status Created): update Created At (Issue Date), Check Number (không trùng với check đang có, ngoại trừ status Delete), Nickname, Name, Pay 1, Pay 2, Memo. Update chỉ apply cho Check đó, không ảnh hưởng setting hiện tại của staff.
  * Select option: Check 1 Payout / Check 2 Payout / Check 1 & 2 Payout.
  * Print Memo: print check.

### **Workflow**

| Status | Định nghĩa |
| -- | -- |
| Created | Check vừa mới được tạo ra |
| Printed | Check đã được in |
| Voided | Cancel check vừa in (Printed) |
| Deleted | Xóa check vừa tạo ra (Created) |

| Action | Định nghĩa |
| -- | -- |
| **View** | Mở và xem toàn bộ thông tin check (chỉ xem, không chỉnh sửa) |
| **Print** | In paycheck cho staff (bản chính ra ngân hàng); chỉ in 1 lần, cần xác nhận nếu in lại (Reprint) |
| **Delete** | Xóa hoàn toàn check (chỉ khi status Created); không khôi phục được |
| **Archive** | Ẩn check khỏi danh sách chính nhưng vẫn giữ trong hệ thống |
| **Void** | Hủy hiệu lực check đã phát hành; chuyển Voided; không in/sử dụng lại; không Delete sau khi Void |

| Status / Action | View | Print | Delete | Archive | Void | Re-print |
| -- | -- | -- | -- | -- | -- | -- |
| **Created** | Yes | Yes (→Printed) | Yes (→Deleted) | Yes (→Archived) | No | No |
| **Printed** | Yes | No | No | No | Yes (→Voided) | Yes (→Printed) |
| **Voided** | Yes | No | No | No | No | No |
| **Deleted** | Yes | No | No | No | No | No |

Một số lưu ý sau khi create Check:

* **Created:** staff bị disable → phải Delete thì mới enable lại.
* **Printed (Đã xử lý):** Nếu staff vẫn còn Income chưa thanh toán → phải enable lại để xuất check tiếp; Nếu staff hết Income → hiển thị giống hình; Nếu Void check đó → enable lại staff với số tiền Income đã Void để xuất lại.

## **Quick Book**

Tạo nhanh 1 check cho list staff trong merchant, không ảnh hưởng đến Income/Payroll của staff (khoản bonus chủ tiệm muốn thanh toán).

**Create Check section:** Bank Account; Ending Balance (tổng số tiền thanh toán bằng Quick-Book, gồm tất cả status); PAY TO THE ORDER OF (selector staff, gồm cả Inactive); Amount ($); Amount in Words; MEMO.

**Check listing section:** ID; Employee Name [Nickname - Full name]; Created At; Check; Memo; Action (View / Print / Delete / Archive / Void / Reprint).

Lưu ý: Không cho phép Edit Check.

## History

* List status riêng của History: Active (check status Created); Archive (check đã printed và archive); Delete (đã delete); Void (đã void).
* History listing: ID; Employee [Nickname - Name]; Created At [hh:mm mm/dd/yyyy]; Amount; Memo (pay period); Sort default desc theo ID.
* History Detail: ID; Employee [Nickname - Name]; Status; Activities (log khi có update — User, Change Fields [old > new], Action [Edit check / Delete check / Reprint check / Void check], Reason, Updated At [hh:mm mm/dd/yyyy]).

---

*Source: Google Docs — "Payroll" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
