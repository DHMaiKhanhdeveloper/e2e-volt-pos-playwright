---
title: Test Cases — Daily Sale Report (/incomes/income-daily)
source-linear: 'https://linear.app/fastboy/document/income-report-cd80210c48f3 (offline docs/linear/income-report.md)'
feature-doc: docs/features/income-daily.md
scanned-at: 2026-07-06
code-status: 'ĐÃ CÓ SẴN — page object src/pages/pos/DailySaleReportPage.ts + 44 TC trong tests/regression/incomes/daily-sale-report/. Skill 2 tài liệu-hoá coverage hiện có, KHÔNG regen/đè code.'
---

# Test Cases — Daily Sale Report (`/incomes/income-daily`)

> Đầu ra **Skill 2/4** (`linear-testcase-gen`). Màn này **đã có code test đầy đủ** (page object + 44 TC).
> File này **tài liệu-hoá** bộ TC đang chạy (mỗi TC map 1-1 với một `test()` trong `tests/regression/incomes/daily-sale-report/`),
> để đối chiếu với spec Linear. Không sinh/đè code mới cho màn này.

## Cách chạy

```bash
npx playwright test tests/regression/incomes/daily-sale-report
```

## Bảng test case (đã hiện thực trong code)

| ID          | Tiêu đề                                                 | Tiền điều kiện        | Các bước                  | Kết quả mong đợi                                                            | Loại            | Ưu tiên | File                |
| ----------- | ------------------------------------------------------- | --------------------- | ------------------------- | --------------------------------------------------------------------------- | --------------- | ------- | ------------------- |
| TC-1        | Default filter = Today, full layout renders             | Passcode đã mở        | Mở /incomes/income-daily  | URL có `from=<today midnight>`; 4 card + panel hiển thị                     | regression      | P1      | defaults            |
| TC-3        | Card description — Total Order                          | như trên              | Đọc `<p>` dưới heading    | Đúng text "Total number of order, excluding cancel/refunds/ manual refunds" | regression      | P2      | defaults            |
| TC-5        | Card description — Sale                                 |                       | Đọc `<p>`                 | Đúng text mô tả Sale                                                        | regression      | P2      | defaults            |
| TC-7        | Card description — Total Tip                            |                       | Đọc `<p>`                 | Đúng text mô tả Tip                                                         | regression      | P2      | defaults            |
| TC-9        | Card description — Total Payment                        |                       | Đọc `<p>`                 | Đúng text mô tả Total Payment                                               | regression      | P2      | defaults            |
| TC-10       | Mỗi card có nhãn `<n>% vs Yesterday`                    |                       | Đọc từng card             | Cả 4 card có badge % + "vs Yesterday"                                       | regression      | P2      | defaults            |
| TC-14       | Order # đầu tiên đúng format `OD\d{6}-\d+`              | Ngày có order         | Đọc cell Order # đầu bảng | Khớp regex                                                                  | regression      | P1      | defaults            |
| TC-25       | Nút Print enabled & click được                          |                       | Click Print               | Không lỗi, dialog in mở                                                     | regression      | P2      | defaults            |
| TC-2/4/6/8  | Refund/Cancel: Sale/Total âm, Cancel không vào Sale     | Ngày có refund/cancel | Đọc bảng + panel          | Refund là số âm; order Cancel loại khỏi Sale/Tip                            | regression      | P1      | refund-cancel       |
| TC-8        | Total Payment nhất quán qua lifecycle (create → cancel) |                       | Theo dõi 1 order          | Total Payment cập nhật đúng                                                 | regression      | P1      | refund-cancel       |
| TC-22/23/37 | Refund/cancel edge trên panel                           |                       |                           | Panel phản ánh đúng                                                         | regression      | P2      | refund-cancel       |
| TC-11       | Mặc định chart = Sale khi load lần đầu                  |                       | Mở màn                    | `activeChart=sale`                                                          | regression      | P2      | chart-switching     |
| TC-27/28/29 | Click card đổi chart (Order/Tip/Payment)                |                       | Click từng card           | URL `activeChart=` đổi tương ứng                                            | regression      | P2      | chart-switching     |
| TC-30       | Chỉ card được click mang trạng thái selected            |                       | Click 1 card              | Chỉ card đó có class selected                                               | regression      | P2      | chart-switching     |
| TC-12       | Chọn hôm qua → load ngày hôm qua                        |                       | gotoDate(yesterday)       | Data + URL = hôm qua                                                        | regression      | P1      | date-filter         |
| TC-13       | Ngày không order → $0.00 mọi nơi                        |                       | Chọn ngày trống           | Tất cả `$0.00`/`0`                                                          | regression      | P1      | date-filter         |
| TC-39       | Ngày quá khứ khớp snapshot GraphQL settled              |                       | gotoDate(past)            | Bảng khớp snapshot                                                          | regression      | P1      | date-filter         |
| TC-15/17    | Cell Sale & Tip parse ra money hợp lệ                   | Ngày có data          | Đọc cell                  | Parse cents thành công                                                      | regression      | P2      | orders-table        |
| TC-18       | Total = Sale + Tip + Tax trên mỗi dòng                  |                       | Đọc từng dòng             | Đẳng thức đúng                                                              | regression      | P1      | orders-table        |
| TC-16       | Ngày settled tách tax vào Income Detail Tax Collected   |                       | Đọc panel                 | Tax Collected = tổng tax                                                    | regression      | P1      | payment-types       |
| TC-24       | Payment buckets Card/Cash/Others                        |                       | Đọc Payment Details       | Khớp GraphQL                                                                | regression      | P1      | payment-types       |
| TC-19/20/21 | Income/Payment Details khớp GraphQL + reconcile         |                       | Đọc panel + so API        | Trùng khớp; live: tip vào Total Tip & Amount Collected chứ không vào Sale   | regression      | P1      | math + live-delta   |
| TC-26       | Mọi money render dạng `$#,##0.00`                       |                       | Quét toàn màn             | Đúng định dạng                                                              | regression      | P2      | math                |
| TC-31       | Reload giữ `activeChart` + `from/to` trong URL          |                       | Reload                    | UI phản ánh đúng URL                                                        | regression      | P2      | url-persistence     |
| TC-32       | Mở route hiện passcode dialog trước khi render data     | Chưa mở passcode      | Mở route                  | Dialog passcode chặn data                                                   | regression/auth | P1      | permission          |
| TC-33       | Passcode sai → dialog vẫn mở, không unlock              |                       | Nhập sai                  | Dialog còn, data ẩn                                                         | regression/auth | P1      | permission          |
| TC-34       | Tick "Do not require passcode 30m" bỏ qua lần sau       |                       | Tick + nhập               | Lần sau không hỏi                                                           | regression/auth | P2      | permission          |
| TC-35       | Click 1 dòng mở Order Details dialog + set `?orderId`   | Ngày có order         | Click dòng                | Dialog mở, URL có orderId                                                   | regression      | P1      | order-detail-dialog |
| TC-36       | Đóng dialog qua ESC / × / mở dòng khác                  |                       | ESC / click × / dòng khác | Dialog đóng, orderId clear/replace                                          | regression      | P2      | order-detail-dialog |
| TC-40       | Skeleton hiện khi đang load                             |                       | Mở màn                    | `[data-slot=skeleton]` xuất hiện                                            | regression      | P3      | edge-cases          |
| TC-41       | Error fallback khi GraphQL 500                          | Mock 500              | Mở màn                    | Hiện "Failed to load…"                                                      | regression      | P2      | edge-cases          |
| TC-42       | %vs Yesterday không Infinity/NaN khi hôm qua = 0        |                       | Chọn ngày sau ngày trống  | Badge hiển thị hợp lệ                                                       | regression      | P2      | edge-cases          |
| TC-43       | Split-tender order hiện qua Card/Cash/Gift Card         | Mock split            | Đọc Payment Details       | Chia đúng bucket                                                            | regression      | P2      | mocked-scenarios    |
| TC-44       | Timezone boundary — UI theo merchant-local day          |                       | gotoDate quanh biên TZ    | Cửa sổ ngày đúng theo shop TZ                                               | regression      | P1      | mocked-scenarios    |

**Tổng: 44 test (TC-1 … TC-44)**, chia 13 file spec theo cluster.

## Ghi chú i18n / quyền

- Toàn bộ route bọc bởi `PermissionProtectedRoute` (passcode owner). Xem `PasscodeDialog`.
- i18n coverage cho màn này được xử lý ở **Skill 5** (`i18n-vietnamese-scan`) — xuất `docs/i18n/income-daily-i18n-result.md`.
