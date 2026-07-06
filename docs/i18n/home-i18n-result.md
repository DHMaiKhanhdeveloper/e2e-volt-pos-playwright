---
title: Kết quả quét Tiếng Việt — Trang Home
screen: home
route: /home
scanned-at: 2026-07-05
source: compare-home.json (TC-i18n-screen-compare) + auto-scan (deep Home)
---

# Trang Home (`/home`) — Quét Tiếng Việt / UI vỡ / dịch đúng chuẩn

> Sinh bởi skill [`i18n-vietnamese-scan`](../../.claude/skills/i18n-vietnamese-scan/SKILL.md).
> Cơ chế: quét **1 lần tiếng Anh + 1 lần Tiếng Việt**, ghép theo đường dẫn DOM, đối chiếu
> **glossary POS** ([`src/utils/i18nCompare.ts`](../../src/utils/i18nCompare.ts)). Dữ liệu (tên
> dịch vụ/nhân viên/đơn) đã được lọc bỏ nên không tính là lỗi dịch.

## Tổng quan

> ❌ chưa dịch **3** · ⚠️ sai chuẩn **0** · ✅ thuật ngữ đúng chuẩn **7** · 📐 UI vỡ thật **0**

## 1. ❌ Chưa dịch (còn tiếng Anh)

| Chuỗi (EN) | Đang hiển thị (VI) | Nên dịch sang        | Ghi chú                                                                                                |
| ---------- | ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------ |
| Quick Pay  | Quick Pay          | **Thanh toán nhanh** | Nút cột dịch vụ — chưa qua `t()`. Đối chiếu: "Quick Checkout" cạnh đó đã dịch đúng "Thanh toán nhanh". |
| Gift Card  | Gift Card          | **Thẻ quà tặng**     | Nút mở dialog Bán thẻ quà tặng.                                                                        |
| Unknown    | Unknown            | _(tuỳ ngữ cảnh)_     | Rò rỉ giá trị trong thẻ đơn (Merge Order) — nên fallback "Không rõ" hoặc ẩn. Không phải nhãn cố định.  |

## 2. ⚠️ Dịch chưa đúng chuẩn

> Không có — mọi thuật ngữ đã dịch đều khớp glossary.

## 3. ✅ Đã dịch đúng chuẩn (7)

| Gốc (EN)       | Tiếng Việt       |
| -------------- | ---------------- |
| Pending Orders | Đơn đang chờ     |
| Order History  | Lịch sử đơn hàng |
| Appointment    | Lịch hẹn         |
| Scanner        | Quét mã          |
| Quick Checkout | Thanh toán nhanh |
| Done           | Hoàn tất         |
| Show           | Hiện             |

## 4. 📐 Vỡ giao diện (chỉ báo cáo)

- **Tràn ngang toàn màn:** `0px` → không vỡ layout.
- **Cắt chữ (ellipsis):** 19 chỗ — NHƯNG tất cả là **tên dịch vụ/mã đơn** (`OD260706-…`, "MANICURE & PEDICURE",
  "Signature pedicure ( callus removed)"…), tức **cắt có chủ đích** trong thẻ dịch vụ, **không phải lỗi layout**.
- ✅ Không phát hiện nhãn UI (nút/label) bị cắt do tiếng Việt dài hơn.

## 5. Tính năng "Tìm kiếm" (đã bổ sung quét)

Trigger cũ tìm theo `button` nên **bỏ sót** ô Search (là **textbox**). Đã sửa trong
[`i18nHome.ts`](../../src/utils/i18nHome.ts): mở bằng `role=textbox` → CSS searchbox → Ctrl+K → button.
Cần kiểm lại: 4 tab **All / Appointment / Customer / Order** trong popup tìm kiếm thường **còn tiếng Anh**.

## 6. Ghi chú / đề xuất

- `Unknown` (và "Processing"/"N/A" ở thẻ Merge Order) là **giá trị fallback** — nên xử lý ở tầng dữ liệu, không phải key i18n.
- Popup sâu của Home (Quick Pay, Sell Gift Card, Promo & Rewards, Order Note, 3 panel header…) được phủ bởi
  [`i18nHome.ts`](../../src/utils/i18nHome.ts) trong lần quét đầy đủ `TC-i18n-vietnamese-scan` — xem [`home-translation-map.md`](home-translation-map.md).
- Chưa có thuật ngữ mới cần thêm vào `GLOSSARY`.
