---
title: Kết quả quét Tiếng Việt — Đơn đang chờ
screen: order-pending
route: /order-pending
scanned-at: 2026-07-06
source: reports/order-pending/compare.json (TC-i18n-screen-compare)
skill: i18n-vietnamese-scan (5)
---

# Đơn đang chờ (`/order-pending`) — Quét Tiếng Việt / UI vỡ / dịch đúng chuẩn

> Đầu ra **Skill 5** (`i18n-vietnamese-scan`). Cơ chế: quét 1 lần **EN** → đổi sang **Tiếng Việt**
> → quét lại → ghép theo đường dẫn DOM. Nguồn số liệu: `compare.json`. Bổ sung ngữ
> cảnh từ [order-pending-translation-map.md](order-pending-translation-map.md).

## Tổng quan

> tổng **6** · ❌ chưa dịch **1** · ⚠️ sai chuẩn **0** · 📐 UI vỡ **0** (xOverflow 0, không chuỗi bị cắt)

Các bề mặt **luôn hiển thị** (header + filter bar) đã dịch tốt. Chỉ còn **1 chuỗi tiếng Anh** rò rỉ
là fallback tên khách **"Unknown"**. Không phát hiện vỡ giao diện (tiếng Việt không đẩy tràn ngang).

## 1. ❌ Chưa dịch (còn tiếng Anh)

| Chuỗi (EN) | Đang hiển thị (VI)     | Nên dịch     | Nguồn                                                                 |
| ---------- | ---------------------- | ------------ | --------------------------------------------------------------------- |
| `Unknown`  | `Unknown` (giữ nguyên) | **Không rõ** | fallback tên khách trên thẻ đơn — `pending-order-card.tsx` (~dòng 83) |

> "Unknown" **không phải** dữ liệu khách thật mà là **chuỗi fallback hardcode** khi đơn chưa gán
> khách → cần đưa qua `t()` (vd `common.unknownCustomer` = "Không rõ"). Map cũ xếp cột tên KH là
> "data động — không dịch", nhưng riêng giá trị fallback này là **UI string** và là lỗi dịch thật.

## 2. ⚠️ Dịch chưa đúng chuẩn

Không có. 6/6 thuật ngữ khớp glossary POS.

## 3. 📐 Vỡ giao diện (chỉ báo cáo)

Không có: `xOverflow = 0`, danh sách `clipped` rỗng. Bản dịch tiếng Việt của header/filter không làm
tràn ngang hay cắt chữ ở viewport 1920×1080.

## 4. ✅ Đã dịch đúng (mẫu)

| Text (EN)      | Hiển thị (VI)    |
| -------------- | ---------------- |
| Pending Orders | Đơn đang chờ     |
| Order History  | Lịch sử đơn hàng |
| Appointment    | Lịch hẹn         |
| Scanner        | Quét mã          |
| Staff          | Nhân viên        |
| Quick Checkout | Thanh toán nhanh |

## 5. Ghi chú / đề xuất bổ sung glossary

- **Phạm vi lần quét này:** compare bắt **6 bề mặt luôn hiển thị**. Nhiều chuỗi **có điều kiện**
  chưa được ép hiện nên chưa vào compare — cần **quét sâu** để phủ (tham chiếu map §1b/§2/§3):
  - Sort `Latest/Oldest` (`global.latest/oldest`), DatePicker preset `Today/Yesterday…`,
    badge `Processing` (`common.processing`), `In Use`, `Checked-in`, `+N more service(s)`.
  - **DatePicker — lưới lịch** vẫn còn tiếng Anh (tên tháng "July 2026" + thứ "Mo Tu We…"),
    đã ghi ⚠️ trong map §1c; từ điển chung không bắt được → cần dò riêng.
  - Empty/Error/Toast (`No pending orders`, `Couldn't load…`, các toast lỗi) chỉ hiện khi có
    điều kiện nghiệp vụ → ghi nhận thủ công từ source, chưa vào compare.
- **Đề xuất glossary** (`src/utils/i18nCompare.ts` → `GLOSSARY`): thêm `Unknown: ['Không rõ']`
  để lần quét sau tự phân loại `missing`/`suspect` cho chuỗi này.
- **KHÔNG tự sửa source app** — việc thêm `t()` cho "Unknown" + dịch lưới lịch là của dev.

## Cách tái tạo

```bash
I18N_SCREEN=order-pending I18N_LENIENT=1 npx playwright test \
  tests/regression/i18n/TC-i18n-screen-compare.spec.ts --project=chromium --reporter=line
# → reports/order-pending/compare.json
```
