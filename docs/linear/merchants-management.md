---
title: Merchants Management
linearId: 1f382a86-58f9-4b3c-90f7-8f26c43650b3
url: https://linear.app/fastboy/document/merchants-management-2f21dec89944
team: VOLT
updatedAt: 2026-06-11T09:59:45.913Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# **Merchants Management**

Left Sidebar Menu (Navigation Panel): Provides quick access to various settings for the business.

* General Settings (Business-wide settings): Business Profile; POS Package; Payment & Transactions.
* Services & Products Management.
* Employee Management.

1. **General Settings Page (Main Area)**

* Click General Settings → General Settings Dashboard với các tab: Business Profile; POS Package; Payment & Transactions.

* **Business Profile:**
  * Business Name: Text field, unable to edit unless admin role.
  * Business Legal Name: Text field, unable to edit unless admin role.
  * Business Address (unable to edit unless admin role): Address; City; State (dropdown, searchable); Zip code (numeric); Country (dropdown, searchable).
  * Contact Owner Information: Phone Number; Email; Website URL.
  * Business Hours: Toggle Open/Close per day + time picker.
  * Logo Upload (.png/jpg, max 5MB).
  * Welcoming Sign Upload (hiển thị trên customer view screen; default nếu không upload; .png/jpg max 5MB).
  * Info message: "If you need to update business name, legal name or address, please contact Fastboy support at (832) 968 6668".
  * Contact CRM (View only): Phone, Business Phone, Email, Role, Name của mỗi contact (active và inactive, highlight active).
  * Buttons: Save / Cancel.

* **POS Package:**
  * Show 3 POS packages (GO POS BASIC / DELUXE / PREMIUM); click mỗi package hiển thị list main features. Luôn có 1 package được select cho merchant.
  * **Gán Package cho Merchant:** Mỗi merchant chỉ được gán 1 package tại 1 thời điểm. Package gán kèm: Package name (Basic/Deluxe/Premium); Effective date (ngày bắt đầu có hiệu lực). Trước effective date dùng package cũ; đến effective date hệ thống tự động áp dụng package mới. Không cho phép 2 package cùng active.
  * UI tham khảo: CURRENT PACKAGE (Package, Effective from, Status Active); SCHEDULE NEW PACKAGE (Package dropdown, Effective date, Save Changes).

* **Payment & Transactions:**
  * **Payment Methods** (checkbox): Credit Card; Cash; Gift Cards; Others.
  * **Tax Settings:** Tax (numeric % cho services/products); Tax Inclusive or Exclusive (radio); Tax Exemption (checkbox tax-exempt services/products).
  * **Tipping Setting:**
    * Tip Acceptance (radio YES/NO để bật "Ask for Tip"). Nếu YES hiển thị các section dưới.
    * When Ask for Tip & Signature (radio): Sign and leave a tip on the printed receipt; Sign and leave tip before payment; Tip before, sign after payment success.
    * Tip Options: Configure up to 4 default tip options; Show Tip In (radio % / $); 4 numeric input boxes; mỗi option có optional label. Default: 15% / 18% / 20% / 25%.
    * Tip Payment Method: Allow Tip By (checkbox: Card, Cash, Gift Card, Others...).
  * **Receipt Setting:**
    * Receipt Customize: Receipt Types (dropdown: Order, Gift Card, Gift Card Balance Check, Cancelled, Refund...); Receipt Content (checkbox list theo type, toggle info show on receipt).
    * Receipt Delivery Method (checkbox: Print paper receipt, Send e-receipt via email, Send e-receipt via phone number).
  * Buttons: Save (save changes but not push to devices); Cancel; Publish to all devices (chỉ enable khi có change, 2 options Now hoặc Schedule publish time).

---

*Source: Google Docs — "Merchants Management" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
