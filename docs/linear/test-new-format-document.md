---
title: Test new format Document
linearId: 5e0d8c9d-2944-48ff-92be-f3eef9c3a383
url: https://linear.app/fastboy/document/test-new-format-document-b5be492b1ec0
team: VOLT
updatedAt: 2026-06-24T09:27:34.839Z
---

# Income Version 2

> 📌 **Source of truth: Linear** (from 2026-06-11). PO edits the spec directly here. The original Google Docs version is frozen and kept only for historical reference.

## Overview

This spec covers **POS Income Version 2**, including:

* Card charge %
* Discount charge
* Income reporting
* Staff income and payroll reporting

## References

* Define specs: [spreadsheet](https://docs.google.com/spreadsheets/d/1NtBfxEsGjaijFWn7rlzR79sLzmeHTAjNqMDatAnY0wo/edit?gid=1736528834#gid=1736528834)
* Business Snapshot UI reference: [document](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit?pli=1&tab=t.wgdnihz0qr1u)
* Historical source: Google Docs "Income Version 2" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit)

## Goal

Make income-related reports easier to understand for both:

* **Business users**: clear numbers, labels, and payout logic
* **Developers**: explicit formulas, filters, and edge-case rules

## Shared rules and definitions

### Exclusions / inclusions

* **Canceled orders** are excluded unless noted otherwise.
* **Refund** and **partial refund** values are included where the formula explicitly says so.
* **Tip** and **Tax** are excluded from sales metrics unless explicitly included.
* **Gift card loads / activations** are **not** counted as POS income.
* **Gift card redemption** is included in payment totals where specified.

### Key definitions

* **Gross Income** = sales after discount, before refunds; excludes tip, tax, gift card loads, and gift card activations.
* **Net Income** = sales after discount and after refund / partial refund; excludes tip, tax, canceled orders, gift card loads, and gift card activations.
* **Amount Collected** = Card + Cash + Others
* **Total Payment** depends on the section:
  * In report summary views, it includes gift card redemption where stated.
  * In detailed formulas, use the exact formula written in that section.

---

## 1) Daily Sale Report

### 1.1 Daily Sale Report chart

#### Metrics

* **Orders**
  * Tooltip: *Total number of orders, excluding canceled, refunded, and manual refund orders.*
* **Sale**
  * Definition: total sale / refund / partial refund amount after discount.
  * Excludes Tip, Tax, and canceled orders.
  * Applies across Card / Cash / Other / Gift Card orders.
  * Tooltip: *Total sale amount of the order, including refund / partial refund values after discount is applied, excluding Tax and Tip.*
* **Total Tips**
  * Definition: total Tip, excluding canceled orders.
  * Tooltip: *Total tips received, not included in sales revenue but counted in collected amounts.*
* **Total Payment**
  * Tooltip: *The final revenue includes Gift Card Redemption.*

#### Filter

* Default: **Today**
* User can view any selected day.

### 1.2 Daily Sale Report detail

#### Order list columns

* Order #: `orderCode`
* Sale: total service sale / refund amount on the order after discount
* Tax: order tax
* Tip: total tip on the order
* Total = Sale + Tip + Tax

### 1.3 Income detail

* Sale = total Sale / Refund amount after discount
* Tip = total tip
* Tax Collected = total tax
* **Total Payment = Sale + Tip + Tax Collected**

### 1.4 Payment detail

* Card = Total Sale Card - Total Refund Card
* Cash = Total Sale Cash - Total Refund Cash
* Others = Total Sale Others - Total Refund Others
* **Amount Collected = Card + Cash + Others**
* Gift Card Redemption = total gift card redemption
* **Total Payment = Amount Collected + Gift Card Redemption**

---

## 2) Income Summary

### 2.1 Income Summary chart

#### Filters

* User can filter by **date range** and group data by **Day / Week / Month**.
* Default: **Day - Today**

#### Grouping behavior

* **Day**
  * Show one record per day in the selected date range.
* **Week**
  * Show one record per week.
  * For the current year, show up to the current week only.
  * Example filter year: `2026`
  * If the selected year is in the past (for example `2025`), show all weeks of that year.
* **Month**
  * Show one record per month.
  * For the current year, show up to the current month only.
  * If the selected year is in the past, show all 12 months.

### 2.2 Total Income section

* **Total Income** = Total Net Income for the selected period
* Always compare it with the previous equivalent period.

#### Chart metrics

* **Gross Income**
  * Total amount of sales after discount and before refunds.
  * Excludes tips, tax, gift card loads, and gift card activations.
  * Note: gift card loads are money added to a gift card and must not be included in POS income reports.
* **Net Income**
  * Total sale amount after discount and after refund / partial refund.
  * Excludes Tip, Tax, canceled orders, gift card loads, and gift card activations.
* **Total Tip**

### 2.3 Total Income table

Columns:

* Date
* Sale
  * Total sale / refund / partial refund after discount
  * Excludes Tip, Tax, and canceled orders
  * Includes all orders in that reporting day
* Tip
* Tax
* Total Payment = Sale + Tip + Tax
  * Includes Gift Card Redemption

### 2.4 Income Summary detail

#### A. Payment details

* **Card** = Total Sale Card - Total Refund Card + Total Tip by Card + Total Tax by Card
  * Sale: Total Sale Card
  * Refund: Total Refund Card
  * Tip: Total Tip by Card
  * Tax: Total Tax by Card
* **Cash** = Total Sale Cash - Total Refund Cash + Total Tip by Cash + Total Tax by Cash
  * Sale: Total Sale Cash
  * Refund: Total Refund Cash
  * Tip: Total Tip by Cash
  * Tax: Total Tax by Cash
* **Others** = Total Sale Others - Total Refund Others + Total Tip by Others + Total Tax by Others
  * Sale: Total Sale Others
  * Refund: Total Refund Others
  * Tip: Total Tip by Others
  * Tax: Total Tax by Others
* **Amount Collected = Card + Cash + Others**
* **Gift Card Redemption** = payments covered by previously sold gift cards
  * Sale: Total Sale by Gift Card
  * Tip: Total Tip by Gift Card
  * Tax: Total Tax by Gift Card
* **Total Payment = Amount Collected + Gift Card Redemption**

#### B. Sale details

* **Total Sale = Gift Card Sale + Service Sale + Product Sale**
  * Service Sale = total service sales
  * Product Sale = total product sales
  * Gift Card Sale = total gift card sale amount (Add Fund when creating an order)
* **Total Refund = Service Refund + Product Refund**
  * Service Refund
  * Product Refund
* **Subtotal = Total Sale - Total Refund**
* **Discount = Discount - Discount Reversed**
  * Discount = all discounts, including promotions, service discounts, loyalty rewards
  * Discount Reversed = discount amount taken back due to refund
* **Net Total = Subtotal - Discount**
* Tip = total tip across all payment methods
* Tax Collected = total tax across all payment methods
* **Total Payment = Net Total + Tax + Tip**

#### C. Supply fee

* **Total Supply Fee** = total supply fee for services, based on each service's configured supply fee
* **Staff Supply Share = Total Supply Fee × 0.6**
  * This is the portion shared with staff, based on Staff Commission Setting for service
  * Example: Staff 60% / Owner 40%
* **Salon Supply Share = Total Supply Fee - Staff Supply Share**
  * This is the owner's portion

#### D. Staff payout

* **Total Service = Service Sale - Service Refund**
* Staff Supply Share (including sale and refund)
* **Staff Commission (60%) = (Total Service × 60%) - Staff Supply Share**
  * Based on each staff's Commission Setting for service
  * If the staff is Salary-only, this value is `0`
* Tip = total tip
* Clean Up Fee = configured deduction per day × number of worked days in the report range
* Staff Discount Charge = total promotion amount shared by staff
* Staff Card Charge - Commission = total deduction based on card fee setting on Staff Commission
* Staff Card Charge - Tip = total deduction based on card fee setting on Credit Card Tip

##### Staff Salary rules

Staff Salary is accumulated for all Salary-based staff in the selected reporting range.

* **Salary by Period**
  * Convert the salary amount into a per-day rate for the payroll period.
  * Example:
    * Pay Period = 1 week
    * Salary by Period = `$7000`
    * Viewing report for 3 days
    * Rate = `$1000`
    * **Staff Salary = $1000 × 3 = $3000**
* **Wage Per Hour**
  * **Staff Salary = hourly wage × working hours**
* **Wage Per Day**
  * **Staff Salary = daily wage × working days**

##### Salary vs Commission + Salary display rule

If a staff member is configured with **Commission + Salary**:

* If the payroll period is **not finalized**, show the **larger** value in the report.
* If the payroll period is **finalized**, show the **actual selected payout method** used in payroll.

##### Staff payout formula

* **Total Staff Payout = Staff Commission + Tip + Salary - Supply Fee - Clean Up Fee - Discount Charge - Staff Card Charge Commission - Staff Card Charge Tip**

Breakdown:

* **Pay 1 = ((Staff Salary + (Staff Commission - Supply Fee)) × 30%) - Clean Up Fee - Discount Charge - Staff Card Charge Commission - Staff Card Charge Tip**
* **Pay 2 = ((Staff Salary + Staff Commission) × 70%) + Tip**

Note:

* The 30% / 70% split is based on each staff's **Pay 1 - Pay 2 Split** setting.

#### E. Salon earnings

* **Total Service = Service Sale - Service Refund**
* Salon Supply Share (including sale and refund)
* **Salon Commission (40%) = (Total Service × 40%) - Salon Supply Share**

Rule for staff with **Commission + Salary**:

* If payroll is not finalized, use the larger amount when calculating this report.
* If payroll is finalized, use the actual selected payout method.

Other fields:

* Product Sale
* Product Refund
* **Total Discount = Discount - Discount Reversed**
  * Discount
  * Discount Reversed
* **Net Earnings = Salon Commission (40%) + Product Sale - Product Refund - Total Discount**
* Staff Supply Share
* Clean Up Fee
* Staff Discount Charge = total promotion amount shared by staff
* Staff Card Charge - Commission = total deduction based on card fee setting on Staff Commission
* Staff Card Charge - Tip = total deduction based on card fee setting on Credit Card Tip

##### Staff Salary rules in salon earnings

* **Salary by Period**
  * Convert salary by period into daily rate, then multiply by number of viewed days
* **Wage Per Hour**
  * Daily salary contribution is based on worked hours
* **Wage Per Day**
  * Daily salary contribution is based on worked days

If staff uses **Commission + Salary**:

* If payroll is not finalized, use the larger number in the report.
* If payroll is finalized, use the actual selected payroll value.

##### Salon earnings formula

* **Total Earning = Net Earnings + Staff Supply Share + Clean Up Fee + Staff Discount Charge - Staff Salary + Staff Card Charge Commission + Staff Card Charge Tip**

Business note:

* Supply fee is already a cost paid by the owner, so final salon earnings should include the portions shared back to the owner through supply fee, promotions, and card-fee-based deductions.
* Tax Collected = total tax

---

## 3) Staff Income

### 3.1 Staff listing

#### Filters

* Search by **Staff Nickname**
* Filter by report date

#### Table columns

* Staff
* Orders
* Subtotal = Sale - Refund
* Supply Fee
* Tip
* Total Income

### 3.2 Staff Income detail

Staff Income detail is shown per staff and depends on that staff's compensation setup.

### Case 1: Staff Income - Commission

#### Staff info

* Staff Name = Nickname
* Date
  * Single day example: `04/15/2025`
  * Date range example: `04/15/2025 - 04/30/2025`
* No. of working days example: `8 days`

#### Order listing

* Order#
* Sale / Refund = total sale / refund amount on the order
* Supply = total supply across all services in the order
* Tip = total tip on the order

#### Staff Income detail

* Sale = total SALE amount
* Refund = total REFUND amount
* **Subtotal = Sale - Refund**
* Supply Fee (including sale and refund)
* **Staff Commission = (Subtotal - Supply Fee) × 60%**
* Discount Charge = total promotion amount shared by staff
* Card Charge - Commission = total deduction based on Staff Compensation > On Staff Commission
* Card Charge - Tip = total deduction based on Staff Compensation > On Credit Card Tip
* Clean Up Fee / Deduction = configured staff deduction × report days
* Tip = total tip
* **Total Income = Staff Commission - Clean Up Fee + Tip - Card Charge Commission - Card Charge Tip - Discount Charge**

Breakdown:

* **Pay 1 = (Staff Commission × 30%) - Clean Up Fee - Card Charge Commission - Card Charge Tip - Discount Charge**
* **Pay 2 = (Staff Commission × 70%) + Tip**

### Case 2: Staff Income (1 day) - Salary / Commission + Salary

#### Applies to pay by Hour / Day / Period

#### Staff info

* Staff Name = Nickname
* Date = `04/15/2025`
* Clock In = `9:00:00 AM`
* Clock Out = `5:00:00 PM`
* Working Hours = `8`

#### Order listing

* Order#
* Sale / Refund = total sale / refund amount on the order
* Tip = total tip on the order

#### Staff Income detail

* Sale = total SALE amount
* Refund = total REFUND amount
* **Subtotal = Sale - Refund**
* **Rate** = value configured in Staff Compensation > Salary
  * **Salary by Period**
    * Convert payroll-period salary into daily rate when the viewed report covers fewer days than the full period
    * Example:
      * Pay Period = 1 week
      * Salary by Period = `$7000`
      * Viewing report for 3 days
      * Rate = `$1000`
      * Gross Income = `$1000 × 3 = $3000`
  * **Wage Per Hour** = hourly salary rate
  * **Wage Per Day** = daily salary rate
* **Gross Income = worked days / hours × rate**
* Clean Up Fee / Deduction = configured staff deduction × report days
* Tip = total tip
* **Total Income = Gross Income - Clean Up Fee + Tip**

Notes:

* Salary by Period = paid by payroll period
* Wage Per Hour = requires check-in / check-out to count working hours
* Wage Per Day = requires check-in to count working days
* For Salary by Period, Clean Up Fee is based on the paid days in that payroll period
* Staff Income is an estimated report. The final correct value is determined in Payroll when the payroll period is finalized.

#### Clock In / Clock Out display rules

* If viewing **1 day** and there is only **1 check-in shift**, show exact Clock In / Clock Out
* If viewing a **date range**:
  * Leave Clock In / Clock Out blank
  * For Wage Per Hour: show total Working Hours
  * For Wage Per Day: show total Working Days
  * For Salary by Period: always leave Clock In / Clock Out blank and show total Working Days

#### Important display rule for Salary or Commission + Salary staff

If a staff member is configured with **Salary** or **Commission + Salary**:

* Always show both **Commission** and **Salary** sections in Staff Income
* But **Total Income** should display the **Salary** side
* Final determination still depends on **Staff Days Off Setting**

---

## 4) Staff Payroll

Staff Payroll detail is shown per staff and depends on compensation type.

### 4.1 Staff Payroll - Commission

#### Staff info

* Staff Name = Nickname
* Pay Period = `04/15/2025 - 04/30/2025`
* Working Days = `8 days`

#### Order listing

Columns:

* Date
* Sale = total sale amount for the day
* Refund = total refund amount for the day (negative)
* Supply = total supply across all services for the day
* Tip = total tip across all orders for the day

#### Staff Payroll detail

* Sale = total Sale
* Refund = total Refund
* **Subtotal = Sale - Refund**
* Supply Fee (including sale and refund) = total Supply
* **Staff Commission = (Subtotal - Supply Fee) × 60%**
* Discount Charge = total promotion amount shared by staff
* Card Charge - Commission = total deduction based on card fee setting on Staff Commission
* Card Charge - Tip = total deduction based on card fee setting on Credit Card Tip
* Clean Up Fee = configured deduction fee × payroll days
* Tip = total Tip
* **Total Income = Staff Commission - Clean Up Fee + Tip - Card Charge Commission - Card Charge Tip - Discount Charge**

Breakdown:

* **Pay 1 = (Staff Commission × 30%) - Clean Up Fee - Card Charge Commission - Card Charge Tip - Discount Charge**
* **Pay 2 = (Staff Commission × 70%) + Tip**

Note:

* The 30% split is based on each staff's **Pay 1 - Pay 2 Split** setting.

### 4.2 Staff Payroll - Salary

#### Staff info

* Staff Name = Nickname
* Pay Period = `04/15/2025 - 04/30/2025`

#### Staff Payroll detail

* Working Days = total worked days
* Working Hours = total worked hours
* **Salary Amount = total salary to pay**
  * **Salary by Period**: use the configured amount in Employee Compensation > Salary by Period
  * **Wage Per Day**: Salary Amount = configured Wage Per Day × Working Days
  * **Wage Per Hour**: Salary Amount = configured Wage Per Hour × Working Hours
* Deduction / Clean Up Fee = configured staff deduction × payroll days
* Tip = total Tip
* **Total Income = Salary Amount - Clean Up Fee + Tip**

Breakdown:

* **Pay 1 = (Salary × 30%) - Clean Up Fee**
* **Pay 2 = (Salary × 70%) + Tip**

Note:

* The salary split uses each staff's **Pay 1 - Pay 2 Split** setting.

#### Payroll notes

* If staff is configured as **Commission + Salary**, the final result depends on **Staff Days Off Setting**.
* Tip may be added or excluded depending on the **Exclude Tips From Cash/Check Income** setting.

---

## 5) Promotion Cost Sharing

### 5.1 General rule

The merchant can configure how Promotion cost is shared between:

* **Owner**
* **Staff**

### 5.2 Allocation rule

The Promotion amount assigned to Staff is distributed across all staff who participated in the order, based on each staff member's service value contribution.

This allocation is **independent of current compensation type**.

### 5.3 Impact on Income / Payroll

#### Staff with compensation that includes Commission

Includes:

* Commission
* Salary + Commission

For these staff, the allocated Promotion amount reduces Income / Commission based on the report rules.

#### Staff with Salary only

For Salary-only staff:

* Promotion is still allocated for order-level distribution purposes
* But it **does not reduce staff Income or Payroll**
* That Promotion portion becomes an **Owner cost** instead

---

## 6) Multi-pay-period descriptions in report UI

When the user views a report spanning multiple payroll periods, the UI should show the effective settings for each period.

### 6.1 Staff Income Report

#### For staff configured as Commission

* **Staff Commission**
  * Commission Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
  * Commission Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
* **Total Income**
  * Pay 1
    * Pay 1 Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
    * Pay 1 Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
  * Pay 2
    * Pay 2 Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
    * Pay 2 Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`

#### For staff configured as Salary or Commission + Salary

* **Rate**
  * Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
  * Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
* **Total Income**
  * Pay 1
    * Pay 1 Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
    * Pay 1 Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
  * Pay 2
    * Pay 2 Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`
    * Pay 2 Rate (`mm/dd/yyyy - mm/dd/yyyy`): `x%`

---

## 7) Implementation notes for developers

### 7.1 Where formulas differ

Use the formulas exactly as defined in each section. Some labels repeat across reports but have different composition rules. For example:

* **Daily Sale Report > Payment Detail > Card** excludes tip and tax
* **Income Summary > Payment Details > Card** includes tip and tax

Do not normalize these unless the product requirement changes.

### 7.2 Reporting state vs payroll finalization

Several report values are **estimates before payroll finalization** and must become **final values after payroll is finalized**.

This especially affects staff configured with:

* Commission + Salary
* Salary by Period

### 7.3 Data dependencies

Some values require additional source data:

* **Wage Per Hour** requires check-in / check-out to calculate working hours
* **Wage Per Day** requires check-in presence to calculate working days
* **Salary by Period** requires payroll period boundaries to derive daily rate
* **Promotion sharing** requires service-level contribution by staff on each order

### 7.4 Recommended QA focus

Validate these edge cases carefully:

* canceled orders
* refund and partial refund behavior
* discount reversed on refund
* gift card sale vs gift card redemption
* staff with Salary-only vs Commission vs Commission + Salary
* payroll not finalized vs finalized
* multi-pay-period reports
* tip inclusion / exclusion rules for cash or check income
* promotion allocation across mixed compensation types
