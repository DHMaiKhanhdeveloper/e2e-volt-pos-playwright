---
title: Thông tin doanh nghiệp (Business Info)
route: /settings/business
source-linear: VP-871 (General Settings — Business Profile tab, portal-legacy) + offline docs/linear/settings.md
scanned-at: 2026-07-06
scanned-by: playwright-mcp (live scan localhost:1420)
---

# Thông tin doanh nghiệp — Đặc tả tính năng

![Business Info](settings-business-assets/business-info.png)

## 1. Mục tiêu & phạm vi

Màn **Cài đặt → Cửa hàng & Tài khoản → Business Info**: xem & chỉnh thông tin doanh nghiệp của tiệm — hồ sơ, giờ làm việc, kỳ trả lương, thương hiệu (logo/ảnh bìa) và chính sách cửa hàng. Là màn **gated** (yêu cầu passcode chủ `8888` khi vào).

## 2. Các luồng chính

- **Xem hồ sơ:** vào màn (qua passcode gate) → thấy thông tin điền sẵn từ merchant settings.
- **Chỉnh sửa:** bấm **Edit** → mở khoá các ô cho phép sửa → **Save** / **Cancel** (Cancel reset về giá trị đã lưu).
- **Cấu hình giờ làm:** bật/tắt từng ngày (switch) + chọn giờ mở/đóng; ngày tắt hiển thị "Closed".
- **Kỳ trả lương (Pay Period):** chọn Weekly/Biweekly/Monthly/Custom; hỗ trợ **lịch đổi kỳ** (scheduled change — hiệu lực đầu kỳ kế, không áp ngay).
- **Thương hiệu:** upload Store Logo + Cover Photo (PNG/JPG ≤ 5MB — theo VP-871).
- **Chính sách:** nhập Liability / Cancellation / Other Policies (khách xác nhận khi check-in/out).

## 3. Thành phần UI thực tế (quét Playwright MCP)

| Nhóm           | Thành phần                                           | Vai trò                         | Trạng thái/Ghi chú                                                      |
| -------------- | ---------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| Gate           | Dialog "Enter your passcode"                         | Cổng owner passcode             | keypad 0–9 + checkbox "Do not require passcode for the next 30 minutes" |
| Header         | `Business Info` + nút **Edit** + nút icon            | Tiêu đề + vào chế độ sửa        |                                                                         |
| Information    | Business Name, Legal Name, Phone                     | Ô nhập                          | **disabled** (read-only; sửa cần admin — VP-871)                        |
| Information    | Website, Address, City, Postal/Zip Code              | Ô nhập                          | editable                                                                |
| Information    | Country, State                                       | Combobox                        | mặc định United States / Wyoming                                        |
| Work Hours     | 7 switch (Mon–Sun) + 2 ô giờ mở/đóng mỗi ngày        | Bật/tắt + giờ                   | Sunday tắt → ô "Closed" (disabled)                                      |
| Pay Period     | Card "Current plan" + "Scheduled change"             | Hiển thị kỳ hiện tại & lịch đổi | vd Jul 01–Jul 23; đổi hiệu lực Jul 24                                   |
| Pay Period     | Radio Weekly/Biweekly/Monthly/Custom + nút chọn ngày | Chọn kiểu kỳ lương              | Custom → nút "23, 25, 26, 31"                                           |
| Pay Period     | Ghi chú scheduled                                    | Thông báo áp dụng kỳ kế         | "This is scheduled, not applied now…"                                   |
| Store Brand    | Store Logo, Cover Photo (Preview)                    | Upload ảnh thương hiệu          | PNG/JPG ≤5MB (VP-871)                                                   |
| Store Policies | Liability / Cancellation / Other Policies            | Ô nhập chính sách               | placeholder "Enter your policies"                                       |

## 4. Nghiệp vụ & ràng buộc

- **Read-only theo quyền:** Business Name, Legal Name, Phone khoá (chỉ admin sửa — VP-871). Muốn đổi tên/địa chỉ pháp lý → liên hệ Fastboy support.
- **Upload:** logo & cover PNG/JPG, tối đa 5MB (VP-871).
- **Pay Period scheduled:** thay đổi kỳ lương **không áp ngay** — có hiệu lực đầu kỳ kế; kỳ hiện tại giữ nguyên.
- **Save/Cancel:** Cancel reset form về lần lưu gần nhất.

## 5. Trạng thái / quyền / edge case

- **Gated:** vào màn phải nhập passcode `8888` (env `OWNER_PASSCODE`); tick "30 phút" để khỏi hỏi lại.
- **Sunday/ngày nghỉ:** switch tắt → giờ hiển thị "Closed", ô giờ disabled.
- **Scheduled change:** khi có lịch đổi kỳ lương → hiện card riêng + ghi chú.
- **i18n:** bản Tiếng Việt **sạch** (70 thuật ngữ đúng, 0 chưa dịch) — xem [docs/i18n/settings-business-i18n-result.md](../i18n/settings-business-i18n-result.md).

## 6. Đối chiếu Linear ↔ UI thực tế

| Mục                                               | Linear (VP-871, portal) | UI thực tế (POS)            | Kết luận                                   |
| ------------------------------------------------- | ----------------------- | --------------------------- | ------------------------------------------ |
| Hồ sơ (Name/Legal/Address/Contact/Website)        | ✅ mô tả                | ✅ có                       | **khớp**                                   |
| Business Hours                                    | ✅                      | ✅ (7 ngày + giờ)           | **khớp**                                   |
| Logo + Welcoming/Cover                            | ✅ (≤5MB)               | ✅ Store Logo + Cover Photo | **khớp**                                   |
| Contact CRM table (view-only)                     | ✅ mô tả                | ❌ **không thấy** trên POS  | **lệch** — chỉ có ở Portal legacy          |
| **Pay Period** (Weekly/…/Custom + scheduled)      | ❌ không nêu            | ✅ có trên POS              | **lệch** — POS bổ sung, chưa có spec riêng |
| **Store Policies** (Liability/Cancellation/Other) | ❌ không nêu            | ✅ có trên POS              | **lệch** — cần bổ sung spec                |
| Cổng passcode                                     | ❌ không nêu            | ✅ owner passcode gate      | **lệch** — cần ghi vào spec                |

> VP-871 thuộc project **Portal (legacy)** nên mô tả hồ sơ khớp, nhưng **Pay Period / Store Policies / passcode gate** là phần POS bổ sung — đề xuất tạo spec Linear cho màn POS Business Info.

## 7. Nguồn tham chiếu

- Linear: [VP-871](https://linear.app/fastboy/issue/VP-871) · offline `docs/linear/settings.md`
- i18n: `docs/i18n/settings-business-i18n-result.md` · `reports/settings-business/compare.html`
- Ảnh quét: `docs/features/settings-business-assets/business-info.png`
