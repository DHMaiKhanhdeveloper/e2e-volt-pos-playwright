---
name: linear-spec-testcase
description: >-
  Đọc document Linear của một màn hình/tính năng, dùng Playwright MCP quét (scan)
  màn hình đang chạy, viết mục "Feature Overview" (mô tả tính năng) và mục
  "Test Cases" (liệt kê đủ case) vào file docs/screens/<man-hinh>/<man-hinh>-test-cases.md,
  rồi SINH CODE Playwright (page object + spec) dựa trên chính file đó. Gộp từ 2 skill
  cũ linear-feature-spec + linear-testcase-gen. Dùng khi user nói "tạo spec + test case
  cho màn <X>", "gen test cho màn <X> từ Linear", "viết feature doc + code test cho <X>".
---

# Skill — Feature Spec + Test Case (.md) + sinh code, từ Linear + quét MCP

Mục tiêu: từ tên một màn hình/tính năng của VOLT POS, đọc spec gốc trên **Linear**,
**quét màn hình thật** bằng Playwright MCP, viết **một file `.md` duy nhất** vừa mô tả
tính năng vừa liệt kê đủ test case, rồi **sinh code test** Playwright dựa trên chính
file đó.

## Đầu vào

- Tên màn hình / tính năng (ví dụ: "Order Pending", "Income Summary"). Lấy từ `args`
  hoặc từ câu hỏi của user. Nếu chưa rõ → hỏi lại đúng 1 câu.

## Đầu ra (BẮT BUỘC)

- **Đúng một** file: `docs/screens/<kebab-ten-man-hinh>/<kebab-ten-man-hinh>-test-cases.md`
  — gồm mục "## Feature Overview" rồi "## Test Cases".
- **Code test** sinh theo quy ước repo:
  - Page object (nếu thiếu): `src/pages/pos|settings/<Man>Page.ts` — kế thừa `BasePage`.
  - Spec: `tests/regression/<nhom>/<man-hinh>/TC-*.spec.ts` (dùng `@fixtures/index`,
    `Tag` từ `@/types/testTags`). Theo mẫu các spec sẵn có trong `tests/regression/`.

## Các bước

1. **Đọc spec Linear.**
   - Ưu tiên MCP `linear-server`: tìm document theo tên màn hình (search / list docs)
     và đọc nội dung. Nếu MCP Linear **chưa được xác thực / không khả dụng**, fallback
     đọc bản offline trong [docs/linear/](../../../docs/linear/) (ví dụ
     `docs/linear/order-pending.md`). Ghi rõ trong file là đã dùng nguồn nào.
   - Trích: mục tiêu tính năng, định nghĩa, các luồng chính, ràng buộc/nghiệp vụ,
     trạng thái, quyền, edge case mà PO nêu.
   - **Đọc CẢ sub-task/issue con** của issue màn hình (`list_issues parentId=<ID>` qua MCP):
     bug/nhận xét đã log ở đó thường mô tả chi tiết mà spec chính bỏ qua. Đưa vào mục
     "Đối chiếu" (§6 bên dưới). Bài học VP-2252: 9 sub-task mô tả lỗi dịch mà spec cha
     để trống.

2. **Quét màn hình thật bằng Playwright MCP.**
   - Dùng MCP `playwright` để mở app (base URL theo `configs/` / `playwright.config.ts`),
     đăng nhập nếu cần, điều hướng tới màn hình mục tiêu.
   - ⚠️ **QUÉT ĐẦY ĐỦ (bắt buộc) — bài học VP-2252 "chưa kéo thanh cuộn":** UI chỉ mount
     phần đang thấy. TRƯỚC khi ghi nhận thành phần, phải:
     1. **Cuộn hết trang** (window + mọi khung `overflow:auto/scroll`) từ trên xuống dưới
        rồi về đầu → nội dung lazy / dưới màn hình mới render. Helper `scrollThroughPage()`
        trong [`src/utils/i18nScan.ts`](../../../src/utils/i18nScan.ts).
     2. **Mở mọi khối thu gọn** (`aria-expanded="false"`, nút "Show more / Xem thêm"). Mẫu:
        `expandPanelSections()` trong [`src/utils/i18nIncomes.ts`](../../../src/utils/i18nIncomes.ts).
     3. **Mở panel / dialog chi tiết** (click 1 dòng dữ liệu) — nhiều thành phần CHỈ xuất
        hiện sau bước này.
   - Liệt kê các phần tử tương tác, luồng thao tác, validation, thông báo lỗi/thành công,
     trạng thái rỗng, phân trang, filter, popup. Ghi lại selector/role/label thực tế để
     dùng khi sinh code (ưu tiên `getByRole`, `getByText`, `data-testid` nếu có).
   - Đối chiếu UI thực tế với spec Linear: ghi lại chỗ **khớp** và chỗ **lệch**.

3. **Viết file `docs/screens/<kebab>/<kebab>-test-cases.md`** theo cấu trúc:

   ```markdown
   ---
   title: <Tên màn hình>
   source-linear: <url hoặc "offline: docs/linear/...">
   scanned-at: <YYYY-MM-DD>
   scanned-by: playwright-mcp
   ---

   # <Tên màn hình> — Test Cases

   ## Feature Overview

   ### 1. Mục tiêu & phạm vi

   ### 2. Các luồng chính (từ Linear)

   ### 3. Thành phần UI thực tế (quét bằng Playwright MCP)

   > bảng: Thành phần | Vai trò | Trạng thái | Ghi chú

   ### 4. Nghiệp vụ & ràng buộc

   ### 5. Trạng thái / quyền / edge case

   ### 6. Đối chiếu Linear ↔ UI thực tế (khớp / lệch)

   ### 7. Nguồn tham chiếu

   ## Test Cases

   | ID          | Tiêu đề | Tiền điều kiện | Các bước  | Kết quả mong đợi | Loại           | Ưu tiên |
   | ----------- | ------- | -------------- | --------- | ---------------- | -------------- | ------- |
   | TC-<MAN>-01 | ...     | ...            | 1... 2... | ...              | e2e/regression | P1      |
   ```

   Liệt kê **đủ** case (happy path, validation, edge, quyền, i18n nếu liên quan; cả
   trạng thái panel chi tiết + khối thu gọn, không chỉ view mặc định). Mỗi case phải
   map được 1-1 sang một `test(...)` khi sinh code.

4. **Sinh code từ file `.md`.**
   - Đọc lại chính `docs/screens/<kebab>/<kebab>-test-cases.md` làm nguồn sự thật.
   - Tạo/cập nhật page object trong `src/pages/...` (chỉ locator + action, không assert).
   - Tạo spec `tests/regression/<nhom>/<man-hinh>/...spec.ts`, mỗi TC → một `test()` có
     `Tag`, dùng fixtures `@fixtures/index`, đặt tên test chứa ID (`TC-<MAN>-01: ...`).
   - Chạy typecheck / lint nếu nhanh (`npm run lint` hoặc `tsc --noEmit`) và sửa lỗi.

5. **Báo cáo.** Liệt kê: file `.md`, các file code đã sinh, số TC, tóm tắt điểm lệch
   spec ↔ UI, và cách chạy (`npx playwright test <path>`).

## Ràng buộc

- Ghi vào **đúng một** file `docs/screens/<slug>/<slug>-test-cases.md`. MỖI màn chỉ có
  đúng 2 file trong `docs/screens/<slug>/`: file này + `<slug>-code-detail.md` (skill
  `codegen-flow`). KHÔNG tạo file/folder rời khác, KHÔNG sinh HTML/report.
- Match giọng văn tài liệu hiện có trong `docs/` (tiếng Việt, có frontmatter) — xem
  [docs/dashboard-guide.md](../../../docs/dashboard-guide.md) làm chuẩn mực về độ
  súc tích/cấu trúc.
- Bám sát convention có sẵn: import alias (`@fixtures`, `@utils`, `@/`), naming
  `TC-*`, page object kế thừa `BasePage`. Xem mẫu ở `tests/regression/i18n/*.spec.ts`.
  Không bịa selector: mọi locator phải bắt nguồn từ kết quả quét Playwright MCP.
- Nếu Linear MCP cần đăng nhập mà đang chạy non-interactive → nói rõ cho user và dùng
  bản offline `docs/linear/`.
