---
title: Test Cases — Staff Income (/incomes/income-staff)
source-linear: 'https://linear.app/fastboy/document/income-report-cd80210c48f3 (offline docs/linear/income-report.md)'
feature-doc: docs/features/income-staff.md
scanned-at: 2026-07-06
code-status: 'MỚI — chưa có page object/spec. Skill 2 sinh IncomeStaffPage.ts + spec TC-IST-*.'
---

# Test Cases — Staff Income (`/incomes/income-staff`)

> Đầu ra **Skill 2/4**. Màn **Staff Income** chưa có code test → skill này **sinh mới** page object + spec.
> Mọi selector bắt nguồn từ quét Playwright MCP (2026-07-06). Các TC cần data staff (rows/detail) được
> đánh dấu **[data]** và tự **skip** khi ngày quét không có staff phát sinh (đúng pattern Cluster của Daily).

## Cách chạy

```bash
npx playwright test tests/regression/incomes/income-staff
```

## Bảng test case

| ID                   | Tiêu đề                                                                          | Tiền điều kiện        | Các bước                 | Kết quả mong đợi                                                                                        | Loại            | Ưu tiên |
| -------------------- | -------------------------------------------------------------------------------- | --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- | --------------- | ------- |
| TC-IST-01            | Route bị chặn bởi passcode dialog                                                | Chưa mở passcode      | Mở /incomes/income-staff | Dialog "Enter your passcode" hiện trước khi render data                                                 | regression/auth | P1      |
| TC-IST-02            | Passcode đúng mở màn, hiển thị tiêu đề "Staff Income"                            |                       | Nhập 8888                | Heading "Staff Income" + thanh tổng hiển thị                                                            | regression/auth | P1      |
| TC-IST-03            | Default filter = Today, URL có from/to                                           | Passcode mở           | Mở màn                   | URL chứa `from=<today midnight>`&`to=`                                                                  | regression      | P1      |
| TC-IST-04            | Thanh tổng có đủ 6 chỉ số                                                        |                       | Đọc header stats         | Total staff, Total orders, Total subtotal, Total supply fee, Total tip, Total staff income đều hiển thị | regression      | P1      |
| TC-IST-05            | Ô Search staff hiển thị & nhập được                                              |                       | Focus + gõ               | Textbox "Search staff" nhận input                                                                       | regression      | P2      |
| TC-IST-06            | Combobox preset ngày mặc định "Today"                                            |                       | Đọc combobox             | Text = "Today"                                                                                          | regression      | P2      |
| TC-IST-07            | Nút calendar hiển thị đúng ngày `MM/DD/YYYY`                                     |                       | Đọc nút                  | Accessible name khớp regex ngày                                                                         | regression      | P2      |
| TC-IST-08            | Panel chi tiết rỗng khi chưa chọn staff                                          |                       | Không chọn staff         | Hiện "No detail to show — Select staff to preview income details or print reports."                     | regression      | P2      |
| TC-IST-09            | Ngày không có staff → "No results found." + tổng $0.00/0                         | Ngày trống            | gotoDate(ngày trống)     | List "No results found."; các tổng tiền = $0.00, đếm = 0                                                | regression      | P1      |
| TC-IST-10            | Chọn ngày quá khứ đổi from/to trên URL                                           |                       | gotoDate(past)           | URL phản ánh ngày đã chọn                                                                               | regression      | P2      |
| TC-IST-11            | Reload giữ from/to trong URL                                                     |                       | Reload sau gotoDate      | UI + URL nhất quán                                                                                      | regression      | P2      |
| TC-IST-12            | Mọi money ở thanh tổng đúng dạng `$#,##0.00`                                     |                       | Quét tổng                | Đúng định dạng USD                                                                                      | regression      | P2      |
| TC-IST-13 **[data]** | Bảng staff có đủ cột Staff/Orders/Subtotal/Supply Fee/Tip/Total Income           | Ngày có staff         | Đọc header bảng          | Đủ 6 cột theo spec                                                                                      | regression      | P1      |
| TC-IST-14 **[data]** | Search lọc đúng theo nickname                                                    | Ngày có staff         | Gõ nickname              | Chỉ còn dòng khớp                                                                                       | regression      | P2      |
| TC-IST-15 **[data]** | Click 1 staff mở panel chi tiết + Print enabled                                  | Ngày có staff         | Click dòng staff         | Panel detail hiện, nút Print enabled                                                                    | regression      | P1      |
| TC-IST-16 **[data]** | Detail Commission: Subtotal = Sale − Refund; Total = Commission − Clean up + Tip | Staff kiểu Commission | Đọc panel                | Đẳng thức đúng                                                                                          | regression      | P1      |
| TC-IST-17 **[data]** | Detail Salary: Gross Income = ngày/giờ × Rate; Total = Gross − Clean up + Tip    | Staff kiểu Salary     | Đọc panel                | Đẳng thức đúng                                                                                          | regression      | P1      |
| TC-IST-18 **[data]** | Total staff income = Σ Total Income từng staff                                   | Ngày có staff         | So tổng vs từng dòng     | Khớp                                                                                                    | regression      | P2      |

**Tổng: 18 TC** (TC-IST-01…18). 12 TC chạy không cần data; 6 TC **[data]** tự skip khi ngày trống.

## Ghi chú

- Route gated passcode owner (`PasscodeDialog`, `OWNER_PASSCODE`).
- Công thức đối chiếu: `docs/linear/income-report.md` mục Staff Income + `src/reports/incomeCalcCore.ts`.
- i18n: Skill 5 → `docs/i18n/income-staff-i18n-result.md`.
