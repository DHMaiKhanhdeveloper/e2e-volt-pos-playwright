---
name: codegen-flow-detail
description: >-
  Skill 4/4 — Bản GIẢI THÍCH CHI TIẾT của luồng code-gen (mở rộng của skill
  codegen-flow-map): liệt kê chi tiết TỪNG ĐOẠN CODE trong luồng, nó làm gì, và DÙNG CÔNG
  NGHỆ GÌ để gen (Playwright, MCP, TanStack Router, fixtures, alias, v.v.). Xuất MỘT file
  .md vào folder docs/codegen-detail/. Dùng khi user nói "giải thích chi tiết luồng gen",
  "từng đoạn code làm gì / dùng công nghệ gì".
---

# Skill 4 — Giải thích chi tiết luồng code-gen (từng đoạn + công nghệ)

Mục tiêu: mở rộng bản đồ của skill `codegen-flow-map` thành bản **chi tiết**: đi qua từng
file trong luồng, trích **từng đoạn code quan trọng**, giải thích nó làm gì và **công nghệ**
đứng sau (framework, MCP, kỹ thuật). Xuất **một file `.md`**.

## Đầu vào

- Tên màn hình. Ưu tiên đọc trước `docs/codegen-flow/<x>-flow.md` (output skill 3) để biết
  chuỗi file cần đào sâu. Nếu chưa có → tự dựng lại chuỗi bằng Glob/Grep.

## Đầu ra (BẮT BUỘC)

- **Đúng một** file `.md`: `docs/codegen-detail/<kebab-man-hinh>-detail.md` (folder riêng của skill này).
- **Bản HTML kèm hình ảnh (BẮT BUỘC):** `reports/<slug>/flow-detail.html` — render từ file `.md` trên,
  tự-chứa (hero screenshot + code/bảng inline). Xem bước cuối.

## Các bước

1. **Lấy danh sách file trong luồng** từ `docs/codegen-flow/<x>-flow.md`.

2. **Đọc từng file thật** (Read) và trích **các đoạn code cốt lõi**: import/alias, khai báo
   page object & locator, khối `test()`/`test.describe`, helper `src/utils/`, cấu hình liên
   quan (`playwright.config.ts`, fixtures `@fixtures/index`).

3. **Với mỗi đoạn, giải thích:** (a) đoạn code làm gì, (b) **công nghệ/kỹ thuật** dùng để
   gen hoặc chạy — ví dụ: Playwright Test, Playwright **MCP** (quét UI), Linear MCP (đọc spec),
   TanStack Router (`window.__TSR_ROUTER__.navigate` để giữ i18n), fixtures/custom test,
   TypeScript path alias (`@/`, `@fixtures`, `@utils`), Allure report, tag system `Tag`.
   - Nếu luồng dùng **kỹ thuật quét-đầy-đủ**, giải thích rõ: `scrollThroughPage()` (cuộn window + khung
     `overflow` để mount nội dung lazy), `expandPanelSections()` (mở `aria-expanded=false` + "Show more"),
     click dòng mở panel chi tiết — vì sao cần (bài học VP-2252: bỏ qua sẽ quét sót phần dưới/panel).

4. **Viết `docs/codegen-detail/<kebab>-detail.md`:**

   ````markdown
   ---
   title: Chi tiết luồng code-gen — <Tên màn hình>
   expands: docs/codegen-flow/<x>-flow.md
   generated-at: <YYYY-MM-DD>
   ---

   # Chi tiết luồng code-gen — <Tên màn hình>

   ## Tổng quan công nghệ

   > Bảng: Công nghệ | Vai trò trong luồng gen

   ## Chi tiết theo file

   ### 1. <đường/dẫn/file>

   - **Vai trò trong luồng:** ...

   ```ts
   // đoạn code trích thật (có dòng)
   ```
   ````

   - **Giải thích:** ...
   - **Công nghệ dùng để gen/chạy:** ...

   ### 2. <file tiếp theo>

   ...

   ## So với bản map (skill 3)

   > Chỗ nào chi tiết hơn: ...

   ```

   ```

5. **Xuất HTML kèm hình ảnh (BẮT BUỘC).**

   ```bash
   node scripts/md-to-html.mjs docs/codegen-detail/<slug>-detail.md --screen <slug> --out reports/<slug>/flow-detail.html
   npm run reports:index
   ```

6. **Báo cáo** đường dẫn `.md` + `reports/<slug>/flow-detail.html`, xác nhận đã giải thích sâu hơn skill 3
   (đi tới mức đoạn code + công nghệ, không chỉ file→file).

## Ràng buộc

- Ghi `.md` trong `docs/codegen-detail/`; HTML kèm ảnh trong `reports/<slug>/flow-detail.html`. Mọi đoạn code trích
  phải **copy đúng** từ file thật (Read trước khi trích, kèm đường dẫn + số dòng). Không bịa API/công nghệ.
