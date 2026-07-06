---
title: Kết quả quét Tiếng Việt — Lịch sử đơn hàng
screen: order-history
route: /order-history
scanned-at: 2026-07-06
source: compare.json + compare.html (TC-i18n-screen-compare)
skill: i18n-vietnamese-scan
---

# Lịch sử đơn hàng — Quét Tiếng Việt / UI vỡ / dịch đúng chuẩn

> Đầu ra **Skill i18n-vietnamese-scan** cho màn `/order-history`. Cơ chế: quét **1 lần EN + 1 lần VI**,
> ghép theo đường dẫn DOM, phân loại bằng `GLOSSARY` POS ([src/utils/i18nCompare.ts](../../src/utils/i18nCompare.ts)).
> Chạy chỉ-báo-cáo (`I18N_LENIENT=1`). Bản đồ chi tiết vùng: [order-history-translation-map.md](order-history-translation-map.md).

## Tổng quan

> tổng **22** chuỗi bắt được · ❌ chưa dịch (text hiển thị) **0** · ⚠️ sai chuẩn **0** · ✅ đúng chuẩn **10** · 🔤 data/format **2** · 📐 UI vỡ: tràn ngang **0px**, cắt chữ **1** ("Bộ lọc")
> Report trực quan (tự-chứa): `reports/order-history/compare.html`

**Kết luận:** phần **text hiển thị** của trang chính Lịch sử đơn hàng đã dịch **sạch & đúng chuẩn** —
không còn chuỗi tiếng Anh, không có bản dịch sai thuật ngữ. Các mục còn lại là **định dạng ngày (locale)**
và **nhãn a11y (aria-label)** — nhóm report-only, không tính là fail cổng dịch.

## 1. ❌ Chưa dịch (text hiển thị giữa UI Tiếng Việt)

**Không có.** Mọi nhãn/label/placeholder nhìn thấy đã sang Tiếng Việt.

> ⚠️ Hai nhóm borderline dưới đây `detectScope` phân loại `missing` nhưng **không phải text UI thường**:

### 1a. 🔤 Định dạng ngày còn kiểu Anh (locale) — lỗi thật, nhưng là format

| Đang hiển thị                                                                      | Nên là                             | Nguồn (data-tsd-source)                                        |
| ---------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `Jul 6, 2026` · `Jul 2, 2026` · `Jul 1, 2026` · `Jun 30, 2026` (tiêu đề nhóm ngày) | `06 Th7, 2026` / định dạng ngày VI | `order-history/-order-history-list/order-history-list.tsx:128` |

> Khớp với [order-history-translation-map.md](order-history-translation-map.md) §3: lưới lịch + tiêu đề ngày
> chưa set `locale` Tiếng Việt (react-day-picker / hàm format ngày). Sửa: truyền locale `vi` cho bộ format ngày.

### 1b. 🔇 aria-label icon còn tiếng Anh (a11y, report-only)

| aria-label (EN)       | Vị trí           | Nguồn                                                          |
| --------------------- | ---------------- | -------------------------------------------------------------- |
| `Open sidebar`        | nút mở sidebar   | `components/ui/button.tsx:92`                                  |
| `Open pending orders` | nút Đơn đang chờ | `components/ui/button.tsx:92`                                  |
| `icon-calendar`       | nút mở lịch      | `components/icon.tsx:64` (Icon lấy tên icon làm aria mặc định) |
| `Search...`           | icon ô tìm kiếm  | `components/icon.tsx:64`                                       |

> Không có chữ hiển thị nhưng screen-reader đọc tiếng Anh → nên thêm `aria-label` đã dịch. Không làm fail cổng.
> **Bỏ qua (không phải app):** `Notifications alt+T` (region toast của thư viện Sonner) · `Open TanStack Devtools` (công cụ dev).

## 2. ⚠️ Dịch chưa đúng chuẩn

**Không có.** Không có chuỗi nào dịch lệch thuật ngữ glossary.

## 3. 📐 Vỡ giao diện (chỉ báo cáo)

- **Tràn ngang:** 0px (không có).
- **Cắt chữ (clipped): 1** → nhãn nút **"Bộ lọc"** (nút Filter). Tiếng Việt "Bộ lọc" (6 ký tự có dấu) dài
  hơn "Filter" → text bị cắt trong khung nút cố định.
  - **Đề xuất:** nới `min-width`/bỏ `truncate` cho nút Filter ở
    `order-history/-order-history-list/order-history-header.tsx:145`, hoặc giảm padding icon.

## 4. ✅ Đã dịch đúng chuẩn (10/10 mẫu)

| EN                                                    | VI (đang hiển thị)                           | Nguồn                                             |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| Pending Orders                                        | **Đơn đang chờ**                             | ui/button.tsx:92                                  |
| Order History (menu + tiêu đề)                        | **Lịch sử đơn hàng**                         | header-menu.tsx:43 · order-history-header.tsx:101 |
| Appointment                                           | **Lịch hẹn**                                 | header-menu.tsx:74                                |
| Scanner                                               | **Quét mã**                                  | ui/button.tsx:92                                  |
| Internet connection restored.                         | **Đã kết nối internet trở lại.**             | online-status-notification.tsx:304                |
| Filter                                                | **Bộ lọc**                                   | order-history-header.tsx:145                      |
| Select an order to view details.                      | **Chọn một đơn hàng để xem chi tiết.**       | order-history/index.tsx:26                        |
| [placeholder] Search...                               | **Tìm kiếm...**                              | ui/input.tsx:176                                  |
| [placeholder] Search order ID, customer name or phone | **Tìm mã đơn hàng, tên khách hàng hoặc SĐT** | input-original.tsx:44                             |

## 5. Ghi chú / đề xuất bổ sung glossary

- Trang chính `/order-history` **đạt chuẩn dịch** cho text hiển thị. Việc còn lại thuộc dev:
  (1) **format ngày theo locale `vi`** (§1a), (2) **dịch aria-label** icon (§1b), (3) **fix cắt chữ "Bộ lọc"** (§3).
- Scan này phủ **trang chính**; các dialog phụ thuộc đơn (Hoá đơn / Hoàn tiền / Huỷ / Chỉnh tip) và lưới lịch
  đã được ghi nhận riêng trong [order-history-translation-map.md](order-history-translation-map.md) §1c-1e, §2, §3
  (gồm vài chuỗi hardcode trong dialog Hoá đơn dùng chung với `/settings/receipt`).
- Chưa cần bổ sung `GLOSSARY` — các thuật ngữ của màn (Filter/Pending Orders/Order History…) đã có và khớp.

## 6. Nguồn tham chiếu

- **HTML (trực quan, tự-chứa):** `reports/order-history/compare.html` — mở: `start reports/order-history/compare.html`
- **JSON (dữ liệu thô):** `reports/order-history/compare.json`
- Sinh bởi: [tests/regression/i18n/TC-i18n-screen-compare.spec.ts](../../tests/regression/i18n/TC-i18n-screen-compare.spec.ts) (renderer `renderCompareReport()` trong [src/utils/i18nCompare.ts](../../src/utils/i18nCompare.ts))
- Lệnh chạy lại: `cross-env ENV=local I18N_SCREEN=order-history I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-screen-compare.spec.ts --project=chromium`
- Bản đồ vùng chi tiết: [order-history-translation-map.md](order-history-translation-map.md)
