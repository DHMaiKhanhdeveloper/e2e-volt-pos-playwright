# Bản đồ dịch thuật — Trang Lịch sử đơn hàng (`/order-history`)

> **Nguồn:** xác minh động bằng MCP Playwright trên app đang chạy (`http://localhost:1420/order-history`, 2026-07-02) + `data-tsd-source` (file:line của app repo) đọc trực tiếp từ DOM.
> **Trạng thái app khi quét:** đã bật **Tiếng Việt** (đổi qua `/settings/language`, điều hướng client-side bằng router).
> **Dùng để:** làm đặc tả (spec) cho tính năng quét tiếng Việt động trang Lịch sử đơn hàng — xem [`vietnamese-scan-flow.md`](vietnamese-scan-flow.md) mục Order History. Song song với [`home-translation-map.md`](home-translation-map.md).

Ký hiệu:
- ✅ **Đã xác minh** mở được trên app thật qua MCP (kèm chuỗi render thực tế).
- 🔁 **Cần chọn 1 đơn** (mở trang chi tiết) trước khi mở.
- ⚠️ **HARDCODE / chưa dịch** — chuỗi tiếng Anh hiển thị giữa UI tiếng Việt, là lỗi dịch thật cần fix.
- 🔇 **aria/label icon còn tiếng Anh** — nhãn trợ năng chưa dịch (a11y + điểm mù scan).
- 🕳️ **Điểm mù scan** — chuỗi tiếng Anh mà `detectScope` hiện KHÔNG bắt được (giải thích ở §5).

---

## 0. Tổng quan luồng động Lịch sử đơn hàng (xác minh qua MCP)

```
/order-history
├── HEADER (giống Home): sidebar · Đơn đang chờ · Lịch sử đơn hàng · Lịch hẹn · Quét mã · Tìm kiếm... · 🔔 3 icon
├── THANH LỌC trên cùng:
│   ├── DatePicker (nút "06/25/2026 - 07/02/2026", aria "icon-calendar")  → popover lịch 2 tháng
│   ├── Nút "Bộ lọc"  → dialog Bộ lọc (Sắp xếp / Nhân viên / Phương thức TT / Trạng thái)
│   └── Ô tìm kiếm "Tìm mã đơn hàng, tên khách hàng hoặc SĐT" (+ icon aria "Search...")
├── DANH SÁCH ĐƠN (trái): tiêu đề ngày ("Jul 1, 2026") + thẻ đơn (mã · trạng thái · SĐT · phương thức TT · tiền · nhân viên · giờ)
└── PANEL CHI TIẾT (phải, khi chọn 1 đơn):
    ├── "Đơn hàng #OD…" + nút "Hoá đơn" / "Hoàn tiền"
    ├── Thông tin đơn hàng · Tóm tắt đơn hàng · Chi tiết dịch vụ · Chi tiết thanh toán · Ghi chú đơn hàng
    ├── Dialog "Chi tiết hoá đơn" (tái dùng receipt-preview của /settings/receipt)  🔁
    └── Dialog "Hoàn tiền" (order-refund-confirm-dialog)  🔁
```

**Điều kiện mở:**
- **Không cần chọn đơn:** DatePicker (lịch), dialog Bộ lọc (+ 4 dropdown con), ô tìm kiếm.
- **Cần chọn 1 đơn (mở chi tiết):** nút Hoá đơn → dialog hoá đơn; nút Hoàn tiền → dialog hoàn tiền.

---

## 1. Chuỗi tĩnh đã dịch OK (verify hiển thị Tiếng Việt)

| Vùng | Chuỗi (EN gốc) | Render thực tế (VN) |
|------|----------------|---------------------|
| Tiêu đề trang | Order History | **Lịch sử đơn hàng** ✅ |
| Nút lọc | Filter | **Bộ lọc** ✅ |
| Ô tìm kiếm (placeholder) | Search order ID, customer name or phone | **Tìm mã đơn hàng, tên khách hàng hoặc SĐT** ✅ |
| Panel rỗng | Select an order to view details | **Chọn một đơn hàng để xem chi tiết.** ✅ |
| Trạng thái đơn (thẻ) | Success - Unsettled / Success - Settled / Cancelled | **Thành công - Chưa quyết toán / Thành công - Đã quyết toán / Đã huỷ** ✅ |
| Nút lịch | Today / Cancel / Apply | **Hôm nay / Huỷ / Áp dụng** ✅ |

### 1a. Dialog "Bộ lọc" — đã dịch sạch ✅

| Element | Chuỗi (VN) |
|---------|-----------|
| Heading / nút đóng | **Bộ lọc** · **Đóng** |
| Sắp xếp theo → option | **Sắp xếp theo** · **Ngày tạo** · **Cập nhật gần nhất** |
| Nhân viên | **Nhân viên** · nút **Chọn nhân viên** · placeholder **Tìm nhân viên** |
| Phương thức thanh toán → option | **Phương thức thanh toán** · **Thẻ** · **Tiền mặt** · **Thẻ quà tặng** · **Khác** |
| Trạng thái → option | **Trạng thái** · Thành công - Chưa quyết toán · Thành công - Đã quyết toán · Đã huỷ · Đang huỷ · Lỗi huỷ · Hoàn tiền một phần · Đã hoàn tiền · Đang hoàn tiền · Lỗi hoàn tiền |
| Nút dưới | **Xoá** · **Xác nhận** |

### 1b. Panel chi tiết đơn — đã dịch sạch ✅

`Đơn hàng #OD…` · `Hoá đơn` · `Hoàn tiền` · `Thông tin đơn hàng` · `Trạng thái` · `Mã đơn` · `Nhân viên thu ngân` · `Ngày đặt hàng` · `Khách hàng` · `Điện thoại` · `Tóm tắt đơn hàng` · `Tạm tính` · `Tổng giảm giá` · `Thuế` · `Tip` · `Tổng cộng` · `Chi tiết dịch vụ` · `Không có thông tin tiền boa.` · `Chi tiết thanh toán` · `Ghi chú đơn hàng` · `Không có ghi chú cho đơn hàng này.`

### 1c. Dialog "Hoàn tiền" — đã dịch sạch ✅

`Hoàn tiền` · `Nhập số tiền hoặc chọn lần thanh toán bạn muốn hoàn.` · `Chọn dịch vụ/sản phẩm` · `Tất cả dịch vụ` · `Số tiền hoàn` · `Phương thức hoàn tiền` · `Chọn phương thức thanh toán để hoàn` · `Chọn lý do hoàn tiền` · `Vui lòng chọn lý do hoàn tiền` · `Huỷ`
> Nguồn: `order-history/-order-history-detail/-refund/order-refund-confirm-dialog.tsx`.

### 1d. Nút hành động theo TRẠNG THÁI đơn (xác minh live 2026-07-02)

Panel chi tiết hiển thị **bộ nút khác nhau tuỳ trạng thái**. Tất cả nhãn nút + dialog đều **đã dịch** ✅.

| Trạng thái đơn | Nút hành động |
|----------------|---------------|
| Thành công - **Chưa quyết toán** | `Chỉnh tip` · `Hoá đơn` · `Mở lại đơn hàng` · `Huỷ đơn` |
| Thành công - **Đã quyết toán** | `Hoá đơn` · `Hoàn tiền` |
| **Đã huỷ** | `Hoá đơn` |
| **Đã hoàn tiền** | `Hoá đơn` |

> 5 trạng thái còn lại (Đang huỷ · Lỗi huỷ · Hoàn tiền một phần · Đang hoàn tiền · Lỗi hoàn tiền) là **trạng thái hệ thống tạm thời** — không có dữ liệu lịch sử để mở, không có biến thể nút riêng.

**Dialog theo nút (đều đã dịch sạch ✅):**
| Dialog | Chuỗi chính (VN) | Nguồn |
|--------|------------------|-------|
| Chỉnh tip | `Chỉnh tip` · `Tip hiện tại: $X` · `Nhập số tiền` · preset $20/$50/$100/$200 · keypad · `Lưu` | `dialog-secondary.tsx` |
| Mở lại đơn hàng | `Mở lại đơn hàng?` · `Mở lại đơn hàng này sẽ cho phép bạn chỉnh sửa các mục hoặc thanh toán trước khi quyết toán.` · `Huỷ` · `Xác nhận` | `alert-dialog.tsx` |
| Huỷ đơn | `Huỷ đơn` · `Bạn có chắc muốn huỷ đơn hàng này? Tất cả thanh toán sẽ bị huỷ.` · `Chọn lý do huỷ` · `Giữ đơn hàng` · `Xác nhận huỷ` | `-cancel/order-cancel-confirm-dialog.tsx` |
| Huỷ đơn › Lý do | `Khách hàng yêu cầu` · `Vấn đề dịch vụ` · `Đơn hàng sai` · `Thanh toán trùng lặp` · `Lỗi khuyến mãi / giảm giá` · `Nhân viên nhầm lẫn` · `Khác` | — |

> ⚠️ **CẢNH BÁO tự động hoá:** dialog "Huỷ đơn" có nút xác nhận **"Xác nhận huỷ"** (chứa chữ "huỷ") — hàm `dismiss()` khi đóng dialog **tuyệt đối không** bấm nút chứa "xác nhận"/"confirm", chỉ dùng Escape / nút "Đóng"/"Giữ đơn hàng", tránh vô tình huỷ đơn thật.

### 1e. Nút trong "Chi tiết hoá đơn": In / Gửi SMS / Gửi Email (xác minh live)

| Nút | Hành vi | Chuỗi (VN) | Ghi chú |
|-----|---------|-----------|---------|
| **In** | Gọi print gốc (native) | nhãn `In` ✅ | Trong trình duyệt không bật toast/dialog app → không có chuỗi cần dịch. |
| **Gửi SMS** | Mở dialog nhập SĐT | `SĐT khách hàng` · placeholder `Nhập điện thoại` · `Gửi` · `Đóng` ✅ | ⚠️ aria-label **"Clear input"** (nút xoá ô nhập) còn tiếng Anh — a11y, xem §4. |
| **Gửi Email** | Mở dialog nhập email | `Email khách hàng` · placeholder `Nhập email` · `Gửi` · `Đóng` ✅ | Sạch. |

---

## 2. ⚠️ Chuỗi HARDCODE / chưa dịch — mục tiêu chính scan phải bắt

Đây là chuỗi tiếng Anh **hiển thị giữa UI Tiếng Việt** = lỗi dịch thật.

| # | Vùng | Text (EN) | Nguồn (data-tsd-source) | Scan bắt? |
|---|------|-----------|-------------------------|:---------:|
| 1 | Dialog Hoá đơn · khách | **Current points:** | `settings/receipt/-receipt-preview/receipt-preview-customer.tsx:51` | 🕳️ (thiếu từ điển — đã thêm `points`) |
| 2 | Dialog Hoá đơn · khách | **Total visit:** | `receipt-preview-customer.tsx:51` | ✅ (`total`) |
| 3 | Dialog Hoá đơn · dòng dịch vụ | **Staff: \<tên\>** | `receipt-preview-service-item.tsx:272` | ✅ (`staff`) |
| 4 | Dialog Hoá đơn · ghi chú | **Business Note:** | `receipt-preview-note.tsx:34` | ✅ (`business`,`note`) |
| 5 | Dialog Hoá đơn · chính sách | **By signing below, you acknowledge that the services were provided to your satisfaction. No refunds allowed.** | `receipt-preview-policy.tsx:12` | ✅ (câu + `service`) |
| 6 | Chi tiết thanh toán | **Amount: $44.00** | `order-history-detail/order-history-detail-payment.tsx:305` | ✅ (`amount`) |
| 7 | Chi tiết thanh toán + Hoá đơn | **Got: $40.00 (Change: $0.00 - Tip: $0.00)** | `order-history-detail-payment.tsx:305` | 🕳️ **Cố ý BỎ QUA** (xem §6) |
| 8 | Thẻ đơn + Hoá đơn | **Cash / Card / Card, Cash** (phương thức TT) | `order-history-list/order-history-item.tsx:104` | 🕳️ (nằm trong data-zone thẻ đơn — xem §6) |
| 9 | Error boundary (khi mất kết nối/backend lỗi) | **Failed to fetch** | trang lỗi chung (`Lỗi` / `Đã có lỗi xảy ra` đã dịch, chi tiết là message exception thô) | ⚠️ borderline — message kỹ thuật, nên ẩn/dịch |

> ⚠️ **Điểm quan trọng:** phương thức thanh toán ở **dialog Bộ lọc** ĐÃ dịch (`Thẻ`/`Tiền mặt`/`Thẻ quà tặng`/`Khác`) nhưng ở **thẻ đơn + hoá đơn** vẫn là `Cash`/`Card`. Không nhất quán → cần dịch enum phương thức TT dùng chung.
> 💡 Dialog "Chi tiết hoá đơn" **tái dùng** các component `settings/receipt/-receipt-preview/*` → lỗi #1–#5 dùng chung với màn **Settings → Hoá đơn** (`/settings/receipt`); sửa 1 lần là hết cả 2 nơi.

---

## 3. 🌐 Lịch (DatePicker) — grid vẫn TIẾNG ANH ⚠️

Nút mở lịch hiển thị dải ngày; popover là `[role="dialog"]` (qua `components/ui/popover.tsx:111`). Các **nút** dưới lịch đã dịch (Hôm nay/Huỷ/Áp dụng) **NHƯNG lưới lịch react-day-picker chưa set `locale` Tiếng Việt**, nên:

| Vùng lịch | Hiển thị (EN) | Loại |
|-----------|---------------|------|
| Tiêu đề tháng | **June 2026** · **July 2026** | text 🕳️ |
| Nhãn thứ | **Mo Tu We Th Fr Sa Su** | text 🕳️ |
| aria điều hướng | **Go to the Previous Month** · **Go to the Next Month** · **Navigation bar** | aria ✅ (`previous`/`next`) |
| aria ô ngày | **Monday, June 1st, 2026** · **Today, Thursday, July 2nd, 2026, selected** … | aria 🕳️ |

> 🐞 **Lỗi thật:** cả lưới lịch tiếng Anh giữa app Tiếng Việt. Vì tháng/thứ **không nằm trong từ điển UI** nên `detectScope` không tự bắt phần text → xem cách xử lý ở §5 (scanner lịch chuyên biệt bắt tên tháng tiếng Anh). aria "Previous/Next Month" thì bị bắt vào mục aria (chỉ báo cáo).

Ngoài ra tiêu đề ngày trong danh sách (`order-history-list.tsx:128`) và dòng "Cập nhật cuối:" (`components/ui/card.tsx:162`) render ngày kiểu Anh: **"Jul 1, 2026"**, **"Cập nhật cuối: Jun 30, 2026 10:35 PM"** — lỗi định dạng ngày (locale) 🕳️.

---

## 4. 🔇 aria/label icon còn tiếng Anh (a11y)

| Vị trí | aria-label | Nguồn |
|--------|-----------|-------|
| Nút mở lịch | **icon-calendar** | `components/icon.tsx:64` — Icon lấy tên icon làm aria-label mặc định |
| Icon ô tìm kiếm | **Search...** | `components/icon.tsx:64` |
| Dòng dịch vụ (chi tiết) | **service-name** · **price** · **note** · **discount** | field aria trong panel chi tiết dịch vụ |
| Dialog Gửi SMS · nút xoá ô | **Clear input** | nút xoá SĐT trong dialog Gửi SMS (§1e) |

> Không có chữ hiển thị để dịch, nhưng screen reader đọc "icon-calendar" / "Search..." → nên thêm `aria-label` đã dịch. Chỉ báo cáo, không làm fail gate (giống mục 🔇 của Home).

---

## 5. Ánh xạ sang implementation quét động ([`i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts))

| Hàm / hằng | Bao phủ | Cách mở (đã verify) |
|------------|---------|---------------------|
| `ORDER_HISTORY_POPUP_DEFS` (DatePicker) | Lịch (aria + screenshot) | click nút có aria `icon-calendar` / nút chứa dải `dd/mm/yyyy` |
| `scanOrderHistoryFilter()` | Dialog Bộ lọc + 4 dropdown con | click "Bộ lọc" → lần lượt mở Nhân viên / Phương thức TT / Trạng thái (popover `[role=dialog]`) + Sắp xếp (listbox) |
| `scanOrderHistoryDatePicker()` | **Grid lịch tiếng Anh** (§3) | mở lịch → dò tên tháng/thứ tiếng Anh (bắt được điểm mù §3) |
| `scanOrderHistoryDetail()` | Panel chi tiết + Hoá đơn + Hoàn tiền | click thẻ đơn đầu → quét body → mở "Hoá đơn" → quét → mở "Hoàn tiền" → quét |

**Điều chỉnh `detectScope`** (nhỏ, an toàn): thêm `points` vào từ điển UI để bắt "Current points:" (#1). KHÔNG đụng luật khác.

> Mỗi trigger khai **nhiều fallback** (aria/role/text EN→VN→css) vì lúc quét app đang ở Tiếng Việt, nhãn EN gốc không khớp.

---

## 6. KHÔNG phải lỗi dịch — scan cố ý BỎ QUA

- Mã đơn `OD260630-…`, tiền `$40.00`, SĐT ẩn `***-***-2052`, tên khách/nhân viên (data trong thẻ đơn — `DATA_ZONE_SELECTORS` có `a[href*="/order-history/"]`).
- Dòng **"Got: $40.00 (Change: $0.00 - Tip: $0.00)"**: khớp luật parenthetical-money → coi là data/format, **thống nhất với** [`home-translation-map.md`](home-translation-map.md) §6 (mục "(Received $0.01 - Change $0.00)"). Nếu về sau muốn dịch nhãn `Got/Change/Tip` thì phải nới luật này cho CẢ hai trang.
- Phương thức TT `Cash`/`Card` ở thẻ đơn nằm trong data-zone → scan không bắt; ghi nhận thủ công ở §2 #8 là điểm cần dịch enum dùng chung.

> Đúng Rule 11 bộ quy tắc dịch — token giá trị/format không dịch. Một **câu hoàn chỉnh** có chèn ngày thì VẪN là UI cần dịch (ví dụ chính sách #5).
