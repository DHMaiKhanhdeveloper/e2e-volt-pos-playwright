---
title: Income Version 2
linearId: c868dd0f-ef6e-4822-96c1-c826cad6663f
url: https://linear.app/fastboy/document/income-version-2-94d2aa985225
team: VOLT
updatedAt: 2026-06-25T04:38:06.785Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# **POS Income Version 2 - Bao gồm: Card Charge % – Discount Charge**

Define specs: https://docs.google.com/spreadsheets/d/1NtBfxEsGjaijFWn7rlzR79sLzmeHTAjNqMDatAnY0wo/edit?gid=1736528834#gid=1736528834

## **Daily Sale Report**

Update giao diện, thêm một số thông tin show trong chart (xem [Business Snapshot](./business-snapshot.md)).

* **Daily Sale Report Chart**
  * **Orders** — Tooltip: *Total number of order, excluding cancel/refunds/manual refunds.*
  * **Sale** = total sale/refund/partial refund sau Discount, không tính Tip, Tax, không tính order Cancel (Card/Cash/Other/GiftCard) — Tooltip: *Total sale amount of the order, including refund/partial refund values after discount is applied, excluding Tax and Tip.*
  * **Total Tips** = total Tip (không tính order Cancel) — Tooltip: *Total tips received, not included in sales revenue but counted in collected amounts.*
  * **Total Payment** — Tooltip: *The final revenue includes Gift Card Redemption.*
  * **Filter:** Default Today; Cho phép xem theo từng ngày được chọn.
* **Daily Sale Report detail:**

  **List Order Detail:** Order # (orderCode); Sale (total service sale/refund trên order sau Discount); Tax; Tip; Total = Total Sale + Tip + Tax.

  **INCOME DETAIL:** Sale (Total Sale/Refund sau Discount); Tip; Tax Collected; **Total Payment = Sale + Tip + Tax Collected**.

  **PAYMENT DETAIL:** Card (Total Sale Card - Total Refund Card); Cash; Others; **Amount Collected = Card + Cash + Others**; Gift Card Redemption; **TOTAL PAYMENT = Amount Collected + Gift Card Redemption**.

## **Income Summary**

* **Income Summary chart**
  * **Filter:** date range, xem data theo Day/Week/Month. Default Day - Today.
    * **Day:** show list report cho từng ngày theo date range, 1 day = 1 record.
    * **Week:** show report theo week của năm hiện tại, đến week hiện tại (1 week = 1 record). Filter year 2026. Nếu chọn năm quá khứ (2025) → show tất cả week của năm đó.
    * **Month:** show report theo tháng của năm hiện tại, đến tháng hiện tại (1 tháng = 1 record). Năm quá khứ → đủ 12 tháng.
  * **Total Income:** Total Net Income, compare với khoảng thời gian trước đó. Chart 3 thông số:
    * **Gross Income:** Total amount of sales, sau discount và trước refunds. Does not include tips, tax and gift card loads and activations. (*gift card loads = tiền nạp vào GiftCard, không cộng vào report POS.*)
    * **Net Income:** Total sale amount sau discount, sau refund/partial refund, không tính Tip, tax, order Cancel, gift card loads and activations.
    * **Total Tip**
  * **Total Income table:** Date; Sale; Tip; Tax; Total Payment (= Sale + Tip + Tax, final revenue includes Gift Card Redemption).
* **Income Summary detail**

  **PAYMENT DETAILS:** Card (= Total Sale Card - Total Refund Card + Total tip by card + Total tax Card); Cash; Others; **Amount Collected = Card + Cash + Others**; Gift Card Redemption (Sale/Tip/Tax by gift card); **TOTAL PAYMENT = Amount Collected + Gift Card Redemption**.

  **SALE DETAILS:**
  * **Total Sale = Gift card Sale + Service Sale + Product Sale**
  * **Total Refund = Service Refund + Product Refund**
  * **Subtotal = Total Sale - Total Refund**
  * Discount = Discount - Discount Reversed
  * **Net Total = Subtotal - Discount**
  * Tip; Tax Collected; **TOTAL PAYMENT = Net Total + Tax + Tip**

  **SUPPLY FEE:**
  * Total Supply Fee (theo từng Service, setting trong Service detail)
  * Staff Supply Share = Total Supply Fee × 0.6 (*theo Staff Commission Setting - For Service, vd Staff 60% - Owner 40%*)
  * Salon Supply Share = Total Supply Fee - Staff Supply Share

  **STAFF PAYOUT:**
  * Total Service = Service Sale - Service Refund
  * Staff Supply Share (incl. Sale & Refund)
  * **Staff Commission (60%) = (Total Service x 60%) - Staff Supply Share** (*nếu staff chỉ Salary thì = 0*)
  * Tip
  * Clean up fee (= Deduction Per Day × số ngày làm việc tới thời điểm xem report)
  * **Staff Discount Charge** (Tổng promotion staff chia với chủ tiệm)
  * **Staff Card Charge - Commission** (chiết khấu trừ trên phí thanh toán thẻ trên Commission — On Staff Commission)
  * **Staff Card Charge - Tip** (chiết khấu trừ trên phí thanh toán thẻ trên Tip — On Credit Card Tip)
  * **Staff Salary:** lương cứng, cộng dồn theo tổng staff Salary trên tổng ngày xem report:
    * Salary by Period: lương 1 kì chia cho số ngày trong kì. VD Pay Period 1 week, Salary by Period $7000, xem report 3 ngày, Rate $1000 → Staff Salary = $1000 × 3 = $3000.
    * Wage Per Hour: Staff Salary = [Lương 1h × số giờ]. Wage Per Day: Staff Salary = [Lương 1 ngày × số ngày].
    * Lưu ý: staff Commission + Salary thuộc kì lương chưa chốt → show con số lớn hơn; đã chốt → show con số được chọn.
  * **TOTAL STAFF PAYOUT = Staff Commission + Tips + Salary – Supply Fee – Cleanup Fee – Discount Charge - Staff Card Charge Commission - Staff Card Charge Tip**
    * Pay 1 = [[Staff Salary + (Staff Commission – Supply Fee)] × 30%] – Clean up fee – Discount Charge - Staff Card Charge Commission - Staff Card Charge Tip
    * Pay 2 = [(Staff Salary + Staff Commission) × 70%] + Tip
    * *× 30%: dựa trên setting Pay 1 - Pay 2 Split của từng staff*
    * *Lưu ý: chưa chốt kì lương → lấy số lớn hơn (estimate); đã chốt → update lại bằng con số chính xác.*

  **SALON EARNINGS:**
  * Total Service = Service Sale - Service Refund
  * Salon Supply Share (incl. Sale & Refund)
  * **Salon Commission (40%) = (Total Service x 40%) - Salon Supply Share** (*chưa chốt → số lớn hơn; đã chốt → con số được chọn*)
  * Product Sale; Product Refund
  * Total Discount = Discount - Discount Reversed
  * **Net Earnings = Salon Commission (40%) + Product Sale - Product Refund - Total Discount**
  * Staff Supply Share; Clean up fee; Staff Discount Charge; Staff Card Charge - Commission; Staff Card Charge - Tip
  * **Staff Salary** (rule như STAFF PAYOUT)
  * **TOTAL EARNING = Net Earnings + Staff Supply Share + Cleanup Fee + Staff Discount Charge – Staff Salary + Staff Card Charge Commission + Staff Card Charge Tip**
  * Tax Collected: total tax

## **Staff Income**

* Staff listing: Search (Staff Nickname); Filter theo Payroll Period (kỳ lương hiện tại chưa chốt hiển thị đầu danh sách: "Current Period (06/15 - 06/28)"); Data table: Staff; Orders; Subtotal (= Sale - Refund); Supply Fee; Tip; Total Income.

1. **STAFF INCOME - Commission**
   * Staff Info: Staff Name (Nickname); Date (1 ngày / range + No. of WD).
   * Order listing: Order#; Sale/Refund; Supply; Tip.
   * Staff Income Detail: Sale; Refund; **Subtotal = Sale - Refund**; Supply Fee (incl. Sale & Refund); **Staff Commission = (Subtotal - Supply fee) x 60%**; Discount Charge; Card Charge - Commission; Card Charge - Tip; Clean Up Fee/Deduction; Tip; **TOTAL INCOME = Staff Commission - Clean up fee + Tip - Card Charge Commission - Card Charge Tip – Discount Charge** (Pay 1 = Staff Commission × 30% - Clean up fee - Card Charge Commission - Card Charge Tip – Discount Charge; Pay 2 = Staff Commission × 70% + Tip).

2. **STAFF INCOME (1 day) - Salary / Commission + Salary** (Pay by Hour/Day/Period)
   * Staff Info: Staff Name; Date; Clock In; Clock Out; Working Hours.
   * Order listing: Order#; Sale/Refund; Tip.
   * Staff Income Detail: Sale; Refund; **Subtotal = Sale - Refund**; Rate (Salary by Period / Wage Per Hour / Wage Per Day); Gross Income = [số ngày/giờ làm việc] × [rate]; Clean Up Fee/Deduction; Tip; **TOTAL INCOME = Gross Income - Clean Up Fee + Tip**.

**Một số lưu ý:** Salary by Period (trả theo kì payroll); Wage Per Hour (cần Checkin-Checkout); Wage Per Day (cần Checkin); Clean Up Fee tính trên số ngày nhận lương của kì; Staff Income chỉ là report dự trù; Clock In/Clock Out display rules (xem chi tiết). Nếu Staff Salary hoặc Commission + Salary → show cả 2 phần, Total Income show phần Salary (phụ thuộc Staff Days Off Setting).

## **Staff Payroll**

1. **STAFF PAYROLL - Commission:** Staff Info (Nickname, Pay Period, Working Days); Order listing (Date, Sale, Refund, Supply, Tip); Staff Income Detail: Sale; Refund; **Subtotal**; Supply Fee; **Staff Commission = (Subtotal - Supply fee) x 60%**; Discount Charge; Card Charge - Commission; Card Charge - Tip; Clean Up Fee; Tip; **TOTAL INCOME = Staff Commission - Clean up fee + Tip - Card Charge Commission - Card Charge Tip – Discount Charge** (Pay 1 / Pay 2).

2. **STAFF PAYROLL - Salary:** Staff Info (Nickname, Pay Period); Working Days; Working Hours; **Salary Amount** (Salary by Period / Wage Per Day × Working Days / Wage Per Hour × Working Hour); Deduction/Clean up fee; Tip; **TOTAL INCOME = Salary Amount - Clean up fee + Tip** (Pay 1 = Salary × 30% - Clean up fee; Pay 2 = Salary × 70% + Tip).

**Một số lưu ý:** Commission + Salary → phụ thuộc Staff Days Off Setting; Tip cộng/trừ theo setting Exclude Tips From Cash/Check Income.

### Promotion Cost Sharing

* Merchant cấu hình tỷ lệ phân chia Promotion giữa Owner và Staff. Phần Promotion thuộc Staff phân bổ cho tất cả staff tham gia order theo tỷ lệ giá trị service.
* Chỉ staff có Compensation chứa Commission mới thực sự chịu phần Promotion khi tính Income/Payroll. Phần phân bổ cho staff Salary-only do Owner chịu.
* **Staff có Commission** (Commission, Salary + Commission): Promotion giảm Income/Commission theo quy tắc.
* **Staff chỉ có Salary:** Promotion chỉ ghi nhận để phân bổ trên order, không ảnh hưởng Income/Payroll → chuyển sang chi phí Owner chịu.

### Description khi xem report nhiều kì lương (Staff Income Report)

* **Staff setting Commission:** Staff Commission (Commission Rate theo từng kì); Total Income (Pay 1 Rate, Pay 2 Rate theo từng kì).
* **Staff setting Commission + Salary và Salary:** Rate (theo từng kì); Total Income (Pay 1 Rate, Pay 2 Rate theo từng kì).

---

*Source: Google Docs — "Income Version 2" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
