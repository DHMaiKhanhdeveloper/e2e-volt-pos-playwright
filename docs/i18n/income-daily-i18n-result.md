---
title: Kết quả quét Tiếng Việt — Daily Sale Report
screen: income-daily
route: /incomes/income-daily
scanned-at: 2026-07-06
source: compare.json + compare.html (TC-i18n-screen-compare, quét sau khi cuộn hết trang)
---

# Daily Sale Report — Quét Tiếng Việt / UI vỡ / dịch đúng chuẩn

## Tổng quan

> **Chuỗi UI đối chiếu 40** · ❌ chưa dịch **1** · ⚠️ sai chuẩn **3** · 📐 UI vỡ **0** · ✅ thuật ngữ đúng **36** · (data bỏ qua: 144 · tổng pair 241)
> Quét **sau khi cuộn hết trang** (`scrollThroughPage`) + đối chiếu glossary bổ sung theo [VP-2252](https://linear.app/fastboy/issue/VP-2252).
> Report trực quan: `reports/income-daily/compare.html`

## 1. ❌ Chưa dịch (còn tiếng Anh)

| Chuỗi (EN) | Đang hiển thị (VI)     | Nên dịch     | Ghi chú                                                                                                                       |
| ---------- | ---------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `Tip`      | `Tip` (chưa qua `t()`) | **Tiền tip** | Nhãn dòng trong panel **Income Details** (khác với card "Total tip" đã dịch = "Tổng tip"). Dev cần bọc `t()` cho label "Tip". |

## 2. ⚠️ Dịch chưa đúng chuẩn

| Hiện tại (VI)       | Gốc (EN) | Nên dùng (chuẩn) | Issue                                                                                                                                                                                                                    |
| ------------------- | -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Bán hàng` (×3 chỗ) | `Sale`   | **Doanh thu**    | [VP-2268](https://linear.app/fastboy/issue/VP-2268) / [VP-2259](https://linear.app/fastboy/issue/VP-2259) — "Sale" dịch không nhất quán: card + Chi tiết thu nhập dùng "Bán hàng" nhưng tiêu đề màn là "Doanh thu ngày". |

## 3. 📐 Vỡ giao diện (chỉ báo cáo)

> Không phát hiện: `xOverflow = 0px`, không có chuỗi bị cắt (`clipped = []`). Bản dịch VI dài hơn EN nhưng layout 2 cột vẫn chịu được.

## 4. ✅ Đã dịch đúng (mẫu)

| EN                                                              | VI                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| Daily Sale Report                                               | Doanh thu ngày                                         |
| Total Order                                                     | Tổng đơn                                               |
| Total number of order, excluding cancel/refunds/ manual refunds | Tổng số đơn, không gồm đơn huỷ/hoàn tiền/hoàn thủ công |
| vs Yesterday                                                    | so với hôm qua                                         |
| Today                                                           | Hôm nay                                                |
| Order History                                                   | Lịch sử đơn hàng                                       |
| Scanner                                                         | Quét mã                                                |
| Internet connection restored.                                   | Đã kết nối internet trở lại.                           |

## 5. Ghi chú / đề xuất bổ sung glossary

- Chuỗi lẻ **"Tip"** (đứng một mình) xuất hiện ở cả income-daily và income-summary — nhiều khả năng cùng một component panel dùng label cứng. Fix một chỗ có thể xử lý cả hai màn.
- Glossary hiện đã đủ cho màn này; không cần bổ sung.

## 6. Nguồn tham chiếu

- HTML: `reports/income-daily/compare.html`
- JSON: `reports/income-daily/compare.json`
- Glossary/registry: [src/utils/i18nCompare.ts](../../src/utils/i18nCompare.ts) (`SCREENS['income-daily']`, `gated:true`)
- Feature doc: [docs/features/income-daily.md](../features/income-daily.md)
