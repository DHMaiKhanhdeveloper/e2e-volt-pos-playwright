---
name: codegen-flow-map
description: >-
  Skill 3/4 — Sau khi đã sinh code test (bằng skill linear-testcase-gen), liệt kê LUỒNG
  code-gen: bắt đầu từ file nào → ra file nào → tới file nào, dưới dạng MỘT file .md vào
  folder docs/codegen-flow/. Đây là bản đồ luồng ở mức tổng quan (file→file). Dùng khi
  user nói kiểu "vẽ/liệt kê luồng gen code màn <X>", "flow gen bắt đầu từ file nào".
  Bản chi tiết từng đoạn code là skill codegen-flow-detail.
---

# Skill 3 — Bản đồ luồng code-gen (file → file)

Mục tiêu: sau khi code test cho một màn hình đã được sinh, ghi lại **luồng đi** của quá
trình gen ở mức file: từ nguồn (Linear/spec `.md`) → qua bước quét → qua test case `.md`
→ ra page object → ra spec → ra report. Xuất **một file `.md`**.

## Đầu vào

- Tên màn hình vừa gen. Lấy từ `args` / câu hỏi user.
- Các artefact liên quan: `docs/linear/<x>.md`, `docs/features/<x>.md`,
  `docs/testcases/<x>-testcases.md`, page object `src/pages/...`, spec `tests/...`.

## Đầu ra (BẮT BUỘC)

- **Đúng một** file `.md`: `docs/codegen-flow/<kebab-man-hinh>-flow.md` (folder riêng của skill này).
- **Bản HTML kèm hình ảnh (BẮT BUỘC):** `reports/<slug>/flow-map.html` — render từ file `.md` trên,
  tự-chứa (hero screenshot của màn + sơ đồ/bảng inline). Xem bước cuối.

## Các bước

1. **Xác định các mắt xích thật.** Dùng Glob/Grep/Read tìm chính xác các file tham gia:
   nguồn spec → file test case `.md` → page object → spec test → helper `src/utils/` (nếu có)
   → nơi ra report/artifact. Chỉ ghi file **thực sự tồn tại**; nếu thiếu mắt xích nào, nói rõ.
   - Với màn có thân dài / panel chi tiết, **helper quét-đầy-đủ là một mắt xích của luồng**:
     `scrollThroughPage()` ([`src/utils/i18nScan.ts`](../../../src/utils/i18nScan.ts)),
     `expandPanelSections()` ([`src/utils/i18nIncomes.ts`](../../../src/utils/i18nIncomes.ts)) — ghi vào sơ đồ
     nếu spec/scan có dùng (bài học VP-2252: thiếu bước này → quét sót).

2. **Dựng chuỗi file→file.** Với mỗi bước ghi: file NGUỒN → file ĐÍCH, ai/khâu nào tạo ra
   (skill 1 / skill 2 / tay), và một dòng mô tả ngắn.

3. **Viết `docs/codegen-flow/<kebab>-flow.md`:**

   ```markdown
   ---
   title: Luồng code-gen — <Tên màn hình>
   generated-at: <YYYY-MM-DD>
   ---

   # Luồng code-gen — <Tên màn hình>

   ## Sơ đồ (file → file)
   ```

   Linear doc / docs/linear/<x>.md
   └─(skill linear-feature-spec)→ docs/features/<x>.md
   └─(skill linear-testcase-gen: quét Playwright MCP)→ docs/testcases/<x>-testcases.md
   ├─→ src/pages/.../<Man>Page.ts (page object)
   └─→ tests/regression/.../TC-\*.spec.ts (spec)
   └─(khi chạy)→ reports/... , allure-results/...

   ```

   ## Bảng mắt xích
   | # | File nguồn | → | File đích | Khâu tạo | Ghi chú |
   |---|-----------|---|-----------|----------|---------|

   ## Ghi chú
   - Mắt xích còn thiếu / chưa tồn tại: ...
   ```

4. **Xuất HTML kèm hình ảnh (BẮT BUỘC).**

   ```bash
   node scripts/md-to-html.mjs docs/codegen-flow/<slug>-flow.md --screen <slug> --out reports/<slug>/flow-map.html
   npm run reports:index
   ```

5. **Báo cáo** đường dẫn `.md` + `reports/<slug>/flow-map.html`. Giữ ở mức file→file (đừng đi sâu vào
   từng dòng code — đó là việc của skill `codegen-flow-detail`).

## Ràng buộc

- Ghi `.md` trong `docs/codegen-flow/`; HTML kèm ảnh trong `reports/<slug>/flow-map.html`. Mọi đường dẫn file
  phải chính xác và tồn tại thật (verify bằng Read/Glob trước khi ghi). Dùng link markdown tương đối tới file thật.
