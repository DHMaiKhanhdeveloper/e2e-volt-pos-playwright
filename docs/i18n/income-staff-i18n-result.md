---
title: Kết quả quét Tiếng Việt — Staff Income
screen: income-staff
route: /incomes/income-staff
scanned-at: 2026-07-06
source: compare.json + compare.html (TC-i18n-screen-compare, quét sau khi cuộn hết trang)
---

# Staff Income — Quét Tiếng Việt / UI vỡ / dịch đúng chuẩn

## Tổng quan

> **Chuỗi UI đối chiếu 23** · ❌ chưa dịch **1** · ⚠️ sai chuẩn **0** · 📐 UI vỡ **0** · ✅ thuật ngữ đúng **22** · (data bỏ qua: 67 · tổng pair 110)
> ⚠️ **Phát hiện mới:** quét **sau khi cuộn hết trang** + bảng có data staff → lộ cột **`Tip`** chưa dịch (trước đây quét trên empty-state nên báo 0). ✅ 18 ⇒ 22 do phủ thêm bảng staff.
> Report trực quan: `reports/income-staff/compare.html`

## 1. ❌ Chưa dịch (còn tiếng Anh)

| Chuỗi (EN)        | Đang hiển thị (VI)     | Nên dịch     | Ghi chú                                                                                                                                             |
| ----------------- | ---------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tip`             | `Tip` (chưa qua `t()`) | **Tiền tip** | Cột **Tip** trong bảng staff (chỉ hiện khi có data). Cùng một label cứng dùng chung với income-daily & income-summary — fix một chỗ xử lý cả 3 màn. |
| `Pay 1` / `Pay 2` | `Pay 1` / `Pay 2`      | (cần dịch)   | [VP-2253](https://linear.app/fastboy/issue/VP-2253) — panel chi tiết (Staff Payout). Deep-scan (`expandPanelSections`) mới bắt được.                |

## 2. ⚠️ Dịch chưa đúng chuẩn

> View mặc định: 22/22 thuật ngữ khớp glossary.

> **Còn sót trong panel chi tiết (Salary) — cần fix riêng, ghi nhận từ Linear:**
>
> - [VP-2267](https://linear.app/fastboy/issue/VP-2267) / [VP-2263](https://linear.app/fastboy/issue/VP-2263): `Rate` → "Tỉ lệ" **SAI** (Rate là số tiền/mức lương, không phải %) ⇒ nên **"Mức lương"** (hoặc "Đơn giá"). Nằm trong panel chi tiết biến thể Salary nên compare tự động chưa bắt; glossary đã thêm `Rate` để lần mở rộng deep-scan panel sẽ tự gắn cờ.

## 3. 📐 Vỡ giao diện (chỉ báo cáo)

> Không phát hiện: `xOverflow = 0px`, `clipped = []`. Thanh 6 thẻ tổng + ô search vẫn khít với bản dịch VI.

## 4. ✅ Đã dịch đúng (mẫu)

| EN                            | VI                           |
| ----------------------------- | ---------------------------- |
| Staff Income                  | Thu nhập nhân viên           |
| Total staff                   | Tổng nhân viên               |
| Total orders                  | Tổng đơn hàng                |
| Total subtotal                | Tổng tạm tính                |
| Today                         | Hôm nay                      |
| Order History                 | Lịch sử đơn hàng             |
| Scanner                       | Quét mã                      |
| Internet connection restored. | Đã kết nối internet trở lại. |

## 5. Ghi chú / đề xuất bổ sung glossary

- Chuỗi lẻ **"Tip"** là lỗi CHUNG của cả 3 màn income (daily + summary + staff) — cùng một component label cứng chưa bọc `t()`. Fix một chỗ xử lý cả ba.
- Đã phủ thêm bảng staff có data nhờ cuộn hết trang. **Vẫn chưa phủ**: panel chi tiết 2 biến thể (Commission/Salary) chỉ mount sau khi click 1 dòng — cần deep-scan (`scanIncomesDetail`, đã có cuộn panel) hoặc mở rộng compare để click dòng, kiểm thêm Staff Commission/Clean Up Fee/Rate/Gross Income.

## 6. Nguồn tham chiếu

- HTML: `reports/income-staff/compare.html`
- JSON: `reports/income-staff/compare.json`
- Glossary/registry: [src/utils/i18nCompare.ts](../../src/utils/i18nCompare.ts) (`SCREENS['income-staff']`, `gated:true`)
- Feature doc: [docs/features/income-staff.md](../features/income-staff.md)
