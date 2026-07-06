# Bản đồ dịch thuật — Trang Home (`/home`)

> **Nguồn:** phân tích source (file:line của app repo) + xác minh động bằng MCP Playwright trên app đang chạy (`http://localhost:1420/home`, 2026-07-01).
> **Trạng thái app khi quét:** đang hiển thị **tiếng Anh** (chưa bật Tiếng Việt).
> **Dùng để:** làm đặc tả (spec) cho tính năng quét tiếng Việt động trang Home — xem [`vietnamese-scan-flow.md`](vietnamese-scan-flow.md) mục Home.

Ký hiệu:
- ✅ **Đã xác minh** mở được trên app thật qua MCP (kèm chuỗi render thực tế).
- 🔁 **Cần đơn hàng/điều kiện** trước khi mở.
- ⚠️ **HARDCODE** — chuỗi chưa qua `t()`, là lỗi dịch thật cần fix.
- 🔇 **Nút icon thiếu nhãn** — không có chữ để dịch nhưng thiếu aria-label (a11y).

---

## 0. Tổng quan luồng động Home (xác minh qua MCP)

```
/home
├── HEADER: Open sidebar · Pending Orders · Order History · Appointment · Scanner · Search... · 🔔 3 nút icon
├── SIDEBAR trái: Pending Orders (count) · ngày giờ · Quick Checkout · search đơn
├── CỘT STAFF: Search staff · tab "All" · thẻ staff (Next appt / --:--)
├── CỘT KHÁCH: bàn phím SĐT (Enter Customer Phone, Name or Email) · Done
│              · Checkin Today (n) Show/Hide · Appointments Today (n) Show/Hide
├── CỘT DỊCH VỤ: Search service · Quick Pay · Gift Card · Product · <danh mục> · list dịch vụ
└── ORDER SUMMARY (khi có đơn): Promo & Rewards · Note · Subtotal · Total · Pay · Remove · Delete Staff Order Item
```

**Điều kiện mở dialog:**
- **Không cần đơn:** Quick Pay*, Gift Card, QR Scanner, Global Search, Customer search.
  (*Quick Pay khi **chưa chọn staff** → bật cảnh báo "Select Staff First".)
- **Cần chọn staff / có service trong đơn:** Note, Promo & Rewards, Remove item/staff/store, Change staff.

---

## 1. Chuỗi tĩnh trên màn Home (đã dùng `t()` — verify hiển thị VN)

| Vùng | file:line | Chuỗi (EN) | Key i18n |
|------|-----------|-----------|----------|
| Sidebar: nút | `pending-sidebar.tsx:110` | Quick Checkout | `global.quickCheckout` |
| Sidebar: search | `pending-sidebar.tsx:118` | placeholder *Search order ID…* | `global.searchOrderPlaceholder` |
| Sidebar: tiêu đề | `pending-sidebar-header.tsx:47` | Pending Orders | `global.pendingOrders` |
| Staff: search | `-staff/index.tsx:29` | placeholder *Search staff* | `global.searchStaff` |
| Staff: nhãn | `staff-items.tsx:222` | Next appt | `global.nextAppt` |
| Staff: Sort By | `staff-sort.tsx:28-81` | Sort By / none / name / appointmentTime / ascending / descending | `global.sortBy` … |
| Service: search | `service-search.tsx:9` | placeholder *Search service* | `global.searchService` |
| Order summary | `order-summary.tsx:165,254` | Merge Order / Pay + Subtotal/Tax/Total | `global.mergeOrder` / `global.pay` … |
| Customer: nhập SĐT | `customer-enter-phone.tsx:160` | placeholder *Enter Customer Phone, Name or Email* | `global.enterCustomerPhoneNameEmail` |
| Customer: Checkin | `customer.tsx:65-66` | Checkin Today (n) / Hide / Show | `global.checkinTodayCount` / `global.hide` / `global.show` |
| Customer: Appts | `customer.tsx:83-88` | Appointments Today (n) / No appointments today | `global.appointmentsTodayCount` / `global.noAppointmentsToday` |

---

## 2. Toast / thông báo (12) — `t()`

| # | file:line | Loại | Key / ghi chú |
|---|-----------|------|---------------|
| 1 | `order/index.tsx:182` | toast.custom | → ToastCheckInSuccessful — ⚠️ **HARDCODE** (xem §5) |
| 2 | `order-promo-rewards-dialog.tsx:155` | error | `global.failedLoadPromotions` |
| 3 | `order-promo-rewards-dialog.tsx:224` | success | `global.promoRewardsApplied` |
| 4 | `use-pending-actions.ts:58` | error | `global.createOrderFailed` |
| 5 | `use-pending-actions.ts:67` | error | `global.startAppointmentCheckoutFailed` |
| 6 | `use-pending-actions.ts:117` | error | `global.syncOrderFailed` |
| 7 | `use-merge-order.ts:104` | error | `global.mergeOrdersFailed` |
| 8 | `use-order-item.ts:211` | error | `result.error` (chuỗi động từ server — không dịch) |
| 9 | `use-appointment-checkout-action.ts:48` | warning | `global.staffInactiveSelectAnother` {name} |
| 10 | `use-appointment-checkout.ts:87` | error | `global.customerAlreadyHasOrder` |
| 11 | `use-appointment-checkout.ts:148` | error | `global.cannotCheckoutWithoutStaff` |
| 12 | `use-appointment-checkout.ts:196` | warning | `global.staffInactiveSelectAnother` {name} |
| 13 | nút In (print) trong order footer | error toast | ⚠️ **HARDCODE** "Printer not connected" — xác minh qua MCP (bấm In khi chưa kết nối máy in). Scan **ép kích hoạt** ở bước order-flow. |

> Toast khác khó kích hoạt tự động (cần lỗi mạng/điều kiện nghiệp vụ) → scan tự động **không** ép mở; chỉ bắt nếu tình cờ xuất hiện. Riêng **toast nút In** thì scan chủ động bấm nút In để kích hoạt.

---

## 3. Popup / Dialog (19) — trigger đã xác minh qua MCP

Cột **Mở được** = xác nhận mở trên app thật. Cột **Trigger** = cách mở đã kiểm chứng.

| Dialog | file:line | Trigger (đã verify) | Chuỗi chính | Mở được |
|--------|-----------|--------------------|-------------|:-------:|
| **Quick Pay** | `quick-pay-dialog.tsx:100-167` | click h3 "Quick Pay" (cần staff) | heading *Quick Pay* · *Custom Amount* · *Apply Discount* · placeholder *Service Name* / *Add note* / *$0.00* · *Add* / *Close* · ⚠️ aria *Reset amount* | ✅ |
| **Sell Gift Card** | `sell-gift-card-dialog.tsx:194-437` | click h3 "Gift Card" | heading *Sell Gift Card* · tab *Bonus*/*Discount* · *Card Number* · *Custom Amount* · *Max $10,000.00* · *Total Balance* · *Customer Pays* · *Add*/*Scan*/*Close* · placeholder *Enter gift card code* | ✅ |
| **Gift Card History** | `sell-gift-card-history-dialog.tsx:137-243` | trong Sell Gift Card → *View details* / *View all* | *Gift Card History* / *Gift Card Details* · *Add funds* · *No transaction history* | 🔁 (từ Gift Card) |
| **QR Scanner (gift card)** | `sell-gift-card-qr-scanner.tsx:81-127` | trong Sell Gift Card → *Scan* | *Scan QR code* · *Align QR code* · *Input gift card code* · *Confirm* | 🔁 (cần camera) |
| **Order Note** | `order-note-dialog.tsx:74-104` | click "Note" (order summary) | heading *Order Note* · placeholder *Order note* · *Save*/*Close* · đếm *0/80* | ✅ 🔴 |
| **Promo & Rewards** | `order-promo-rewards-dialog.tsx:238-459` | click "Promo & Rewards" | heading *Promo & Rewards* · tab *Percentage %*/*Amount $* · *Promotions*/*No promotions available* · *Custom Discount* · *Rewards*/*No rewards available* · *Apply* · aria *Order promotion discount setting* | ✅ 🔴 |
| **Add Promotion** | `order-add-promotion-dialog.tsx:55-162` | trong Promo & Rewards | *Add Promotion* · *Confirm* · ⚠️ nhãn mẫu HARDCODE | 🔁 |
| **Add Reward** | `order-add-reward-dialog.tsx:40-95` | trong Promo & Rewards | *Add Reward* · *Confirm* · ⚠️ nhãn mẫu HARDCODE | 🔁 |
| **Select Staff First** (cảnh báo) | `service-warning-dialog.tsx:32-39` | Quick Pay / chọn service khi **chưa** có staff | heading *Select Staff First* · *Please select a staff before choosing services.* · *Done* | ✅ |
| **Xoá order** | `order-info.tsx:62-65` | Delete Order | `global.deleteOrder` · `global.deleteOrderConfirm` · delete/cancel | 🔴 |
| **Gỡ SĐT khách** | `order-info.tsx:138-141` | gỡ khách khỏi đơn | `global.removeCustomerPhone` · confirm | 🔴 |
| **Xem note khách** | `customer-view-note-dialog.tsx:32-51` | mở note khách | `global.customerNote` · *Done* | 🔴 |
| **Merge Order** | `merge-order-dialog.tsx:64-102` (portal `dialog-secondary.tsx:320`) | click "Merge Order"/"Gộp đơn" (order footer) | heading *Merge Order* (→ *Gộp đơn*) · placeholder *Search order ID, customer name or phone* · *Merge*/*Close* · ⚠️ thẻ đơn leak **"Unknown"/"Processing"/"N/A"** | ✅ 🔴 |
| **Customer Info** | `customer-information-dialog.tsx:55-58` | chọn/ thêm khách | `global.customerInformation` · form label (đã `t()`) · *Save* | 🔴 |
| **Customer Order Detail** | `customer-order-detail-dialog.tsx:19` | xem đơn của khách | `global.orderDetails` | 🔴 |
| **Remove item/staff/store** | `order-items.tsx:313-345` | Remove trên dòng đơn | `global.removeServiceItem`/`removeStaff`/`removeStore`/`removeInactiveStaff` + …Confirm + *Remove* | ✅ 🔴 |
| **Change staff** | nút `order-item/index.tsx:102` → dialog `alert-dialog.tsx:182` | click "Change Staff"/"Đổi nhân viên" → chọn staff khác | heading *Change from X to Y?* (→ *Đổi từ X sang Y?*) · *This action will update the staff assigned to this services.* · *Cancel*/*Confirm* — **đã dịch** | ✅ |
| **Order item (edit)** | `order-item-dialog.tsx:80-136` | click dòng dịch vụ trong đơn | placeholder *Add note* · *Save* · ⚠️ aria *Reset amount* | 🔴 |
| **Mở đơn appointment** | `order-appointment-card.tsx:115-118` | mở appointment từ home | `global.openAppointmentOrder` · *Continue*/*Cancel* | 🔴 |

---

## 4. Global search & Scanner (header)

| Chức năng | Trigger | Ghi chú |
|-----------|---------|---------|
| Tìm kiếm toàn cục | textbox "Search..." ở header (hoặc Ctrl+K) | popup tìm kiếm |
| Scanner (QR đơn) | button "Scanner" ở header | thường cần camera → có thể không mở được CI |
| 🔔 3 icon header phải | xem §4c | 3 panel: Thông báo / Chấm công / Thiết bị |

---

## 4c. 3 icon trạng thái ở header phải (đã xác minh qua MCP)

3 nút icon góc phải header (không có nhãn — xem §4b) mở 3 panel. Vị trí xác định phải→trái:

| Vị trí (x) | Icon | Panel mở ra (là `[role=dialog]`) | Trạng thái | Nguồn |
|-----------|------|-------------|-----------|-------|
| Phải nhất | 🔔 Chuông | **Notifications** (Thông báo) | Tiêu đề/nút dịch OK, NHƯNG ⚠️ **nội dung thông báo còn tiếng Anh** | `header-notification.tsx:51` |
| Giữa | 🕐 Đồng hồ | **Time Keeping** (Chấm công) | ✅ VN sạch | header |
| Trái nhất | 🔗 Sơ đồ (badge ❗) | **Devices** (Thiết bị) | ✅ VN sạch | header |

> ⚠️ **Lỗi thật ở panel Thông báo:** nội dung như **"Kevin V appointment on 07/03/2026 10:15 AM has been confirmed."** hiển thị tiếng Anh giữa UI tiếng Việt (template `... appointment on ... has been confirmed` chưa dịch — xem §5 #10).

**Đã triển khai:** `scanHeaderPanels()` trong [`i18nHome.ts`](../../src/utils/i18nHome.ts) — click từng icon theo vị trí, quét portal panel bằng `detectDialog` (cả 3 panel đều là `[role=dialog]`).

> 🐞 **Vì sao trước đây scan báo "sạch" (false negative):** câu thông báo **chứa ngày** (`07/03/2026`) → luật `looksLikeData` cũ coi mọi chuỗi có ngày là "data" nên bỏ qua. **Đã sửa** trong [`i18nScan.ts`](../../src/utils/i18nScan.ts): một **câu** (kết thúc `.?!` hoặc có từ `has/been/is/...`) dù chứa ngày vẫn được coi là UI và bị flag; chỉ **dòng ngày trơ** (không phải câu) mới là data.

---

## 4b. 🔇 Nút icon không nhãn — a11y (đã xác minh qua MCP)

Các nút **chỉ có icon SVG**, KHÔNG text / aria-label / title. Không có chữ tiếng Anh để dịch → **không phải bug dịch**, NHƯNG là **lỗ hổng a11y** (screen reader không đọc được) và **điểm mù** của scan. Khuyến nghị: thêm `aria-label` (đã dịch) cho từng nút.

| Vị trí | Nút | Nguồn (data-tsd-source) |
|--------|-----|-------------------------|
| Header phải | Trạng thái thiết bị/sync (badge ❗) · Đồng hồ/giờ · Chuông thông báo | `components/ui/button.tsx:92` (component dùng chung) |
| Dải trạng thái mạng | Nút đóng banner "Internet connection restored" | `components/online-status-notification.tsx:177` |
| Footer đơn hàng | **Nút In (print)** (nền xanh) · Nút gọi/chuông (nền cam) | `components/ui/button.tsx:92` — ⚠️ nút In còn bắn toast tiếng Anh "Printer not connected" (xem §2 #13, §5 #9) |
| Bàn phím SĐT | Nút xoá (backspace) | `components/keypad.tsx:137` |
| Cột khách | Nút mở/gập accordion | `components/ui/accordion.tsx:129` |

**Đã triển khai trong scan:** `detectScope` bổ sung danh sách `noName` (gom theo file nguồn), hiển thị ở mục **"🔇 Nút icon thiếu nhãn"** trong báo cáo HTML — chỉ báo cáo, không làm fail. Xem [`i18nScan.ts`](../../src/utils/i18nScan.ts).

---

## 5. ⚠️ Chuỗi HARDCODE — mục tiêu chính scan phải bắt được

Đây là các chuỗi **chưa qua `t()`** — lỗi dịch thật:

| # | file:line | Text | Ghi chú |
|---|-----------|------|---------|
| 1 | `toast-check-in-successful.tsx:12,14` | "Check-in successful" + mô tả | Toast đang dùng thật |
| 2 | `service-items.tsx:88` | "No services available." | Empty-state |
| 3 | `service-category.tsx:183-187` | "Product / Products / Service / Services" | + vi phạm plural ternary |
| 4 | `gift-card.constants.ts:17-20` | "Active / Inactive / Used Up / Not Sold Yet" | Render ở gift-card-status-badge |
| 5 | `customer-add-group-dialog.tsx:43,46,79` | "Group name is required." … | Zod validation |
| 6 | `customer-information-form.tsx:57,67` | "Phone number is required" … | Zod validation |
| 7 | aria-label hardcode | `quick-pay-dialog.tsx:124`, `order-item/index.tsx:168-169`, `order-item-dialog.tsx:106`, `pending-sidebar.tsx:101`, `pending-sidebar-header.tsx:18`, `order-appointment-card.tsx:74`, `order-add-promotion-dialog.tsx:140` | "Reset amount", "Discount", "Pending Orders sidebar", "Syncing", "Close", "Percent" |
| 8 | `order-add-promotion-dialog.tsx:80,99` / `order-add-reward-dialog.tsx:57,72,87` | "Spring Sale 20% off", "1000 Points for 10% off"… | ⚠️ Có thể là **data mẫu/mock** — xác nhận trước khi dịch |
| 9 | toast nút In (print) | **"Printer not connected"** | ✅ Scan **bắt được** (verify 2 lần). Bấm nút In (nền xanh `rgb(86,105,255)`) khi chưa có máy in → toast. Đã thêm `printer`/`connected` vào từ điển. |
| 10 | panel Thông báo (`header-notification.tsx`) | **"... appointment on \<ngày\> has been confirmed."** (template) | ✅ Xác minh qua MCP. Nội dung thông báo chưa dịch. Scan bắt được sau khi sửa luật câu-có-ngày (xem §4c). |

---

## 6. KHÔNG phải lỗi dịch — scan phải BỎ QUA

- Ký hiệu `%` / `$`, placeholder `$0.00` / `0.00` / `"0"` / `--:--`.
- Value/data field: tên khách, tên service, `group.name`, tên danh mục HOA ("WAXING", "ACRYLIC"…), mã đơn `OD…`.
- Chuỗi động từ server (`result.error`).
- **Dòng ngày/giờ trơ** (data): `07/01/2026`, `12:17 AM`, dòng lịch hẹn `09:15 AM Anna Khuu`.

> Đây đúng theo Rule 11 của bộ quy tắc dịch — token giá trị/format không dịch.
> ⚠️ **NGOẠI LỆ:** một **câu hoàn chỉnh** (kết thúc `.?!` hoặc có từ `has/been/is/are/will/…`) **có chèn ngày** thì **VẪN là UI cần dịch**, KHÔNG phải data — ví dụ notification "... appointment on 07/03/2026 has been confirmed." (xem §4c).

---

## 7. Ánh xạ sang implementation quét động Home

Các trigger đã verify sẽ được khai báo trong `HOME_POPUP_DEFS` (xem [`src/utils/i18nHome.ts`](../../src/utils/i18nHome.ts)):

| Popup | prep (điều kiện) | open trigger |
|-------|------------------|--------------|
| Sell Gift Card | — | h3 "Gift Card" |
| Quick Pay (cảnh báo staff) | — (không chọn staff) | h3 "Quick Pay" |
| Quick Pay (thật) | chọn staff | h3 "Quick Pay" |
| Order Note | chọn staff + service | button "Note"/"Lưu ý" |
| Promo & Rewards | chọn staff + service | button "Promo & Rewards" |
| Merge Order (Gộp đơn) | chọn staff + service | button "Merge Order"/"Gộp đơn" |
| Change Staff (Đổi nhân viên) | chọn staff + service | button "Change Staff" → chọn staff khác |
| Global Search | — | Ctrl+K / textbox Search |
| QR Scanner | — | button "Scanner" |
| Toast nút In | chọn staff + service | click nút In (icon-only, **nền xanh `rgb(86,105,255)`**) → poll `detectToasts`. Lưu ý: phải đóng sạch overlay trước (dismissDialog), và tìm theo màu (KHÔNG theo vị trí sibling — footer re-render sau Change Staff). |
| 3 panel header | — | `scanHeaderPanels()`: click 3 icon phải header → `detectDialog` |

> Mỗi trigger khai **nhiều fallback** (role+name EN/VN → text → css) vì khi quét app đang ở Tiếng Việt, nhãn EN sẽ không khớp.
