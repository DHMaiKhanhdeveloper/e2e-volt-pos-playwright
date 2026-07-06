---
title: Kết quả quét Tiếng Việt — Income Summary
screen: income-summary
route: /incomes/income-summary
scanned-at: 2026-07-06
source: compare.json + compare.html (TC-i18n-screen-compare, quét sau khi cuộn hết trang)
---

# Income Summary — Quét Tiếng Việt / UI vỡ / dịch đúng chuẩn

## Tổng quan

> **Chuỗi UI đối chiếu 23** · ❌ chưa dịch **1** · ⚠️ sai chuẩn **3** · 📐 UI vỡ **0** · ✅ thuật ngữ đúng **19** · (data bỏ qua: 8 · tổng pair 45)
> Quét **sau khi cuộn hết trang** + glossary bổ sung theo [VP-2252](https://linear.app/fastboy/issue/VP-2252). Ngoài ra deep-scan panel chi tiết bắt thêm **Pay 1 / Pay 2** còn tiếng Anh (xem §1).
> Report trực quan: `reports/income-summary/compare.html`

## 1. ❌ Chưa dịch (còn tiếng Anh)

| Chuỗi (EN)        | Đang hiển thị (VI)     | Nên dịch     | Ghi chú                                                                                                                                                                                                                    |
| ----------------- | ---------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tip`             | `Tip` (chưa qua `t()`) | **Tiền tip** | Nhãn "Tip" trong khu Total Income / bảng tổng. Cùng lỗi với income-daily (label cứng dùng chung).                                                                                                                          |
| `Pay 1` / `Pay 2` | `Pay 1` / `Pay 2`      | (cần dịch)   | [VP-2253](https://linear.app/fastboy/issue/VP-2253) — trong panel chi tiết mục **Tổng chi trả nhân viên** (Staff Payout). Chỉ hiện sau khi mở khối → deep-scan (`scanIncomesDetail` + `expandPanelSections`) mới bắt được. |

## 2. ⚠️ Dịch chưa đúng chuẩn

| Hiện tại (VI)   | Gốc (EN)       | Nên dùng (chuẩn)       | Issue                                                                         |
| --------------- | -------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `Thu nhập gộp`  | `Gross Income` | **Tổng thu nhập**      | [VP-2256](https://linear.app/fastboy/issue/VP-2256) — legend biểu đồ.         |
| `Thu nhập ròng` | `Net Income`   | **Thu nhập thực nhận** | [VP-2256](https://linear.app/fastboy/issue/VP-2256) — legend biểu đồ.         |
| `Bán hàng`      | `Sale`         | **Doanh thu**          | [VP-2259](https://linear.app/fastboy/issue/VP-2259) — "Sale" không nhất quán. |

> **Lưu ý phạm vi (còn sót — cần fix riêng):** compare chỉ phủ **view mặc định**. Hai lỗi sau nằm trong **panel chi tiết** (chỉ mount sau click 1 dòng) nên compare tự động **chưa** bắt — ghi nhận từ Linear:
>
> - [VP-2258](https://linear.app/fastboy/issue/VP-2258): `Net Total` → "Thực thu" gây nhầm ⇒ nên **"Doanh thu thuần"**.
> - (Glossary đã thêm các từ này nên khi mở rộng compare vào panel chi tiết sẽ tự bắt.)

## 3. 📐 Vỡ giao diện (chỉ báo cáo)

> Không phát hiện: `xOverflow = 0px`, `clipped = []`. Tabs Day/Week/Month + bảng vẫn khít với bản dịch VI.

## 4. ✅ Đã dịch đúng (mẫu)

| EN                            | VI                           |
| ----------------------------- | ---------------------------- |
| Income Summary                | Tổng hợp thu nhập            |
| Day                           | Ngày                         |
| Week                          | Tuần                         |
| Month                         | Tháng                        |
| Today                         | Hôm nay                      |
| Order History                 | Lịch sử đơn hàng             |
| Scanner                       | Quét mã                      |
| Internet connection restored. | Đã kết nối internet trở lại. |

## 5. Ghi chú / đề xuất bổ sung glossary

- "Tip" lẻ: fix chung với income-daily.
- Cần **deep-scan panel chi tiết** để đánh giá đủ (hiện mới phủ view mặc định) — nhiều thuật ngữ tài chính (Amount Collected, Net Total, Salon Earnings...) nằm trong panel.

## 6. Nguồn tham chiếu

- HTML: `reports/income-summary/compare.html`
- JSON: `reports/income-summary/compare.json`
- Glossary/registry: [src/utils/i18nCompare.ts](../../src/utils/i18nCompare.ts) (`SCREENS['income-summary']`, `gated:true`)
- Feature doc: [docs/features/income-summary.md](../features/income-summary.md)
