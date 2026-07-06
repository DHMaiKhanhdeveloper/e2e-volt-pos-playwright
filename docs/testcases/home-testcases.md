---
title: Test Cases — Home (/home) quét Tiếng Việt
source-linear: "offline: docs/linear/main-flow-onboard.md + docs/features/home.md"
scanned-at: 2026-07-06
skill: linear-testcase-gen (2/4)
---

# Test Cases — Home (`/home`) quét Tiếng Việt

> Đầu ra **Skill 2/4** (`linear-testcase-gen`). Liệt kê đủ test case cho chức năng quét
> tiếng Việt màn Home, dựa trên [docs/features/home.md](../features/home.md) + kết quả quét
> Playwright live (2026-07-06).
>
> **Code đã tồn tại** cho luồng này (helper + spec đã được sinh trước đó). Bảng dưới **map 1-1**
> mỗi TC → đoạn code thực thi. Skill KHÔNG ghi đè code đang chạy; nếu thêm TC mới thì sinh
> thêm `test()` tương ứng theo đúng convention `@fixtures/index` + `Tag`.

## Bảng test case

| ID | Tiêu đề | Tiền điều kiện | Các bước | Kết quả mong đợi | Loại | Ưu tiên | Code |
|----|---------|----------------|----------|------------------|------|---------|------|
| TC-HOME-VI-01 | Đổi ngôn ngữ sang Tiếng Việt qua UI | App đã đăng nhập | 1. Vào `/settings/language` 2. Click "Tiếng Việt" | Sidebar hiển thị "Đơn đang chờ" (VN) | regression | P1 | `switchToVietnamese()` — i18nScan.ts:624 |
| TC-HOME-VI-02 | Router client-side khả dụng | Đã đổi VN | Đọc `window.__TSR_ROUTER__` | Là object (điều hướng SPA được) | regression | P1 | `expect(hasRouter).toBe(true)` — spec:57 |
| TC-HOME-VI-03 | Quét trang `/home` còn chuỗi EN | VN + router | Điều hướng `/home`, quét body | Liệt kê chuỗi EN còn sót (hiện: Quick Pay, Gift Card) | regression | P1 | `scanRoute(page, homeDef)` + `record` |
| TC-HOME-VI-04 | Quét popup Bán thẻ quà tặng | VN, không cần đơn | Mở Gift Card, quét, đóng | Popup đã VN hóa | regression | P2 | `HOME_POPUP_DEFS[0]` + `scanPopup` |
| TC-HOME-VI-05 | Quét cảnh báo "Chọn nhân viên trước" | VN, chưa chọn staff | Click Quick Pay | Dialog cảnh báo VN | regression | P2 | `HOME_POPUP_DEFS[1]` |
| TC-HOME-VI-06 | Quét Tìm kiếm toàn cục | VN | Ctrl+K | Dialog search VN | regression | P2 | `HOME_POPUP_DEFS[2]` |
| TC-HOME-VI-07 | Quét Scanner (best-effort) | VN, có camera | Mở Scanner | VN (skip nếu không có camera) | regression | P3 | `HOME_POPUP_DEFS[3]` |
| TC-HOME-VI-08 | Quét dialog phụ thuộc đơn | VN, tạo được đơn | Chọn staff + service → mở Ghi chú/Khuyến mãi/Gộp đơn | Mỗi dialog VN | regression | P1 | `scanHomeOrderDialogs()` — i18nHome.ts:132 |
| TC-HOME-VI-09 | Quét dialog Đổi nhân viên | VN, đơn có staff | Đổi nhân viên → chọn staff khác | Dialog xác nhận VN | regression | P2 | `scanHomeOrderDialogs` §3b |
| TC-HOME-VI-10 | Quét toast nút In | VN, đơn có dịch vụ | Click nút In (icon xanh) | Toast VN (không hardcode EN) | regression | P2 | `scanHomeOrderDialogs` §4 (detectToasts) |
| TC-HOME-VI-11 | Quét 3 panel header | VN | Mở Thông báo / Chấm công / Thiết bị | Panel VN (hiện: chuông 🔔 còn EN) | regression | P1 | `scanHeaderPanels()` — i18nHome.ts:305 |
| TC-HOME-VI-12 | Sinh báo cáo HTML/JSON | Đã quét xong | Ghi `home-scan.{html,json}` | File tồn tại, có dedup + untranslated | regression | P1 | `renderI18nReport` + `writeFileSync` |
| TC-HOME-VI-13 | Cổng localization (soft gate) | `I18N_LENIENT≠1` | Với mỗi surface EN → `expect.soft` | Test fail nếu còn EN; lenient → info-only | regression | P1 | vòng `expect.soft` cuối spec |

## Code đã sinh (map)

- **Spec:** [tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts](../../tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts)
  — 1 `test()` chứa toàn bộ TC trên (các bước = các mục 1→7 trong spec).
- **Page object / helper:** [src/utils/i18nHome.ts](../../src/utils/i18nHome.ts) (surface Home) +
  [src/utils/i18nScan.ts](../../src/utils/i18nScan.ts) (engine dùng chung) +
  [src/utils/i18nPopups.ts](../../src/utils/i18nPopups.ts) (`scanPopup`).
- **Chạy:** `ENV=local I18N_LENIENT=1 npx playwright test tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts --project=chromium`

## Ghi chú
- Convention: import qua alias `@fixtures/index`, `@utils/*`, `@/types/testTags`; tên test chứa ID (`TC-I18N-VI-HOME`); tag `${Tag.REGRESSION}`.
- Selector đều lấy từ quét thật (ưu tiên `getByRole`/`getByText`, fallback cấu trúc vì app đang ở VN nên nhãn EN không match).
