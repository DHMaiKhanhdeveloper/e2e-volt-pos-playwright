# Luồng quét Tiếng Việt (i18n Vietnamese Coverage Scan)

> **Mã:** VP-462
> **Test:** [`tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts)
> **Helper:** [`src/utils/i18nScan.ts`](../../src/utils/i18nScan.ts) · [`src/utils/i18nPopups.ts`](../../src/utils/i18nPopups.ts) · [`src/utils/i18nHome.ts`](../../src/utils/i18nHome.ts) · [`src/utils/i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts) · [`src/utils/i18nOrderPending.ts`](../../src/utils/i18nOrderPending.ts) · [`src/utils/i18nIncomes.ts`](../../src/utils/i18nIncomes.ts)
> **Đầu ra:** `reports/i18n-audit/auto-scan.{html,json}` + ảnh chụp `auto-screens/*.png` (chỉ trang FAIL)
>
> **Cập nhật gần nhất (2026-07-02):** bổ sung **quét sâu 3 trang Báo cáo thu nhập** — xem [mục 3.4](#34-cập-nhật-quét-sâu-3-trang-báo-cáo-thu-nhập-incomes) và bản đồ dịch [`incomes-translation-map.md`](incomes-translation-map.md).
> **Trước đó (2026-07-02):** **quét sâu Đơn đang chờ** — [mục 3.3](#33-cập-nhật-quét-sâu-trang-đơn-đang-chờ) · [`order-pending-translation-map.md`](order-pending-translation-map.md).
> **Trước đó (2026-07-02):** **quét sâu Lịch sử đơn hàng** — [mục 3.2](#32-cập-nhật-quét-sâu-trang-lịch-sử-đơn-hàng) · [`order-history-translation-map.md`](order-history-translation-map.md).
> **Trước đó (2026-07-01):** **quét sâu Home** — [mục 3.1](#31-cập-nhật-quét-sâu-trang-home) · [`home-translation-map.md`](home-translation-map.md).

Tài liệu này mô tả **luồng đi** của test, **trang nào / link nào / popup nào** được quét, và **cơ chế phát hiện** chuỗi tiếng Anh còn sót. Đây là file đặc tả (spec) — dùng nó làm nguồn sự thật khi cần sửa/mở rộng test.

---

## 1. Mục tiêu

Chuyển app sang **Tiếng Việt**, đi qua mọi màn hình điều hướng được, và liệt kê **chính xác màn nào còn hiển thị chữ tiếng Anh**. Kết quả ra báo cáo HTML có: danh sách chuỗi cần dịch (gom trùng), ảnh thumbnail từng trang lỗi, và diff so với lần chạy trước (mới phát sinh / vừa dịch xong).

---

## 2. Ràng buộc kỹ thuật quan trọng

- **App KHÔNG lưu ngôn ngữ qua reload** (bug đã biết). Vì vậy test chỉ đổi sang Tiếng Việt **một lần** qua UI, rồi điều hướng **client-side** bằng TanStack Router (`window.__TSR_ROUTER__.navigate`) để giữ trạng thái VN sống. **Không dùng `page.goto`** giữa chừng (sẽ revert về tiếng Anh).
- Test **fail** khi có bất kỳ màn nào còn tiếng Anh (đây là "cổng" localization). Đặt `I18N_LENIENT=1` để chạy chỉ-báo-cáo, không fail.
- Timeout toàn test: **600 giây** (10 phút — full walk gồm deep scan Home / Lịch sử đơn / Đơn đang chờ / 3 trang Thu nhập nên mất ~7–8 phút).

---

## 3. Luồng đi (thứ tự các bước)

```
1. switchToVietnamese()      → mở /settings/language, click "Tiếng Việt", chờ sidebar re-render VN
2. Kiểm tra __TSR_ROUTER__    → bắt buộc có router client-side (nếu không → fail ngay)
3. Quét STATIC_ROUTES         → 22 route tĩnh (mục 4)
4. Quét trang chi tiết động   → click item đầu trong list rồi quét (mục 5)
5. Quét luồng đơn hàng/checkout → từ 1 order id lấy được (mục 6)
6. Quét thông báo (chuông 🔔)  → mở panel + click 1 thông báo → trang lịch hẹn (mục 7)
7. Quét popup                 → POPUP_DEFS + HOME_POPUP_DEFS: mở từng dialog, quét, đóng (mục 8)
8. Quét panel chi tiết theo hàng → income/batch/product/nhân viên (mục 9)
9. Quét 5 tab hồ sơ nhân viên  → (mục 9)
9b. Quét dialog theo đơn của Home → tạo đơn (staff+service) → Note, Promo & Rewards (mục 3.1)
10. Ghi báo cáo               → diff vs lần trước, xuất HTML + JSON
11. Gate                      → mỗi trang chưa dịch = 1 expect.soft fail
```

### 3.1. [Cập nhật] Quét sâu trang Home

Bổ sung tại [`src/utils/i18nHome.ts`](../../src/utils/i18nHome.ts) — chi tiết chuỗi/trigger ở [`home-translation-map.md`](home-translation-map.md). Gồm 2 phần, **đều chạy sau khi đã bật Tiếng Việt** và điều hướng client-side (giữ nguyên nguyên tắc mục 2):

**(a) `HOME_POPUP_DEFS`** — popup mở được **không cần đơn hàng**, gộp chung vòng lặp popup (bước 7):
| Popup | Trigger (đã verify qua MCP) |
|-------|------------------------------|
| Bán thẻ quà tặng (Sell Gift Card) | click "Gift Card" |
| Cảnh báo chọn nhân viên (Select Staff First) | click "Quick Pay" lúc chưa chọn staff |
| Tìm kiếm toàn cục | Ctrl+K / nút Search |
| Quét mã (Scanner) | nút "Scanner" (thường cần camera) |

**(b) `scanHomeOrderDialogs(page, record)`** — bước **9b**, dialog chỉ xuất hiện khi đơn có staff + service:
1. Về `/home` (router) → chọn **staff đầu** (tạo đơn) → thêm **service đầu**.
2. Mở lần lượt → quét → đóng: **Ghi chú đơn (Order Note)**, **Khuyến mãi & Thưởng (Promo & Rewards)**.
3. Best-effort: thiếu staff/service hoặc dialog không mở được → bỏ qua, **không** làm fail.

> Kết quả chạy thử (lenient) 2026-07-01: 7 surface Home được quét. Các trigger khai **nhiều fallback** (nhãn EN → nhãn VN → cấu trúc) vì lúc quét app đang ở Tiếng Việt.

**Spec chạy độc lập (nhanh):** [`TC-i18n-home-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts) chỉ quét Home (~40s thay vì ~5 phút), xuất báo cáo riêng `reports/i18n-audit/home-scan.{html,json}`. Dùng khi cần iterate nhanh việc sửa dịch trang Home.
> Chạy: `ENV=local I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts`
> Phát hiện đầu tiên: 2 ô quick-action **"Quick Pay"** và **"Gift Card"** trên `/home` còn tiếng Anh (chưa qua `t()`).

Các bước 4–9 đều là **best-effort**: thiếu dữ liệu / không mở được thì bỏ qua, **không làm fail** test (chỉ mục 3 và popup mở được mới tính vào cổng).

### 3.2. [Cập nhật] Quét sâu trang Lịch sử đơn hàng

Bổ sung tại [`src/utils/i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts) — chi tiết chuỗi/trigger ở [`order-history-translation-map.md`](order-history-translation-map.md). Gồm 1 popup-def + 3 hàm quét động, **đều chạy sau khi đã bật Tiếng Việt** và điều hướng client-side:

**(a) `ORDER_HISTORY_POPUP_DEFS`** — popup mở được **không cần chọn đơn**, gộp chung vòng lặp popup (bước 4c):
| Popup | Trigger (đã verify qua MCP) |
|-------|------------------------------|
| Lịch chọn ngày (DatePicker) | click nút có aria `icon-calendar` (popover là `[role=dialog]`) |

**(b) 3 hàm quét động** (bước **4e-oh**, best-effort):
1. `scanOrderHistoryFilter()` — mở "Bộ lọc" → quét dialog + 4 dropdown con (Sắp xếp / Nhân viên / Phương thức thanh toán / Trạng thái). *(tất cả đã dịch — quét để chống hồi quy)*
2. `scanOrderHistoryDatePicker()` — mở lịch, dò **tên tháng/thứ tiếng Anh** ("June 2026", "Mo Tu We…") mà từ điển chung không bắt được → flag lưới lịch chưa localize.
3. `scanOrderHistoryDetail()` — click đơn đầu → quét panel chi tiết → mở/quét dialog **Hoá đơn** (rò "Current points:", "Total visit:", "Staff:", "Business Note:", câu chính sách) và **Hoàn tiền** (đã dịch).

> Kết quả mong đợi: rò tiếng Anh tập trung ở **dialog Hoá đơn** (tái dùng component `settings/receipt/-receipt-preview/*`), **lưới lịch**, và nhãn `Amount:` ở chi tiết thanh toán. Phương thức TT `Cash`/`Card` ở thẻ đơn nằm trong data-zone nên không tính vào cổng (ghi nhận thủ công).

**Spec chạy độc lập (nhanh):** [`TC-i18n-order-history-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts) chỉ quét Lịch sử đơn hàng, xuất báo cáo riêng `reports/i18n-audit/order-history-scan.{html,json}`.
> Chạy: `ENV=local I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts`

### 3.3. [Cập nhật] Quét sâu trang Đơn đang chờ

Bổ sung tại [`src/utils/i18nOrderPending.ts`](../../src/utils/i18nOrderPending.ts) — chi tiết chuỗi/trigger ở [`order-pending-translation-map.md`](order-pending-translation-map.md). Thân trang (filter bar + thẻ đơn) đã được route-scan bao; phần này thêm các surface chỉ hiện khi **tương tác**, chạy sau khi đã bật Tiếng Việt + điều hướng client-side:

**(a) `ORDER_PENDING_POPUP_DEFS`** — DatePicker lịch (`[role=dialog]`), gộp chung vòng lặp popup (bước 4c) — screenshot + aria.

**(b) 3 hàm quét động** (best-effort):
1. `scanOrderPendingFilter()` — mở & quét: **Bộ lọc nhân viên** (popover: *By Staff* / *All* / *No results found.*), **Sắp xếp** (*Latest*/*Oldest*), **DatePicker preset** (*Today · Yesterday · This Week · Last Week · Last 7 Days · This Month · Last Month · Last 30 Days*).
2. `scanOrderPendingDatePicker()` — mở lịch, dò **tên tháng/thứ tiếng Anh** ("July 2026", "Mo Tu We…") — cùng bug với Lịch sử đơn hàng.
3. `scanOrderPendingCardOpen()` — click thẻ đầu → best-effort quét **dialog guard** ("Order in use" / "Complete the current order first") nếu bật lên (khó ép — cần trạng thái đơn đặc thù).

> Empty/Error state ("No pending orders", "Couldn't load pending orders") và toast lỗi cần điều kiện (0 đơn / lỗi mạng) → không ép; ghi nhận thủ công trong bản đồ dịch.

**Spec chạy độc lập (nhanh):** [`TC-i18n-order-pending-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-order-pending-vietnamese-scan.spec.ts) → báo cáo riêng `reports/i18n-audit/order-pending-scan.{html,json}`.
> Chạy: `ENV=local I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-order-pending-vietnamese-scan.spec.ts`

### 3.4. [Cập nhật] Quét sâu 3 trang Báo cáo thu nhập (Incomes)

Bổ sung tại [`src/utils/i18nIncomes.ts`](../../src/utils/i18nIncomes.ts) — chi tiết ở [`incomes-translation-map.md`](incomes-translation-map.md). Phạm vi: **Daily Sale Report** (`/incomes/income-daily`), **Income Summary** (`/incomes/income-summary`), **Staff Income** (`/incomes/income-staff`) — cả 3 **gated** (passcode chủ 8888). Thân trang (tabs Day/Week/Month, cột bảng, Search staff, empty) đã được route-scan bao; phần này thêm:

**(a) `scanIncomesGate`** — quét **dialog passcode** ("Enter your passcode" / "Do not require passcode for the next 30 minutes") **trước khi** mở khoá, rồi nhập 8888. Chạy trước vòng STATIC_ROUTES (route-scan nhập passcode nhưng không quét text dialog). No-op nếu đã mở khoá.

**(b) `INCOMES_POPUP_DEFS`** — DatePicker lịch (`[role=dialog]`, `gated`), gộp vòng lặp popup.

**(c) 2 hàm quét động** (best-effort):
1. `scanIncomesDatePicker()` — mở lịch → dò tên tháng/thứ tiếng Anh ("July 2026", "Mo Tu We…") — cùng bug lưới lịch.
2. `scanIncomesDetail()` — click hàng đầu (summary + staff) → panel chi tiết (**Print** + headings) → best-effort mở **Order Details** dialog.

> **i18n gap thật:** `income-daily-error.tsx:5-6` hardcode "Failed to load store daily income data!" + "Please try again later." trong khi đã có key `global.failedLoadDailyIncome` / `global.tryAgainLater` (khó ép — cần load fail; ghi nhận thủ công).

**Spec chạy độc lập (nhanh):** [`TC-i18n-incomes-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-incomes-vietnamese-scan.spec.ts) → báo cáo riêng `reports/i18n-audit/incomes-scan.{html,json}`.
> Chạy: `ENV=local I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-incomes-vietnamese-scan.spec.ts`

---

## 4. Trang tĩnh được quét (STATIC_ROUTES — 22 màn)

Nguồn: [`src/utils/i18nScan.ts`](../../src/utils/i18nScan.ts) — hằng `STATIC_ROUTES`. Cột **Gated** = cần nhập passcode chủ (8888). **ExpandAll** = bấm "Mở rộng tất cả" trước khi quét.

| Nhóm | Route | Tên màn | Gated | ExpandAll |
|------|-------|---------|:-----:|:---------:|
| POS | `/home` | Trang chủ / POS | | |
| POS | `/order-pending` | Đơn đang chờ | | |
| POS | `/order-history` | Lịch sử đơn hàng | | |
| POS | `/appointment` | Lịch hẹn | | |
| Incomes | `/incomes/income-daily` | Thu nhập theo ngày | ✅ | |
| Incomes | `/incomes/income-summary` | Tổng hợp thu nhập | ✅ | |
| Incomes | `/incomes/income-staff` | Thu nhập nhân viên | ✅ | |
| Settings | `/settings/business` | Thông tin doanh nghiệp | | |
| Settings | `/settings/services` | Dịch vụ & Sản phẩm | | |
| Settings | `/settings/staffs` | Nhân viên | | |
| Settings | `/settings/roles` | Vai trò | | |
| Settings | `/settings/permissions` | Quyền hạn | | ✅ |
| Settings | `/settings/receipt` | Hóa đơn (mẫu in) | | |
| Settings | `/settings/charge-fee` | Phí & Phụ thu | | |
| Settings | `/settings/accessibility` | Hiển thị | | |
| Settings | `/settings/language` | Ngôn ngữ | | |
| System | `/time-tracking` | Chấm công | | |
| System | `/batch-history` | Lịch sử ca (Batch) | ✅ | |
| System | `/cash-drawer` | Két tiền | | |
| System | `/customer` | Màn hình khách hàng | | |
| System | `/force-update` | Yêu cầu cập nhật | | |
| System | `/customer/force-update` | Khách hàng · cập nhật | | |

> Nếu router nhảy sang route khác (redirect) → đánh dấu `redirected`, **không tính** là chưa dịch.

---

## 5. Trang chi tiết động (click item đầu danh sách)

Hàm `scanDynamic(listPath, name, group, clickSelector)`: điều hướng tới list → click phần tử đầu → quét trang chi tiết mở ra.

| Route list | Tên | Nhóm | Selector click |
|-----------|-----|------|----------------|
| `/settings/staffs` | Chi tiết nhân viên | Settings | `main a.cursor-pointer` |
| `/settings/roles` | Chi tiết vai trò | Settings | `main a, main [role=button]` |
| `/settings/services` | Chi tiết danh mục | Settings | `main a[href*="services/"], main a.cursor-pointer` |
| `/order-history` | Chi tiết đơn hàng | POS | `main a[href*="order-history/"], main a.cursor-pointer` |

---

## 6. Luồng đơn hàng / thanh toán (checkout)

Lấy 1 `orderId` từ URL đang ở trang chi tiết đơn hàng (mục 5), rồi điều hướng qua các sub-route `/order/$id/<sub>`:

| Sub-route | Tên |
|-----------|-----|
| `checkout` | Thanh toán (Checkout) |
| `checkout/view-cart` | Checkout · Xem giỏ hàng |
| `checkout/processing-payment` | Checkout · Đang xử lý thanh toán |
| `checkout/payment-success` | Checkout · TT thành công |
| `payment-success` | Thanh toán thành công |
| `split-order` | Tách đơn |

> Lưu ý: có **hai** màn "thanh toán thành công" khác nhau (một dưới `/checkout`, một ở gốc `/order`). Nhãn route giữ chúng tách biệt.
> Màn Login / splashscreen **không** thuộc phạm vi (cần phiên chưa đăng nhập).

---

## 7. Thông báo (chuông 🔔)

- Về `/home`, tìm nút icon nhỏ ở header (chuông không có aria-label) → click phải-sang-trái đến khi hiện heading "Thông báo".
- Quét **bảng thông báo** (panel).
- Click thông báo đầu (nhận diện qua chuỗi ngày `dd/mm/yyyy`) → điều hướng tới **trang lịch hẹn** → quét tiếp.

| Route (nhãn) | Tên | Nhóm |
|--------------|-----|------|
| `🔔 → bảng thông báo` | Bảng thông báo (panel) | System |
| `🔔 → chi tiết (Lịch hẹn)` | Trang mở từ thông báo | System |

---

## 8. Popup / Dialog được quét (POPUP_DEFS)

Nguồn: [`src/utils/i18nPopups.ts`](../../src/utils/i18nPopups.ts). Mỗi popup: về `host` route → chạy `prep` (nếu có) → thử lần lượt các `open` trigger (testid → role+name → text → css → key) → khi dialog hiện thì quét portal `[role="dialog"]` → đóng bằng Escape.

> Vòng lặp popup quét cả `POPUP_DEFS` **và** `HOME_POPUP_DEFS` (popup Home không cần đơn — xem [mục 3.1](#31-cập-nhật-quét-sâu-trang-home)).

**Phạm vi "chỉ tính popup mở được":** popup không mở được trong phiên (dialog thiết bị/lỗi, cần camera…) → ghi `reachable: false`, **không** làm fail.

### 8a. Két tiền — trang showcase dev (`/cash-drawer`)

Chuỗi hardcode tiếng Anh (audit đã xác nhận), mở bằng nút theo nhãn EN:

| Popup | Nút mở |
|-------|--------|
| Cảnh báo xoá tài khoản | `Show Dialog` |
| Gỡ SĐT khách | `Remove Customer Phone` |
| Gỡ dịch vụ | `Remove Service Item` |
| Gỡ nhân viên | `Remove Staff` |
| Xoá đơn | `Delete Order` |
| Huỷ đơn | `Void Order` |
| Hoàn tiền | `Refund Payment` |
| Thêm tip | `Add a Tip` |
| Chia tip | `Split Tip` |
| Bộ lọc | `Filter` |

### 8b. Popup theo route thật

| Nhóm | Host route | Popup |
|------|-----------|-------|
| Settings | `/settings/demo-mode` | Demo Mode (tool nội bộ) |
| Settings | `/settings/services` | Thêm dịch vụ / sản phẩm |
| Settings | `/settings/services` | Tạo danh mục |
| Settings | `/settings/staffs` | Tạo nhân viên |
| Settings | `/settings/staffs` | Tạo nhóm nhân viên |
| Settings | `/settings/roles` | Gán nhân viên vào vai trò |
| Settings | `/settings/charge-fee` | Tạo cấu hình tip |
| POS | `/home` | Tìm kiếm toàn cục (Ctrl+K) |
| POS | `/home` | Quét QR *(thường cần camera → có thể không mở được trong CI)* |
| POS | `/order-history` | Bộ lọc |
| System | `/time-tracking` | Thêm bản ghi chấm công |

> Mỗi popup khai báo **nhiều trigger dự phòng** (testid → role → text → css) vì app đang ở tiếng Việt nên nhãn EN gốc có thể không khớp — trigger đầu tiên bật được dialog sẽ thắng.

---

## 9. Panel chi tiết theo hàng & tab nhân viên

**`scanRowDetail`** — click hàng đầu trong bảng để mở panel chi tiết tại chỗ:

| Route list | Tên | Nhóm | Selector hàng |
|-----------|-----|------|---------------|
| `/incomes/income-summary` | Tổng hợp thu nhập → chi tiết | Incomes | `main tr.cursor-pointer`, `main tbody tr` |
| `/incomes/income-staff` | Thu nhập nhân viên → chi tiết | Incomes | `main tr.cursor-pointer`, `main tbody tr` |
| `/batch-history` | Lịch sử ca → Batch Close Review | System | `main tbody tr button`, `main button.underline`, `main tr.cursor-pointer` |
| `/settings/services` | Dịch vụ & Sản phẩm → chi tiết | Settings | `main a.cursor-pointer`, `main [role="button"]` |

**5 tab hồ sơ nhân viên** — mở nhân viên đầu ở `/settings/staffs`, click từng tab theo thứ tự (click theo index, ngôn ngữ-trung-lập):

`Thông tin` · `Thù lao` · `Kỹ năng dịch vụ` · `Giờ làm việc` · `Quyền hạn`

---

## 10. Cơ chế phát hiện chuỗi tiếng Anh (`detectScope`)

Chạy **trong trình duyệt**, scope theo `body` (trang) hoặc `[role="dialog"]` (popup). Một chuỗi bị coi là **"UI tiếng Anh chưa dịch"** khi:

1. **Không có dấu tiếng Việt** (regex diacritics), VÀ
2. Chứa từ nằm trong **từ điển UI tuyển chọn** (~200 từ: `save`, `cancel`, `total`, `payment`, `staff`…).

Cố tình **bỏ qua** (không gắn cờ nhầm):
- Vùng dữ liệu người bán (`DATA_ZONE_SELECTORS`): thẻ nhân viên, hàng dịch vụ, đơn hàng.
- Giá trị dữ liệu (`DATA_VALUES`): `Owner`, `Manager`, `Staff`, `Product`, `Custom...`.
- Ngày tháng, badge đếm ("3 Services"), tên viết HOA nhiều từ, tên riêng ≥3 từ, chuỗi tiền/mã.
- False-positive cố định: `In` (=Print), `English` (=tên ngôn ngữ).

Ngoài ra còn thu thập (chỉ báo cáo, **không** làm fail):
- **aria/placeholder/title** còn tiếng Anh.
- **Nút/điều khiển** còn tiếng Anh (gồm nút chỉ-icon đọc từ aria-label).
- **UI vỡ**: chữ bị cắt (ellipsis/overflow) và layout tràn ngang >8px (tiếng Việt dài hơn tiếng Anh nên hay vỡ).

---

## 11. Đầu ra & cổng chặn (gate)

- `reports/i18n-audit/auto-scan.html` — báo cáo đầy đủ (chuỗi gom trùng, thumbnail trang lỗi, diff vs lần trước).
- `reports/i18n-audit/auto-scan.json` — dữ liệu thô + **làm baseline cho lần chạy sau** (để tính "mới phát sinh / đã dịch xong").
- `reports/i18n-audit/auto-screens/*.png` — ảnh full-page **chỉ** cho trang/popup FAIL.
- Console log tổng kết số trang chưa dịch.
- **Gate:** mỗi màn chưa dịch → 1 `expect.soft(...).toHaveLength(0)` → test fail nhưng vẫn liệt kê hết mọi màn (không dừng ở màn đầu). Tắt bằng `I18N_LENIENT=1`.

---

## 12. Cách mở rộng (không phá xương sống)

- **Thêm trang tĩnh:** thêm 1 dòng vào `STATIC_ROUTES` trong [`i18nScan.ts`](../../src/utils/i18nScan.ts).
- **Thêm popup:** thêm 1 `PopupDef` vào `POPUP_DEFS` trong [`i18nPopups.ts`](../../src/utils/i18nPopups.ts) (nhớ khai nhiều trigger dự phòng).
- **Thêm popup/dialog trang Home:** sửa `HOME_POPUP_DEFS` (không cần đơn) hoặc `ORDER_DIALOGS` (cần đơn) trong [`i18nHome.ts`](../../src/utils/i18nHome.ts); cập nhật kèm [`home-translation-map.md`](home-translation-map.md).
- **Thêm popup/dialog trang Lịch sử đơn:** sửa `ORDER_HISTORY_POPUP_DEFS`, `scanOrderHistoryFilter`, `scanOrderHistoryDatePicker` hoặc `DETAIL_DIALOGS` trong [`i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts); cập nhật kèm [`order-history-translation-map.md`](order-history-translation-map.md).
- **Thêm popup/dialog trang Đơn đang chờ:** sửa `ORDER_PENDING_POPUP_DEFS`, `scanOrderPendingFilter`, `scanOrderPendingDatePicker` hoặc `scanOrderPendingCardOpen` trong [`i18nOrderPending.ts`](../../src/utils/i18nOrderPending.ts); cập nhật kèm [`order-pending-translation-map.md`](order-pending-translation-map.md).
- **Thêm popup/dialog 3 trang Báo cáo thu nhập:** sửa `INCOMES_POPUP_DEFS`, `scanIncomesGate`, `scanIncomesDatePicker` hoặc `scanIncomesDetail` trong [`i18nIncomes.ts`](../../src/utils/i18nIncomes.ts); cập nhật kèm [`incomes-translation-map.md`](incomes-translation-map.md).
- **Tinh chỉnh phát hiện:** sửa từ điển `ui`, `DATA_ZONE_SELECTORS`, `DATA_VALUES`, hoặc `fpExact` — tất cả nằm trong `detectScope`.
- **Không** thêm selector inline trong file `.spec.ts`; mọi selector quét đi qua helper.
