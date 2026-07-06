---
title: Luồng code-gen — Home (/home) quét Tiếng Việt
generated-at: 2026-07-06
skill: codegen-flow-map (3/4)
---

# Luồng code-gen — Home (`/home`) quét Tiếng Việt

> Đầu ra **Skill 3/4** (`codegen-flow-map`). Bản đồ ở **mức file → file** của quá trình gen
> chức năng quét tiếng Việt màn Home. Chi tiết từng đoạn code + công nghệ xem **Skill 4**:
> [docs/codegen-detail/home-detail.md](../codegen-detail/home-detail.md).

## Sơ đồ (file → file)

```
Linear (offline) docs/linear/main-flow-onboard.md
  └─(Skill 1 · linear-feature-spec: quét Playwright live)→ docs/features/home.md
     └─(Skill 2 · linear-testcase-gen)→ docs/testcases/home-testcases.md
        │
        ├─ dùng ENGINE dùng chung:  src/utils/i18nScan.ts
        │     (switchToVietnamese · routerNavigate · scanRoute · detectBody/Dialog/Toasts
        │      · isUntranslated · dedupUntranslated · renderI18nReport · STATIC_ROUTES)
        ├─ dùng SURFACE Home:       src/utils/i18nHome.ts
        │     (HOME_POPUP_DEFS · scanHomeOrderDialogs · scanHeaderPanels)
        ├─ dùng POPUP dùng chung:   src/utils/i18nPopups.ts  (scanPopup)
        │
        └─→ SPEC: tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts
               │  (import qua @fixtures/index, @utils/*, @/types/testTags)
               └─(khi chạy: ENV=local npx playwright test ...)→
                    reports/i18n-audit/home-scan.html
                    reports/i18n-audit/home-scan.json
                    reports/i18n-audit/home-screens/*.png   (chỉ surface FAIL)
                    reports/allure-results/*                 (Allure)
```

## Bảng mắt xích

| # | File nguồn | → | File đích | Khâu tạo | Ghi chú |
|---|-----------|---|-----------|----------|---------|
| 1 | docs/linear/main-flow-onboard.md | → | docs/features/home.md | Skill 1 | Spec + quét live |
| 2 | docs/features/home.md | → | docs/testcases/home-testcases.md | Skill 2 | 13 TC |
| 3 | docs/testcases/home-testcases.md | → | tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts | Skill 2 (đã có sẵn) | 1 test = tất cả TC |
| 4 | (spec) | ← import | src/utils/i18nScan.ts | có sẵn | engine quét dùng chung |
| 5 | (spec) | ← import | src/utils/i18nHome.ts | có sẵn | surface riêng Home |
| 6 | (spec) | ← import | src/utils/i18nPopups.ts | có sẵn | `scanPopup` |
| 7 | (spec) | ← import | src/fixtures/index.ts · src/types/testTags.ts | có sẵn | fixtures + tag |
| 8 | TC-i18n-home-...spec.ts | → (runtime) | reports/i18n-audit/home-scan.{html,json}, home-screens/*.png | khi chạy | đầu ra scan |
| 9 | playwright.config.ts | → (runtime) | reports/allure-results/* | khi chạy | reporter Allure |

## Thứ tự thực thi trong spec (tóm tắt)

```
switchToVietnamese → kiểm tra __TSR_ROUTER__ → scanRoute('/home')
→ HOME_POPUP_DEFS (scanPopup ×4) → scanHomeOrderDialogs → scanHeaderPanels
→ renderI18nReport + ghi file → log surface EN → gate expect.soft
```

## Ghi chú
- Tất cả file đường dẫn ở trên **đã tồn tại thật** (verify bằng đọc file, 2026-07-06).
- Mắt xích #3–#7 là code **đã được sinh trước đó**; Skill 2 map lại chứ không sinh trùng.
- Import dùng path alias TypeScript (`@fixtures`, `@utils`, `@/`) — cấu hình ở `tsconfig.json`.
