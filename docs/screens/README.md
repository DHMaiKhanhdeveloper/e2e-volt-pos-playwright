# docs/screens/ — Per-screen documentation index

Each screen/feature has its own folder here with **up to 2 files**:

1. `<screen>-test-cases.md` — feature overview + all test cases for that screen (merged from the
   old `docs/features/`, `docs/testcases/`, and `docs/test-cases/` folders).
2. `<screen>-code-detail.md` — how the test-automation code for that screen works: file→file
   codegen flow, per-code-block explanation + technology, relevant GraphQL API reference, and
   i18n (Vietnamese translation) notes. Merged from the old `docs/codegen-flow/`,
   `docs/codegen-detail/`, `docs/api/`, and `docs/i18n/` folders.

Screens that only had an i18n scan (no feature-spec/testcase-gen run yet) or that have no
codegen output get only the test-cases file — see the table below.

## Screens

| Screen             | Route(s)                                       | test-cases | code-detail | Notes                                                                          |
| ------------------ | ----------------------------------------------- | :--------: | :---------: | ------------------------------------------------------------------------------- |
| home                | `/home`                                        |     ✅     |     ✅      |                                                                                 |
| income-daily        | `/incomes/income-daily`                        |     ✅     |     ✅      | code-detail includes daily-sale-report-api.md + incomes i18n notes             |
| income-staff        | `/incomes/income-staff`                        |     ✅     |     ✅      | test-cases includes legacy VP-1402 Staff Income & Payroll Excel test cases     |
| income-summary      | `/incomes/income-summary`                      |     ✅     |     ✅      | code-detail includes income-summary-api.md; VP-1048 legacy TCs already merged  |
| order-history       | `/order-history`                                |     ✅     |     ✅      |                                                                                 |
| order-pending       | `/order-pending`                                |     ✅     |     ✅      |                                                                                 |
| order-flow          | `/home` (create order/checkout/order mgmt)     |     ✅     |     —      | No dedicated codegen flow/detail exists yet for this doc (overlaps with Home). |
| settings-business    | `/settings/business`                            |     ✅     |     ✅      |                                                                                 |
| appointment          | `/appointment` (Create/Edit Appointment form)  |     ✅     |     —      | Merged from `docs/test-cases/VP-1615-analysis.md` + `VP-1615-test-cases.md`.  |
| charge-fee          | `/settings/charge-fee`                          |     ✅     |     —      | i18n-scan only so far — no feature-spec/codegen run yet.                       |
| receipt             | `/settings/receipt`                             |     ✅     |     —      | i18n-scan only so far.                                                         |
| settings-accessibility | `/settings/accessibility`                    |     ✅     |     —      | i18n-scan only so far.                                                         |
| settings-language   | `/settings/language`                            |     ✅     |     —      | i18n-scan only so far.                                                         |
| settings-roles      | `/settings/roles`                               |     ✅     |     —      | i18n-scan only so far.                                                         |
| settings-services   | `/settings/services`                            |     ✅     |     —      | i18n-scan only so far.                                                         |
| settings-staffs     | `/settings/staffs`                              |     ✅     |     —      | i18n-scan only so far.                                                         |
| time-keeping        | `/home?dialog=time-keeping`                     |     ✅     |     —      | i18n-scan only so far.                                                         |

## Untouched by this reorg

- `docs/linear/` — source-of-truth Linear mirrors, left exactly as-is (not part of this reorg).
- `docs/dashboard-guide.md` and `docs/report-field-formulas.md` — kept at `docs/` root (style
  model for this reorg's per-screen docs).

## Cross-cutting content that didn't map to one screen

The old `docs/i18n/` folder had two documents describing the **overall i18n Vietnamese-scan test
infrastructure** (`TC-i18n-vietnamese-scan.spec.ts`) that walks every screen in one run — this is
not specific to a single screen, so their content is preserved below instead of being deleted.
Per-screen translation maps (home/incomes/order-history/order-pending) were folded into each
screen's own `*-code-detail.md` under an "i18n Notes" section.

Skill-output-folder `README.md` files (from `docs/api/`, `docs/codegen-detail/`,
`docs/codegen-flow/`, `docs/features/`, `docs/testcases/`, `docs/test-cases/`) only described
**which Claude Code skill produces which file** — that's process documentation, not screen
documentation. Summary, since those folders are now removed:

- `linear-feature-spec` (Skill 1) → used to write `docs/features/<screen>.md` → now
  `docs/screens/<screen>/<screen>-test-cases.md` (Feature Overview section).
- `linear-testcase-gen` (Skill 2) → used to write `docs/testcases/<screen>-testcases.md` → now
  merged into the same `<screen>-test-cases.md` (Test Cases section).
- `codegen-flow-map` (Skill 3) → used to write `docs/codegen-flow/<screen>-flow.md` → now the
  top half of `docs/screens/<screen>/<screen>-code-detail.md`.
- `codegen-flow-detail` (Skill 4) → used to write `docs/codegen-detail/<screen>-detail.md` → now
  the bottom half of the same `code-detail.md`.
- `i18n-vietnamese-scan` → used to write `docs/i18n/<screen>-translation-map.md` → now an "i18n
  Notes" section inside `code-detail.md` (or the whole `test-cases.md` for i18n-only screens).

---

# Appendix A — Vietnamese i18n scan flow (cross-screen test infrastructure)

> Verbatim from the old `docs/i18n/vietnamese-scan-flow.md` — describes
> `TC-i18n-vietnamese-scan.spec.ts`, which walks **every** screen in one run (as opposed to the
> per-screen `TC-i18n-<screen>-vietnamese-scan.spec.ts` specs referenced in each screen's
> code-detail doc). Kept here because it documents cross-cutting test infrastructure, not one screen.

<!-- BEGIN vietnamese-scan-flow.md -->
# Luồng quét Tiếng Việt (i18n Vietnamese Coverage Scan)

> **Mã:** VP-462
> **Test:** [`tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts)
> **Helper:** [`src/utils/i18nScan.ts`](../../src/utils/i18nScan.ts) · [`src/utils/i18nPopups.ts`](../../src/utils/i18nPopups.ts) · [`src/utils/i18nHome.ts`](../../src/utils/i18nHome.ts) · [`src/utils/i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts) · [`src/utils/i18nOrderPending.ts`](../../src/utils/i18nOrderPending.ts) · [`src/utils/i18nIncomes.ts`](../../src/utils/i18nIncomes.ts) · [`src/utils/i18nSplitOrder.ts`](../../src/utils/i18nSplitOrder.ts) · [`src/utils/i18nCheckoutPayment.ts`](../../src/utils/i18nCheckoutPayment.ts)
> **Đầu ra:** `reports/i18n-audit/auto-scan.{html,json}` + ảnh chụp `auto-screens/*.png` (chỉ trang FAIL)
>
> **Cập nhật gần nhất (2026-07-08, đợt 3 — rà soát toàn bộ cây con [VP-2115](https://linear.app/fastboy/issue/VP-2115), không cần vá code):** Duyệt lại **toàn bộ 8 nhóm con** của epic VP-2115 (Home/VP-2138, Setting/VP-2269, Order/VP-2300, Order History/VP-2192, Appointment/VP-2310, Split Order/VP-2287, Income/VP-2252, Time Tracking/VP-2245) cùng các bug lá đã biết, đối chiếu với bộ dò hiện có. Kết luận: **6 bug được nêu làm ứng viên chính đều ĐÃ có bộ dò từ các đợt trước, không cần sửa code:**
>
> - **[VP-2294](https://linear.app/fastboy/issue/VP-2294) / [VP-2283](https://linear.app/fastboy/issue/VP-2283)** ("Tip" chưa dịch ở `/batch-history`, 3 màn Income, `/order-history`, `/order/$id/checkout`, `/settings/receipt`) — từ điển `tip` trong [`i18nScan.ts:240`](../../src/utils/i18nScan.ts) bắt trên mọi route vì các route này đều nằm trong `STATIC_ROUTES`/deep-scan hiện có; đã ghi nhận ở mục 3.5 & dòng 314.
> - **[VP-2284](https://linear.app/fastboy/issue/VP-2284)** (`/cash-drawer` gần như toàn tiếng Anh) — route đã có trong `STATIC_ROUTES` ([`i18nScan.ts:49`](../../src/utils/i18nScan.ts)); từ điển `dialog`/`dialogs`/`alert`/`alerts` thêm từ đợt trước ([`i18nScan.ts:440-443`](../../src/utils/i18nScan.ts)) bắt đúng 2 tiêu đề nhóm "Alerts"/"Dialogs" nêu trong bug.
> - **[VP-2285](https://linear.app/fastboy/issue/VP-2285)** (màn Welcome "WELCOME TO") — `forceEnglish` regex `^welcome to\b` ([`i18nScan.ts:471-472`](../../src/utils/i18nScan.ts)) bắt cứng chuỗi này bất kể heuristic ALL-CAPS/proper-name.
> - **[VP-2286](https://linear.app/fastboy/issue/VP-2286)** (nhãn "Gift Card [****-****-XXXX]" ở Order/Checkout/chi tiết đơn) — từ điển `gift` ([`i18nScan.ts:309`](../../src/utils/i18nScan.ts)) đã ghi nhận, tài liệu hoá ở mục 3.5 (dòng 16). Câu "Cannot use Gift Card to buy a Gift Card..." được bắt qua luật câu (`isSentence`) + từ `gift`; "Unknown" qua từ `unknown`.
> - **[VP-2243](https://linear.app/fastboy/issue/VP-2243)** (màn sync/setup "Waiting for device approval from portal...", "Finishing setup...") — từ điển `setup`/`waiting`/`approval`/`portal` ([`i18nScan.ts:420-425`](../../src/utils/i18nScan.ts)) đã có sẵn kèm chú thích VP-2243 ngay tại chỗ.
> - **[VP-2198](https://linear.app/fastboy/issue/VP-2198)** (lưới lịch chưa dịch tên tháng/thứ "June 2026", "Mo, Tu, We…") — đã có **3 bộ dò chuyên biệt** `scanOrderHistoryDatePicker()` ([`i18nOrderHistory.ts:248`](../../src/utils/i18nOrderHistory.ts)), `scanOrderPendingDatePicker()` ([`i18nOrderPending.ts:196`](../../src/utils/i18nOrderPending.ts)) và `scanIncomesDatePicker()` ([`i18nIncomes.ts:135`](../../src/utils/i18nIncomes.ts)) — dò tên tháng/thứ tiếng Anh trong lưới `react-day-picker` (từ điển chung không bắt được vì "June"/"Mo"/"Tu" không có trong dictionary UI và không khớp `EN_DATETIME`, vốn chỉ bắt tháng viết TẮT có `\b`, ví dụ "Jun" chứ không phải "June").
>
> Rà soát thêm phần **cây con mới phát sinh** dưới 8 nhóm (VP-2288…VP-2329, tạo ngày 2026-07-06 → 2026-07-08) cho thấy phần lớn cũng đã rơi vào các bộ dò/từ điển hiện có nhờ cùng nhóm từ (`check`/`checks`, `cash`, `card`, `got`, `change`, `received`, `finished`/`completed`, `active`/`inactive`, `pay`) đã bổ sung qua các đợt trước (mục 3.5/3.6) — ví dụ [VP-2196](https://linear.app/fastboy/issue/VP-2196)/[VP-2194](https://linear.app/fastboy/issue/VP-2194) (Cash/Got/Change/Tip ở Order History), [VP-2288](https://linear.app/fastboy/issue/VP-2288)…[VP-2292](https://linear.app/fastboy/issue/VP-2292) (Split Order "Check"/"Equally"/"By Amount"/"Paid by Cash"), [VP-2322](https://linear.app/fastboy/issue/VP-2322) (Check-in "Completed"/"Finished"), [VP-2323](https://linear.app/fastboy/issue/VP-2323)/[VP-2299](https://linear.app/fastboy/issue/VP-2299)/[VP-2313](https://linear.app/fastboy/issue/VP-2313) (ngày/giờ Anh — `EN_DATETIME`), [VP-2301](https://linear.app/fastboy/issue/VP-2301)…[VP-2321](https://linear.app/fastboy/issue/VP-2321) (toàn bộ luồng thanh toán thẻ/Cash/Other/Customer Display — mục 3.5, `CARD_PAY_FLOW`, `scanCashOtherPayment()`). **Một điểm mù kiến trúc thật sự, ghi nhận nhưng CHƯA vá** trong đợt này: **[VP-2329](https://linear.app/fastboy/issue/VP-2329)** ("15 Services"/"1 Product" ở category card) — `looksLikeData()` trong [`i18nScan.ts:491`](../../src/utils/i18nScan.ts) coi mọi chuỗi khớp mẫu `"<số> <chữ>"` (ví dụ "3 Services") là DATA theo chủ đích (đếm dịch vụ trộn với tên catalog), nên sẽ không bao giờ tự gắn cờ được từ "Services"/"Product" trong cụm đếm này dù đúng là UI copy cần dịch — cần thiết kế lại luật (tách số đếm khỏi hậu tố) trước khi vá, để trong backlog thay vì vá vội gây false-positive tràn lan trên các badge số khác ("3 orders", "5 items"…). Các mục còn lại thuộc nhóm **rà soát dịch thuật/thuật ngữ** (VP-2258/2259/2260/2261/2263/2267/2268/2270…2280/2306/2309/2325 — "Net Total nên dịch gì", "Rate vs Tỉ lệ"…) là góp ý NGỮ NGHĨA cho bản dịch đã tồn tại, không phải "chưa dịch" — nằm ngoài phạm vi bộ dò tự động (bộ dò chỉ phát hiện tiếng Anh CÒN SÓT, không đánh giá chất lượng bản dịch tiếng Việt) và ngoài phạm vi repo test này (bản dịch nằm ở app repo khác).
>
> **Trước đó (2026-07-08, đợt 2 — triển khai code + màn khách hàng thứ 2 cho Tip/Ký tên thẻ):** 2 thay đổi code: **(1)** đưa lượt quét Tiền mặt/Khác từ thủ công (đợt 1 bên dưới) thành **tự động trong spec** — hàm mới [`scanCashOtherPayment()`](../../src/utils/i18nCheckoutPayment.ts) chọn lần lượt 2 chip "Tiền mặt"/"Khác" trên `/order/$id/checkout` và quét panel bằng `detectScope`, KHÔNG bấm "Hoàn tất thanh toán" (non-destructive, tránh đổi trạng thái đơn thật + tránh bật dialog passcode của chủ). Gọi ở bước 4a5 trong spec, ngay sau khối `CARD_PAY_FLOW` (mục 4a4). Đơn dùng để quét được lấy ưu tiên từ `/order-pending` (đơn chắc chắn chưa thanh toán) để tránh trường hợp lấy nhầm đơn đã thanh toán ở Order History khiến checkout redirect đi nơi khác. **(2)** trả lời câu hỏi "màn khách hàng (thứ 2) khi nhập tip và ký tên có được quét không": **CÓ** — nhưng cả 2 bước này thuộc **luồng thanh toán thẻ thật** (cần đầu đọc thẻ) nên vẫn ghi **manual** (`reachable:false`), y hệt các bước khác của VP-2315…2321. Trước đây `CARD_PAY_FLOW` chỉ ghi 1 dòng chung "Order · Custom tip"/"Order · Add Signature" (ngụ ý phía terminal/nhân viên); nay thêm **2 dòng riêng phía màn hình khách** — `/customer ▸ Custom tip (thanh toán thẻ, màn khách hàng)` và `/customer ▸ Ký tên (Add Signature, màn khách hàng)` — để tách bạch 2 mặt vật lý (staff terminal vs. Customer Display) của cùng 1 bug (VP-2315/VP-2317), phòng trường hợp 2 mặt dùng component khác nhau nên chỉ dịch đúng 1 bên. Xem [mục 4a4](#4-trang-tĩnh-được-quét-static_routes--24-màn) trong spec.

**Trạng thái xác minh `scanCashOtherPayment()` (3 lần chạy live sau khi backend hết lỗi 500):** cả 3 lần `TC-i18n-vietnamese-scan.spec.ts` đều **pass** (`npx tsc --noEmit` sạch, không throw, không có regression), nhưng route `checkout ▸ Tiền mặt/Khác` **không xuất hiện** trong `auto-scan.json` ở cả 3 lần — nghĩa là hàm chạy tới nhánh "không tìm được đơn còn thanh toán được" rồi bỏ qua êm, đúng theo thiết kế best-effort (không throw, không fail cổng) nhưng chưa từng thực sự lấy được dữ liệu trong môi trường dev hiện tại. Đã sửa 2 lỗi chọn phần tử phát hiện được qua debug bằng MCP (bấm thẻ đơn treo ở `/order-pending` KHÔNG đổi URL — phải bấm tiếp "Thanh toán" mới ra `/order/$id/checkout`; và selector thẻ đơn ban đầu khớp nhầm nút "Quick Checkout"/bộ lọc ở đầu trang thay vì thẻ đơn thật, nay dùng selector theo mã đơn `OD\d{6}` giống `i18nOrderPending.ts`), nhưng vẫn 0 kết quả ở lần chạy thứ 3 — nghi vấn hàng đầu: `/order-pending` bị các bước quét TRƯỚC đó trong CÙNG lượt chạy (`scanOrderPendingCardOpen` ở mục 3.3, và `CARD_PAY_FLOW`/`ORDER_SUBROUTES` dùng chung đơn từ Order History) làm đơn đầu danh sách chuyển sang trạng thái **"In Use"** (khoá bởi phiên trước) trước khi `scanCashOtherPayment()` chạy tới (bước 4a5, xếp sau các bước đó). Đây là hạn chế **best-effort đã biết** — giống hệt cách tài liệu này mô tả nhiều bề mặt khác (VD: `scanOrderPendingCardOpen` — "nếu chỉ điều hướng vào đơn thì không ghi lại gì") — **không phải bug**, không làm fail cổng, chỉ có nghĩa là lượt quét Tiền mặt/Khác **có thể không sinh dữ liệu ở mọi lần chạy** tuỳ trạng thái dữ liệu đơn hàng hiện có lúc chạy. Bằng chứng "đã dịch đúng" cho 2 panel này vẫn đứng vững nhờ lượt **quét thủ công qua MCP** ở đợt 1 (xem ngay bên dưới, mục 3.7) — quan sát trực tiếp, không phụ thuộc trạng thái đơn. Việc còn lại (nếu muốn `scanCashOtherPayment()` tự chạy ổn định) là dời bước 4a5 lên TRƯỚC các bước tiêu thụ đơn `/order-pending` khác, hoặc tạo đơn mới riêng cho bước này thay vì dùng chung pool đơn hiện có — chưa làm trong đợt này để tránh đổi thứ tự các bước đã ổn định.

> **Trước đó (2026-07-08, đợt 1 — luồng thanh toán Tiền mặt/Khác):** quét thủ công (MCP Playwright, client-side navigate + `#vi`) **luồng thanh toán Tiền mặt (Cash) và Khác (Other)** trên `/order/$id/checkout` — chọn phương thức → bàn phím số / phím tắt `$5/$10/$50/$100` → "Tổng đã trả"/"Tiền thối"/"Còn lại" → dialog **Nhập passcode** (mở khi hoàn tất thanh toán, chủ xác nhận) → "Hoàn tất thanh toán". Toàn bộ khối này **đã dịch đúng chuẩn**, không phát sinh bug i18n mới; 2 chuỗi còn tiếng Anh nhìn thấy trên cùng màn ("Order #…" và nút "Tip") là bug **đã biết** (VP-2301/VP-2283-2294, mục 3.5) — không tính là bug mới của lượt quét này. Xem [mục 3.7](#37-cập-nhật-2026-07-08-luồng-thanh-toán-tiền-mặt--khác). Nhân dịp này, làm rõ 2 nhóm **không tính vào tổng "chưa dịch"** trong báo cáo `auto-scan.json` hiện tại (`generatedAt: 2026-07-08T03:03:46Z`): **Popup KHÔNG mở được trong phiên quét này** (`reachable:false` — 24 mục, toàn bộ nằm trong danh sách "Chưa tự động được — kiểm THỦ CÔNG" ở cuối mục 3.5) và **Redirect/Stub** (`stub:true` — 3 mục: 3 sub-route `checkout/view-cart`, `checkout/processing-payment`, `checkout/payment-success` — các bước trung gian tự động redirect sang bước kế tiếp nên không giữ được nội dung riêng để quét). Cả 2 nhóm đều có `ui:[]` (không có chuỗi phát hiện) nên vốn dĩ đã không cộng vào `untranslatedCount`; ghi rõ ở đây để tránh hiểu nhầm khi đọc HTML report thấy 112 dòng scan nhưng chỉ ~46 dòng thực sự "chưa dịch".
> **Trước đó (2026-07-07, đợt 5 — màn Setting/Nhân viên/Quyền hạn):** thêm loạt sub-bug **[VP-2115](https://linear.app/fastboy/issue/VP-2115)** dưới nhóm **Setting Page ([VP-2269](https://linear.app/fastboy/issue/VP-2269))** — thời gian định dạng Anh ở **Thông tin doanh nghiệp** (**[VP-2325](https://linear.app/fastboy/issue/VP-2325)**), toggle **"Active"** chưa dịch ở Cài đặt Tip/Thêm dịch vụ/màn Nhân viên (**[VP-2278](https://linear.app/fastboy/issue/VP-2278)** / **[VP-2270](https://linear.app/fastboy/issue/VP-2270)**), trang **Quyền hạn** + tab Quyền hạn nhân viên chưa dịch tên nhóm/quyền con + cột role (**[VP-2280](https://linear.app/fastboy/issue/VP-2280)** / **[VP-2279](https://linear.app/fastboy/issue/VP-2279)** / **[VP-2275](https://linear.app/fastboy/issue/VP-2275)**), dropdown **"Vai trò nhân viên"** (**[VP-2272](https://linear.app/fastboy/issue/VP-2272)**), nhãn/placeholder **"Pay 1"/"Pay 2"** tab Thù lao (**[VP-2273](https://linear.app/fastboy/issue/VP-2273)**), nhãn **"Active"/"Inactive"** danh sách+hồ sơ nhân viên (**[VP-2271](https://linear.app/fastboy/issue/VP-2271)**); cộng **[VP-2200](https://linear.app/fastboy/issue/VP-2200)** ("Unknown" tên khách ở Đơn đang chờ) và **[VP-2142](https://linear.app/fastboy/issue/VP-2142)** (toast "Printer not connected"). Đa số đã **CÓ SẴN** trong luồng quét nhờ route `/settings/permissions` (ExpandAll) + `/settings/staffs` + 5 tab hồ sơ đã route-scan (mục 4/5/9) và từ điển sẵn có (`active`/`inactive`/`pay`/`unknown`/`printer`/`connected`); bổ sung mới: từ điển `partner`/`partners`, bộ dò `EN_DATETIME` gắn thêm cho route `/settings/business` (VP-2325), và mở thêm dropdown **"Vai trò nhân viên"** trong vòng quét tab hồ sơ nhân viên (VP-2272, best-effort). Lưu ý quan trọng: cột/dropdown role hiển thị đúng **"Owner"/"Manager"/"Staff"** bị `DATA_VALUES` loại trừ theo chủ đích (coi là dữ liệu role, không phải copy UI — xem mục 10) nên KHÔNG tự gắn cờ được, dù đã mở dropdown; ghi nhận đây là **điểm mù cố ý** của bộ dò, không phải bug bỏ sót. Xem [mục 3.6](#36-cập-nhật-2026-07-07-đợt-5-bổ-sung-vp-2115-setting-page).
> **Trước đó (2026-07-07, đợt 4 — Màn Lịch hẹn + màn tiến hành thanh toán thẻ):** đưa **màn Lịch hẹn (Appointment)** thành nhóm riêng của **[VP-2310](https://linear.app/fastboy/issue/VP-2310)** — gộp bug **panel Thông báo** còn tiếng Anh "… appointment on … has been confirmed." (**[VP-2143](https://linear.app/fastboy/issue/VP-2143)**) và toast **xác nhận lịch hẹn** cùng câu đó (**[VP-2311](https://linear.app/fastboy/issue/VP-2311)**); cả hai đã bị bắt sẵn qua **panel Thông báo** (§7) nhờ **luật câu** của `detectScope` (câu kết thúc bằng `.` / chứa "has been" → coi là UI, không phải DATA) + từ điển `appointment`/`confirmed`. Đồng thời bổ sung **[VP-2321](https://linear.app/fastboy/issue/VP-2321)** — **màn tiến hành thanh toán thẻ** (chuỗi trạng thái `present → read → processing`): "Total Amount"/"Tip"/"PRESENT CARD" → "CARD READ OK, REMOVE CARD" → "Processing" (mong đợi "Tổng tiền"/"Tiền tip"/"Vui lòng đưa thẻ" → "Đọc thẻ thành công, vui lòng rút thẻ" → "Đang xử lý"). Cùng lớp bug thẻ với VP-2315…VP-2320 nên ghi **manual** (`reachable:false`) trong spec (mục 4a4 — thêm entry thứ 7 vào `CARD_PAY_FLOW`). Từ điển đã sẵn `processing`/`total`/`amount`/`tip` + `forceEnglish` bắt 2 prompt ALL-CAPS "PRESENT CARD" / "CARD READ OK, REMOVE CARD" → **không cần đổi bộ dò**. Xem [mục 3.5](#35-cập-nhật-2026-07-07-bổ-sung-theo-vp-2115).
> **Trước đó (2026-07-07, đợt 3 — luồng thanh toán thẻ):** thêm 6 bug mới của **[VP-2115](https://linear.app/fastboy/issue/VP-2115)** trên **màn Order (`/order/$id`)** — loạt màn/popup của **luồng thanh toán bằng thẻ (card terminal)**: **Custom tip** (**[VP-2315](https://linear.app/fastboy/issue/VP-2315)**), **Total Amount** kèm "PRESENT CARD" (**[VP-2316](https://linear.app/fastboy/issue/VP-2316)**), **Add Signature** (**[VP-2317](https://linear.app/fastboy/issue/VP-2317)**), popup **"Payment Successfully"** (**[VP-2318](https://linear.app/fastboy/issue/VP-2318)**), popup **"Waiting for connect device…"** (**[VP-2319](https://linear.app/fastboy/issue/VP-2319)**) và popup **"Getting ready to charge"** với "PRESENT CARD" / "CARD READ OK, REMOVE CARD" (**[VP-2320](https://linear.app/fastboy/issue/VP-2320)**). Cả 6 chỉ hiển thị khi có **giao dịch thẻ thật + đầu đọc thẻ (card reader)** nên là điểm mù không tự động hoá được → ghi **manual** (`reachable:false`) trong spec (mục 4a4) để truy vết. Bổ sung từ điển (`present`, `sign`, `signature`, `transaction`, `getting`, `ready`, `successfully`) và mở rộng `forceEnglish` để bắt các prompt ALL-CAPS "PRESENT CARD" / "CARD READ OK, REMOVE CARD" (cùng lớp bug với "WELCOME TO"). Xem [mục 3.5](#35-cập-nhật-2026-07-07-bổ-sung-theo-vp-2115).
> **Trước đó (2026-07-07, đợt 2 — Lịch sử đơn hàng):** thêm 2 bug mới của **[VP-2115](https://linear.app/fastboy/issue/VP-2115)** trên màn **Lịch sử đơn hàng** — dropdown **"Phương thức hoàn tiền"** còn tiếng Anh "Cash (Remain $150.00)" (**[VP-2312](https://linear.app/fastboy/issue/VP-2312)**) và thời gian **"Cập nhật cuối"** / "Chi tiết thanh toán" hiển thị định dạng Anh "Jun 30, 2026 03:58 AM" (**[VP-2313](https://linear.app/fastboy/issue/VP-2313)**). Cả hai là điểm mù `detectScope` cố ý bỏ (luật tiền-trong-ngoặc + luật ngày-đơn) nên [`i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts) nay có **bộ dò chuyên biệt**: quét dropdown phương thức hoàn tiền + dò ngày/giờ tiếng Anh (tháng viết tắt + AM/PM) trong panel chi tiết. Từ điển thêm `remain`/`remaining`. Xem [mục 3.2](#32-cập-nhật-quét-sâu-trang-lịch-sử-đơn-hàng) và [mục 3.5](#35-cập-nhật-2026-07-07-bổ-sung-theo-vp-2115).
> **Trước đó (2026-07-07):** bổ sung theo loạt bug **[VP-2115](https://linear.app/fastboy/issue/VP-2115)** — màn **Order/POS gốc** (`/order/$id`), **Customer Display khi đang có đơn** + 2 state luồng thanh toán **Add Tip / Payment Complete**, **UI vỡ Home khi có đơn**, popup **Thông tin khách hàng**, dialog **Chấm công** ("No staffs found"), màn **Tách đơn** (Split Order), **Payment Success (Staff)**, popup **thẻ quà tặng không đủ số dư**, popup **Terms Service / Privacy Policy** phía khách, toast **xác nhận lịch hẹn**, màn **Két tiền** (`/cash-drawer`) thân trang (VP-2284), nhãn **"Tip"** còn sót ở loạt màn Thu nhập / Lịch sử đơn / Hoá đơn (VP-2283/2294) & nhãn **"Gift Card […]"** ở Order/Checkout/chi tiết đơn (VP-2286); + mở rộng từ điển (`check`, `closed`, `setup`, `promotion`, `phone`, `enter`, `terms`, `privacy`, `policy`, `message`, `alert`/`alerts`/`dialogs`…) và bắt "WELCOME TO". Xem [mục 3.5](#35-cập-nhật-2026-07-07-bổ-sung-theo-vp-2115).
**Trước đó (2026-07-02):** bổ sung **quét sâu 3 trang Báo cáo thu nhập** — xem [mục 3.4](#34-cập-nhật-quét-sâu-3-trang-báo-cáo-thu-nhập-incomes) và bản đồ dịch [`incomes-translation-map.md`](incomes-translation-map.md).
**Trước đó (2026-07-02):** **quét sâu Đơn đang chờ** — [mục 3.3](#33-cập-nhật-quét-sâu-trang-đơn-đang-chờ) · [`order-pending-translation-map.md`](order-pending-translation-map.md).
**Trước đó (2026-07-02):** **quét sâu Lịch sử đơn hàng** — [mục 3.2](#32-cập-nhật-quét-sâu-trang-lịch-sử-đơn-hàng) · [`order-history-translation-map.md`](order-history-translation-map.md).
**Trước đó (2026-07-01):** **quét sâu Home** — [mục 3.1](#31-cập-nhật-quét-sâu-trang-home) · [`home-translation-map.md`](home-translation-map.md).

Tài liệu này mô tả **luồng đi** của test, **trang nào / link nào / popup nào** được quét, và **cơ chế phát hiện** chuỗi tiếng Anh còn sót. Đây là file đặc tả (spec) — dùng nó làm nguồn sự thật khi cần sửa/mở rộng test.

---

## 1. Mục tiêu

Chuyển app sang **Tiếng Việt**, đi qua mọi màn hình điều hướng được, và liệt kê **chính xác màn nào còn hiển thị chữ tiếng Anh**. Kết quả ra báo cáo HTML có: danh sách chuỗi cần dịch (gom trùng), ảnh thumbnail từng trang lỗi, và diff so với lần chạy trước (mới phát sinh / vừa dịch xong).

---

## 1b. Danh sách toàn bộ URL màn hình (nguồn: bảng route do user cung cấp, 2026-07-07)

Bảng dưới là **toàn bộ màn hình** của app theo route, dùng làm nguồn đối chiếu khi mở rộng độ phủ quét. Cột **Quét ở đâu** trỏ tới mục tương ứng trong file này.

**Staff interface (main window):**

| Màn hình                       | URL                                           | Quét ở đâu                                                                                                                       |
| ------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Home                           | `/home`                                       | [mục 4](#4-trang-tĩnh-được-quét-static_routes--24-màn) (STATIC_ROUTES) + [mục 3.1](#31-cập-nhật-quét-sâu-trang-home) (deep scan) |
| Order pending                  | `/order-pending`                              | mục 4 + [mục 3.3](#33-cập-nhật-quét-sâu-trang-đơn-đang-chờ)                                                                      |
| Checkout (view cart)           | `/order/$orderId/checkout/view-cart`          | [mục 6](#6-luồng-đơn-hàng--thanh-toán-checkout)                                                                                  |
| Checkout (processing payment)  | `/order/$orderId/checkout/processing-payment` | mục 6                                                                                                                            |
| Checkout (payment success)     | `/order/$orderId/checkout/payment-success`    | mục 6                                                                                                                            |
| Split order                    | `/order/$orderId/split-order`                 | mục 6 + [mục 3.5](#35-cập-nhật-2026-07-07-bổ-sung-theo-vp-2115) (`scanSplitOrder`)                                               |
| Order history (list)           | `/order-history`                              | mục 4 + [mục 3.2](#32-cập-nhật-quét-sâu-trang-lịch-sử-đơn-hàng)                                                                  |
| Order history (chi tiết)       | `/order-history/$orderId`                     | [mục 5](#5-trang-chi-tiết-động-click-item-đầu-danh-sách) (`scanDynamic`)                                                         |
| Appointment                    | `/appointment`                                | mục 4 + [mục 7](#7-thông-báo-chuông-)                                                                                            |
| Cash drawer                    | `/cash-drawer`                                | mục 4                                                                                                                            |
| Batch history                  | `/batch-history`                              | mục 4 (gated)                                                                                                                    |
| Time tracking                  | `/time-tracking`                              | mục 4                                                                                                                            |
| Incomes (index)                | `/incomes`                                    | mục 4 (mới thêm — trước đây chỉ quét 3 route con)                                                                                |
| Income summary                 | `/incomes/income-summary`                     | mục 4 (gated) + [mục 3.4](#34-cập-nhật-quét-sâu-3-trang-báo-cáo-thu-nhập-incomes)                                                |
| Income daily                   | `/incomes/income-daily`                       | mục 4 (gated) + mục 3.4                                                                                                          |
| Income staff                   | `/incomes/income-staff`                       | mục 4 (gated) + mục 3.4                                                                                                          |
| Settings (index)               | `/settings`                                   | mục 4 (mới thêm — trước đây chỉ quét các route con)                                                                              |
| Settings – Business            | `/settings/business`                          | mục 4 + [mục 3.6](#36-cập-nhật-2026-07-07-đợt-5-bổ-sung-vp-2115-setting-page) (EN_DATETIME)                                      |
| Settings – Accessibility       | `/settings/accessibility`                     | mục 4                                                                                                                            |
| Settings – Language            | `/settings/language`                          | mục 4                                                                                                                            |
| Settings – Permissions         | `/settings/permissions`                       | mục 4 (expandAll)                                                                                                                |
| Settings – Receipt             | `/settings/receipt`                           | mục 4                                                                                                                            |
| Settings – Charge fee          | `/settings/charge-fee`                        | mục 4                                                                                                                            |
| Settings – Roles (list)        | `/settings/roles`                             | mục 4                                                                                                                            |
| Settings – Roles (chi tiết)    | `/settings/roles/$roleId`                     | mục 5 (`scanDynamic`)                                                                                                            |
| Settings – Staffs (list)       | `/settings/staffs`                            | mục 4                                                                                                                            |
| Settings – Staffs (chi tiết)   | `/settings/staffs/$staffId`                   | mục 5 + [mục 9](#8-popup--dialog-được-quét-popup_defs) (5 tab hồ sơ)                                                             |
| Settings – Services (list)     | `/settings/services`                          | mục 4                                                                                                                            |
| Settings – Services (danh mục) | `/settings/services/$categoryId`              | mục 5                                                                                                                            |

> Settings – Demo mode là dialog (không có route riêng), mở trong `/settings` → quét qua `POPUP_DEFS` (mục 8), không có dòng route riêng.

**Customer-facing display:**

| Màn hình              | URL                      | Quét ở đâu                                            |
| --------------------- | ------------------------ | ----------------------------------------------------- |
| Customer home/display | `/customer`              | mục 4 + `scanCustomerDisplay()` (mục 3.5, khi có đơn) |
| Customer force-update | `/customer/force-update` | mục 4                                                 |

**Khác (ngoài `_app`):**

| Màn hình             | URL                  | Quét ở đâu                                                                                        |
| -------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| Login                | `/login`             | **Ngoài phạm vi** — cần phiên chưa đăng nhập, `switchToVietnamese()` yêu cầu đã đăng nhập (mục 2) |
| Login staff token    | `/login-staff-token` | **Ngoài phạm vi** — cùng lý do (chưa đăng nhập)                                                   |
| Splashscreen         | `/splashscreen`      | **Ngoài phạm vi** — màn chuyển tiếp lúc khởi động, không giữ được đủ lâu để quét                  |
| Force update (chung) | `/force-update`      | mục 4                                                                                             |

---

## 1a. Nguồn gốc: [VP-462 — Multiple Languages](https://linear.app/fastboy/issue/VP-462/multiple-languages)

Toàn bộ luồng quét trong file này kiểm tra việc **triển khai tính năng đa ngôn ngữ (VP-462, status: Done)** — cho phép merchant chuyển app giữa **English** và **Tiếng Việt**. Các ràng buộc nghiệp vụ dưới đây là "nguồn sự thật" khi phân loại một chuỗi English còn sót là **bug thật** hay **out-of-scope** (không tính vào cổng):

**Phạm vi:**

- **Cấp áp dụng:** ngôn ngữ set ở **merchant level**, áp dụng cho **mọi POS device** cùng merchant (không phải setting riêng từng máy).
- **Trong scope (chỉ Static UI):** Button, Label, Menu/Navigation, Popup/Modal, Toast/Snackbar, Validation message, Error message, Empty state, System message — đây là tập text mà `detectScope` + từ điển `ui` trong file này nhằm bắt.
- **Ngoài scope (out of scope — không tính vào cổng, không gắn cờ):** nội dung **DB** (tên service/category/item/gift card/khách hàng/nhân viên), **Receipt/Printer**, **Report/Export**, **định dạng Currency/Date-Time/Number**. Đây chính là lý do `DATA_ZONE_SELECTORS`/`DATA_VALUES` và luật bỏ-qua-ngày-tháng-tiền-tệ trong [mục 10](#10-cơ-chế-phát-hiện-chuỗi-tiếng-anh-detectscope) tồn tại — khớp đúng ranh giới scope của VP-462, **trừ** 2 điểm mù cố ý vá thêm sau (VP-2312/2313 — bộ dò chuyên biệt vẫn bắt ngày/giờ & phương thức hoàn tiền trong dropdown vì đó là **label UI**, không phải data trần).

**User flow gốc** (đường `General Settings > Language Setting`, tương ứng route `/settings/language` trong [STATIC_ROUTES](#4-trang-tĩnh-được-quét-static_routes--24-màn)): chọn ngôn ngữ (radio English/Tiếng Việt) → Apply → modal xác nhận "Change Language? / Changing language will apply to all POS devices in this merchant." → Confirm → loading → áp dụng.

**Default & Fallback:** ngôn ngữ mặc định là **English**; chuỗi thiếu bản dịch phải **fallback về English**, **không được hiện raw key** — đây là lý do một số bug trong [mục 3.5](#35-cập-nhật-2026-07-07-bổ-sung-theo-vp-2115) (ví dụ các câu hardcode tiếng Anh trong `income-daily-error.tsx`) được xem là **bug thật** dù có key sẵn: đúng ra phải qua `t()` để tự fallback, không phải hardcode string Anh trực tiếp trong code.

**Bug đã biết liên quan trực tiếp đến luồng quét:** ứng dụng **không lưu ngôn ngữ qua reload** — đây là ràng buộc kỹ thuật ở [mục 2](#2-ràng-buộc-kỹ-thuật-quan-trọng) buộc test phải điều hướng client-side thay vì `page.goto`.

**Acceptance Criteria** liên quan trực tiếp tới phạm vi quét ở file này: _"Only static UI is translated"_, _"No DB content is translated"_, _"No receipt/printer translation"_, _"Missing translation falls back to English"_, _"No raw key is displayed"_ — 5 tiêu chí này là kim chỉ nam khi quyết định một finding có nên vào báo cáo `auto-scan.html` hay ghi nhận "out of scope theo VP-462".

---

## 2. Ràng buộc kỹ thuật quan trọng

- **App KHÔNG lưu ngôn ngữ qua reload** (bug đã biết). Vì vậy test chỉ đổi sang Tiếng Việt **một lần** qua UI, rồi điều hướng **client-side** bằng TanStack Router (`window.__TSR_ROUTER__.navigate`) để giữ trạng thái VN sống. **Không dùng `page.goto`** giữa chừng (sẽ revert về tiếng Anh).
- Test **fail** khi có bất kỳ màn nào còn tiếng Anh (đây là "cổng" localization). Đặt `I18N_LENIENT=1` để chạy chỉ-báo-cáo, không fail.
- Timeout toàn test: **600 giây** (10 phút — full walk gồm deep scan Home / Lịch sử đơn / Đơn đang chờ / 3 trang Thu nhập nên mất ~7–8 phút).

---

## 3. Luồng đi (thứ tự các bước)

```
1. switchToVietnamese()      → mở /settings/language, click "Tiếng Việt", chờ sidebar re-render VN
2. Kiểm tra __TSR_ROUTER__    → bắt buộc có router client-side (nếu không → fail ngay)
3. Quét STATIC_ROUTES         → 22 route tĩnh (mục 4)
4. Quét trang chi tiết động   → click item đầu trong list rồi quét (mục 5)
5. Quét luồng đơn hàng/checkout → từ 1 order id lấy được (mục 6)
6. Quét thông báo (chuông 🔔)  → mở panel + click 1 thông báo → trang lịch hẹn (mục 7)
7. Quét popup                 → POPUP_DEFS + HOME_POPUP_DEFS: mở từng dialog, quét, đóng (mục 8)
8. Quét panel chi tiết theo hàng → income/batch/product/nhân viên (mục 9)
9. Quét 5 tab hồ sơ nhân viên  → (mục 9)
9b. Quét dialog theo đơn của Home → tạo đơn (staff+service) → Note, Promo & Rewards, Thông tin khách hàng (mục 3.1, 3.5)
9c. Quét thân /home khi có đơn + Customer Display (/customer) khi có đơn (mục 3.5 — VP-2298/2302)
9d. Chấm công dialog + Tách đơn (Split Order) (mục 3.5 — VP-2246/2288…)
10. Ghi báo cáo               → diff vs lần trước, xuất HTML + JSON
11. Gate                      → mỗi trang chưa dịch = 1 expect.soft fail (+ cổng phủ tối thiểu 40 bề mặt)
```

### 3.1. [Cập nhật] Quét sâu trang Home

Bổ sung tại [`src/utils/i18nHome.ts`](../../src/utils/i18nHome.ts) — chi tiết chuỗi/trigger ở [`home-translation-map.md`](home-translation-map.md). Gồm 2 phần, **đều chạy sau khi đã bật Tiếng Việt** và điều hướng client-side (giữ nguyên nguyên tắc mục 2):

**(a) `HOME_POPUP_DEFS`** — popup mở được **không cần đơn hàng**, gộp chung vòng lặp popup (bước 7):
| Popup | Trigger (đã verify qua MCP) |
|-------|------------------------------|
| Bán thẻ quà tặng (Sell Gift Card) | click "Gift Card" |
| Cảnh báo chọn nhân viên (Select Staff First) | click "Quick Pay" lúc chưa chọn staff |
| Tìm kiếm toàn cục | Ctrl+K / nút Search |
| Quét mã (Scanner) | nút "Scanner" (thường cần camera) |

**(b) `scanHomeOrderDialogs(page, record)`** — bước **9b**, dialog chỉ xuất hiện khi đơn có staff + service:

1. Về `/home` (router) → chọn **staff đầu** (tạo đơn) → thêm **service đầu**.
2. Mở lần lượt → quét → đóng: **Ghi chú đơn (Order Note)**, **Khuyến mãi & Thưởng (Promo & Rewards)**.
3. Best-effort: thiếu staff/service hoặc dialog không mở được → bỏ qua, **không** làm fail.

> Kết quả chạy thử (lenient) 2026-07-01: 7 surface Home được quét. Các trigger khai **nhiều fallback** (nhãn EN → nhãn VN → cấu trúc) vì lúc quét app đang ở Tiếng Việt.

**Spec chạy độc lập (nhanh):** [`TC-i18n-home-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts) chỉ quét Home (~40s thay vì ~5 phút), xuất báo cáo riêng `reports/i18n-audit/home-scan.{html,json}`. Dùng khi cần iterate nhanh việc sửa dịch trang Home.

> Chạy: `ENV=local I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts`
> Phát hiện đầu tiên: 2 ô quick-action **"Quick Pay"** và **"Gift Card"** trên `/home` còn tiếng Anh (chưa qua `t()`).

Các bước 4–9 đều là **best-effort**: thiếu dữ liệu / không mở được thì bỏ qua, **không làm fail** test (chỉ mục 3 và popup mở được mới tính vào cổng).

### 3.2. [Cập nhật] Quét sâu trang Lịch sử đơn hàng

Bổ sung tại [`src/utils/i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts) — chi tiết chuỗi/trigger ở [`order-history-translation-map.md`](order-history-translation-map.md). Gồm 1 popup-def + 3 hàm quét động, **đều chạy sau khi đã bật Tiếng Việt** và điều hướng client-side:

**(a) `ORDER_HISTORY_POPUP_DEFS`** — popup mở được **không cần chọn đơn**, gộp chung vòng lặp popup (bước 4c):
| Popup | Trigger (đã verify qua MCP) |
|-------|------------------------------|
| Lịch chọn ngày (DatePicker) | click nút có aria `icon-calendar` (popover là `[role=dialog]`) |

**(b) 3 hàm quét động** (bước **4e-oh**, best-effort):

1. `scanOrderHistoryFilter()` — mở "Bộ lọc" → quét dialog + 4 dropdown con (Sắp xếp / Nhân viên / Phương thức thanh toán / Trạng thái). _(tất cả đã dịch — quét để chống hồi quy)_
2. `scanOrderHistoryDatePicker()` — mở lịch, dò **tên tháng/thứ tiếng Anh** ("June 2026", "Mo Tu We…") mà từ điển chung không bắt được → flag lưới lịch chưa localize.
3. `scanOrderHistoryDetail()` — click đơn đầu → quét panel chi tiết → mở/quét dialog **Hoá đơn** (rò "Current points:", "Total visit:", "Staff:", "Business Note:", câu chính sách) và **Hoàn tiền**. Ngoài phần quét chung, hàm nay có **2 bộ dò chuyên biệt** cho 2 điểm mù `detectScope` cố ý bỏ:
   - **VP-2313 — ngày/giờ định dạng Anh** trong panel ("Cập nhật cuối: Jun 30, 2026 03:58 AM") + tiêu đề nhóm ngày ở danh sách ("Jul 1, 2026"). `detectScope` coi ngày trơ là DATA nên bỏ qua → dùng regex `EN_DATETIME` (tháng viết tắt + năm, hoặc giờ HH:MM AM/PM), quét theo phần tử lá & tránh data-zone, gộp vào `ui` của panel. Cùng lớp bug với lưới lịch (§3, VP-2198).
   - **VP-2312 — dropdown "Phương thức hoàn tiền"** trong dialog Hoàn tiền còn "Cash (Remain $150.00)" (mong đợi "Tiền mặt (Còn lại $150.00)"). "Cash"/"Card" bị luật tiền-trong-ngoặc bỏ qua, "Remain" chưa có trong từ điển → `scanRefundMethod()` mở dropdown, quét option bằng bộ dò phương thức TT chuyên biệt (Cash/Card/Gift Card/Other/Check/Remain…). Best-effort: nút Hoàn tiền chỉ hiện với đơn **Đã quyết toán** — nếu không mở được ghi `reachable:false`.

> Kết quả mong đợi: rò tiếng Anh tập trung ở **dialog Hoá đơn** (tái dùng component `settings/receipt/-receipt-preview/*`), **lưới lịch**, nhãn `Amount:` ở chi tiết thanh toán, **ngày/giờ định dạng Anh** (VP-2313) và **dropdown phương thức hoàn tiền** (VP-2312). Phương thức TT `Cash`/`Card` ở **thẻ đơn** nằm trong data-zone nên không tính vào cổng (ghi nhận thủ công) — nhưng trong dropdown Hoàn tiền thì được bộ dò chuyên biệt bắt.

**Spec chạy độc lập (nhanh):** [`TC-i18n-order-history-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts) chỉ quét Lịch sử đơn hàng, xuất báo cáo riêng `reports/i18n-audit/order-history-scan.{html,json}`.

> Chạy: `ENV=local I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-order-history-vietnamese-scan.spec.ts`

### 3.3. [Cập nhật] Quét sâu trang Đơn đang chờ

Bổ sung tại [`src/utils/i18nOrderPending.ts`](../../src/utils/i18nOrderPending.ts) — chi tiết chuỗi/trigger ở [`order-pending-translation-map.md`](order-pending-translation-map.md). Thân trang (filter bar + thẻ đơn) đã được route-scan bao; phần này thêm các surface chỉ hiện khi **tương tác**, chạy sau khi đã bật Tiếng Việt + điều hướng client-side:

**(a) `ORDER_PENDING_POPUP_DEFS`** — DatePicker lịch (`[role=dialog]`), gộp chung vòng lặp popup (bước 4c) — screenshot + aria.

**(b) 3 hàm quét động** (best-effort):

1. `scanOrderPendingFilter()` — mở & quét: **Bộ lọc nhân viên** (popover: _By Staff_ / _All_ / _No results found._), **Sắp xếp** (_Latest_/_Oldest_), **DatePicker preset** (_Today · Yesterday · This Week · Last Week · Last 7 Days · This Month · Last Month · Last 30 Days_).
2. `scanOrderPendingDatePicker()` — mở lịch, dò **tên tháng/thứ tiếng Anh** ("July 2026", "Mo Tu We…") — cùng bug với Lịch sử đơn hàng.
3. `scanOrderPendingCardOpen()` — click thẻ đầu → best-effort quét **dialog guard** ("Order in use" / "Complete the current order first") nếu bật lên (khó ép — cần trạng thái đơn đặc thù).

> Empty/Error state ("No pending orders", "Couldn't load pending orders") và toast lỗi cần điều kiện (0 đơn / lỗi mạng) → không ép; ghi nhận thủ công trong bản đồ dịch.

**Spec chạy độc lập (nhanh):** [`TC-i18n-order-pending-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-order-pending-vietnamese-scan.spec.ts) → báo cáo riêng `reports/i18n-audit/order-pending-scan.{html,json}`.

> Chạy: `ENV=local I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-order-pending-vietnamese-scan.spec.ts`

### 3.4. [Cập nhật] Quét sâu 3 trang Báo cáo thu nhập (Incomes)

Bổ sung tại [`src/utils/i18nIncomes.ts`](../../src/utils/i18nIncomes.ts) — chi tiết ở [`incomes-translation-map.md`](incomes-translation-map.md). Phạm vi: **Daily Sale Report** (`/incomes/income-daily`), **Income Summary** (`/incomes/income-summary`), **Staff Income** (`/incomes/income-staff`) — cả 3 **gated** (passcode chủ 8888). Thân trang (tabs Day/Week/Month, cột bảng, Search staff, empty) đã được route-scan bao; phần này thêm:

**(a) `scanIncomesGate`** — quét **dialog passcode** ("Enter your passcode" / "Do not require passcode for the next 30 minutes") **trước khi** mở khoá, rồi nhập 8888. Chạy trước vòng STATIC_ROUTES (route-scan nhập passcode nhưng không quét text dialog). No-op nếu đã mở khoá.

**(b) `INCOMES_POPUP_DEFS`** — DatePicker lịch (`[role=dialog]`, `gated`), gộp vòng lặp popup.

**(c) 2 hàm quét động** (best-effort):

1. `scanIncomesDatePicker()` — mở lịch → dò tên tháng/thứ tiếng Anh ("July 2026", "Mo Tu We…") — cùng bug lưới lịch.
2. `scanIncomesDetail()` — click hàng đầu (summary + staff) → panel chi tiết (**Print** + headings) → best-effort mở **Order Details** dialog.

> **i18n gap thật:** `income-daily-error.tsx:5-6` hardcode "Failed to load store daily income data!" + "Please try again later." trong khi đã có key `global.failedLoadDailyIncome` / `global.tryAgainLater` (khó ép — cần load fail; ghi nhận thủ công).

**Spec chạy độc lập (nhanh):** [`TC-i18n-incomes-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-incomes-vietnamese-scan.spec.ts) → báo cáo riêng `reports/i18n-audit/incomes-scan.{html,json}`.

> Chạy: `ENV=local I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-incomes-vietnamese-scan.spec.ts`

### 3.5. [Cập nhật 2026-07-07] Bổ sung theo VP-2115

Loạt bug mới của **[VP-2115](https://linear.app/fastboy/issue/VP-2115)** (đợt 2026-07-07). Đã thêm bề mặt/độ phủ và tinh chỉnh bộ dò. Bản đồ bug→nơi quét cũng ghi trong khối comment "VP-2115 bug coverage" đầu file [`TC-i18n-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts).

**(a) Màn / bề mặt mới đưa vào luồng quét:**

| Bug                                   | Màn / bề mặt                                                                                                                                                                                                    | Đưa vào đâu                                                                                                                                                                                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VP-2301                               | **Order / POS gốc** (`/order/$id`) — "Order #", "Points:", "Total visits:", ngày giờ EN                                                                                                                         | entry `sub:''` trong `ORDER_SUBROUTES` (mục 6)                                                                                                                                                                                                                                                    |
| VP-2302                               | **Customer Display khi ĐANG có đơn** (`/customer`) — "Order Details", "Subtotal", "Promotion", "Hello there! Is this your phone number?", "No, enter again"…                                                    | `scanCustomerDisplay()` ([`i18nHome.ts`](../../src/utils/i18nHome.ts)) — chạy ngay sau khi mở đơn                                                                                                                                                                                                 |
| VP-2303                               | **Add Tip (Customer Display)** — "Add a tip", "Custom Tip", "No Tip", "Continue", "By proceeding… Terms and Privacy Policy"                                                                                     | `scanCustomerDisplay()` ghi **manual** (cần thanh toán thật) + từ điển `terms/privacy/policy`                                                                                                                                                                                                     |
| VP-2304                               | **Payment Complete (Customer Display)** — "Congrats… points", "Payment complete", "Text Message"/"Email"                                                                                                        | `scanCustomerDisplay()` ghi **manual** + từ điển `message`/`points`                                                                                                                                                                                                                               |
| VP-2305                               | **Payment Success (Staff)** — "Cash (Received… Change…)", "$X + $Y Tip"                                                                                                                                         | đã phủ bởi subroute `/order/$id/payment-success` (mục 6)                                                                                                                                                                                                                                          |
| VP-2306                               | Popup **thẻ quà tặng không đủ số dư** (checkout) — còn "check"                                                                                                                                                  | từ điển `check` (đã có) + ghi **manual** (cần thanh toán thẻ quà tặng)                                                                                                                                                                                                                            |
| VP-2307                               | **"Unknown"** ở màn Order/Thanh toán                                                                                                                                                                            | từ điển `unknown` (đã có) + đã phủ bởi `/order/$id` & checkout scans                                                                                                                                                                                                                              |
| VP-2308                               | Popup **Terms Service** (mở từ màn nhập SĐT khách) — "Welcome to GoCheckIn…", "Acceptance of Terms"…                                                                                                            | `scanCustomerDisplay()` ghi **manual** + từ điển `terms`/`service` + `forceEnglish`                                                                                                                                                                                                               |
| VP-2309                               | Popup **Privacy Policy** (mở từ màn nhập SĐT khách) — toàn văn EN                                                                                                                                               | `scanCustomerDisplay()` ghi **manual** + từ điển `privacy`/`policy`                                                                                                                                                                                                                               |
| VP-2311                               | Toast **xác nhận lịch hẹn** ("… has been confirmed.")                                                                                                                                                           | từ điển `confirmed`/`appointment` (đã bắt qua panel Thông báo §7) + ghi **manual** (xác nhận làm đổi trạng thái)                                                                                                                                                                                  |
| VP-2298                               | **UI vỡ màn Home khi có đơn** — thẻ dịch vụ bị cắt, ô tìm kiếm cắt, card "null"                                                                                                                                 | quét thân `/home` sau khi mở đơn (trong `scanHomeOrderDialogs`) — chỉ báo cáo UI vỡ                                                                                                                                                                                                               |
| VP-2299                               | Popup **Thông tin khách hàng** (Customer Info) — cột "Ngày & Giờ" (định dạng EN) + "Tip"                                                                                                                        | thêm vào `ORDER_DIALOGS` ([`i18nHome.ts`](../../src/utils/i18nHome.ts)), best-effort                                                                                                                                                                                                              |
| VP-2246                               | Dialog **Chấm công** — empty state "No staffs found."                                                                                                                                                           | `scanTimeKeepingDialog()` (đã có sẵn, nay được **GỌI** trong spec)                                                                                                                                                                                                                                |
| VP-2288 / VP-2290 / VP-2291 / VP-2292 | **Tách đơn (Split Order)** — "Equally / By Amount / Check / Paid by / Total Paid / Tip" + popup thanh toán                                                                                                      | `scanSplitOrder()` ([`i18nSplitOrder.ts`](../../src/utils/i18nSplitOrder.ts))                                                                                                                                                                                                                     |
| VP-2295                               | Popup **Chỉnh tip đơn hàng** (Order History)                                                                                                                                                                    | đã có trong `DETAIL_DIALOGS` (mục 3.2)                                                                                                                                                                                                                                                            |
| VP-2312                               | Dropdown **"Phương thức hoàn tiền"** (Order History ▸ Hoàn tiền) — còn "Cash (Remain $150.00)"                                                                                                                  | `scanRefundMethod()` trong `scanOrderHistoryDetail` ([`i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts)) + từ điển `remain`/`remaining` (mục 3.2)                                                                                                                                       |
| VP-2313                               | **Ngày/giờ định dạng Anh** (Order History ▸ chi tiết) — "Cập nhật cuối: Jun 30, 2026 03:58 AM" + tiêu đề nhóm ngày "Jul 1, 2026"                                                                                | bộ dò `EN_DATETIME` trong `scanOrderHistoryDetail` ([`i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts)) — cùng lớp bug lưới lịch (mục 3.2, VP-2198)                                                                                                                                     |
| VP-2244                               | Tabs tìm kiếm **All/Appointment/Customer/Order**                                                                                                                                                                | Global Search popup (mục 3.1)                                                                                                                                                                                                                                                                     |
| VP-2283 / VP-2294                     | **"Tip"** chưa dịch — `/batch-history` ▸ chi tiết, `/incomes/*` (+ chi tiết), `/order-history` ▸ chi tiết, `/order/$id/checkout`, `/settings/receipt`                                                           | từ điển `tip` (đã có) — các màn đều đã route-scan / deep-scan bao (mục 4, 5, 9). Đề xuất dịch **"Tiền tip"** thống nhất                                                                                                                                                                           |
| VP-2286                               | Nhãn **"Gift Card [\*\***-\***\*-XXXX]"** + câu "Cannot use Gift Card to buy a Gift Card. Use another payment method." + "Unknown" — màn **Order** (`/order/$id`), **Checkout**, **chi tiết đơn** (Lịch sử đơn) | từ điển `gift`/`card`/`payment`/`method`/`unknown` (đã có) + `/order/$id` & `checkout` (mục 6) & order-history detail (mục 5). Dòng giỏ hàng KHÔNG nằm trong data-zone nên được quét                                                                                                              |
| VP-2284                               | **`/cash-drawer` (Két tiền)** — thân trang: heading nhóm "Alerts"/"Dialogs" + toàn bộ nút (Show Dialog, Remove…, Void Order, Refund Payment, Add a Tip, Split Tip, Filter)                                      | route `/cash-drawer` (mục 4) — các nút đã bắt qua dict; **bổ sung** dict `alert`/`alerts`/`dialogs` cho 2 heading nhóm trước đây bị bỏ sót                                                                                                                                                        |
| VP-2315                               | **Custom tip** (luồng thanh toán thẻ) — "Custom tip on $110.00", nút "Done"                                                                                                                                     | **Manual** (mục 4a4) — cần thanh toán thẻ; từ điển `custom`/`tip`/`done` (đã có)                                                                                                                                                                                                                  |
| VP-2316                               | **Total Amount** (thanh toán thẻ) — "Total Amount", "Tip", "PRESENT CARD"                                                                                                                                       | **Manual** (mục 4a4) — cần đầu đọc thẻ; từ điển `total`/`amount`/`tip`/`present` + `forceEnglish` bắt "PRESENT CARD"                                                                                                                                                                              |
| VP-2317                               | **Add Signature** (thanh toán thẻ) — "Add Signature", "Transaction approved. Please sign your name.", "Sign here", "Clear", "Continue"                                                                          | **Manual** (mục 4a4) — hiện sau khi giao dịch thẻ được duyệt; từ điển `sign`/`signature`/`transaction` (câu "Transaction approved…" đã bắt qua luật câu)                                                                                                                                          |
| VP-2318                               | Popup **"Payment Successfully"** (Order Page)                                                                                                                                                                   | **Manual** (mục 4a4) — cần hoàn tất thanh toán; từ điển `payment`/`successfully`                                                                                                                                                                                                                  |
| VP-2319                               | Popup **"Waiting for connect device…"** + "Getting ready to charge" (Order Page)                                                                                                                                | **Manual** (mục 4a4) — cần kết nối đầu đọc thẻ; từ điển `waiting`/`connect`/`device`/`getting`/`ready`                                                                                                                                                                                            |
| VP-2320                               | Popup **"Getting ready to charge"** — "PRESENT CARD", "CARD READ OK, REMOVE CARD"                                                                                                                               | **Manual** (mục 4a4) — cần đầu đọc thẻ thật; từ điển `getting`/`ready`/`charge` + `forceEnglish` bắt 2 prompt ALL-CAPS                                                                                                                                                                            |
| VP-2321                               | **Màn tiến hành thanh toán thẻ** (chuỗi trạng thái `present → read → processing`) — "Total Amount"/"Tip"/"PRESENT CARD" → "CARD READ OK, REMOVE CARD" → "Processing"                                            | **Manual** (mục 4a4 — entry thứ 7 của `CARD_PAY_FLOW`) — cần đầu đọc thẻ + giao dịch thật; từ điển `total`/`amount`/`tip`/`processing` (đã có) + `forceEnglish` bắt 2 prompt ALL-CAPS. Đề xuất dịch "Tổng tiền"/"Tiền tip"/"Vui lòng đưa thẻ"/"Đọc thẻ thành công, vui lòng rút thẻ"/"Đang xử lý" |
| VP-2310 / VP-2143                     | **Màn Lịch hẹn** — panel **Thông báo** (chuông 🔔) còn tiếng Anh "… appointment on … has been confirmed."                                                                                                       | Đã phủ: **panel Thông báo** (§7) bắt câu này nhờ **luật câu** `detectScope` (kết thúc `.` / chứa "has been" → là UI, không phải DATA) + từ điển `appointment`/`confirmed` (đã có). Route `/appointment` đã trong STATIC_ROUTES (mục 4)                                                            |

**(b) Bổ sung từ điển `detectScope`** (bắt chuỗi mà từ điển cũ bỏ sót — mỗi từ kèm chú thích bug trong code): `check`/`checks` (VP-2290/91/92), `closed` (VP-2274), `setup`/`waiting`/`approval`/`approve`/`portal` (VP-2243), `promotion`/`promotions` + `phone` + `enter` (VP-2302), `terms`/`privacy`/`policy` (VP-2303), `message` (VP-2304), `alert`/`alerts`/`dialogs` (VP-2284 — heading nhóm "Alerts"/"Dialogs" trên màn Két tiền `/cash-drawer`), `present`/`sign`/`signature`/`transaction`/`getting`/`ready`/`successfully` (VP-2315…VP-2320 — luồng thanh toán thẻ trên màn Order). **VP-2321** (màn tiến hành thanh toán thẻ: "Total Amount"/"Tip"/"PRESENT CARD" → "CARD READ OK, REMOVE CARD" → "Processing") **KHÔNG cần thêm từ mới** — `total`/`amount`/`tip`/`processing` đã có sẵn + `forceEnglish` bắt 2 prompt ALL-CAPS.

**(c) Bắt các chuỗi ALL-CAPS hardcode** qua regex `forceEnglish` trong `detectScope` (kiểm **trước** `looksLikeData` nên vượt qua luật "tên viết HOA nhiều từ / tên riêng ≥3 từ"):

- "WELCOME TO [tên tiệm]" (VP-2285/VP-2282).
- Prompt của đầu đọc thẻ **"PRESENT CARD" / "CARD READ OK, REMOVE CARD"** (VP-2320/VP-2316/VP-2321) — cùng lớp bug ALL-CAPS. Regex nay là `/^welcome to\b|\b(present|insert|tap|swipe) card\b|\bcard read\b|\bremove card\b/i`.

**(d) Cổng phủ tối thiểu:** thêm `expect.soft(scans.length).toBeGreaterThanOrEqual(40)` trong spec — chống hồi quy làm tụt độ phủ (route tĩnh + vòng popup luôn vượt mức này kể cả khi mọi bề mặt best-effort không mở được).

> **Chưa tự động được (kiểm THỦ CÔNG — không tính vào cổng):** màn đồng bộ thiết bị "Finishing setup…" / "Waiting for device approval…" (VP-2243, tiền-đăng-nhập); popup **Thanh toán thành công** của Tách đơn (VP-2292 — cần thực thanh toán 1 check, ghi `reachable:false`); 2 state luồng thanh toán phía khách **Add Tip** (VP-2303) và **Payment Complete** (VP-2304) — cần thu ngân bắt đầu/hoàn tất thanh toán thật, `scanCustomerDisplay()` ghi `reachable:false`; popup **thẻ quà tặng không đủ số dư** khi checkout (VP-2306 — cần thanh toán bằng thẻ không đủ số dư, ghi `reachable:false`; từ "check" đã có trong từ điển); popup **Terms Service** / **Privacy Policy** phía khách (VP-2308/2309 — mở từ màn nhập SĐT khách, ghi `reachable:false`; từ `terms`/`service`/`privacy`/`policy` + `forceEnglish` đã có); toast **xác nhận lịch hẹn** (VP-2311 — xác nhận làm đổi trạng thái/gửi thông báo khách, ghi `reachable:false`; chuỗi đã bắt qua panel Thông báo); **toàn bộ luồng thanh toán bằng thẻ** trên màn Order — **Custom tip** (VP-2315), **Total Amount** "PRESENT CARD" (VP-2316), **Add Signature** (VP-2317), popup **"Payment Successfully"** (VP-2318), popup **"Waiting for connect device…"** (VP-2319), popup **"Getting ready to charge"** với "PRESENT CARD"/"CARD READ OK, REMOVE CARD" (VP-2320) và **màn tiến hành thanh toán thẻ** `present → read → "Processing"` (VP-2321) — đều cần **giao dịch thẻ thật + đầu đọc thẻ**, spec ghi `reachable:false` (mục 4a4); từ điển + `forceEnglish` đã bao các chuỗi này; trạng thái **"Closed"** tab Giờ làm việc (cần tắt OFF 1 ngày, VP-2274); bảng "Đơn hàng" trong popup **Thông tin khách hàng** (cần khách có lịch sử đơn, VP-2299); màn **Welcome/Customer** hiện "WELCOME TO" (cần đúng trạng thái hiển thị banner); **cột/dropdown role "Owner"/"Manager"/"Staff"** ở trang Quyền hạn, tab Quyền hạn nhân viên và dropdown "Vai trò nhân viên" (VP-2279/2280/2272/2275) — các giá trị này khớp **chính xác** `DATA_VALUES` (`['Owner','Manager','Staff','Product','Custom...']`) nên `detectScope` **cố tình bỏ qua** (coi là dữ liệu role/API, không phải copy UI — cùng lý do staff card không bị gắn cờ khi hiện tên role); "Partner" không nằm trong `DATA_VALUES` nên VẪN được gắn cờ nếu render trần, nhưng 3 giá trị còn lại cần **kiểm thủ công bằng mắt** (xem ảnh chụp / mở trực tiếp trang Quyền hạn và dropdown vai trò).

### 3.6. [Cập nhật 2026-07-07, đợt 5] Bổ sung VP-2115 — Setting Page

Loạt sub-bug mới của **[VP-2115](https://linear.app/fastboy/issue/VP-2115)** dưới nhóm cha **[VP-2269 — Setting Page](https://linear.app/fastboy/issue/VP-2269)**, cộng 2 bug lẻ **VP-2200** (Order Pending) và **VP-2142** (toast máy in). Khác với các đợt trước, phần lớn **không cần thêm bề mặt quét mới** vì `/settings/permissions` (ExpandAll) và `/settings/staffs` + 5 tab hồ sơ **đã** route/tab-scan sẵn (mục 4/5/9) — chỉ cần đúng từ trong từ điển.

**(a) Bug → nơi quét:**

| Bug               | Màn / bề mặt                                                                                                                                                                  | Đưa vào đâu                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| VP-2325           | **Thông tin doanh nghiệp** (`/settings/business`) — "Kỳ trả lương" + giờ làm việc theo ngày hiển thị định dạng Anh ("Jul 01 - Jul 10, 2026", "09:00 AM - 05:00 PM")           | route `/settings/business` (mục 4) — **mới thêm**: merge `detectEnDateTimeHits()` (`EN_DATETIME`, đã dùng cho VP-2313) vào riêng route này trong vòng lặp `STATIC_ROUTES` (spec, bước 2)                                                                                                                                                                                             |
| VP-2278 / VP-2270 | Toggle **"Active"** ở popup Cài đặt Tip (`/settings/charge-fee`), popup Thêm dịch vụ/sản phẩm (`/settings/services`), màn Nhân viên                                           | đã phủ: route `/settings/charge-fee` (mục 4) + popup "Tạo cấu hình tip" & "Thêm dịch vụ / sản phẩm" (mục 8b) + route/detail `/settings/staffs` (mục 4/5/9). Từ điển `active` **đã có sẵn**                                                                                                                                                                                           |
| VP-2280 / VP-2279 | Trang **Quyền hạn** (`/settings/permissions`) — tên nhóm quyền + quyền con ("Order Management", "Edit Order", "Cancel Order (Void)", "Refund", "Income", "Batch Management"…) | đã phủ: route `/settings/permissions` với `expandAll: true` (mục 4). Cụm từ nhiều chữ ("Order Management") được dictCount≥2 nên KHÔNG bị luật "tên riêng ≥3 từ" loại — tự động gắn cờ. Riêng **cột role Owner/Manager/Partner/Staff** là `DATA_VALUES` → **manual** (xem cuối mục 3.5)                                                                                               |
| VP-2272           | Màn Nhân viên → hồ sơ → dropdown **"Vai trò nhân viên"**                                                                                                                      | **mới thêm**: trong vòng quét 5 tab hồ sơ (spec, bước 4e), khi đang ở tab `i===0` ("Thông tin") thử mở dropdown vai trò (best-effort, tìm control theo sau text "Vai trò nhân viên"/"Employee role") rồi quét lại `detectBody`. Giá trị Owner/Manager/Staff vẫn là `DATA_VALUES` nên chỉ hữu ích cho nhãn/label xung quanh + UI vỡ, không bắt được text option (xem manual list)     |
| VP-2273           | Màn Nhân viên → tab **"Thù lao"** — nhãn nhóm "Pay 1 - Pay 2" + placeholder                                                                                                   | đã phủ: tab "Thù lao" trong vòng quét 5 tab (mục 9). Từ điển `pay` **đã có sẵn** (VP-2253); "Pay 1"/"Pay 2" không khớp luật proper-name (chỉ 1 token dict) nên tự động gắn cờ ở `ui`; placeholder tương ứng lên `aria` (report-only)                                                                                                                                                 |
| VP-2274           | Màn Nhân viên → tab **"Giờ làm việc"** — ngày OFF hiện "Closed"                                                                                                               | đã ghi trong mục 3.5/manual list từ trước (từ điển `closed` đã có) — chỉ cross-reference, không thêm dòng mới                                                                                                                                                                                                                                                                        |
| VP-2271           | Màn Nhân viên (danh sách + hồ sơ) — nhãn **"Active"/"Inactive"**                                                                                                              | đã phủ: route/detail `/settings/staffs` (mục 4/5) + 5 tab hồ sơ (mục 9). Từ điển `active`/`inactive` **đã có sẵn**                                                                                                                                                                                                                                                                   |
| VP-2275           | Màn Nhân viên → tab **"Quyền hạn"** — nhóm quyền/tên quyền con + badge "Owner"                                                                                                | đã phủ qua tab "Quyền hạn" (mục 9), cùng cơ chế VP-2280 (cụm nhiều chữ tự gắn cờ); riêng badge role "Owner" là `DATA_VALUES` → manual                                                                                                                                                                                                                                                |
| VP-2200           | **Đơn đang chờ** (`/order-pending`) — tên khách "Unknown"                                                                                                                     | đã phủ: route `/order-pending` (mục 4). Từ điển `unknown` **đã có sẵn** (không phải VP-2307 — khác route)                                                                                                                                                                                                                                                                            |
| VP-2142           | Toast **"Printer not connected"** khi bấm icon in                                                                                                                             | đã phủ: `scanHomeOrderDialogs()` bước 4 ([`i18nHome.ts`](../../src/utils/i18nHome.ts)) đã có sẵn logic bấm nút In + poll `detectToasts()` (route `/home ▸ Toast nút In`). Cùng component toast dùng chung nên coi như đã đại diện cho Order History/mọi trang; không nhân bản thêm click-in riêng cho Order History (rủi ro không tìm đúng nút, để **doc-only** nếu cần verify thêm) |

**(b) Bổ sung từ điển `detectScope`:** `partner`/`partners` (VP-2272/2279/2280 — "Partner" không phải `DATA_VALUES` nên cần có trong từ điển để tự gắn cờ khi render trần). Các từ `active`/`inactive`/`pay`/`unknown`/`printer`/`connected`/`owner`/`manager`/`staff` **đã có sẵn** trong từ điển từ trước — không cần thêm.

**(c) Giới hạn cố ý (không sửa):** `DATA_VALUES = ['Owner','Manager','Staff','Product','Custom...']` khiến các giá trị role hiển thị trần (cột bảng Quyền hạn, badge role, option dropdown "Vai trò nhân viên") KHÔNG tự động gắn cờ được — đây là **điểm mù cố ý từ trước** (role name là dữ liệu API, giống staff card), không phải lỗi mới. Xem ghi chú cuối mục 3.5.

**(d) Cổng phủ:** không đổi — các bổ sung trên tận dụng route/tab đã có trong `STATIC_ROUTES`/vòng quét tab nhân viên, không thêm route/popup mới vào cổng.

### 3.7. [Cập nhật 2026-07-08] Luồng thanh toán Tiền mặt (Cash) & Khác (Other)

Tiếp nối các đợt quét luồng thanh toán **Thẻ** (mục 3.5/3.6 — VP-2315…VP-2321, toàn bộ ghi manual vì cần đầu đọc thẻ thật), lượt này quét **thủ công qua Playwright MCP** (không phải spec tự động — do luồng chọn phương thức + nhập số tiền + xác nhận là tương tác đa bước khó best-effort trong `TC-i18n-vietnamese-scan.spec.ts`) 2 phương thức **không cần thiết bị ngoài**: **Tiền mặt (Cash)** và **Khác (Other)**.

**(a) Cách quét:** bật Tiếng Việt qua `#vi` trên `/settings/language` → client-side `window.__TSR_ROUTER__.navigate` (đúng ràng buộc ở [mục 2](#2-ràng-buộc-kỹ-thuật-quan-trọng), không dùng `page.goto` giữa chừng) → tạo đơn ở `/home` (chọn nhân viên + dịch vụ) → bấm **Thanh toán** → `/order/$id/checkout`.

**(b) Bề mặt đã quét & kết quả:**

| Bề mặt                                                                                                                               | Kết quả                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 4 chip phương thức thanh toán "Thẻ / Tiền mặt / Thẻ quà tặng / Khác"                                                                 | Đã dịch đúng                                                                                             |
| Bàn phím số + phím tắt mệnh giá `$5/$10/$50/$100` (khi chọn Tiền mặt)                                                                | Không có text cần dịch (chỉ số/ký hiệu tiền)                                                             |
| "Nhập số tiền" / "Tổng đã trả" / "Còn lại" / **"Tiền thối"** (đổi tiền — chỉ hiện khi trả dư bằng Tiền mặt)                          | Đã dịch đúng, kể cả nhãn "Tiền thối" chỉ xuất hiện có điều kiện                                          |
| Panel tóm tắt đơn bên phải (Nhân viên, Ghi chú đơn, Tạm tính, Tổng cộng) + nút "In"/"Khay tiền"/"Hoàn tất thanh toán"                | Đã dịch đúng                                                                                             |
| Dialog **"Nhập passcode"** (mở khi bấm Hoàn tất thanh toán — cần chủ xác nhận) + checkbox "Không yêu cầu passcode trong 30 phút tới" | Đã dịch đúng                                                                                             |
| Panel "Khác" (Other) — cùng layout "Nhập số tiền"/"Tổng đã trả"/"Còn lại" như Tiền mặt (không có "Tiền thối" vì không phải tiền mặt) | Đã dịch đúng (quan sát trước khi trang tạm trắng do lỗi fetch `asset://` không liên quan i18n — xem (c)) |

**Không phát sinh bug i18n mới.** 2 chuỗi tiếng Anh nhìn thấy trên cùng màn checkout trong lúc quét — **"Order #OD…"** (tiêu đề đơn) và nút **"Tip"** — là 2 bug **đã ghi nhận từ trước**: VP-2301 (mục 3.5, dòng "Order / POS gốc") và VP-2283/2294 (mục 3.5, nhãn "Tip" chưa dịch xuyên suốt nhiều màn). Không đếm là bug mới của lượt quét này.

**(c) Sự cố môi trường (không phải bug i18n):** khi thao tác trên panel "Khác", trang checkout render trắng (`<main>` rỗng) kèm một loạt lỗi console `Fetch API cannot load asset://localhost/...png` và `Error when converting URL to base64: TypeError: Failed to fetch` — xuất phát từ `getLogoBase64()`/`imageUrlToBase64()` khi hook in hoá đơn cố tải logo qua scheme `asset://` (không được hỗ trợ trong ngữ cảnh browser dev server). Không liên quan tới dịch thuật; điều hướng lại bằng router là phục hồi được. Ghi chú lại phòng khi tái diễn — không mở issue mới vì đây là vấn đề runtime/asset-loading, ngoài phạm vi VP-462.

**(d) Làm rõ 2 nhóm loại trừ khỏi số "chưa dịch"** (đối chiếu `reports/i18n-audit/auto-scan.json`, `generatedAt: 2026-07-08T03:03:46Z`, tổng 112 dòng scan / `untranslatedCount: 46`):

- **Popup KHÔNG mở được trong phiên quét này** (`reachable:false` — **24 mục**): toàn bộ đã liệt kê ở khối "Chưa tự động được — kiểm THỦ CÔNG" cuối [mục 3.5](#35-cập-nhật-2026-07-07-bổ-sung-theo-vp-2115) (7 bước thanh toán thẻ VP-2315…2321, 2 popup Add Tip/Payment Complete phía khách VP-2303/2304, Terms/Privacy phía khách VP-2308/2309, thẻ quà tặng không đủ số dư VP-2306, toast xác nhận lịch hẹn VP-2311, 2 popup Tách đơn VP-2288…2292, cùng 6 popup Settings tạo-mới yêu cầu form trống — Demo Mode, Tạo danh mục, Tạo nhân viên, Tạo nhóm nhân viên, Gán nhân viên vào vai trò, Tạo cấu hình tip — cộng Tìm kiếm toàn cục, Thêm bản ghi chấm công, Cảnh báo chọn nhân viên). Đây là **best-effort** đúng như nguyên tắc ở bước 4–9 ([mục 3](#3-luồng-đi-thứ-tự-các-bước)) — không tính vào cổng, không phải bug.
- **Redirect / Stub** (`stub:true` — **3 mục**): `checkout/view-cart`, `checkout/processing-payment`, `checkout/payment-success` — 3 sub-route trung gian trong `ORDER_SUBROUTES` ([mục 6](#6-luồng-đơn-hàng--thanh-toán-checkout)) tự động chuyển tiếp sang bước kế (ví dụ `processing-payment` chỉ tồn tại vài trăm ms trước khi qua `payment-success`) nên route-scan không kịp giữ lại nội dung riêng để so `detectScope`.
- Cả 2 nhóm đều có `ui: []` trong JSON (không phát hiện chuỗi) nên vốn dĩ **không cộng vào `untranslatedCount`** — mục này chỉ để tài liệu hoá rõ ràng, tránh khi đọc HTML thấy 112 dòng nhưng ngỡ có 112 lỗi.

---

## 4. Trang tĩnh được quét (STATIC_ROUTES — 24 màn)

Nguồn: [`src/utils/i18nScan.ts`](../../src/utils/i18nScan.ts) — hằng `STATIC_ROUTES`. Cột **Gated** = cần nhập passcode chủ (8888). **ExpandAll** = bấm "Mở rộng tất cả" trước khi quét.

> **Cập nhật 2026-07-07:** thêm 2 route index còn thiếu so với [bảng URL đầy đủ ở mục 1b](#1b-danh-sách-toàn-bộ-url-màn-hình-nguồn-bảng-route-do-user-cung-cấp-2026-07-07) — `/incomes` (index) và `/settings` (index) — trước đây chỉ quét các route con của 2 nhóm này.

| Nhóm     | Route                     | Tên màn                  | Gated | ExpandAll |
| -------- | ------------------------- | ------------------------ | :---: | :-------: |
| POS      | `/home`                   | Trang chủ / POS          |       |           |
| POS      | `/order-pending`          | Đơn đang chờ             |       |           |
| POS      | `/order-history`          | Lịch sử đơn hàng         |       |           |
| POS      | `/appointment`            | Lịch hẹn                 |       |           |
| Incomes  | `/incomes`                | Báo cáo thu nhập (index) |       |           |
| Incomes  | `/incomes/income-daily`   | Thu nhập theo ngày       |  ✅   |           |
| Incomes  | `/incomes/income-summary` | Tổng hợp thu nhập        |  ✅   |           |
| Incomes  | `/incomes/income-staff`   | Thu nhập nhân viên       |  ✅   |           |
| Settings | `/settings`               | Cài đặt (index)          |       |           |
| Settings | `/settings/business`      | Thông tin doanh nghiệp   |       |           |
| Settings | `/settings/services`      | Dịch vụ & Sản phẩm       |       |           |
| Settings | `/settings/staffs`        | Nhân viên                |       |           |
| Settings | `/settings/roles`         | Vai trò                  |       |           |
| Settings | `/settings/permissions`   | Quyền hạn                |       |    ✅     |
| Settings | `/settings/receipt`       | Hóa đơn (mẫu in)         |       |           |
| Settings | `/settings/charge-fee`    | Phí & Phụ thu            |       |           |
| Settings | `/settings/accessibility` | Hiển thị                 |       |           |
| Settings | `/settings/language`      | Ngôn ngữ                 |       |           |
| System   | `/time-tracking`          | Chấm công                |       |           |
| System   | `/batch-history`          | Lịch sử ca (Batch)       |  ✅   |           |
| System   | `/cash-drawer`            | Két tiền                 |       |           |
| System   | `/customer`               | Màn hình khách hàng      |       |           |
| System   | `/force-update`           | Yêu cầu cập nhật         |       |           |
| System   | `/customer/force-update`  | Khách hàng · cập nhật    |       |           |

> Nếu router nhảy sang route khác (redirect) → đánh dấu `redirected`, **không tính** là chưa dịch.

---

## 5. Trang chi tiết động (click item đầu danh sách)

Hàm `scanDynamic(listPath, name, group, clickSelector)`: điều hướng tới list → click phần tử đầu → quét trang chi tiết mở ra.

| Route list           | Tên                | Nhóm     | Selector click                                          |
| -------------------- | ------------------ | -------- | ------------------------------------------------------- |
| `/settings/staffs`   | Chi tiết nhân viên | Settings | `main a.cursor-pointer`                                 |
| `/settings/roles`    | Chi tiết vai trò   | Settings | `main a, main [role=button]`                            |
| `/settings/services` | Chi tiết danh mục  | Settings | `main a[href*="services/"], main a.cursor-pointer`      |
| `/order-history`     | Chi tiết đơn hàng  | POS      | `main a[href*="order-history/"], main a.cursor-pointer` |

---

## 6. Luồng đơn hàng / thanh toán (checkout)

Lấy 1 `orderId` từ URL đang ở trang chi tiết đơn hàng (mục 5), rồi điều hướng qua các sub-route `/order/$id/<sub>`:

| Sub-route                     | Tên                                                                         |
| ----------------------------- | --------------------------------------------------------------------------- |
| _(gốc)_ `/order/$id`          | **Order / POS (Sửa đơn)** — "Order #", "Points:", "Total visits:" (VP-2301) |
| `checkout`                    | Thanh toán (Checkout)                                                       |
| `checkout/view-cart`          | Checkout · Xem giỏ hàng                                                     |
| `checkout/processing-payment` | Checkout · Đang xử lý thanh toán                                            |
| `checkout/payment-success`    | Checkout · TT thành công                                                    |
| `payment-success`             | Thanh toán thành công                                                       |
| `split-order`                 | Tách đơn (thân trang — mục 3.5)                                             |

> Lưu ý: có **hai** màn "thanh toán thành công" khác nhau (một dưới `/checkout`, một ở gốc `/order`). Nhãn route giữ chúng tách biệt.
> `sub:''` = màn Order/POS gốc (`/order/$id`) — màn sửa đơn với khối tóm tắt hoá đơn bên phải. Các popup sâu của **Tách đơn** (nhập số tiền, thanh toán thành công) do `scanSplitOrder()` xử lý — xem [mục 3.5](#35-cập-nhật-2026-07-07-bổ-sung-theo-vp-2115).
> Các màn/popup của **luồng thanh toán bằng thẻ (card terminal)** — Custom tip, Total Amount ("PRESENT CARD"), Add Signature, "Payment Successfully", "Waiting for connect device…", "Getting ready to charge" và **màn tiến hành thanh toán** `present → read → "Processing"` (VP-2315…VP-2321) — chỉ hiện khi có **giao dịch thẻ thật + đầu đọc thẻ** nên KHÔNG quét tự động; spec ghi **manual** (`reachable:false`) ở mục 4a4. Xem [mục 3.5](#35-cập-nhật-2026-07-07-bổ-sung-theo-vp-2115).
> Màn Login / splashscreen **không** thuộc phạm vi (cần phiên chưa đăng nhập).

---

## 7. Thông báo (chuông 🔔)

- Về `/home`, tìm nút icon nhỏ ở header (chuông không có aria-label) → click phải-sang-trái đến khi hiện heading "Thông báo".
- Quét **bảng thông báo** (panel).
- Click thông báo đầu (nhận diện qua chuỗi ngày `dd/mm/yyyy`) → điều hướng tới **trang lịch hẹn** → quét tiếp.

> **Nhóm Màn Lịch hẹn ([VP-2310](https://linear.app/fastboy/issue/VP-2310)):** đây là nơi bắt bug **panel Thông báo còn tiếng Anh** ([VP-2143](https://linear.app/fastboy/issue/VP-2143)) và **toast xác nhận lịch hẹn** ([VP-2311](https://linear.app/fastboy/issue/VP-2311)) — cả hai cùng câu "**… appointment on … has been confirmed.**". Câu này bị `detectScope` gắn cờ nhờ **luật câu** (kết thúc bằng `.` / chứa "has been" → coi là UI chứ không phải ngày-DATA) cộng từ điển `appointment`/`confirmed`, nên khi panel mở là chuỗi vào danh sách dedup. Toast (VP-2311) làm đổi trạng thái nên ghi **manual** (mục 4a3); route `/appointment` đã được route-scan (mục 4).

| Route (nhãn)               | Tên                              | Nhóm   |
| -------------------------- | -------------------------------- | ------ |
| `🔔 → bảng thông báo`      | Bảng thông báo (panel) — VP-2143 | System |
| `🔔 → chi tiết (Lịch hẹn)` | Trang mở từ thông báo            | System |

---

## 8. Popup / Dialog được quét (POPUP_DEFS)

Nguồn: [`src/utils/i18nPopups.ts`](../../src/utils/i18nPopups.ts). Mỗi popup: về `host` route → chạy `prep` (nếu có) → thử lần lượt các `open` trigger (testid → role+name → text → css → key) → khi dialog hiện thì quét portal `[role="dialog"]` → đóng bằng Escape.

> Vòng lặp popup quét cả `POPUP_DEFS` **và** `HOME_POPUP_DEFS` (popup Home không cần đơn — xem [mục 3.1](#31-cập-nhật-quét-sâu-trang-home)).

**Phạm vi "chỉ tính popup mở được":** popup không mở được trong phiên (dialog thiết bị/lỗi, cần camera…) → ghi `reachable: false`, **không** làm fail.

### 8a. Két tiền — trang showcase dev (`/cash-drawer`)

Chuỗi hardcode tiếng Anh (audit đã xác nhận), mở bằng nút theo nhãn EN:

| Popup                  | Nút mở                  |
| ---------------------- | ----------------------- |
| Cảnh báo xoá tài khoản | `Show Dialog`           |
| Gỡ SĐT khách           | `Remove Customer Phone` |
| Gỡ dịch vụ             | `Remove Service Item`   |
| Gỡ nhân viên           | `Remove Staff`          |
| Xoá đơn                | `Delete Order`          |
| Huỷ đơn                | `Void Order`            |
| Hoàn tiền              | `Refund Payment`        |
| Thêm tip               | `Add a Tip`             |
| Chia tip               | `Split Tip`             |
| Bộ lọc                 | `Filter`                |

### 8b. Popup theo route thật

| Nhóm     | Host route             | Popup                                                         |
| -------- | ---------------------- | ------------------------------------------------------------- |
| Settings | `/settings/demo-mode`  | Demo Mode (tool nội bộ)                                       |
| Settings | `/settings/services`   | Thêm dịch vụ / sản phẩm                                       |
| Settings | `/settings/services`   | Tạo danh mục                                                  |
| Settings | `/settings/staffs`     | Tạo nhân viên                                                 |
| Settings | `/settings/staffs`     | Tạo nhóm nhân viên                                            |
| Settings | `/settings/roles`      | Gán nhân viên vào vai trò                                     |
| Settings | `/settings/charge-fee` | Tạo cấu hình tip                                              |
| POS      | `/home`                | Tìm kiếm toàn cục (Ctrl+K)                                    |
| POS      | `/home`                | Quét QR _(thường cần camera → có thể không mở được trong CI)_ |
| POS      | `/order-history`       | Bộ lọc                                                        |
| System   | `/time-tracking`       | Thêm bản ghi chấm công                                        |

> Mỗi popup khai báo **nhiều trigger dự phòng** (testid → role → text → css) vì app đang ở tiếng Việt nên nhãn EN gốc có thể không khớp — trigger đầu tiên bật được dialog sẽ thắng.

---

## 9. Panel chi tiết theo hàng & tab nhân viên

**`scanRowDetail`** — click hàng đầu trong bảng để mở panel chi tiết tại chỗ:

| Route list                | Tên                             | Nhóm     | Selector hàng                                                             |
| ------------------------- | ------------------------------- | -------- | ------------------------------------------------------------------------- |
| `/incomes/income-summary` | Tổng hợp thu nhập → chi tiết    | Incomes  | `main tr.cursor-pointer`, `main tbody tr`                                 |
| `/incomes/income-staff`   | Thu nhập nhân viên → chi tiết   | Incomes  | `main tr.cursor-pointer`, `main tbody tr`                                 |
| `/batch-history`          | Lịch sử ca → Batch Close Review | System   | `main tbody tr button`, `main button.underline`, `main tr.cursor-pointer` |
| `/settings/services`      | Dịch vụ & Sản phẩm → chi tiết   | Settings | `main a.cursor-pointer`, `main [role="button"]`                           |

**5 tab hồ sơ nhân viên** — mở nhân viên đầu ở `/settings/staffs`, click từng tab theo thứ tự (click theo index, ngôn ngữ-trung-lập):

`Thông tin` · `Thù lao` · `Kỹ năng dịch vụ` · `Giờ làm việc` · `Quyền hạn`

---

## 10. Cơ chế phát hiện chuỗi tiếng Anh (`detectScope`)

Chạy **trong trình duyệt**, scope theo `body` (trang) hoặc `[role="dialog"]` (popup). Một chuỗi bị coi là **"UI tiếng Anh chưa dịch"** khi:

1. **Không có dấu tiếng Việt** (regex diacritics), VÀ
2. Chứa từ nằm trong **từ điển UI tuyển chọn** (~200 từ: `save`, `cancel`, `total`, `payment`, `staff`…).

Cố tình **bỏ qua** (không gắn cờ nhầm):

- Vùng dữ liệu người bán (`DATA_ZONE_SELECTORS`): thẻ nhân viên, hàng dịch vụ, đơn hàng.
- Giá trị dữ liệu (`DATA_VALUES`): `Owner`, `Manager`, `Staff`, `Product`, `Custom...`.
- Ngày tháng, badge đếm ("3 Services"), tên viết HOA nhiều từ, tên riêng ≥3 từ, chuỗi tiền/mã.
- False-positive cố định: `In` (=Print), `English` (=tên ngôn ngữ).

Ngoài ra còn thu thập (chỉ báo cáo, **không** làm fail):

- **aria/placeholder/title** còn tiếng Anh.
- **Nút/điều khiển** còn tiếng Anh (gồm nút chỉ-icon đọc từ aria-label).
- **UI vỡ**: chữ bị cắt (ellipsis/overflow) và layout tràn ngang >8px (tiếng Việt dài hơn tiếng Anh nên hay vỡ).

---

## 11. Đầu ra & cổng chặn (gate)

- `reports/i18n-audit/auto-scan.html` — báo cáo đầy đủ (chuỗi gom trùng, thumbnail trang lỗi, diff vs lần trước).
- `reports/i18n-audit/auto-scan.json` — dữ liệu thô + **làm baseline cho lần chạy sau** (để tính "mới phát sinh / đã dịch xong").
- `reports/i18n-audit/auto-screens/*.png` — ảnh full-page **chỉ** cho trang/popup FAIL.
- Console log tổng kết số trang chưa dịch.
- **Gate:** mỗi màn chưa dịch → 1 `expect.soft(...).toHaveLength(0)` → test fail nhưng vẫn liệt kê hết mọi màn (không dừng ở màn đầu). Tắt bằng `I18N_LENIENT=1`.

---

## 12. Cách mở rộng (không phá xương sống)

- **Thêm trang tĩnh:** thêm 1 dòng vào `STATIC_ROUTES` trong [`i18nScan.ts`](../../src/utils/i18nScan.ts).
- **Thêm popup:** thêm 1 `PopupDef` vào `POPUP_DEFS` trong [`i18nPopups.ts`](../../src/utils/i18nPopups.ts) (nhớ khai nhiều trigger dự phòng).
- **Thêm popup/dialog trang Home:** sửa `HOME_POPUP_DEFS` (không cần đơn) hoặc `ORDER_DIALOGS` (cần đơn) trong [`i18nHome.ts`](../../src/utils/i18nHome.ts); cập nhật kèm [`home-translation-map.md`](home-translation-map.md).
- **Thêm popup/dialog trang Lịch sử đơn:** sửa `ORDER_HISTORY_POPUP_DEFS`, `scanOrderHistoryFilter`, `scanOrderHistoryDatePicker` hoặc `DETAIL_DIALOGS` trong [`i18nOrderHistory.ts`](../../src/utils/i18nOrderHistory.ts); cập nhật kèm [`order-history-translation-map.md`](order-history-translation-map.md).
- **Thêm popup/dialog trang Đơn đang chờ:** sửa `ORDER_PENDING_POPUP_DEFS`, `scanOrderPendingFilter`, `scanOrderPendingDatePicker` hoặc `scanOrderPendingCardOpen` trong [`i18nOrderPending.ts`](../../src/utils/i18nOrderPending.ts); cập nhật kèm [`order-pending-translation-map.md`](order-pending-translation-map.md).
- **Thêm popup/dialog 3 trang Báo cáo thu nhập:** sửa `INCOMES_POPUP_DEFS`, `scanIncomesGate`, `scanIncomesDatePicker` hoặc `scanIncomesDetail` trong [`i18nIncomes.ts`](../../src/utils/i18nIncomes.ts); cập nhật kèm [`incomes-translation-map.md`](incomes-translation-map.md).
- **Tinh chỉnh phát hiện:** sửa từ điển `ui`, `DATA_ZONE_SELECTORS`, `DATA_VALUES`, hoặc `fpExact` — tất cả nằm trong `detectScope`.
- **Không** thêm selector inline trong file `.spec.ts`; mọi selector quét đi qua helper.

<!-- END vietnamese-scan-flow.md -->


---

# Appendix B — Vietnamese scan flow, full execution order (static + dynamic)

> Verbatim from the old `docs/i18n/vietnamese-scan-flow-order.md`.

<!-- BEGIN vietnamese-scan-flow-order.md -->

# Luồng quét Tiếng Việt — Thứ tự thực thi đầy đủ (Tĩnh + Động)

> **File gốc (đặc tả chi tiết theo từng đợt cập nhật):** [`vietnamese-scan-flow.md`](vietnamese-scan-flow.md)
> **File này (bổ sung):** liệt kê **TOÀN BỘ màn hình/bề mặt** mà [`TC-i18n-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts) đi qua, theo **đúng thứ tự chạy trong code** — gộp chung **Tĩnh (STATIC_ROUTES)** và **Động (click/tương tác mới hiện)** vào một luồng số thứ tự duy nhất, thay vì tách bảng theo nhóm như mục 1b của file gốc.

Ký hiệu:

- **[TĨNH]** — route điều hướng trực tiếp, quét thân trang ngay khi vào (`scanRoute` / `STATIC_ROUTES`).
- **[ĐỘNG]** — chỉ hiện sau khi **click/tương tác** (mở dialog, click hàng, mở tab, mở dropdown…).
- **[MANUAL]** — không tự động kích hoạt được (cần phần cứng/giao dịch thật) → ghi `reachable:false`, không tính vào cổng, chỉ để truy vết.

---

## Bước 0 — Chuẩn bị

| #   | Bước                                                                              | Loại   |
| --- | --------------------------------------------------------------------------------- | ------ |
| 0a  | `switchToVietnamese()` — mở `/settings/language`, chọn Tiếng Việt, Apply, Confirm | —      |
| 0b  | Kiểm tra `__TSR_ROUTER__` tồn tại (bắt buộc, fail ngay nếu thiếu)                 | —      |
| 0c  | Dialog **passcode Incomes** (trước khi mở khoá)                                   | [ĐỘNG] |

## Bước 1 — 22 route tĩnh (`STATIC_ROUTES`, đúng thứ tự khai báo)

| #   | Màn hình                                                    | Route                     | Nhóm     |
| --- | ----------------------------------------------------------- | ------------------------- | -------- |
| 1   | Trang chủ / POS                                             | `/home`                   | POS      |
| 2   | Đơn đang chờ                                                | `/order-pending`          | POS      |
| 3   | Lịch sử đơn hàng                                            | `/order-history`          | POS      |
| 4   | Lịch hẹn                                                    | `/appointment`            | POS      |
| 5   | Báo cáo thu nhập (index)                                    | `/incomes`                | Incomes  |
| 6   | Thu nhập theo ngày _(gated)_                                | `/incomes/income-daily`   | Incomes  |
| 7   | Tổng hợp thu nhập _(gated)_                                 | `/incomes/income-summary` | Incomes  |
| 8   | Thu nhập nhân viên _(gated)_                                | `/incomes/income-staff`   | Incomes  |
| 9   | Cài đặt (index)                                             | `/settings`               | Settings |
| 10  | Thông tin doanh nghiệp _(+ dò EN_DATETIME riêng — VP-2325)_ | `/settings/business`      | Settings |
| 11  | Dịch vụ & Sản phẩm                                          | `/settings/services`      | Settings |
| 12  | Nhân viên                                                   | `/settings/staffs`        | Settings |
| 13  | Vai trò                                                     | `/settings/roles`         | Settings |
| 14  | Quyền hạn _(expandAll)_                                     | `/settings/permissions`   | Settings |
| 15  | Hóa đơn (mẫu in)                                            | `/settings/receipt`       | Settings |
| 16  | Phí & Phụ thu                                               | `/settings/charge-fee`    | Settings |
| 17  | Hiển thị                                                    | `/settings/accessibility` | Settings |
| 18  | Ngôn ngữ                                                    | `/settings/language`      | Settings |
| 19  | Chấm công                                                   | `/time-tracking`          | System   |
| 20  | Lịch sử ca (Batch) _(gated)_                                | `/batch-history`          | System   |
| 21  | Két tiền                                                    | `/cash-drawer`            | System   |
| 22  | Màn hình khách hàng                                         | `/customer`               | System   |
| 23  | Yêu cầu cập nhật                                            | `/force-update`           | System   |
| 24  | Khách hàng · cập nhật                                       | `/customer/force-update`  | System   |

## Bước 2 — Trang chi tiết động (click item đầu danh sách) [ĐỘNG]

| #   | Từ danh sách         | Trigger                       | Kết quả            | Ghi chú / Cập nhật gần nhất                                                                                                                                                                                                                                             |
| --- | -------------------- | ----------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 25  | `/settings/staffs`   | click `a.cursor-pointer` đầu  | Chi tiết nhân viên | Quét 1 lần ở đây (thân trang chi tiết); **5 tab hồ sơ** (Thông tin/Thù lao/Kỹ năng dịch vụ/Giờ làm việc/Quyền hạn) được quét **riêng, sâu hơn** ở Bước 7 — gồm dropdown "Vai trò nhân viên" (VP-2272), "Pay 1/Pay 2" (VP-2273), "Closed" giờ làm việc (VP-2274).        |
| 26  | `/settings/roles`    | click `a`/`[role=button]` đầu | Chi tiết vai trò   | Chưa có bộ dò chuyên biệt riêng — dựa vào từ điển chung; chưa ghi nhận bug i18n mới tính đến 2026-07-08.                                                                                                                                                                |
| 27  | `/settings/services` | click item đầu                | Chi tiết danh mục  | Trùng route với **Bước 6** (`scanRowDetail` mở **dialog sản phẩm**) — đây là 2 lượt click khác nhau trên cùng list (chi tiết danh mục vs. dialog sản phẩm), không phải trùng lặp thật.                                                                                  |
| 28  | `/order-history`     | click item đầu                | Chi tiết đơn hàng  | Chỉ quét thân panel 1 lần ở đây; phần **sâu** (Hoá đơn, Hoàn tiền, dropdown "Phương thức hoàn tiền" VP-2312, ngày/giờ EN VP-2313) được quét riêng ở **Bước 8 · `scanOrderHistoryDetail`** — xem [`order-history-translation-map.md`](order-history-translation-map.md). |

## Bước 3 — Luồng đơn hàng / checkout (từ 1 order id lấy được) [ĐỘNG]

| #   | Sub-route                                | Tên                              |
| --- | ---------------------------------------- | -------------------------------- |
| 29  | `/order/$id` (`sub:''`)                  | Order / POS (Sửa đơn)            |
| 30  | `/order/$id/checkout`                    | Thanh toán (Checkout)            |
| 31  | `/order/$id/checkout/view-cart`          | Checkout · Xem giỏ hàng          |
| 32  | `/order/$id/checkout/processing-payment` | Checkout · Đang xử lý thanh toán |
| 33  | `/order/$id/checkout/payment-success`    | Checkout · TT thành công         |
| 34  | `/order/$id/payment-success`             | Thanh toán thành công            |
| 35  | `/order/$id/split-order`                 | Tách đơn                         |

**3a — [MANUAL] không tự kích hoạt được (cần giao dịch/phần cứng thật):**

| #   | Bề mặt                                                     | Mã bug  |
| --- | ---------------------------------------------------------- | ------- |
| 36  | Popup thẻ quà tặng không đủ số dư                          | VP-2306 |
| 37  | Toast xác nhận lịch hẹn ("… has been confirmed.")          | VP-2311 |
| 38  | Custom tip (thanh toán thẻ)                                | VP-2315 |
| 39  | Total Amount / "PRESENT CARD" (thanh toán thẻ)             | VP-2316 |
| 40  | Add Signature (thanh toán thẻ)                             | VP-2317 |
| 41  | Popup "Payment Successfully"                               | VP-2318 |
| 42  | Popup "Waiting for connect device"                         | VP-2319 |
| 43  | Popup "Getting ready to charge"                            | VP-2320 |
| 44  | Màn tiến hành thanh toán thẻ (present → read → Processing) | VP-2321 |

**3b — [ĐỘNG] quét LIVE (không cần phần cứng):**

| #   | Bề mặt                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------- |
| 45  | `scanCashOtherPayment` — chọn Tiền mặt/Khác → bàn phím số → "Tổng đã trả"/"Tiền thối"/"Còn lại" (không bấm Hoàn tất) |

## Bước 4 — Panel Thông báo (chuông 🔔) [ĐỘNG]

| #   | Bề mặt                             |
| --- | ---------------------------------- |
| 46  | Bảng thông báo (panel)             |
| 47  | Trang mở từ thông báo (→ Lịch hẹn) |

## Bước 5 — Popup / Dialog đăng ký sẵn (mở từ route chủ, quét, đóng) [ĐỘNG]

Gộp `POPUP_DEFS` + `HOME_POPUP_DEFS` + `ORDER_HISTORY_POPUP_DEFS` + `ORDER_PENDING_POPUP_DEFS` + `INCOMES_POPUP_DEFS` — mỗi định nghĩa là 1 dialog (ví dụ: Gift Card, Cảnh báo chọn nhân viên, Tìm kiếm toàn cục, Scanner, DatePicker Lịch sử đơn/Đơn đang chờ/Incomes…). Số lượng thay đổi theo phiên bản dictionary — xem trực tiếp 3 file `i18n*.ts` liên quan để đối chiếu danh sách mới nhất.

## Bước 6 — Panel chi tiết theo hàng (click row → panel/dialog) [ĐỘNG]

| #   | Từ danh sách              | Kết quả                                |
| --- | ------------------------- | -------------------------------------- |
| 48  | `/incomes/income-summary` | Tổng hợp thu nhập → chi tiết           |
| 49  | `/incomes/income-staff`   | Thu nhập nhân viên → chi tiết          |
| 50  | `/batch-history`          | Lịch sử ca → Batch Close Review        |
| 51  | `/settings/services`      | Dịch vụ & Sản phẩm → chi tiết (dialog) |

## Bước 7 — 5 tab hồ sơ nhân viên (+ dropdown vai trò) [ĐỘNG]

| #   | Tab             | Ghi chú                                                  |
| --- | --------------- | -------------------------------------------------------- |
| 52  | Thông tin       | + mở dropdown "Vai trò nhân viên" (VP-2272, best-effort) |
| 53  | Thù lao         | "Pay 1"/"Pay 2" (VP-2273)                                |
| 54  | Kỹ năng dịch vụ |                                                          |
| 55  | Giờ làm việc    | "Closed" (VP-2274)                                       |
| 56  | Quyền hạn       |                                                          |

## Bước 8 — Quét sâu 3 màn còn lại [ĐỘNG]

| #   | Màn                                                           | Hàm                          |
| --- | ------------------------------------------------------------- | ---------------------------- |
| 57  | Lịch sử đơn hàng — Bộ lọc (+4 dropdown con)                   | `scanOrderHistoryFilter`     |
| 58  | Lịch sử đơn hàng — Lịch (calendar grid EN)                    | `scanOrderHistoryDatePicker` |
| 59  | Lịch sử đơn hàng — chi tiết (Hoá đơn, Hoàn tiền, EN_DATETIME) | `scanOrderHistoryDetail`     |
| 60  | Đơn đang chờ — Bộ lọc nhân viên/Sắp xếp/DatePicker preset     | `scanOrderPendingFilter`     |
| 61  | Đơn đang chờ — Lịch (calendar grid EN)                        | `scanOrderPendingDatePicker` |
| 62  | Đơn đang chờ — dialog guard khi mở thẻ đơn                    | `scanOrderPendingCardOpen`   |
| 63  | Incomes — Lịch (calendar grid EN)                             | `scanIncomesDatePicker`      |
| 64  | Incomes — panel chi tiết (Print + Order Details dialog)       | `scanIncomesDetail`          |

## Bước 9 — Home order-flow + Customer Display + Chấm công + Tách đơn (chạy CUỐI vì mutate dữ liệu) [ĐỘNG]

| #   | Bề mặt                                                                       | Hàm                     |
| --- | ---------------------------------------------------------------------------- | ----------------------- |
| 65  | Tạo đơn (staff+service đầu) → Ghi chú đơn, Khuyến mãi & Thưởng               | `scanHomeOrderDialogs`  |
| 66  | `/customer` khi đơn đang mở (Order Details/Subtotal/Promotion/xác nhận SĐT…) | `scanCustomerDisplay`   |
| 67  | Dialog Chấm công ("No staffs found" — VP-2246)                               | `scanTimeKeepingDialog` |
| 68  | Tách đơn — tab "Check" + luồng thanh toán tách đơn                           | `scanSplitOrder`        |

---

## Tổng quan số lượng

- **Tĩnh:** 24 route (Bước 1).
- **Động (tự động quét được):** ~44 bề mặt (Bước 2, 3(base+3b), 4–9), số popup ở Bước 5 phụ thuộc `POPUP_DEFS`/`*_POPUP_DEFS` hiện có.
- **Manual (không tự kích hoạt):** 9 bề mặt (Bước 3a) — không tính vào cổng gate, chỉ để truy vết theo mã bug VP-2115.
- **Cổng tối thiểu:** `scans.length >= 40` (xem [`TC-i18n-vietnamese-scan.spec.ts`](../../tests/regression/i18n/TC-i18n-vietnamese-scan.spec.ts) bước 7) — chống hồi quy khi luồng quét bị rớt bề mặt.

> Khi thêm/bớt bề mặt trong spec, cập nhật cả file này (thứ tự chạy) lẫn [`vietnamese-scan-flow.md`](vietnamese-scan-flow.md) (đặc tả chi tiết + lịch sử theo bug).

<!-- END vietnamese-scan-flow-order.md -->
