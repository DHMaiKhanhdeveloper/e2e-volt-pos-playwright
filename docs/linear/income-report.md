---
title: Income Report
linearId: 3ff5a309-2cf3-447b-a87e-cfb927c4ce93
url: https://linear.app/fastboy/document/income-report-cd80210c48f3
team: VOLT
updatedAt: 2026-06-11T09:59:25.079Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# **[PORTAL] POS Income**

Define specs: https://docs.google.com/spreadsheets/d/1JdMe04AtlnYSBC4XybIGmTBHCU6_C5MJAJruTq2jSNw/edit?gid=1697565846#gid=1697565846

## **Daily Sale Report**

* **Daily Sale Report Chart**
  * **Orders** — Tooltip: *Total number of order, refunds, and manual refunds.*
  * **Sale** = total sale/refund/partial refund, không tính Tip, Tax, không tính order Cancel (Card/Cash/Other/GiftCard) — Tooltip: *Total sale amount of the order, including refund/partial refund values after discount is applied, excluding Tax and Tip.*
  * **Total Tips** = total Tip (không tính order Cancel) — Tooltip: *Total tips received, not included in sales revenue but counted in collected amounts.*
  * **Total Payment** — Tooltip: *The final revenue includes Gift Card Redemption.*
* **Daily Sale Report detail:**

  Note: với Order Refund/Partial Refund — Sale/Refund = total amount refund của order (số âm); Tax = total tax của tất cả order refund; Tip = Total tip của order refund (số âm); Total = Sale - Discount + Tip (số âm).

  **List Order Detail**
  * Order #: orderCode
  * Sale: total amount service sale/refund trên order sau Discount
  * Tax = Tax trên order
  * Tip = Total tip trên order
  * Total = Total Sale + Tip + Tax

  **INCOME DETAIL**
  * Sale = Total Sale/Refund amount sau Discount
  * Tip = Total tip
  * Tax Collected = total Tax
  * **Total Payment = Sale + Tip + Tax Collected**

  **PAYMENT DETAIL**
  * Card = Total Sale Card - Total Refund Card
  * Cash = Total Sale Cash - Total Refund Cash
  * Others = Total Sale Others - Total Refund Others
  * **Amount Collected = Card + Cash + Others**
  * Gift Card Redemption: Total gift card redemption
  * **TOTAL PAYMENT = Amount Collected + Gift Card Redemption**

## **Income Summary**

* **Income Summary chart**
  * **Filter:** date range và chọn xem data theo Day or Week
  * **Total Income:** theo thời gian đã chọn, luôn compare với khoảng thời gian trước đó
    * Total Income chart — 3 thông số:
      * **Gross Income:** Total amount of sales before refunds. Does not include tips and gift card loads and activations
      * **Net Income:** Total sale amount sau khi refund/partial refund, không tính Tip, không tính order Cancel, không tính sale giftcard
      * **Total Tip**
  * Total Income table: Date; Sale (total sale/refund/partial refund, không tính Tip/Tax/order Cancel); Tip; Net Income; Total Payment (final revenue includes Gift Card Redemption).
* **Income Summary detail**

  **PAYMENT DETAILS**
  * Card = Total Sale Card - Total Refund Card + Total tip by card + Total tax Card (Sale: Total Sale Card; Refund: Total Refund Card; Tip: Total tip by card; Tax: Total tax by card)
  * Cash = Total Sale Cash - Total Refund Cash + Total tip by Cash + Total tax Cash
  * Others = Total Sale Others - Total Refund Others + Total tip Others + Total tax Others
  * **Amount Collected = Card + Cash + Others**
  * Gift Card Redemption (Payments covered by previously sold gift cards): Sale (Total Sale by gift card); Tip (Total tip by gift card); Tax (Total tax by gift card)
  * **TOTAL PAYMENT = Amount Collected + Gift Card Redemption**

  **SALE DETAILS**
  * **Total Sale = Gift card Sale + Service Sale + Product Sale** (Service Sale; Product Sale; Gift card Sale = Add Fund cho giftcard khi create order)
  * **Total Refund = Service Refund + Product Refund**
  * **Subtotal = Total Sale - Total Refund**
  * Discount = Discount - Discount Reversed (*Discount: All discounts — promotions, service discounts, loyalty rewards; Discount Reversed: discount taken back due to a refund*)
  * **Net Total = Subtotal - Discount**
  * Tip = total tip của tất cả hình thức thanh toán
  * Tax Collected = total tax của tất cả hình thức thanh toán
  * **TOTAL PAYMENT = Net Total + Tax + Tip**

  **SUPPLY FEE**
  * Total Supply Fee: theo từng Service (setting trong Service detail)
  * Staff Supply Share = Total Supply Fee × 0.6 (*phần trăm theo Staff Compensation, vd Staff 60% - Owner 40%*)
  * Salon Supply Share = Total Supply Fee - Staff Supply Share

  **STAFF PAYOUT**
  * Total Service = Service Sale - Service Refund
  * Staff Supply Share (incl. Sale & Refund)
  * **Staff Commission (60%) = (Total Service x 60%) - Staff Supply Share** (*nếu staff chỉ setting Salary thì = 0*)
  * Tip = total tip
  * Clean up fee = $ setting Deduction Per Day × số ngày đã làm việc của staff tới thời điểm xem report
  * **Staff Salary:** lương cứng của staff, theo setting
  * **TOTAL STAFF PAYOUT = Staff Commission (60%) + Tip - Clean up fee + Staff Salary**
    * Pay 1 (Staff Commission x 30% - Clean up fee)
    * Pay 2 (Staff Commission x 70% + Tip)
    * *Staff Commission x 30%: dựa trên setting Pay 1 - Pay 2 Split của từng staff*

  **SALON EARNINGS**
  * Total Service = Service Sale - Service Refund
  * Salon Supply Share (incl. Sale & Refund)
  * **Salon Commission (40%) = (Total Service x 40%) - Salon Supply Share**
  * Product Sale; Product Refund
  * Total Discount = Discount - Discount Reversed
  * **Net Earnings = Salon Commission (40%) + Product Sale - Product Refund - Total Discount**
  * Staff Supply Share; Clean up fee; **Staff Salary**
  * **TOTAL EARNING = Net Earnings + Staff Supply Share (60%) + Clean up fee - Staff Salary**
  * Tax Collected: total tax

## **Staff Income**

* Staff listing: Search (Staff Nickname); Filter (ngày xem report); Data table columns: Staff (nickname); Orders; Subtotal (= Sale - Refund); Supply Fee; Tip; Total Income.
* Staff Income detail theo từng staff và theo setting Compensation:

1. **STAFF INCOME - Commission**
   * **Staff Info:** Staff Name (Nickname); Date (1 ngày: 04/15/2025; range: 04/15/2025 - 04/30/2025, No. of WD: 8 days).
   * **Order listing:** Order#; Sale/Refund; Supply; Tip.
   * **Staff Income Detail:**
     * Sale = total amount SALE
     * Refund = total amount REFUND
     * **Subtotal = Sale - Refund**
     * Supply Fee (incl. Sale & Refund)
     * **Staff Commission = (Subtotal - Supply fee) x 60%**
     * Clean Up Fee/Deduction = $ setting × số ngày xem report
     * Tip = Total tip
     * **TOTAL INCOME = Staff Commission - Clean up fee + Tip**

2. **STAFF INCOME (1 day) - Salary / Commission + Salary** (Pay by Hour/Day/Period)
   * **Staff Info:** Staff Name (Nickname); Date (04/15/2025); Clock In (9:00:00 AM); Clock Out (5:00:00 PM); Working Hours (8).
   * **Order listing:** Order#; Sale/Refund; Tip.
   * **Staff Income Detail:**
     * Sale = total amount SALE; Refund = total amount REFUND
     * **Subtotal = Sale - Refund**
     * Rate: số setting trong staff Compensation - Salary:
       * Salary by Period: lương 1 kì chia cho số ngày trong kì. VD: Pay Period 1 week, Salary by Period $7000, xem report 3 ngày, Rate = $1000, Gross Income = $1000 × 3 = $3000.
       * Wage Per Hour: lương 1h. Wage Per Day: lương 1 ngày.
     * Gross Income: [số ngày/giờ làm việc] × [rate]
     * Clean Up Fee/Deduction = $ setting × số ngày xem report
     * Tip = Total tip
     * **TOTAL INCOME = Gross Income - Clean Up Fee + Tip**

**Một số lưu ý:**

* Salary by Period: trả lương theo kì payroll.
* Wage Per Hour: cần Checkin - Checkout để count số giờ làm việc.
* Wage Per Day: cần Checkin để count số ngày đến tiệm làm việc.
* Staff Income chỉ là report dự trù, con số chính xác vẫn là trong Payroll khi chốt kì lương.
* Nếu Staff đang setting **Salary** hoặc **Commission + Salary**: Staff Income luôn show cả Commission và Salary, nhưng Total Income show phần Salary (phụ thuộc vào **Staff Days Off Setting**).

---

*Source: Google Docs — "Income Report" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
