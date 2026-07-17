---
name: codegen-flow
description: >-
  Đọc test case đã sinh cho một màn hình rồi viết DUY NHẤT một file
  docs/screens/<man-hinh>/<man-hinh>-code-detail.md miêu tả luồng code: (1) bản đồ
  file → file của quá trình gen (Linear/spec → test-cases.md → page object → spec →
  report), và (2) giải thích chi tiết từng đoạn code quan trọng trong luồng đó dùng
  công nghệ gì (Playwright, MCP, TanStack Router, fixtures, alias, v.v.). Gộp từ 2
  skill cũ codegen-flow-map + codegen-flow-detail. Dùng khi user nói "vẽ/giải thích
  luồng gen code màn <X>", "luồng code màn <X> đi qua file nào", "từng đoạn code làm
  gì / dùng công nghệ gì".
---

# Skill — Luồng code-gen (file → file + chi tiết đoạn code)

Mục tiêu: từ tên một màn hình đã có code test được sinh, viết **một file `.md` duy
nhất** miêu tả luồng code: sơ đồ file→file, rồi đi sâu vào từng file thật trong luồng đó
với đoạn code trích + công nghệ dùng.

## Đầu vào

- Tên màn hình vừa gen. Lấy từ `args` / câu hỏi user.
- Các artefact liên quan: `docs/linear/<x>.md`, `docs/screens/<x>/<x>-test-cases.md`,
  page object `src/pages/...`, spec `tests/...`.

## Đầu ra (BẮT BUỘC)

- **Đúng một** file: `docs/screens/<kebab-man-hinh>/<kebab-man-hinh>-code-detail.md`.
  Không sinh thêm file/HTML/report nào khác.

## Các bước

1. **Xác định các mắt xích thật.** Dùng Glob/Grep/Read tìm chính xác các file tham gia:
   nguồn spec → file test case `.md` → page object → spec test → helper `src/utils/`
   (nếu có) → nơi ra report/artifact. Chỉ ghi file **thực sự tồn tại**; nếu thiếu mắt
   xích nào, nói rõ.
   - Với màn có thân dài / panel chi tiết, **helper quét-đầy-đủ là một mắt xích của
     luồng**: `scrollThroughPage()` ([`src/utils/i18nScan.ts`](../../../src/utils/i18nScan.ts)),
     `expandPanelSections()` ([`src/utils/i18nIncomes.ts`](../../../src/utils/i18nIncomes.ts)) — ghi
     vào sơ đồ nếu spec/scan có dùng (bài học VP-2252: thiếu bước này → quét sót).

2. **Dựng chuỗi file→file.** Với mỗi bước ghi: file NGUỒN → file ĐÍCH, ai/khâu nào tạo
   ra, và một dòng mô tả ngắn.

3. **Đọc từng file thật** (Read) và trích **các đoạn code cốt lõi**: import/alias,
   khai báo page object & locator, khối `test()`/`test.describe`, helper
   `src/utils/`, cấu hình liên quan (`playwright.config.ts`, fixtures
   `@fixtures/index`). Với mỗi đoạn, giải thích (a) đoạn code làm gì, (b)
   **công nghệ/kỹ thuật** dùng để gen hoặc chạy — ví dụ: Playwright Test, Playwright
   **MCP** (quét UI), Linear MCP (đọc spec), TanStack Router
   (`window.__TSR_ROUTER__.navigate` để giữ i18n), fixtures/custom test, TypeScript
   path alias (`@/`, `@fixtures`, `@utils`), Allure report, tag system `Tag`.
   - Nếu luồng dùng **kỹ thuật quét-đầy-đủ**, giải thích rõ: `scrollThroughPage()`
     (cuộn window + khung `overflow` để mount nội dung lazy), `expandPanelSections()`
     (mở `aria-expanded=false` + "Show more"), click dòng mở panel chi tiết — vì sao
     cần (bài học VP-2252: bỏ qua sẽ quét sót phần dưới/panel).

4. **Viết file `docs/screens/<kebab>/<kebab>-code-detail.md`** theo cấu trúc:

   ```markdown
   ---
   title: Code Detail — <Tên màn hình>
   generated-at: <YYYY-MM-DD>
   ---

   # <Tên màn hình> — Code Detail

   ## Flow Map

   ### Sơ đồ (file → file)
   ```

   Linear doc / docs/linear/<x>.md
   └─(feature-spec)→ docs/screens/<x>/<x>-test-cases.md (Feature Overview)
   └─(testcase-gen: quét Playwright MCP)→ docs/screens/<x>/<x>-test-cases.md (Test Cases)
   ├─→ src/pages/.../<Man>Page.ts (page object)
   └─→ tests/regression/.../TC-\*.spec.ts (spec)
   └─(khi chạy)→ reports/... , allure-results/...

   ```

   ### Bảng mắt xích
   | # | File nguồn | → | File đích | Khâu tạo | Ghi chú |
   |---|-----------|---|-----------|----------|---------|

   ### Ghi chú
   - Mắt xích còn thiếu / chưa tồn tại: ...

   ## Code Detail

   ### Tổng quan công nghệ

   > Bảng: Công nghệ | Vai trò trong luồng gen

   ### Chi tiết theo file

   #### 1. <đường/dẫn/file>

   - **Vai trò trong luồng:** ...

   ```ts
   // đoạn code trích thật (có dòng)
   ```

   - **Giải thích:** ...
   - **Công nghệ dùng để gen/chạy:** ...

   #### 2. <file tiếp theo>

   ...

   ### So với sơ đồ Flow Map

   > Chỗ nào chi tiết hơn: ...
   ```

5. **Báo cáo** đường dẫn file `.md` đã tạo/cập nhật, xác nhận đã đi tới mức đoạn code +
   công nghệ, không chỉ file→file.

## Ràng buộc

- Ghi vào **đúng một** file `docs/screens/<slug>/<slug>-code-detail.md`. MỖI màn chỉ
  có đúng 2 file trong `docs/screens/<slug>/`: file này + `<slug>-test-cases.md`
  (skill `linear-spec-testcase`). KHÔNG sinh HTML/report — chỉ file `.md`.
- Mọi đường dẫn file phải chính xác và tồn tại thật (verify bằng Read/Glob trước khi
  ghi). Mọi đoạn code trích phải **copy đúng** từ file thật (Read trước khi trích, kèm
  đường dẫn + số dòng). Không bịa API/công nghệ, không bịa mắt xích.
