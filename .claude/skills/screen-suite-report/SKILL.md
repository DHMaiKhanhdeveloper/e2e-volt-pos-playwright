---
name: screen-suite-report
description: >-
  Gộp toàn bộ test case của MỘT màn hình VOLT POS thành MỘT test lớn duy nhất
  (mỗi test case là một test.step) rồi xuất báo cáo HTML + JSON tự-chứa vào
  reports/<màn>/ — đúng theo luồng màn Home (một lần chạy → một report, không
  abort khi 1 case fail). Dùng khi user nói kiểu "gộp test màn <X> thành 1 case
  bự giống home", "xuất report giống màn home cho <X>", "one big test cho màn <X>",
  "làm luồng report như home cho màn khác". Đầu vào là TÊN/route MỘT MÀN HÌNH;
  đầu ra là spec 1-test + file reports/<màn>/<màn>-scan.{html,json}.
---

# Skill — Gộp test 1 màn thành 1 test lớn + xuất report (kiểu Home)

Mục tiêu: biến bộ test case rời rạc của một màn hình thành **một `test()` duy nhất** — mỗi
case chạy như một `test.step`, kết quả gom lại (pass/fail/skip) và ghi ra **một báo cáo
HTML + JSON tự-chứa** trong `reports/<màn>/`. Đây là đúng "contract" của màn Home
(`TC-i18n-home-vietnamese-scan` → `reports/i18n-audit/home-scan.{html,json}`), áp cho màn khác.

## Đầu vào

- Tên / route màn hình (vd `order-history`, `income-summary`, route `/order-history`).
  Lấy từ `args` hoặc câu hỏi user. Nếu mơ hồ → hỏi đúng 1 câu.
- Nếu đã có test rời (`tests/regression/.../TC-*.spec.ts`) và/hoặc test case `.md`
  (`docs/screens/<màn>/<màn>-test-cases.md`, mục "## Test Cases") → **đọc làm nguồn**, giữ
  nguyên ID case.

## Đầu ra (BẮT BUỘC)

- **Spec 1-test:** `tests/regression/<nhóm>/<màn>/TC-<màn>.spec.ts` — một `test()` duy nhất,
  tên chứa hậu tố `-ALL` (vd `TC-OH-ALL`). Mỗi case cũ → một `test.step` gọi qua helper `check`.
- **Report khi chạy:** `reports/<màn>/<màn>-scan.{html,json}` + đính kèm HTML vào run
  (`test.info().attach`). Dùng util dùng chung — **không tự viết lại renderer**:
  [`src/utils/checkReport.ts`](../../../src/utils/checkReport.ts).
- **HTML kèm hình ảnh (BẮT BUỘC):** report này **đã có sẵn ảnh** — mỗi case chụp 1 screenshot
  qua `captureShot(page)` (từ `checkReport.ts`), gán vào `result.shot`, renderer nhúng base64 làm
  thumbnail (cột "Ảnh"). Trong helper `check`, LUÔN gọi `const shot = await captureShot(page)` sau khi
  chạy `fn` và push `{ id, title, status, detail, shot }`. Report tự hiện trên dashboard `reports/index.html`.

## Tiền đề

- App chạy `http://localhost:1420`, đã đăng nhập. Check nhanh:
  `curl -s -o /dev/null -w "%{http_code}" http://localhost:1420` (phải `200`), hoặc
  `node scripts/check-server.mjs`.

## Các bước

1. **Thu thập case.** Đọc `docs/screens/<màn>/<màn>-test-cases.md` (nếu có) + spec rời hiện tại.
   Nếu chưa có test → chạy skill `linear-spec-testcase` trước, rồi quay lại gộp.

2. **Đảm bảo page object** cho màn tồn tại trong `src/pages/...` (locator + action, bắt nguồn
   từ quét Playwright MCP — không bịa selector). Thiếu thì bổ sung như `linear-spec-testcase`.

3. **Viết spec 1-test** theo khuôn (xem mẫu thật đã chạy xanh:
   [`tests/regression/orders/order-pending/TC-order-pending.spec.ts`](../../../tests/regression/orders/order-pending/TC-order-pending.spec.ts)):

   ```ts
   import { test, expect } from '@fixtures/index';
   import { Tag } from '@/types/testTags';
   import { type CheckResult, type CheckStatus, captureShot, SkipCheck, summarize, writeCheckReport } from '@utils/checkReport';

   test.describe(`<Màn> — queue scan ${Tag.REGRESSION} ${Tag.UI}`, () => {
     test('TC-<MÃ>-ALL: <Màn> — full check', async ({ <pageFixture>, page }) => {
       test.setTimeout(180_000);
       const results: CheckResult[] = [];

       const check = async (id, title, fn: () => Promise<string | void>) => {
         await test.step(`${id}: ${title}`, async () => {
           let status: CheckStatus = 'pass';
           let detail: string | undefined;
           try {
             detail = (await fn()) || undefined;
           } catch (e) {
             if (e instanceof SkipCheck) { status = 'skip'; detail = e.message; }
             else { status = 'fail'; detail = (e as Error).message; }
           }
           const shot = await captureShot(page); // screenshot → base64 thumbnail in report
           results.push({ id, title, status, detail, shot });
         });
       };

       // Navigate MỘT LẦN — mọi check chạy LIÊN TỤC nối tiếp trên cùng phiên này.
       await <pageFixture>.goto();

       await check('TC-<MÃ>-01', '<mô tả>', async () => { /* expect(...) ; return 'chi tiết' */ });
       // ... mỗi test case cũ = một check(...), chạy nối tiếp KHÔNG goto lại giữa chừng.
       // Case cần dữ liệu mà không có → `throw new SkipCheck('lý do')` (ghi SKIP, không FAIL).

       // Report kiểu Home
       const generatedAt = new Date().toISOString();
       const { html, htmlPath } = writeCheckReport('<màn>', results, {
         screen: '<Tên hiển thị>', route: '<route>', generatedAt,
       });
       await test.info().attach('<màn>-scan.html', { body: html, contentType: 'text/html' });

       const s = summarize(results);
       const failed = results.filter((r) => r.status === 'fail');
       // eslint-disable-next-line no-console
       console.log(`\n=== <Màn> — ${s.pass}/${s.total} pass · ${s.fail} fail · ${s.skip} skip ===\n`
         + results.map((r) => `  [${r.status.toUpperCase()}] ${r.id} ${r.title}`).join('\n')
         + `\nBáo cáo: ${htmlPath}\n`);

       if (process.env.I18N_LENIENT !== '1') {
         for (const f of failed) expect.soft(f.status, `${f.id} "${f.title}": ${f.detail}`).not.toBe('fail');
       }
     });
   });
   ```

   **Quy tắc chuyển đổi:**
   - Mỗi `test(...)` rời cũ → một `check('TC-…','…', fn)`. Giữ nguyên ID case.
   - **Chạy LIÊN TỤC:** `goto()` **một lần** trước case đầu; helper `check` **KHÔNG** goto lại.
     Các case chạy nối tiếp như một luồng thao tác thật trên cùng phiên (nhanh hơn, sát UX).
   - **Case làm đổi trạng thái phải tự dọn** để case sau bắt đầu từ trạng thái sạch:
     search → `clearSearch()`; đổi sort/filter → set về mặc định; điều hướng đi (click link
     sang màn khác) → `goto()` quay lại màn ở cuối case đó. Xếp case điều hướng-đi về cuối nếu tiện.
   - Chuyển `test.skip(cond, reason)` → `if (cond) throw new SkipCheck(reason)`.
   - Assert vẫn dùng `expect` bình thường bên trong `fn` (fail sẽ được `check` bắt lại).
   - Không abort giữa chừng: **mọi** case đều chạy, report liệt kê đủ; cổng fail bằng
     `expect.soft` cuối cùng (đặt `I18N_LENIENT=1` để chạy chỉ-báo-cáo, không fail).
   - `fn` có thể `return` một chuỗi ngắn → hiển thị ở cột "Chi tiết" của report.
   - ⚠️ **QUÉT ĐẦY ĐỦ (bài học VP-2252):** case nào kiểm nội dung dưới màn hình / trong panel chi tiết
     phải **cuộn hết trang** (`scrollThroughPage(page)` từ `@utils/i18nScan`) + **mở khối thu gọn / panel**
     (click dòng, `aria-expanded="false"`) trước khi assert — nếu không sẽ pass nhầm vì phần tử chưa mount.
     Nên gọi `scrollThroughPage(page)` ngay trước `captureShot(page)` để thumbnail phản ánh cả phần dưới.

4. **Verify:**

   ```bash
   npx eslint --fix <spec> && npx tsc --noEmit -p tsconfig.json
   npx playwright test <spec> --project=chromium --reporter=line
   ```

   Xác nhận: 1 test pass, và `reports/<màn>/<màn>-scan.html` + `.json` được sinh.

5. **Báo cáo cho user:** số case pass/fail/skip, đường dẫn report HTML, cách mở
   (`npx playwright show-report reports/html` để xem attachment, hoặc mở trực tiếp file HTML tự-chứa).

## Ràng buộc

- **Tái dùng** `src/utils/checkReport.ts` (types + `renderCheckReport` + `writeCheckReport` +
  `SkipCheck` + `summarize`). Nếu cần cột/section mới → mở rộng util, đừng fork renderer trong spec.
- Report phải **tự-chứa** (inline CSS, không asset ngoài) như Home để mở offline được.
- Chỉ một spec 1-test cho mỗi màn; ghi `reports/<màn>/` riêng theo slug màn.
- Không bịa selector: locator từ page object đã verify bằng Playwright MCP.
- Nếu màn chưa có test case → chạy `linear-spec-testcase` trước (skill này chỉ **gộp + report**).
