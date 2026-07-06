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
- **Đúng một** file: `docs/features/<kebab-ten-man-hinh>.md`
- Folder output riêng của skill này là `docs/features/`. Không ghi ra nơi khác.

## Các bước

1. **Đọc spec Linear.**
   - Ưu tiên MCP `linear-server`: tìm document theo tên màn hình (search / list docs)
     và đọc nội dung. Nếu MCP Linear **chưa được xác thực / không khả dụng**, fallback
     đọc bản offline trong [docs/linear/](../../../docs/linear/) (ví dụ
     `docs/linear/order-pending.md`). Ghi rõ trong file là đã dùng nguồn nào.
   - Trích: mục tiêu tính năng, định nghĩa, các luồng chính, ràng buộc/nghiệp vụ,
     trạng thái, quyền, edge case mà PO nêu.

2. **Quét màn hình thật bằng Playwright MCP.**
   - Dùng MCP `playwright` để mở app (base URL theo `configs/` / `playwright.config.ts`),
     đăng nhập nếu cần, điều hướng tới màn hình mục tiêu.
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

4. **Kiểm tra & báo cáo.** Xác nhận file đã tạo tại `docs/features/`, tóm tắt cho user
   các điểm lệch giữa spec và UI (nếu có). Không sinh code, không sinh test case ở skill này.

## Ràng buộc
- Chỉ tạo/ghi trong `docs/features/`. Một lần chạy → một màn hình → một file `.md`.
- Match giọng văn tài liệu hiện có trong `docs/` (tiếng Việt, có frontmatter).
- Nếu Linear MCP cần đăng nhập mà đang chạy non-interactive → nói rõ cho user và dùng
  bản offline `docs/linear/`.
