---
title: Home (/home) — Chức năng quét Tiếng Việt (i18n scan)
source-linear: "offline: docs/linear/main-flow-onboard.md (Linear MCP chưa xác thực trong phiên này)"
scanned-at: 2026-07-06
scanned-by: playwright (TC-i18n-home-vietnamese-scan) trên app live http://localhost:1420
skill: linear-feature-spec (1/4)
---

# Home (`/home`) — Đặc tả chức năng quét Tiếng Việt

> File này là đầu ra **Skill 1/4** (`linear-feature-spec`) cho màn hình **Home**, tập trung
> vào **chức năng quét tiếng Việt** (i18n coverage scan). Nguồn: spec offline Linear +
> **quét màn hình thật** bằng Playwright trên app đang chạy (2026-07-06).

## 1. Mục tiêu & phạm vi

Chuyển app sang **Tiếng Việt**, đi hết các bề mặt (surface) của màn Home, và liệt kê **chính
xác chỗ nào còn hiển thị chữ tiếng Anh**. Phạm vi Home gồm: trang `/home`, các popup **không
cần đơn**, các dialog **cần đơn** (Ghi chú / Khuyến mãi / Gộp đơn / Đổi nhân viên / toast In),
và 3 **panel header** (Thông báo 🔔 / Chấm công / Thiết bị).

## 2. Các luồng chính (từ spec)

- Đổi ngôn ngữ **một lần** qua UI (`/settings/language` → "Tiếng Việt").
- App **không lưu ngôn ngữ qua reload** (bug đã biết) → điều hướng **client-side** bằng
  TanStack Router, **không** `page.goto` giữa chừng.
- Tạo **một đơn** (chọn nhân viên đầu + 1 dịch vụ) để mở nhóm dialog phụ thuộc đơn.

## 3. Thành phần UI thực tế (quét bằng Playwright, 2026-07-06)

Quét **10 surface**, **2 surface còn tiếng Anh**, **12 chuỗi** cần dịch.

| Surface | Vai trò | Trạng thái VN | Ghi chú |
|---------|---------|---------------|---------|
| `/home` (trang chính) | Header, sidebar đơn chờ, cột Staff/Khách/Dịch vụ, Order summary | ⚠️ **CÒN EN** | Rò rỉ `Quick Pay`, `Gift Card` |
| Popup **Bán thẻ quà tặng** (Gift Card) | Mở không cần đơn | ✅ VN | |
| Popup **Chọn nhân viên trước** (Quick Pay khi chưa chọn staff) | Cảnh báo | ✅ VN | |
| Popup **Tìm kiếm toàn cục** (Ctrl+K) | Search | ✅ VN | |
| Popup **Quét mã** (Scanner) | Camera | ✅ VN | thường không mở trong CI |
| Dialog **Ghi chú đơn** (Order Note) | Cần đơn | ✅ VN | |
| Dialog **Khuyến mãi & Thưởng** (Promo & Rewards) | Cần đơn | ✅ VN | |
| Dialog **Gộp đơn** (Merge Order) | Cần đơn | ✅ VN | |
| Panel **Chấm công** (Time Keeping) | Header | ✅ VN | |
| Panel **Thông báo** (chuông 🔔) | Header | ⚠️ **CÒN EN** | 10 dòng `... appointment on <date> has been confirmed.` |

### Chuỗi cần dịch (dedup 12)
1. `Quick Pay` · `Gift Card` — nút trên `/home`.
2. 10 dòng thông báo lịch hẹn dạng `"<Tên> appointment on <ngày giờ> has been confirmed."`
   (nội dung động trong panel chuông 🔔).

## 4. Nghiệp vụ & ràng buộc

- **Cổng localization:** mỗi surface còn tiếng Anh là một fail (soft). `I18N_LENIENT=1` → chỉ báo cáo.
- Timeout test: 180s. Passcode owner mặc định `8888` (auto khi bị hỏi).
- Đầu ra scan: `reports/i18n-audit/home-scan.{html,json}` + ảnh `home-screens/*.png` (chỉ surface FAIL).

## 5. Trạng thái / quyền / edge case

- Popup Scanner cần quyền camera → thường skip trong CI (best-effort, không fail).
- Nhóm dialog phụ thuộc đơn bị **skip an toàn** nếu không có staff/service để tạo đơn.
- Panel header: nút icon **không có accessible name** → click theo vị trí (hàng trên, phải→trái).

## 6. Đối chiếu spec ↔ UI thực tế

- **Khớp:** cấu trúc Home & danh mục popup trùng với `docs/i18n/home-translation-map.md`.
- **Lệch (lỗi dịch thật):** `Quick Pay`, `Gift Card` chưa qua `t()`; thông báo lịch hẹn
  hardcode tiếng Anh → cần đưa vào i18n.

## 7. Nguồn tham chiếu

- Spec quét: [docs/i18n/home-translation-map.md](../i18n/home-translation-map.md) ·
  [docs/i18n/vietnamese-scan-flow.md](../i18n/vietnamese-scan-flow.md)
- Test: [tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts](../../tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts)
- Helper: [src/utils/i18nHome.ts](../../src/utils/i18nHome.ts) · [src/utils/i18nScan.ts](../../src/utils/i18nScan.ts)
- Báo cáo scan: `reports/i18n-audit/home-scan.html`
