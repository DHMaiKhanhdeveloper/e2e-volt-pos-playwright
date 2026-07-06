# Bản đồ dịch thuật — Trang Đơn đang chờ (`/order-pending`)

> **Nguồn:** phân tích source (file:line app repo) + xác minh động bằng MCP Playwright trên app đang chạy (`http://localhost:1420/order-pending`, 2026-07-02).
> **Trạng thái app khi quét (MCP):** đang hiển thị **tiếng Anh**.
> **Dùng để:** đặc tả cho quét động trang Đơn đang chờ — xem [`vietnamese-scan-flow.md`](vietnamese-scan-flow.md) §3.3.
> **Triển khai:** [`src/utils/i18nOrderPending.ts`](../../src/utils/i18nOrderPending.ts) · spec riêng [`TC-i18n-order-pending-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-order-pending-vietnamese-scan.spec.ts).
> **Quét gần nhất (compare EN↔VI):** 2026-07-06 — tổng 6 · ❌ chưa dịch 1 (`Unknown`→"Không rõ") · ⚠️ sai chuẩn 0 · 📐 UI vỡ 0. Chi tiết: [`order-pending-i18n-result.md`](order-pending-i18n-result.md).

Ký hiệu: ✅ đã xác minh mở được qua MCP · ⚠️ HARDCODE (chưa `t()`) · 🔁 cần điều kiện · 🔇 nút icon thiếu nhãn.

---

## 0. Tổng quan (xác minh qua MCP)

```
/order-pending
├── FILTER BAR (filter-bar.tsx): Search · Staff (n) · Sort (Latest) · DatePicker (preset + lịch) · Quick Checkout
├── LƯỚI THẺ ĐƠN (pending-order-card.tsx): mã đơn · Unknown · N/A · 0 Pts · giờ · Processing · service/staff
└── STATE: Empty (No pending orders) / Error (Couldn't load…) / Loading (spinner)
```

**Popover/dropdown mở được (không cần chọn đơn):**

- **Staff filter** → popover `[role=dialog]` (`popover.tsx:111`).
- **Sort** → `[role=listbox]` (Latest/Oldest).
- **DatePicker preset** → `[role=listbox]` (Today/Yesterday/…).
- **DatePicker lịch** → `[role=dialog]` (react-day-picker grid).

---

## 1. FilterBar — `filter-bar.tsx`

| Element            | Text (EN)                                                     | file:line             | Trạng thái |
| ------------------ | ------------------------------------------------------------- | --------------------- | ---------- |
| Search input       | placeholder _Search order ID, customer name or phone_         | `filter-bar.tsx:43`   | ✅ verify  |
| Nút Staff filter   | _Staff_ + badge số                                            | `staff-filter.tsx:82` | ✅ verify  |
| Nút Quick Checkout | _Quick Checkout_ (icon +)                                     | `filter-bar.tsx:59`   | ✅ verify  |
| DatePicker         | preset dùng chung (Today/Yesterday…, trừ This Year/Last Year) | `filter-bar.tsx:50`   | ✅ verify  |

### 1a. Popover Staff filter — `staff-filter.tsx` (✅ `[role=dialog]`)

| Element              | Text (EN)                      | line |
| -------------------- | ------------------------------ | ---- |
| Search               | placeholder _By Staff_         | 102  |
| Checkbox chọn tất cả | _All_                          | 110  |
| Empty                | _No results found._            | 117  |
| Danh sách staff      | tên staff (data động — bỏ qua) | 124  |

### 1b. Dropdown Sort — `sort-filter.tsx` (✅ `[role=listbox]`)

| Option     | Text (EN) | line                 |
| ---------- | --------- | -------------------- |
| SelectItem | _Latest_  | 38 (`global.latest`) |
| SelectItem | _Oldest_  | 38 (`global.oldest`) |

### 1c. DatePicker (✅ verify)

- **Preset dropdown** (`[role=listbox]`): _Today · Yesterday · This Week · Last Week · Last 7 Days · This Month · Last Month · Last 30 Days_.
- **Lưới lịch** (`[role=dialog]`, react-day-picker): tiêu đề tháng **"July 2026"** + hàng thứ **"Mo Tu We Th Fr Sa Su"** → ⚠️ **grid còn tiếng Anh** (giống Lịch sử đơn hàng — từ điển chung không bắt được tên tháng/thứ, phải dò riêng).

---

## 2. Trạng thái Empty / Error / Loading — `empty-state.tsx` / `index.tsx`

| Trạng thái   | Text (EN)                                                                                                       | Nguồn                   | Kích hoạt       |
| ------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------- |
| Không có đơn | title _No pending orders_ · desc _New orders created from check-in or appointments will show up here._          | `empty-state.tsx:11-12` | 🔁 khi 0 đơn    |
| Lỗi tải      | title _Couldn't load pending orders_ · desc _Something went wrong. Please check your connection and try again._ | `index.tsx:45-46`       | 🔁 khi lỗi mạng |
| Đang tải     | (spinner, không chữ)                                                                                            | `index.tsx:50`          | —               |

> Empty/Error khó ép tự động (cần 0 đơn / lỗi mạng) → scan chỉ bắt nếu tình cờ xuất hiện; ghi nhận thủ công.

---

## 3. Thẻ đơn pending — `pending-order-card.tsx`

| Element                                 | Text (EN)                                                | line                      | Ghi chú                      |
| --------------------------------------- | -------------------------------------------------------- | ------------------------- | ---------------------------- |
| Badge đang dùng                         | _In Use_                                                 | 77                        | 🔁 khi đơn mở ở máy khác     |
| Badge đã check-in                       | _Checked-in_                                             | 87                        | 🔁 khi đã check-in           |
| Phone fallback                          | _N/A_                                                    | 94                        | ✅ verify (hiện thường trực) |
| Điểm                                    | _{{points}} Pts_                                         | 96                        | ✅ verify ("0 Pts")          |
| Badge trạng thái                        | _Processing_ (mặc định)                                  | 106 (`common.processing`) | ✅ verify                    |
| Thêm service                            | _+ {{count}} more service_ / _+ {{count}} more services_ | 117                       | 🔁 khi >1 service            |
| mã đơn / tên KH / giờ / service / staff | data động — **không dịch**                               | 71,83,101,129,130         | —                            |

> Thẻ đơn nằm trong luồng `/order-pending` (đã là STATIC_ROUTE) nên chuỗi hiển-thị-sẵn được route-scan bắt. Badge điều kiện (In Use / Checked-in / +N more) chỉ bắt được khi có dữ liệu tương ứng.

---

## 4. TOAST — `use-pending-actions.ts`

| Trigger                   | Text (EN)                                                | Loại  | line |
| ------------------------- | -------------------------------------------------------- | ----- | ---- |
| Tạo đơn lỗi               | _Couldn't create a new order. Please try again._         | error | 58   |
| Bắt đầu checkout appt lỗi | _Couldn't start appointment checkout. Please try again._ | error | 67   |
| Sync đơn lỗi              | _Couldn't sync this order. Please try again._            | error | 117  |

> Toast lỗi cần điều kiện nghiệp vụ/lỗi mạng → scan **không** ép; ghi nhận thủ công.

---

## 5. Dialog guard (render từ component dùng chung — KHÔNG trong route này)

Khi mở 1 thẻ bị chặn (đơn half-paid, hoặc đang mở ở máy khác), `openOrder` kích hoạt guard dùng chung:

| Dialog                     | Text (EN)                                                                                   | Key                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Đơn đang dùng máy khác     | _Order in use_ · _This order is currently being used on another device…_                    | `global.orderInUseTitle` / `…Description`           |
| Phải hoàn tất đơn hiện tại | _Complete the current order first_ · _The current order already has a payment in progress…_ | `global.completeCurrentOrderTitle` / `…Description` |

> 🔁 Hai dialog này khó ép tự động (cần trạng thái đơn đặc thù). `scanOrderPendingCardOpen` click thẻ đầu và **best-effort** quét dialog nếu bật lên.

---

## 6. Ánh xạ sang implementation (`i18nOrderPending.ts`)

| Hàm / def                    | Quét gì                                                             |
| ---------------------------- | ------------------------------------------------------------------- |
| `ORDER_PENDING_POPUP_DEFS`   | DatePicker lịch (icon-calendar) — screenshot + aria qua `scanPopup` |
| `scanOrderPendingFilter`     | Staff popover · Sort dropdown · DatePicker preset dropdown          |
| `scanOrderPendingDatePicker` | lưới lịch — dò tên tháng/thứ tiếng Anh                              |
| `scanOrderPendingCardOpen`   | click thẻ đầu → best-effort quét guard dialog / màn mở đơn          |

> Mọi trigger khai **nhiều fallback** (EN → VN → cấu trúc) vì lúc quét app đang ở Tiếng Việt.

---

## 7. KHÔNG phải lỗi dịch — bỏ qua

- mã đơn `OD…`, tên KH (`Unknown` là fallback UI — có bắt, xem [[home-translation-map]] §5), tên service/staff (data), giờ `02:25 AM`, `0 Pts` (số).
- Ký hiệu, ngày trơ. (Theo Rule 11.)
