---
title: 📋 VOLT POS — Release Notes
linearId: 989ed4ee-c4b9-4a58-a7a1-788715f3c1b8
url: https://linear.app/fastboy/document/volt-pos-release-notes-10de31de66dd
team: VOLT
updatedAt: 2026-06-18T05:22:25.440Z
---

📌 Source of truth: Linear

Living changelog for VOLT POS — newest release on top. End-user-facing notes; internal back-end/refactor items are listed separately for traceability only.

---

# v1.0.31

**Release date:** June 18, 2026

This release adds check management and payroll-check printing, expands customer tools, and delivers a large accuracy fix across the Income/Reports suite. *(Issue references in parentheses for internal traceability.)*

## 🚀 New Features

**Split Order & Check Management** (VP-206)

* Split a single order into multiple checks, either **By Amount** or **Equally**.
* **Merge Checks** and merge in-progress orders at checkout (VP-1708, VP-1784).

**Print Check — Portal** (VP-1435, VP-1625)

* **Bank Account Management** for paycheck printing (VP-1751).
* **Check List** with Add Staff and Signature support (VP-1752).
* **Check Detail** view (VP-1753).

**Edit Customer — Portal** (VP-1785, VP-1624) — edit customer details directly from the Portal.

**Customer Search by Name or Email** (VP-1235, VP-1755) — find existing customers by name or email on the Create Order screen.

**Staff Payroll — Salary Type** (VP-1341) — payroll now supports salary-type staff in addition to commission.

**Appointment Tags on Check-in** (VP-1775, VP-1783) — check-in records linked to an appointment now display the appointment tag; improved tag display on order cards (VP-1823).

**Sync with Business Hours** (VP-1170, VP-1756) — new button in Employee Settings → Work Hours to sync an employee's hours to the business hours.

## ✨ Improvements

* **Appointment page UI** — wider, clearer appointment cards (VP-1895); cleaner overall layout (VP-1284, VP-1616).
* **Order History** — display card brand + last 4 digits and a quick date filter (VP-1856); show order *create* time (VP-1826); hide the Refund button on $0 orders (VP-1811).
* **Merchant Overview** — added metric descriptions to summary cards (VP-1799).
* **Order Detail / Payment Detail** — improved layout and added payment info (VP-1371, VP-1372).
* **Staff income commission rate** enhancement (VP-1889).
* **Inactive staff** — defined behavior when tapping inactive-staff notifications; checkout from an appointment with a pending order now opens that order (VP-1244, VP-1325).

## 🐛 Bug Fixes

**Income & Reports accuracy** (VP-1711)

* Gross Income now correctly subtracts discounts (VP-1805).
* Total Staff Payout now includes Staff Salary and uses the correct Clean Up Fee (VP-1713).
* Staff/Salon Supply Share now splits correctly by commission % and no longer rounds inconsistently (VP-1712, VP-1714, VP-1798, VP-1861, VP-1868).
* Tip totals now match between Income Summary blocks (VP-1874).
* Staff Income detail panel now shows the selected staff (VP-1884).
* Date-range filter no longer drops current-day (End Date) orders (VP-1810); $0 refund orders now appear in the detail list (VP-1808).
* Orders created today now appear in Daily Sale Report, Income Summary & Staff Income (VP-1725).
* **Receipt printing** — correct "Sale Details" heading (VP-1832); refund minus sign restored in Sale/Refund & Supply columns (VP-1813); tax note line no longer wraps/misaligns (VP-1812).
* Daily Sale Report date picker redesigned (VP-1687, VP-1631).

**Split Order**

* Cash Drawer button now works and only appears for Cash payments (VP-1932).
* "By Amount" split totals now match the order total — no missing money (VP-1919); "Equally" totals corrected (VP-1891).
* Fixed $0.01 orders being splittable and $0.00 checks being unpayable (VP-1867); added scrollbar to the check list (VP-1864).

**Appointments**

* Staff work hours now show on Fridays when enabled (VP-1839).
* Calendar shows day numbers and allows selecting future dates (VP-1837, VP-1838).
* Correct layout for bookings that cross midnight (VP-1758).

**Payroll & Pay Periods**

* Weekly pay period now uses the correct date range (VP-1842) and periods display in the correct order (VP-1841).
* Total Payment by Hour calculation corrected (VP-1827).
* Tips are no longer added to pay when "Exclude Tips From Cash/Check Income" is enabled (VP-1791).

**Customer**

* Customer page now refreshes when switching merchants on the Portal (VP-1899).
* Search by email now works on Create Order (VP-1894); fixed result rows overlapping with long names (VP-1893).

**Other**

* Inactive staff: canceling the change-staff prompt no longer creates an order for an inactive staff (VP-1769); removed quotes around staff names in notifications (VP-1768).
* Corrected time-tracking modal titles (VP-1779, VP-1562).
* Gift card history now shows top-ups in the correct order after offline sync (VP-1549).
* Tip Settings no longer allows a $0.00 / 0% option (VP-1745).
* "Do not require passcode" checkbox can now be checked (VP-1722).
* Card Charge Fee fix (VP-1871).
* Pending Orders now show the date (not just the time) when filtering across multiple days (VP-1728).

---

*Internal-only (not user-visible) — for traceability:* VP-1726, VP-1618, VP-1764, VP-1693, VP-1836, VP-1792, VP-1851, VP-1814, VP-1875, VP-1209, VP-1820, VP-1821, VP-1822, VP-1877, VP-778, VP-1869, VP-1705, VP-963, VP-734, VP-1548, VP-1740, VP-1767, VP-1627, VP-1744, VP-1634, VP-1892.
