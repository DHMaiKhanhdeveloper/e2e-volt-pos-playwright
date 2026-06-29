---
title: 📚 VOLT Docs Index
linearId: 84bc0457-7150-4da7-b702-0eafe37a3562
url: https://linear.app/fastboy/document/volt-docs-index-cb9e6b837376
team: VOLT
updatedAt: 2026-06-18T03:39:49.613Z
---

> Cập nhật **2026-06-11**. Source of truth: **Linear** — PO viết doc mới trực tiếp tại đây. Google Docs "Volt Pos Documents" đã freeze.

## Quy ước

* **Spec library** (spec sản phẩm theo màn hình / tính năng) → document **team-level**, tên trần: `<Tên màn hình/tính năng>`.
* **Working docs** (R&D, guide, test cases, impl log của feature đang làm) → gắn vào project **V-Features** (hoặc issue VP-x), tên theo pattern `<Feature> — <Type>`.
* Spec bị thay thế → đổi tên bản cũ thành `… (legacy)` + note đầu doc trỏ sang bản mới.
* Doc mới tạo → thêm dòng vào index này.
* **Release notes / changelog** → living doc *📋 VOLT POS — Release Notes* (team-level); prepend 1 section cho mỗi version mới (newest on top).

## Release notes & changelog

* [📋 VOLT POS — Release Notes](./volt-pos-release-notes.md) — living changelog, newest version on top (current: **v1.0.31**, 2026-06-18).

## Spec library — team-level (42)

* [[DEMO] QR Payment - Spec & Requirements](./demo-qr-payment-spec-and-requirements.md)
* [[POS] Promotion Split Between Owner & Staff](./pos-promotion-split-between-owner-and-staff.md)
* [Admin Site](./admin-site.md)
* [Batch History](./batch-history.md)
* [Batches](./batches.md)
* [Book Appointment from POS](./book-appointment-from-pos.md)
* [Business Snapshot](./business-snapshot.md)
* [Cashback](./cashback.md)
* [Count Days Off](./count-days-off.md)
* [Customer Management](./customer-management.md)
* [Device Management](./device-management.md)
* [Device Pending](./device-pending.md)
* [Gift Card Management](./gift-card-management.md)
* [Income Report](./income-report.md)
* [Income Version 1 (legacy)](./income-version-1-legacy.md)
* [Income Version 2](./income-version-2.md)
* [Language Setting](./language-setting.md)
* [Login flow](./login-flow.md)
* [Main Flow Onboard](./main-flow-onboard.md)
* [Merchant Overview](./merchant-overview.md)
* [Merchants Management](./merchants-management.md)
* [Order Flow](./order-flow.md)
* [Order Management](./order-management.md)
* [Order Pending](./order-pending.md)
* [Package Management](./package-management.md)
* [Payroll](./payroll.md)
* [Portal Access Control & Authorization](./portal-access-control-and-authorization.md)
* [Portal Order History](./portal-order-history.md)
* [Promotion Management](./promotion-management.md)
* [Recalculate Report](./recalculate-report.md)
* [Sell Gift Card](./sell-gift-card.md)
* [Service Fee](./service-fee.md)
* [Services Management](./services-management.md)
* [Settings](./settings.md)
* [Shortcuts](./shortcuts.md)
* [Split Order](./split-order.md)
* [Staff Management](./staff-management.md)
* [Staff Rating](./staff-rating.md)
* [System Management](./system-management.md)
* [Time Keeping](./time-keeping.md)
* [Turn Suggestion](https://linear.app/fastboy/document/turn-suggestion-92372b816566) (không thuộc danh sách 48 đã tải)
* [Version Management](./version-management.md)

## Working docs — V-Features (7)

* [Merge Order — Guide (sử dụng & dev)](https://linear.app/fastboy/document/merge-order-guide-su-dung-and-dev-7fba25972140)
* [Merge Order — R&D (GoPOS parity)](https://linear.app/fastboy/document/merge-order-randd-gopos-parity-6c73fd58ec87)
* [Staff Rating — R&D (GoPOS parity)](https://linear.app/fastboy/document/staff-rating-randd-gopos-parity-e6138a845751)
* [Turn — Guide (người mới)](https://linear.app/fastboy/document/turn-guide-nguoi-moi-2302a9daa4bb)
* [Turn — Impl log (FE volt-pos)](https://linear.app/fastboy/document/turn-impl-log-fe-volt-pos-d01b55831466)
* [Turn — Spec (verified từ GoPOS)](https://linear.app/fastboy/document/turn-spec-verified-tu-gopos-664f8037a1c0)
* [Turn — Test cases](https://linear.app/fastboy/document/turn-test-cases-02d800121ca7)

> Ghi chú: 48 document team-level đã được tải về thư mục này. Các "Working docs" gắn với project V-Features không nằm trong danh sách list_documents team-level nên chỉ để link.
