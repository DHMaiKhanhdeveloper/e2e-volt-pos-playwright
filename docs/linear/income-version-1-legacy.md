---
title: Income Version 1 (legacy)
linearId: 2e78ec9b-d8cd-4c68-bdbf-3f4bb9b94820
url: https://linear.app/fastboy/document/income-version-1-legacy-22a0cc2660e0
team: VOLT
updatedAt: 2026-06-11T09:59:56.144Z
---

> ⚠️ **Legacy** — đã được thay thế bởi [Income Version 2](./income-version-2.md). Giữ để tham khảo lịch sử, không cập nhật tiếp.

# **[Volt POS] POS Income**

Define specs: https://docs.google.com/spreadsheets/d/1JdMe04AtlnYSBC4XybIGmTBHCU6_C5MJAJruTq2jSNw/edit?gid=1697565846#gid=1697565846

## **Daily Sale Report**

Update giao diện, thêm một số thông tin show trong chart (xem [Business Snapshot](./business-snapshot.md)).

* **Daily Sale Report Chart**
  * **Orders** — Tooltip: *Total number of order, excluding cancel/refunds/manual refunds.*
  * **Sale** = total sale/refund/partial refund, không tính Tip, Tax, không tính order Cancel (Card/Cash/Other/GiftCard) — Tooltip: *Total sale amount of the order, including refund/partial refund values after discount is applied, excluding Tax and Tip.*
  * **Total Tips** = total Tip (không tính order Cancel) — Tooltip: *Total tips received, not included in sales revenue but counted in collected amounts.*
  * **Total Payment** — Tooltip: *The final revenue includes Gift Card Redemption.*
  * **Filter:** Default Today; xem theo từng ngày được chọn.
* **Daily Sale Report detail:**
  * List Order Detail: Order # (orderCode); Sale (service sale/refund sau Discount); Tax; Tip; Total = Total Sale + Tip + Tax.
  * INCOME DETAIL: Sale; Tip; Tax Collected; **Total Payment = Sale + Tip + Tax Collected**.
  * PAYMENT DETAIL: Card; Cash; Others; **Amount Collected = Card + Cash + Others**; Gift Card Redemption; **TOTAL PAYMENT = Amount Collected + Gift Card Redemption**.

## **Income Summary**

* **Income Summary chart**
  * Filter: date range, xem theo Day/Week/Month. Default Day - Today. (Day: 1 day = 1 record; Week: theo week năm hiện tại, filter year 2026, năm quá khứ → tất cả week; Month: theo tháng năm hiện tại, năm quá khứ → đủ 12 tháng.)
  * **Total Income:** Total Net Income, compare với khoảng thời gian trước đó. Chart 3 thông số: **Gross Income** (Total amount of sales before refunds, không gồm tips, tax, gift card loads and activations); **Net Income** (sau refund/partial refund, không tính Tip, tax, order Cancel, sale giftcard); **Total Tip**.
  * Total Income table: Date; Sale; Tip; Tax; ~~Net Income~~; Total Payment (= Sale + Tip + Tax, includes Gift Card Redemption).
* **Income Summary detail**
  * PAYMENT DETAILS: Card (= Total Sale Card - Total Refund Card + Total tip by card + Total tax Card); Cash; Others; **Amount Collected = Card + Cash + Others**; Gift Card Redemption (Sale/Tip/Tax by gift card); **TOTAL PAYMENT = Amount Collected + Gift Card Redemption**.
  * SALE DETAILS: **Total Sale = Gift card Sale + Service Sale + Product Sale**; **Total Refund = Service Refund + Product Refund**; **Subtotal = Total Sale - Total Refund**; Discount = Discount - Discount Reversed; **Net Total = Subtotal - Discount**; Tip; Tax Collected; **TOTAL PAYMENT = Net Total + Tax + Tip**.
  * SUPPLY FEE: Total Supply Fee; Staff Supply Share = Total Supply Fee × 0.6; Salon Supply Share = Total Supply Fee - Staff Supply Share.
  * STAFF PAYOUT: Total Service = Service Sale - Service Refund; Staff Supply Share; **Staff Commission (60%) = (Total Service x 60%) - Staff Supply Share**; Tip; Clean up fee; **Staff Salary** (Salary by Period / Wage Per Hour / Wage Per Day, rule chốt kì lương); **TOTAL STAFF PAYOUT = Staff Commission (60%) + Tip - Clean up fee + Staff Salary** (Pay 1 = Staff Commission × 30% - Clean up fee; Pay 2 = Staff Commission × 70% + Tip). *Chưa chốt kì lương → lấy số lớn hơn (estimate); đã chốt → con số chính xác.*
  * SALON EARNINGS: Total Service; Salon Supply Share; **Salon Commission (40%) = (Total Service x 40%) - Salon Supply Share**; Product Sale; Product Refund; Total Discount; **Net Earnings = Salon Commission (40%) + Product Sale - Product Refund - Total Discount**; Staff Supply Share; Clean up fee; Staff Salary; **TOTAL EARNING = Net Earnings + Staff Supply Share (60%) + Clean up fee - Staff Salary**; Tax Collected.

## **Staff Income**

* Staff listing: Search (Staff Nickname); Filter (ngày xem report); Data table: Staff; Orders; Subtotal (= Sale - Refund); Supply Fee; Tip; Total Income.

1. **STAFF INCOME - Commission**: Staff Info; Order listing (Order#, Sale/Refund, Supply, Tip); Staff Income Detail: Sale; Refund; **Subtotal = Sale - Refund**; Supply Fee; **Staff Commission = (Subtotal - Supply fee) x 60%**; Clean Up Fee/Deduction; Tip; **TOTAL INCOME = Staff Commission - Clean up fee + Tip**.
2. **STAFF INCOME (1 day) - Salary / Commission + Salary** (Pay by Hour/Day/Period): Staff Info (Clock In/Out, Working Hours); Order listing; Staff Income Detail: Sale; Refund; **Subtotal**; Rate (Salary by Period / Wage Per Hour / Wage Per Day); Gross Income = [số ngày/giờ] × [rate]; Clean Up Fee/Deduction; Tip; **TOTAL INCOME = Gross Income - Clean Up Fee + Tip**.

**Lưu ý:** Salary by Period; Wage Per Hour (cần Checkin-Checkout); Wage Per Day (cần Checkin); Staff Income chỉ là report dự trù; Salary hoặc Commission + Salary → show cả 2 phần, Total Income show Salary (phụ thuộc Staff Days Off Setting).

## **Staff Payroll**

1. **STAFF PAYROLL - Commission**: Staff Info (Pay Period, Working Days); Order listing; Staff Income Detail: Sale; Refund; **Subtotal**; Supply Fee; **Staff Commission = (Subtotal - Supply fee) x 60%**; Clean Up Fee; Tip; **TOTAL INCOME = Staff Commission - Clean up fee + Tip** (Pay 1 / Pay 2).
2. **STAFF PAYROLL - Salary**: Staff Info; Working Days; Working Hours; **Salary Amount** (Salary by Period / Wage Per Day × Working Days / Wage Per Hour × Working Hour); Deduction/Clean up fee; Tip; **TOTAL INCOME = Salary Amount - Clean up fee + Tip** (Pay 1 / Pay 2).

**Lưu ý:** Commission + Salary → phụ thuộc Staff Days Off Setting; Tip cộng/trừ theo Exclude Tips From Cash/Check Income.

---

*Source: Google Docs — "Income Version 1" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
