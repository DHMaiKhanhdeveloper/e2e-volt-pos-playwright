# Luồng quét Tiếng Việt — Thứ tự thực thi đầy đủ (Tĩnh + Động)

> **File gốc (đặc tả chi tiết theo từng đợt cập nhật):** [`vietnamese-scan-flow.md`](vietnamese-scan-flow.md)
> **File này (bổ sung):** liệt kê **TOÀN BỘ màn hình/bề mặt** mà [`TC-i18n-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts) đi qua, theo **đúng thứ tự chạy trong code** — gộp chung **Tĩnh (STATIC_ROUTES)** và **Động (click/tương tác mới hiện)** vào một luồng số thứ tự duy nhất, thay vì tách bảng theo nhóm như mục 1b của file gốc.

Ký hiệu:

- **[TĨNH]** — route điều hướng trực tiếp, quét thân trang ngay khi vào (`scanRoute` / `STATIC_ROUTES`).
- **[ĐỘNG]** — chỉ hiện sau khi **click/tương tác** (mở dialog, click hàng, mở tab, mở dropdown…).
- **[MANUAL]** — không tự động kích hoạt được (cần phần cứng/giao dịch thật) → ghi `reachable:false`, không tính vào cổng, chỉ để truy vết.

---

## Bước 0 — Chuẩn bị

| #   | Bước                                                                              | Loại   |
| --- | --------------------------------------------------------------------------------- | ------ |
| 0a  | `switchToVietnamese()` — mở `/settings/language`, chọn Tiếng Việt, Apply, Confirm | —      |
| 0b  | Kiểm tra `__TSR_ROUTER__` tồn tại (bắt buộc, fail ngay nếu thiếu)                 | —      |
| 0c  | Dialog **passcode Incomes** (trước khi mở khoá)                                   | [ĐỘNG] |

## Bước 1 — 22 route tĩnh (`STATIC_ROUTES`, đúng thứ tự khai báo)

| #   | Màn hình                                                    | Route                     | Nhóm     |
| --- | ----------------------------------------------------------- | ------------------------- | -------- |
| 1   | Trang chủ / POS                                             | `/home`                   | POS      |
| 2   | Đơn đang chờ                                                | `/order-pending`          | POS      |
| 3   | Lịch sử đơn hàng                                            | `/order-history`          | POS      |
| 4   | Lịch hẹn                                                    | `/appointment`            | POS      |
| 5   | Báo cáo thu nhập (index)                                    | `/incomes`                | Incomes  |
| 6   | Thu nhập theo ngày _(gated)_                                | `/incomes/income-daily`   | Incomes  |
| 7   | Tổng hợp thu nhập _(gated)_                                 | `/incomes/income-summary` | Incomes  |
| 8   | Thu nhập nhân viên _(gated)_                                | `/incomes/income-staff`   | Incomes  |
| 9   | Cài đặt (index)                                             | `/settings`               | Settings |
| 10  | Thông tin doanh nghiệp _(+ dò EN_DATETIME riêng — VP-2325)_ | `/settings/business`      | Settings |
| 11  | Dịch vụ & Sản phẩm                                          | `/settings/services`      | Settings |
| 12  | Nhân viên                                                   | `/settings/staffs`        | Settings |
| 13  | Vai trò                                                     | `/settings/roles`         | Settings |
| 14  | Quyền hạn _(expandAll)_                                     | `/settings/permissions`   | Settings |
| 15  | Hóa đơn (mẫu in)                                            | `/settings/receipt`       | Settings |
| 16  | Phí & Phụ thu                                               | `/settings/charge-fee`    | Settings |
| 17  | Hiển thị                                                    | `/settings/accessibility` | Settings |
| 18  | Ngôn ngữ                                                    | `/settings/language`      | Settings |
| 19  | Chấm công                                                   | `/time-tracking`          | System   |
| 20  | Lịch sử ca (Batch) _(gated)_                                | `/batch-history`          | System   |
| 21  | Két tiền                                                    | `/cash-drawer`            | System   |
| 22  | Màn hình khách hàng                                         | `/customer`               | System   |
| 23  | Yêu cầu cập nhật                                            | `/force-update`           | System   |
| 24  | Khách hàng · cập nhật                                       | `/customer/force-update`  | System   |

## Bước 2 — Trang chi tiết động (click item đầu danh sách) [ĐỘNG]

| #   | Từ danh sách         | Trigger                       | Kết quả            | Ghi chú / Cập nhật gần nhất                                                                                                                                                                                                                                             |
| --- | -------------------- | ----------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 25  | `/settings/staffs`   | click `a.cursor-pointer` đầu  | Chi tiết nhân viên | Quét 1 lần ở đây (thân trang chi tiết); **5 tab hồ sơ** (Thông tin/Thù lao/Kỹ năng dịch vụ/Giờ làm việc/Quyền hạn) được quét **riêng, sâu hơn** ở Bước 7 — gồm dropdown "Vai trò nhân viên" (VP-2272), "Pay 1/Pay 2" (VP-2273), "Closed" giờ làm việc (VP-2274).        |
| 26  | `/settings/roles`    | click `a`/`[role=button]` đầu | Chi tiết vai trò   | Chưa có bộ dò chuyên biệt riêng — dựa vào từ điển chung; chưa ghi nhận bug i18n mới tính đến 2026-07-08.                                                                                                                                                                |
| 27  | `/settings/services` | click item đầu                | Chi tiết danh mục  | Trùng route với **Bước 6** (`scanRowDetail` mở **dialog sản phẩm**) — đây là 2 lượt click khác nhau trên cùng list (chi tiết danh mục vs. dialog sản phẩm), không phải trùng lặp thật.                                                                                  |
| 28  | `/order-history`     | click item đầu                | Chi tiết đơn hàng  | Chỉ quét thân panel 1 lần ở đây; phần **sâu** (Hoá đơn, Hoàn tiền, dropdown "Phương thức hoàn tiền" VP-2312, ngày/giờ EN VP-2313) được quét riêng ở **Bước 8 · `scanOrderHistoryDetail`** — xem [`order-history-translation-map.md`](order-history-translation-map.md). |

## Bước 3 — Luồng đơn hàng / checkout (từ 1 order id lấy được) [ĐỘNG]

| #   | Sub-route                                | Tên                              |
| --- | ---------------------------------------- | -------------------------------- |
| 29  | `/order/$id` (`sub:''`)                  | Order / POS (Sửa đơn)            |
| 30  | `/order/$id/checkout`                    | Thanh toán (Checkout)            |
| 31  | `/order/$id/checkout/view-cart`          | Checkout · Xem giỏ hàng          |
| 32  | `/order/$id/checkout/processing-payment` | Checkout · Đang xử lý thanh toán |
| 33  | `/order/$id/checkout/payment-success`    | Checkout · TT thành công         |
| 34  | `/order/$id/payment-success`             | Thanh toán thành công            |
| 35  | `/order/$id/split-order`                 | Tách đơn                         |

**3a — [MANUAL] không tự kích hoạt được (cần giao dịch/phần cứng thật):**

| #   | Bề mặt                                                     | Mã bug  |
| --- | ---------------------------------------------------------- | ------- |
| 36  | Popup thẻ quà tặng không đủ số dư                          | VP-2306 |
| 37  | Toast xác nhận lịch hẹn ("… has been confirmed.")          | VP-2311 |
| 38  | Custom tip (thanh toán thẻ)                                | VP-2315 |
| 39  | Total Amount / "PRESENT CARD" (thanh toán thẻ)             | VP-2316 |
| 40  | Add Signature (thanh toán thẻ)                             | VP-2317 |
| 41  | Popup "Payment Successfully"                               | VP-2318 |
| 42  | Popup "Waiting for connect device"                         | VP-2319 |
| 43  | Popup "Getting ready to charge"                            | VP-2320 |
| 44  | Màn tiến hành thanh toán thẻ (present → read → Processing) | VP-2321 |

**3b — [ĐỘNG] quét LIVE (không cần phần cứng):**

| #   | Bề mặt                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------- |
| 45  | `scanCashOtherPayment` — chọn Tiền mặt/Khác → bàn phím số → "Tổng đã trả"/"Tiền thối"/"Còn lại" (không bấm Hoàn tất) |

## Bước 4 — Panel Thông báo (chuông 🔔) [ĐỘNG]

| #   | Bề mặt                             |
| --- | ---------------------------------- |
| 46  | Bảng thông báo (panel)             |
| 47  | Trang mở từ thông báo (→ Lịch hẹn) |

## Bước 5 — Popup / Dialog đăng ký sẵn (mở từ route chủ, quét, đóng) [ĐỘNG]

Gộp `POPUP_DEFS` + `HOME_POPUP_DEFS` + `ORDER_HISTORY_POPUP_DEFS` + `ORDER_PENDING_POPUP_DEFS` + `INCOMES_POPUP_DEFS` — mỗi định nghĩa là 1 dialog (ví dụ: Gift Card, Cảnh báo chọn nhân viên, Tìm kiếm toàn cục, Scanner, DatePicker Lịch sử đơn/Đơn đang chờ/Incomes…). Số lượng thay đổi theo phiên bản dictionary — xem trực tiếp 3 file `i18n*.ts` liên quan để đối chiếu danh sách mới nhất.

## Bước 6 — Panel chi tiết theo hàng (click row → panel/dialog) [ĐỘNG]

| #   | Từ danh sách              | Kết quả                                |
| --- | ------------------------- | -------------------------------------- |
| 48  | `/incomes/income-summary` | Tổng hợp thu nhập → chi tiết           |
| 49  | `/incomes/income-staff`   | Thu nhập nhân viên → chi tiết          |
| 50  | `/batch-history`          | Lịch sử ca → Batch Close Review        |
| 51  | `/settings/services`      | Dịch vụ & Sản phẩm → chi tiết (dialog) |

## Bước 7 — 5 tab hồ sơ nhân viên (+ dropdown vai trò) [ĐỘNG]

| #   | Tab             | Ghi chú                                                  |
| --- | --------------- | -------------------------------------------------------- |
| 52  | Thông tin       | + mở dropdown "Vai trò nhân viên" (VP-2272, best-effort) |
| 53  | Thù lao         | "Pay 1"/"Pay 2" (VP-2273)                                |
| 54  | Kỹ năng dịch vụ |                                                          |
| 55  | Giờ làm việc    | "Closed" (VP-2274)                                       |
| 56  | Quyền hạn       |                                                          |

## Bước 8 — Quét sâu 3 màn còn lại [ĐỘNG]

| #   | Màn                                                           | Hàm                          |
| --- | ------------------------------------------------------------- | ---------------------------- |
| 57  | Lịch sử đơn hàng — Bộ lọc (+4 dropdown con)                   | `scanOrderHistoryFilter`     |
| 58  | Lịch sử đơn hàng — Lịch (calendar grid EN)                    | `scanOrderHistoryDatePicker` |
| 59  | Lịch sử đơn hàng — chi tiết (Hoá đơn, Hoàn tiền, EN_DATETIME) | `scanOrderHistoryDetail`     |
| 60  | Đơn đang chờ — Bộ lọc nhân viên/Sắp xếp/DatePicker preset     | `scanOrderPendingFilter`     |
| 61  | Đơn đang chờ — Lịch (calendar grid EN)                        | `scanOrderPendingDatePicker` |
| 62  | Đơn đang chờ — dialog guard khi mở thẻ đơn                    | `scanOrderPendingCardOpen`   |
| 63  | Incomes — Lịch (calendar grid EN)                             | `scanIncomesDatePicker`      |
| 64  | Incomes — panel chi tiết (Print + Order Details dialog)       | `scanIncomesDetail`          |

## Bước 9 — Home order-flow + Customer Display + Chấm công + Tách đơn (chạy CUỐI vì mutate dữ liệu) [ĐỘNG]

| #   | Bề mặt                                                                       | Hàm                     |
| --- | ---------------------------------------------------------------------------- | ----------------------- |
| 65  | Tạo đơn (staff+service đầu) → Ghi chú đơn, Khuyến mãi & Thưởng               | `scanHomeOrderDialogs`  |
| 66  | `/customer` khi đơn đang mở (Order Details/Subtotal/Promotion/xác nhận SĐT…) | `scanCustomerDisplay`   |
| 67  | Dialog Chấm công ("No staffs found" — VP-2246)                               | `scanTimeKeepingDialog` |
| 68  | Tách đơn — tab "Check" + luồng thanh toán tách đơn                           | `scanSplitOrder`        |

---

## Tổng quan số lượng

- **Tĩnh:** 24 route (Bước 1).
- **Động (tự động quét được):** ~44 bề mặt (Bước 2, 3(base+3b), 4–9), số popup ở Bước 5 phụ thuộc `POPUP_DEFS`/`*_POPUP_DEFS` hiện có.
- **Manual (không tự kích hoạt):** 9 bề mặt (Bước 3a) — không tính vào cổng gate, chỉ để truy vết theo mã bug VP-2115.
- **Cổng tối thiểu:** `scans.length >= 40` (xem [`TC-i18n-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts) bước 7) — chống hồi quy khi luồng quét bị rớt bề mặt.

> Khi thêm/bớt bề mặt trong spec, cập nhật cả file này (thứ tự chạy) lẫn [`vietnamese-scan-flow.md`](vietnamese-scan-flow.md) (đặc tả chi tiết + lịch sử theo bug).
