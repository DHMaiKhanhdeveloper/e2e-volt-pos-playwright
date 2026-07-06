---
title: Test Cases — Thông tin doanh nghiệp (Business Info)
route: /settings/business
source-linear: VP-871 + offline docs/linear/settings.md
scanned-at: 2026-07-06
scanned-by: playwright-mcp
---

# Test Cases — Thông tin doanh nghiệp (Business Info)

> Tiền đề chung: app chạy `localhost:1420`, đã đăng nhập. Màn **gated** → nhập passcode `8888`.
> Phạm vi: **read-only / verification** (KHÔNG bấm Save để tránh đổi dữ liệu backend dùng chung).

| ID        | Tiêu đề                    | Tiền điều kiện        | Các bước                                       | Kết quả mong đợi                                                                                         | Loại       | Ưu tiên |
| --------- | -------------------------- | --------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------- | ------- |
| TC-BIZ-01 | Cổng passcode hiện khi vào | chưa unlock           | 1. Vào `/settings/business`                    | Dialog "Enter your passcode" hiện (keypad + checkbox 30')                                                | regression | P1      |
| TC-BIZ-02 | Unlock bằng passcode đúng  | dialog đang hiện      | 1. Tick "30 phút" 2. Nhập `8888`               | Dialog đóng, form Business Info hiện                                                                     | regression | P1      |
| TC-BIZ-03 | Tiêu đề & các section      | đã unlock             | 1. Quan sát                                    | Có heading "Business Info" + 5 section: Information, Work Hours, Pay Period, Store Brand, Store Policies | regression | P1      |
| TC-BIZ-04 | Field hồ sơ hiển thị       | đã unlock             | 1. Xem khối Information                        | Có các ô: Business Name, Legal Name, Phone, Website, Address, Country, State, City, Postal/Zip           | regression | P2      |
| TC-BIZ-05 | Field khoá theo quyền      | đã unlock (chưa Edit) | 1. Kiểm tra Business Name / Legal Name / Phone | 3 ô này **disabled** (read-only)                                                                         | regression | P1      |
| TC-BIZ-06 | Field cho phép sửa         | đã unlock             | 1. Kiểm tra Website / Address / City           | Các ô này **editable**                                                                                   | regression | P2      |
| TC-BIZ-07 | Nút Edit tồn tại           | đã unlock             | 1. Xem header                                  | Nút "Edit" hiển thị & bấm được                                                                           | regression | P2      |
| TC-BIZ-08 | Work Hours 7 ngày          | đã unlock             | 1. Xem Work Hours                              | Có switch cho monday…sunday; ngày mở có 2 ô giờ                                                          | regression | P2      |
| TC-BIZ-09 | Ngày nghỉ = Closed         | đã unlock             | 1. Tìm ngày switch off (Sunday)                | Hiển thị "Closed", ô giờ disabled                                                                        | regression | P3      |
| TC-BIZ-10 | Pay Period đọc được        | đã unlock             | 1. `readPayPeriod()`                           | Trả về type ∈ {Weekly,Biweekly,Monthly,Custom}; Custom có danh sách ngày                                 | regression | P1      |
| TC-BIZ-11 | Store Policies fields      | đã unlock             | 1. Xem Store Policies                          | Có 3 ô: Liability / Cancellation / Other Policies                                                        | regression | P3      |
| TC-BIZ-12 | i18n VN sạch               | app đang VN           | 1. Đối chiếu compare                           | 0 chuỗi tiếng Anh trên màn (xem i18n-result)                                                             | regression | P2      |
