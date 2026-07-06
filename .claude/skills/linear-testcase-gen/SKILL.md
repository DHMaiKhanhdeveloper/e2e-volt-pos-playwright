---
name: linear-testcase-gen
description: >-
  Skill 2/4 — Đọc document Linear của một màn hình, dùng Playwright MCP quét màn hình
  đó, tạo TẤT CẢ test case dưới dạng file .md (vào folder docs/testcases/), rồi SINH CODE
  Playwright (page object + spec) dựa trên file .md test case đó. Dùng khi user nói kiểu
  "tạo test case cho màn <X>", "gen test cho màn <X> từ Linear", "viết test case + code
  cho <X>". Đây là skill sinh cả tài liệu test case lẫn code test.
---

# Skill 2 — Test cases (.md) + sinh code từ Linear + quét MCP

Mục tiêu: từ một màn hình VOLT POS → đọc spec **Linear**, **quét** màn hình bằng
Playwright MCP, viết **file test case `.md`** (liệt kê đủ case), rồi **sinh code test**
Playwright dựa trên chính file `.md` đó.

## Đầu vào
- Tên màn hình / tính năng. Lấy từ `args` hoặc câu hỏi của user.
- Nếu đã có `docs/features/<man-hinh>.md` (output của skill `linear-feature-spec`) thì
  đọc luôn để tiết kiệm — coi đó là nguồn tính năng đã tổng hợp.

## Đầu ra (BẮT BUỘC)
- **File test case:** `docs/testcases/<kebab-man-hinh>-testcases.md` (folder riêng của skill này).
- **Code test** sinh theo quy ước repo:
  - Page object (nếu thiếu): `src/pages/pos|settings/<Man>Page.ts` — kế thừa `BasePage`.
  - Spec: `tests/regression/<nhom>/<man-hinh>/TC-*.spec.ts` (dùng `@fixtures/index`,
    `Tag` từ `@/types/testTags`). Theo mẫu các spec sẵn có trong `tests/regression/`.

## Các bước

1. **Thu thập spec.**
   - Đọc Linear qua MCP `linear-server` (fallback `docs/linear/<man-hinh>.md` nếu MCP
     chưa xác thực). Nếu có sẵn `docs/features/<man-hinh>.md` → dùng làm nguồn chính.

2. **Quét màn hình bằng Playwright MCP.**
   - Mở app, điều hướng tới màn hình, liệt kê các phần tử tương tác, luồng thao tác,
     validation, thông báo lỗi/thành công, trạng thái rỗng, phân trang, filter, popup.
   - Ghi lại selector/role/label thực tế để dùng khi sinh code (ưu tiên `getByRole`,
     `getByText`, `data-testid` nếu có).

3. **Viết file test case `docs/testcases/<kebab>-testcases.md`.** Liệt kê **đủ** case
   (happy path, validation, edge, quyền, i18n nếu liên quan). Mẫu bảng:

   ```markdown
   ---
   title: Test Cases — <Tên màn hình>
   source-linear: <url hoặc offline path>
   scanned-at: <YYYY-MM-DD>
   ---

   # Test Cases — <Tên màn hình>

   | ID | Tiêu đề | Tiền điều kiện | Các bước | Kết quả mong đợi | Loại | Ưu tiên |
   |----|---------|----------------|----------|------------------|------|---------|
   | TC-<MAN>-01 | ... | ... | 1... 2... | ... | e2e/regression | P1 |
   ```

   Mỗi case phải map được 1-1 sang một `test(...)` khi sinh code.

4. **Sinh code từ file `.md`.**
   - Đọc lại chính `docs/testcases/<kebab>-testcases.md` làm nguồn sự thật.
   - Tạo/cập nhật page object trong `src/pages/...` (chỉ locator + action, không assert).
   - Tạo spec `tests/regression/<nhom>/<man-hinh>/...spec.ts`, mỗi TC → một `test()` có
     `Tag`, dùng fixtures `@fixtures/index`, đặt tên test chứa ID (`TC-<MAN>-01: ...`).
   - Chạy typecheck / lint nếu nhanh (`npm run lint` hoặc `tsc --noEmit`) và sửa lỗi.

5. **Báo cáo.** Liệt kê: file test case `.md` đã tạo, các file code đã sinh (đường dẫn),
   số TC, và cách chạy (`npx playwright test <path>`).

## Ràng buộc
- File `.md` test case chỉ nằm trong `docs/testcases/`. Code theo đúng cây thư mục repo.
- Bám sát convention có sẵn: import alias (`@fixtures`, `@utils`, `@/`), naming `TC-*`,
  page object kế thừa `BasePage`. Xem mẫu ở `tests/regression/i18n/*.spec.ts`.
- Không bịa selector: mọi locator phải bắt nguồn từ kết quả quét Playwright MCP.
