---
name: test-commands-sync
description: >-
  Cập nhật lại file docs/test-commands.md — bảng liệt kê MỌI test case hiện có
  trong repo kèm câu lệnh Playwright chính xác để chạy từng case, từng file,
  hoặc toàn bộ suite. Dùng khi user vừa gen thêm test case/màn hình mới và
  muốn đồng bộ lại danh sách lệnh chạy test. Kích hoạt khi user nói kiểu
  "cập nhật danh sách lệnh test", "sync test-commands.md", "vừa gen xong test
  màn X, update lại file lệnh chạy test", "liệt kê lại tất cả câu lệnh test".
---

# Skill — Đồng bộ `docs/test-commands.md`

Mục tiêu: giữ `docs/test-commands.md` luôn khớp với các test case đang có trong `tests/`,
để user chỉ cần mở file đó là có ngay lệnh Playwright để chạy bất kỳ test case, file, hay
cả suite nào.

## Khi nào chạy skill này

- Sau khi một skill khác (vd. `linear-spec-testcase`, `screen-suite-report`) sinh thêm
  test case/spec file mới.
- Sau khi user tự tay thêm/xoá/đổi tên test case.
- Khi user yêu cầu trực tiếp "cập nhật/liệt kê lại danh sách lệnh chạy test".

## Các bước

1. **Kiểm tra script tồn tại:** [`scripts/generate-test-commands.mjs`](../../../scripts/generate-test-commands.mjs).
   Nếu bị xoá/hỏng, đọc lại logic bên dưới ("Cách script hoạt động") để viết lại tương đương.
2. **Chạy script** từ root repo:

   ```bash
   node scripts/generate-test-commands.mjs
   ```

   Script tự gọi `npx playwright test --list --reporter=list` để lấy danh sách test case
   mới nhất (không cần server/app đang chạy — chỉ list, không thực thi test), parse ra
   file + dòng + tên test, rồi ghi đè toàn bộ `docs/test-commands.md`.

3. **Nếu script báo lỗi module/alias không tìm thấy** (ví dụ
   `Cannot find module '@utils/xxx'`): đây là do một spec file import sai đường dẫn alias
   (khai báo tại `tsconfig.json` → `compilerOptions.paths`). Tìm file thật của module đó
   (`grep -r "export const <tên>" src`) và sửa lại import trong spec file cho đúng alias,
   rồi chạy lại script. Không bỏ qua lỗi này — nếu `--list` fail thì toàn bộ file test-commands
   sẽ rỗng/thiếu.
4. **Xác nhận kết quả:** mở đầu file phải có dòng `> Tổng: **N test case** trong **M file**.`
   — đối chiếu N với số lượng bạn kỳ vọng (vd. nếu vừa thêm 1 file test mới, M phải tăng).
5. Báo cho user số test case/file mới, và nếu bước 3 phải sửa import thì nêu rõ file đã sửa.

## Cách script hoạt động (tham khảo nếu cần viết lại)

- Chạy `npx playwright test --list --reporter=list`, mỗi dòng output có dạng:
  `[project] › path/to/file.spec.ts:LINE:COL › describe › ... › test title`
- Parse bằng regex, gom theo file, sinh:
  - 1 bảng Markdown mỗi file: cột `#`, `Test case` (full breadcrumb describe › title),
    `Command` (`npx playwright test <file>:<line>`).
  - Lệnh chạy cả file: `npx playwright test <file>`.
  - Mục đầu file liệt kê lệnh chạy nhóm: toàn bộ suite, `@smoke`, `@regression`, project `api`,
    thư mục `tests/e2e` — lấy nguyên từ script trong `package.json`.
- Ghi đè `docs/test-commands.md` (file luôn được tạo mới hoàn toàn, không merge thủ công).

## Không làm

- Không chỉnh sửa `docs/test-commands.md` bằng tay — luôn chạy lại script để tránh lệch
  giữa nội dung và test case thật.
- Không thêm test case mới trong skill này — skill này chỉ đồng bộ tài liệu lệnh chạy,
  việc sinh test case thuộc skill `linear-spec-testcase` / `screen-suite-report`.
