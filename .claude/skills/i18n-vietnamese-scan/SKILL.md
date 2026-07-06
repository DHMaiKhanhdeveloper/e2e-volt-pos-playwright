---
name: i18n-vietnamese-scan
description: >-
  Quét kiểm tra Tiếng Việt cho MỘT màn hình VOLT POS: (1) còn chuỗi tiếng Anh
  chưa dịch không, (2) có vỡ giao diện (chữ tràn/cắt, tràn ngang) không, và
  (3) dịch ĐÚNG CHUẨN tiếng Việt chưa — bằng cách quét 1 lần tiếng Anh + 1 lần
  tiếng Việt rồi so sánh; nếu sai chuẩn thì đề xuất nên dịch sang từ nào. Đầu vào
  là TÊN MỘT MÀN HÌNH, đầu ra là MỘT file .md trong docs/i18n/. Dùng khi user nói
  kiểu "quét tiếng Việt màn <X>", "kiểm tra dịch chuẩn + vỡ UI màn <X>",
  "scan i18n màn <X>".
---

# Skill — Quét Tiếng Việt + vỡ UI + dịch đúng chuẩn (theo màn)

Mục tiêu: với **một màn hình**, trả lời 3 câu hỏi và ghi kết quả ra `.md`:

1. **Còn tiếng Anh?** — chuỗi nào chưa qua `t()` / chưa dịch.
2. **Vỡ giao diện?** — chữ bị cắt/tràn khung, layout đẩy tràn ngang (Tiếng Việt dài hơn Anh).
3. **Dịch đúng chuẩn?** — quét **1 lần EN + 1 lần VI**, ghép từng chuỗi theo vị trí DOM, so với
   **glossary POS**; chỗ dịch sai chuẩn → **đề xuất từ đúng**.

## Đầu vào

- Tên/khoá màn hình (ví dụ: `home`, `order-history`, `income-summary`). Lấy từ `args` hoặc câu hỏi
  của user. Khoá hợp lệ khai trong `SCREENS` tại [`src/utils/i18nCompare.ts`](../../../src/utils/i18nCompare.ts).
  Nếu user nói tên tiếng Việt/tiếng Anh chưa khớp khoá → map về khoá gần nhất; nếu vẫn mơ hồ → hỏi đúng 1 câu.

## Đầu ra (BẮT BUỘC)

- **Đúng một** file tài liệu: `docs/i18n/<khoá-màn>-i18n-result.md`.
- Nếu đã có `docs/i18n/<khoá-màn>-translation-map.md` → **cập nhật dòng trạng thái** (ngày quét + số liệu),
  KHÔNG viết đè nội dung map. KHÔNG ghi ra folder khác trong `docs/`.
- **Report tự sinh khi chạy** (không viết tay): `reports/<khoá>/compare.json` **và**
  `reports/<khoá>/compare.html` — file HTML tự-chứa (mở trực tiếp được) hiển thị:
  thẻ tổng quan (Dịch đúng / Sai chuẩn / Chưa dịch), bảng "Chưa dịch", và bảng "Chất lượng dịch"
  (từng cặp EN→VI kèm badge ĐÚNG/SAI CHUẨN). HTML cũng được đính vào Playwright report.
  → Trong file `-i18n-result.md`, **trỏ link tới HTML này** ở mục nguồn tham chiếu.
- **Bản HTML kèm hình ảnh (BẮT BUỘC):** `reports/<khoá>/i18n-result.html` — render từ
  `docs/i18n/<khoá>-i18n-result.md`, tự-chứa, có **hero screenshot** màn hình (lấy từ
  `docs/features/<khoá>-assets/` hoặc `reports/<khoá>/screens/`). Xem bước cuối.

## Các bước

1. **Tiền đề.** App phải chạy ở `http://localhost:1420` và backend GraphQL khỏe (không trả 500).
   Kiểm tra nhanh: `node scripts/check-server.mjs`. Nếu backend 500 → dừng, báo user khởi động lại backend
   (skill này quét app thật; app hỏng dữ liệu sẽ không render được để quét).

2. **Chạy so sánh EN↔VI** cho màn hình (chỉ-báo-cáo, không fail để lấy đủ dữ liệu):

   ```bash
   I18N_SCREEN=<khoá> I18N_LENIENT=1 npx playwright test \
     tests/regression/i18n/TC-i18n-screen-compare.spec.ts --project=chromium --reporter=line
   ```

   → sinh **cùng lúc** `reports/<khoá>/compare.json` **và** `compare-<khoá>.html`.
   JSON gồm: `summary`, `missing` (còn tiếng Anh, đã lọc data + kèm `suggestion`), `suspect`,
   `uiBroken`, `pairs` (mỗi cặp `en/vi/status/suggestion`). HTML là bản trực quan của cùng dữ liệu.

   > Cơ chế: quét EN, đổi sang Tiếng Việt, quét lại; ghép theo **đường dẫn DOM** (đổi ngôn ngữ chỉ đổi chữ,
   > không đổi cấu trúc). Trước mỗi lần bắt chuỗi, spec gọi `scrollThroughPage()` (cuộn window + mọi khung
   > overflow từ trên xuống dưới rồi về đầu) để nội dung **lazy / dưới màn hình** kịp mount — nếu không sẽ
   > bỏ sót phần dưới của báo cáo dài (Incomes, Order History). Phân loại: `missing` (còn tiếng Anh) ·
   > `suspect` (đã dịch nhưng không đúng từ chuẩn) · `ok` · `data` (tên riêng/giá trị — bỏ qua).
   > Renderer HTML = `renderCompareReport()` trong [`src/utils/i18nCompare.ts`](../../../src/utils/i18nCompare.ts);
   > bảng "Chất lượng dịch" chỉ hiện verdict `ok`/`suspect`, còn danh sách "Chưa dịch" lấy từ `missing`
   > (đã lọc nhiễu data). Xem HTML: `start reports/<khoá>/compare.html`.

3. **(Tuỳ chọn) Quét sâu popup/deep của màn** nếu cần phủ dialog (Home có deep-scan riêng):

   ```bash
   I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts --project=chromium
   ```

   Lọc trong `reports/i18n-audit/auto-scan.json` các mục có `route` chứa tên màn để bổ sung popup.

4. **Đọc `compare-<khoá>.json`** và phân tích:
   - `missing` → **lỗi dịch thật** (còn tiếng Anh). Liệt kê kèm `suggestion` nếu có trong glossary.
   - `suspect` → đã dịch nhưng **khác từ chuẩn** trong glossary → ghi rõ "hiện tại → nên dùng".
   - `uiBroken` → nếu `xOverflow > 8` hoặc `clipped` không rỗng → mục **UI vỡ** (chỉ báo cáo).

5. **Đánh giá "chuẩn tiếng Việt".** Với các `suspect` và các chuỗi VI **không có trong glossary**, dùng
   kiến thức tiếng Việt + văn phong POS để phán xét tự nhiên/đúng thuật ngữ chưa; nếu chưa, **đề xuất từ nên dùng**.
   Nguồn chuẩn thuật ngữ = `GLOSSARY` trong [`src/utils/i18nCompare.ts`](../../../src/utils/i18nCompare.ts).
   Tham chiếu văn cảnh mong đợi ở các doc màn Home: `docs/features/home.md`, `docs/i18n/home-translation-map.md`.

   > ⚠️ **HIỂU 2 CƠ CHẾ PHÁT HIỆN (bài học VP-2252):** scan chỉ bắt được khi thuật ngữ nằm trong "từ điển":
   >
   > - **`missing` (còn tiếng Anh)** chỉ báo nếu chuỗi chứa từ trong **từ điển detector** (biến `ui` trong
   >   `detectScope`, `i18nScan.ts`). Từ domain thiếu → bỏ sót (vd "Pay 1/2" lọt lưới đến khi thêm `pay`).
   > - **`suspect` (sai chuẩn)** chỉ báo nếu cặp EN→VI có **key trong `GLOSSARY`**. Không có key → coi là `ok`
   >   (vd "Rate"→"Tỉ lệ", "Net Total"→"Thực thu" từng lọt cho tới khi thêm vào `GLOSSARY`).
   >   → Khi màn có thuật ngữ mới: **bổ sung `GLOSSARY`** (EN→từ chuẩn) và/hoặc **từ detector** rồi quét lại.
   >   (Không tự sửa code trừ khi user đồng ý; nhưng nên chủ động đề xuất kèm từ chuẩn.)
   >   **Hạn chế còn lại:** nhãn trong **panel chi tiết / khối thu gọn** (Pay 1/2, Rate, Net Total…) chỉ hiện
   >   sau khi click 1 dòng + `expandPanelSections()` → dùng **deep-scan** (`TC-i18n-incomes`), compare view
   >   mặc định không với tới.

5b. **Đối chiếu sub-task Linear (bắt buộc khi có issue màn).** Nếu màn thuộc một issue Linear, đọc **tất cả
sub-task** của nó (`list_issues parentId=<ID>` qua MCP `linear-server`): tester thường log sẵn các lỗi
dịch "sai chuẩn" mà scan tự động bỏ qua. Với mỗi sub-task còn mở → đảm bảo `GLOSSARY`/detector có thể bắt
được (bổ sung nếu thiếu), ghi ID issue vào file kết quả. Bài học VP-2252: 6 bug thật (Sale, Gross/Net
Income, Net Total, Rate, Pay 1/2) mà lần quét đầu chỉ ra 1 (`Tip`).

6. **Viết `docs/i18n/<khoá>-i18n-result.md`** theo mẫu:

   ```markdown
   ---
   title: Kết quả quét Tiếng Việt — <Tên màn>
   screen: <khoá>
   route: <route>
   scanned-at: <YYYY-MM-DD>
   source: compare.json + compare.html (TC-i18n-screen-compare)
   ---

   # <Tên màn> — Quét Tiếng Việt / UI vỡ / dịch đúng chuẩn

   ## Tổng quan

   > tổng N · ❌ chưa dịch X · ⚠️ sai chuẩn Y · 📐 UI vỡ Z
   > Report trực quan: `reports/<khoá>/compare.html`

   ## 1. ❌ Chưa dịch (còn tiếng Anh)

   | Chuỗi (EN) | Đang hiển thị (VI) | Nên dịch | Nguồn (data-tsd-source) |

   ## 2. ⚠️ Dịch chưa đúng chuẩn

   | Hiện tại (VI) | Gốc (EN) | Nên dùng (chuẩn) | Vì sao |

   ## 3. 📐 Vỡ giao diện (chỉ báo cáo)

   > tràn ngang …px · các chuỗi bị cắt: …

   ## 4. ✅ Đã dịch đúng (mẫu)

   ## 5. Ghi chú / đề xuất bổ sung glossary

   ## 6. Nguồn tham chiếu

   > - HTML: `reports/<khoá>/compare.html` · JSON: `reports/<khoá>/compare.json`
   ```

7. **Xuất HTML kèm hình ảnh (BẮT BUỘC).** Render file kết quả `.md` thành HTML tự-chứa có hero screenshot:

   ```bash
   node scripts/md-to-html.mjs docs/i18n/<khoá>-i18n-result.md --screen <khoá> --out reports/<khoá>/i18n-result.html
   npm run reports:index
   ```

8. **Cập nhật & báo cáo.** Nếu có `<khoá>-translation-map.md` → thêm dòng trạng thái (ngày + số liệu).
   Tóm tắt cho user: bao nhiêu chưa dịch, bao nhiêu sai chuẩn (kèm từ đề xuất), có UI vỡ không,
   **và đường dẫn HTML** (`reports/<khoá>/compare.html` bảng EN↔VI + `reports/<khoá>/i18n-result.html` kèm ảnh).

## Ràng buộc

- Tạo/ghi `.md` trong `docs/i18n/`; HTML kèm ảnh trong `reports/<khoá>/i18n-result.html`. Một lần chạy → một màn.
- KHÔNG tự dịch/sửa source app; skill chỉ **phát hiện + đề xuất**. Việc sửa `t()`/thêm key là do dev.
- Giọng văn tiếng Việt, có frontmatter — khớp các doc trong `docs/i18n/`.
- `missing` là lỗi thật (gate fail nếu chạy không có `I18N_LENIENT=1`); `suspect` + UI vỡ chỉ báo cáo.
- Glossary là nguồn sự thật cho "chuẩn tiếng Việt" — mở rộng tại `src/utils/i18nCompare.ts`.
- File HTML/JSON là **tự sinh** khi chạy test — KHÔNG viết tay. Muốn đổi giao diện report thì sửa
  `renderCompareReport()` trong `src/utils/i18nCompare.ts` (đừng fork HTML trong file `.md`).

```

```
