---
name: linear-feature-spec
description: >-
  Skill 1/4 — Đọc document Linear của một màn hình/tính năng, dùng Playwright MCP
  quét (scan) màn hình đang chạy, rồi tạo MỘT file .md mô tả tính năng của màn hình
  đó vào folder docs/features/. Dùng khi user nói kiểu "tạo spec tính năng cho màn
  <X>", "mô tả tính năng màn <X> từ Linear", "quét màn <X> và viết feature doc".
  KHÔNG sinh test case hay code ở skill này (đó là skill linear-testcase-gen).
---

# Skill 1 — Feature Spec từ Linear + quét màn hình (MCP)

Mục tiêu: từ tên một màn hình/tính năng của VOLT POS, đọc spec gốc trên **Linear**,
**quét màn hình thật** bằng Playwright MCP, và viết **một file `.md` duy nhất** mô tả
tính năng của màn hình đó.

## Đầu vào

- Tên màn hình / tính năng (ví dụ: "Order Pending", "Income Summary"). Lấy từ `args`
  hoặc từ câu hỏi của user. Nếu chưa rõ → hỏi lại đúng 1 câu.

## Đầu ra (BẮT BUỘC)

- **Đúng một** file `.md`: `docs/features/<kebab-ten-man-hinh>.md`
- **Bản HTML kèm hình ảnh (BẮT BUỘC):** `reports/<slug>/feature-spec.html` — render từ file `.md`
  trên bằng script dùng chung, tự-chứa (nhúng ảnh base64). Xem bước cuối. Đây là "kết quả HTML
  có kèm hình ảnh" cho user, và tự hiện trên dashboard `reports/index.html`.

## Các bước

1. **Đọc spec Linear.**
   - Ưu tiên MCP `linear-server`: tìm document theo tên màn hình (search / list docs)
     và đọc nội dung. Nếu MCP Linear **chưa được xác thực / không khả dụng**, fallback
     đọc bản offline trong [docs/linear/](../../../docs/linear/) (ví dụ
     `docs/linear/order-pending.md`). Ghi rõ trong file là đã dùng nguồn nào.
   - Trích: mục tiêu tính năng, định nghĩa, các luồng chính, ràng buộc/nghiệp vụ,
     trạng thái, quyền, edge case mà PO nêu.
   - **Đọc CẢ sub-task/issue con** của issue màn hình (`list_issues parentId=<ID>` qua MCP):
     bug/nhận xét đã log ở đó thường mô tả chi tiết mà spec chính bỏ qua (nhãn sai, luồng
     đặc thù). Đưa vào mục "Đối chiếu" (§6). Bài học VP-2252: 9 sub-task mô tả lỗi dịch mà
     spec cha để trống.

2. **Quét màn hình thật bằng Playwright MCP.**
   - Dùng MCP `playwright` để mở app (base URL theo `configs/` / `playwright.config.ts`),
     đăng nhập nếu cần, điều hướng tới màn hình mục tiêu.
   - ⚠️ **QUÉT ĐẦY ĐỦ (bắt buộc) — bài học VP-2252 "chưa kéo thanh cuộn":** UI chỉ mount
     phần đang thấy. TRƯỚC khi ghi nhận thành phần, phải:
     1. **Cuộn hết trang** (window + mọi khung `overflow:auto/scroll`) từ trên xuống dưới rồi
        về đầu → nội dung lazy / dưới màn hình mới render. Tham chiếu helper `scrollThroughPage()`
        trong [`src/utils/i18nScan.ts`](../../../src/utils/i18nScan.ts).
     2. **Mở mọi khối thu gọn** (`aria-expanded="false"`, nút "Show more / Xem thêm"). Mẫu:
        `expandPanelSections()` trong [`src/utils/i18nIncomes.ts`](../../../src/utils/i18nIncomes.ts).
     3. **Mở panel / dialog chi tiết** (click 1 dòng dữ liệu) — nhiều thành phần (vd 5 khối chi
        tiết của Income: Payment/Sale/Supply/Staff Payout/Salon) CHỈ xuất hiện sau bước này.
   - Chụp lại: các thành phần UI (button/label/field/table/filter/popup), các trạng thái
     hiển thị, và điều hướng ra/vào. Có thể chụp screenshot vào `docs/features/<man-hinh>-assets/`
     nếu hữu ích.
   - Đối chiếu UI thực tế với spec Linear: ghi lại chỗ **khớp** và chỗ **lệch**.

3. **Viết file `docs/features/<kebab>.md`** theo cấu trúc:

   ```markdown
   ---
   title: <Tên màn hình>
   source-linear: <url hoặc "offline: docs/linear/...">
   scanned-at: <YYYY-MM-DD>
   scanned-by: playwright-mcp
   ---

   # <Tên màn hình> — Đặc tả tính năng

   ## 1. Mục tiêu & phạm vi

   ## 2. Các luồng chính (từ Linear)

   ## 3. Thành phần UI thực tế (quét bằng Playwright MCP)

   > bảng: Thành phần | Vai trò | Trạng thái | Ghi chú

   ## 4. Nghiệp vụ & ràng buộc

   ## 5. Trạng thái / quyền / edge case

   ## 6. Đối chiếu Linear ↔ UI thực tế (khớp / lệch)

   ## 7. Nguồn tham chiếu
   ```

4. **Xuất HTML kèm hình ảnh (BẮT BUỘC).** Render file `.md` vừa tạo thành HTML tự-chứa,
   nhúng ảnh base64 (hero screenshot lấy từ `docs/features/<slug>-assets/` + mọi ảnh inline):

   ```bash
   node scripts/md-to-html.mjs docs/features/<slug>.md --screen <slug> --out reports/<slug>/feature-spec.html
   npm run reports:index   # cập nhật dashboard reports/index.html
   ```

   → nhớ chụp ít nhất 1 screenshot màn hình vào `docs/features/<slug>-assets/` ở bước 2 để HTML có ảnh.

5. **Kiểm tra & báo cáo.** Xác nhận `docs/features/<slug>.md` **và** `reports/<slug>/feature-spec.html`
   đã tạo, tóm tắt điểm lệch spec ↔ UI. Không sinh code / test case ở skill này.

## Ràng buộc

- Tạo/ghi `.md` trong `docs/features/`; bản HTML kèm ảnh ghi `reports/<slug>/feature-spec.html`. Một lần chạy → một màn hình.
- Match giọng văn tài liệu hiện có trong `docs/` (tiếng Việt, có frontmatter).
- Nếu Linear MCP cần đăng nhập mà đang chạy non-interactive → nói rõ cho user và dùng
  bản offline `docs/linear/`.
