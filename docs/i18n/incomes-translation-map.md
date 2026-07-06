# Bản đồ dịch thuật — 3 trang Báo cáo thu nhập (Incomes)

> **Phạm vi:** Daily Sale Report (`/incomes/income-daily`) · Income Summary (`/incomes/income-summary`) · Staff Income (`/incomes/income-staff`).
> **Nguồn:** phân tích source (file:line) + xác minh động MCP Playwright (`localhost:1420`, 2026-07-02).
> **Trạng thái app khi quét (MCP):** tiếng Anh. Cả 3 route **gated** (passcode chủ 8888).
> **Dùng để:** đặc tả cho quét động Incomes — xem [`vietnamese-scan-flow.md`](vietnamese-scan-flow.md) §3.4.
> **Triển khai:** [`src/utils/i18nIncomes.ts`](../../src/utils/i18nIncomes.ts) · spec riêng [`TC-i18n-incomes-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-incomes-vietnamese-scan.spec.ts).

Ký hiệu: ✅ đã xác minh qua MCP · ⚠️ HARDCODE (chưa `t()`) · 🔁 cần điều kiện/dữ liệu.

---

## 0. Tổng quan (xác minh qua MCP)

Cả 3 route dùng chung khung: **Passcode gate → DatePicker (preset + lịch) → Bảng dữ liệu → click hàng mở panel chi tiết → (Print / Order Details)**.

| Điểm          | Kết quả                                                         |
| ------------- | --------------------------------------------------------------- |
| Toast         | ❌ không có toast ở cả 3 route                                  |
| data-testid   | chỉ 1 (`income-offline-banner`) → còn lại select theo text/role |
| Passcode gate | ✅ cả 3 khoá bằng **dialog owner-passcode**                     |
| Dialog        | **Order Details** (cả 3)                                        |
| Button        | **Print** (cả 3), **Show more/Show less** (summary)             |
| Tab           | **Day / Week / Month** (income-summary)                         |
| Search        | **Search staff** (income-staff)                                 |
| Calendar      | widget dùng chung (giống order-pending/order-history)           |

---

## 1. Passcode gate (dialog dùng chung — ✅ `[role=dialog]`)

Vào bất kỳ route income nào khi chưa mở khoá → dialog keypad:

| Element  | Text (EN)                                         |
| -------- | ------------------------------------------------- |
| Tiêu đề  | _Enter your passcode_                             |
| Keypad   | 1–9, 0 (data-neutral)                             |
| Checkbox | _Do not require passcode for the next 30 minutes_ |

> Nhập `8888` (env `OWNER_PASSCODE`) + tick "30 minutes" → các route income sau **không** hỏi lại. Route-scan tự nhập passcode nhưng **không quét text dialog** → `scanIncomesGate` quét dialog này (chạy trước khi nhập passcode).

---

## 2. Income Summary — `/incomes/income-summary`

| Element                | Text (EN)                                                 | Trạng thái                        |
| ---------------------- | --------------------------------------------------------- | --------------------------------- |
| Tabs                   | **Day / Week / Month**                                    | ✅ verify                         |
| DatePicker             | preset _Today_ + nút lịch (`icon-calendar`)               | ✅ verify                         |
| Empty (chưa chọn hàng) | _No detail to show_                                       | ✅ verify                         |
| Button                 | **Show more / Show less**                                 | 🔁 khi có nhiều dòng              |
| Button                 | **Print**                                                 | 🔁 trong panel chi tiết           |
| Hàng dữ liệu           | click → panel chi tiết tại chỗ (payment/sale/staff/salon) | ✅ (đã cover ở flow §9)           |
| Dialog                 | **Order Details**                                         | 🔁 mở từ 1 đơn trong chi tiết     |
| Lưới lịch              | "July 2026" / "Mo Tu We Th Fr Sa Su"                      | ⚠️ react-day-picker chưa localize |

---

## 3. Staff Income — `/incomes/income-staff`

| Element    | Text (EN)                                                      | Trạng thái   |
| ---------- | -------------------------------------------------------------- | ------------ |
| Search     | placeholder **Search staff**                                   | ✅ verify    |
| Bảng — cột | **Name · Orders · Subtotal · Supply Fee · Tip · Total Income** | ✅ verify    |
| Empty      | _No detail to show_                                            | ✅ verify    |
| DatePicker | _Today_ + lịch                                                 | ✅ verify    |
| Hàng staff | click → panel chi tiết (tên staff + clock/salary/pay)          | ✅ (flow §9) |
| Button     | **Print** (trong panel chi tiết)                               | ✅ verify    |
| Dialog     | **Order Details**                                              | 🔁           |

---

## 4. Daily Sale Report — `/incomes/income-daily`

| Element              | Text (EN)                                                                        | Trạng thái  |
| -------------------- | -------------------------------------------------------------------------------- | ----------- |
| Bảng dữ liệu + Print | tương tự 2 trang trên                                                            | 🔁          |
| Dialog               | **Order Details**                                                                | 🔁          |
| DatePicker           | _Today_ + lịch                                                                   | ✅          |
| **Lỗi tải**          | ⚠️ **"Failed to load store daily income data!"** + **"Please try again later."** | ⚠️ HARDCODE |

### ⚠️ i18n gap DUY NHẤT (nên fix trong source)

`income-daily-error.tsx:5-6` — 2 chuỗi **hardcode** trong khi **đã có key sẵn**:
| Text hardcode | Key có sẵn |
|---------------|-----------|
| _Failed to load store daily income data!_ | `global.failedLoadDailyIncome` |
| _Please try again later._ | `global.tryAgainLater` |

> Chỉ cần thay 2 chuỗi bằng `t(global.failedLoadDailyIncome)` / `t(global.tryAgainLater)`. Lỗi này khó ép tự động (cần load fail) → scan chỉ bắt nếu tình cờ; ghi nhận thủ công.

---

## 5. Ánh xạ sang implementation (`i18nIncomes.ts`)

| Hàm / def               | Quét gì                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scanIncomesGate`       | dialog passcode ("Enter your passcode" / "Do not require…") — chạy TRƯỚC khi nhập passcode                                                               |
| `INCOMES_POPUP_DEFS`    | DatePicker lịch (icon-calendar) — screenshot + aria                                                                                                      |
| `scanIncomesDatePicker` | lưới lịch — dò tên tháng/thứ tiếng Anh (như order-history)                                                                                               |
| `scanIncomesDetail`     | click hàng đầu (summary + staff) → **cuộn hết panel** (`scrollThroughPage`) → panel chi tiết (Print, headings) → best-effort mở **Order Details** dialog |

> Route body (tabs/headings/Search/empty/Today) đã được **route-scan** bao (STATIC_ROUTES, gated). Deep-scan thêm: **dialog passcode**, **lưới lịch**, **panel chi tiết + Print + Order Details**.
> **Cuộn hết trang:** `scanRoute` (STATIC_ROUTES) và cả 2 lần bắt chuỗi trong `TC-i18n-screen-compare` gọi `scrollThroughPage()` (cuộn window + mọi khung overflow từ trên xuống dưới rồi về đầu) trước khi quét → nội dung lazy/dưới màn hình mới mount được bắt hết.

---

## 6. KHÔNG phải lỗi dịch — bỏ qua

- Số tiền `$...`, ngày/giờ trơ, tên staff/đơn (data).
- `income-offline-banner` = trạng thái mạng (đã có xử lý riêng).

---

## 7. Trạng thái quét (cập nhật qua Skill `i18n-vietnamese-scan`)

| Ngày quét  | Màn            | Chuỗi UI | ❌ Chưa dịch                 | ⚠️ Sai chuẩn                   | 📐 UI vỡ | ✅ Đúng | Kết quả chi tiết                                               |
| ---------- | -------------- | -------- | ---------------------------- | ------------------------------ | -------- | ------- | -------------------------------------------------------------- |
| 2026-07-06 | income-daily   | 40       | 1 (`Tip`)                    | 3 (`Sale`→Doanh thu)           | 0        | 36      | [income-daily-i18n-result.md](income-daily-i18n-result.md)     |
| 2026-07-06 | income-summary | 23       | 1 (`Tip`) + `Pay 1`/`Pay 2`ᵈ | 3 (`Gross/Net Income`, `Sale`) | 0        | 19      | [income-summary-i18n-result.md](income-summary-i18n-result.md) |
| 2026-07-06 | income-staff   | 23       | 1 (`Tip`) + `Pay 1`/`Pay 2`ᵈ | 0ᵛ                             | 0        | 22      | [income-staff-i18n-result.md](income-staff-i18n-result.md)     |

> ᵈ chỉ deep-scan (`TC-i18n-incomes`, mở panel chi tiết) bắt được — không nằm trong compare view mặc định.
> ᵛ view mặc định 0; `Rate`→"Tỉ lệ" (VP-2267) ở panel chi tiết Salary compare chưa với tới.
>
> Nguồn: `TC-i18n-screen-compare` (EN↔VI) + `TC-i18n-incomes` (deep) → `reports/<khoá>/compare.{json,html}` · `reports/i18n-audit/incomes-scan.{json,html}`.
> **Cuộn hết trang:** compare + route-scan gọi `scrollThroughPage()` trước khi bắt chuỗi; `scanIncomesDetail` thêm `expandPanelSections()` mở khối thu gọn (Staff Payout) → bắt được `Pay 1`/`Pay 2` ([VP-2253](https://linear.app/fastboy/issue/VP-2253)).
> **Đối chiếu VP-2252:** glossary bổ sung `Sale`→Doanh thu ([VP-2268](https://linear.app/fastboy/issue/VP-2268)/[VP-2259](https://linear.app/fastboy/issue/VP-2259)), `Gross Income`→Tổng thu nhập & `Net Income`→Thu nhập thực nhận ([VP-2256](https://linear.app/fastboy/issue/VP-2256)), `Net Total`→Doanh thu thuần ([VP-2258](https://linear.app/fastboy/issue/VP-2258)), `Rate`→Mức lương ([VP-2267](https://linear.app/fastboy/issue/VP-2267)).
> **Còn hạn chế:** `Net Total` (VP-2258) và `Rate` (VP-2267) nằm trong panel chi tiết → compare view-mặc-định chưa bắt; đã thêm vào glossary sẵn, cần mở rộng compare để deep-scan panel là tự gắn cờ.
> Lỗi chung: label lẻ **"Tip"** chưa bọc `t()` ở **cả 3 màn** (cùng component) → fix một chỗ.
