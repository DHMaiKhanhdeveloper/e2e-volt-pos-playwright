---
title: Chi tiết luồng code-gen — Home (/home) quét Tiếng Việt
expands: docs/codegen-flow/home-flow.md
generated-at: 2026-07-06
skill: codegen-flow-detail (4/4)
---

# Chi tiết luồng code-gen — Home (`/home`) quét Tiếng Việt

> Đầu ra **Skill 4/4** (`codegen-flow-detail`). Mở rộng bản đồ file→file của Skill 3 thành
> **từng đoạn code + công nghệ**. Mọi đoạn trích dưới đây copy đúng từ file thật (kèm đường
> dẫn + số dòng).

## Tổng quan công nghệ

| Công nghệ | Vai trò trong luồng gen/quét |
|-----------|------------------------------|
| **Playwright Test** | Chạy test, điều khiển trình duyệt, `expect.soft` làm cổng localization |
| **Playwright MCP** | Quét khám phá màn hình live để xây spec/selector (khâu Skill 1) |
| **Linear MCP** (`linear-server`) | Đọc spec gốc (phiên này chưa xác thực → dùng bản offline `docs/linear/`) |
| **TanStack Router** | `window.__TSR_ROUTER__.navigate` — điều hướng SPA giữ trạng thái VN (không reload) |
| **Custom fixtures** (`mergeTests`) | `@fixtures/index` bơm page object vào test |
| **TypeScript path alias** | `@utils/*`, `@fixtures`, `@/*` (cấu hình `tsconfig.json`) |
| **DOM heuristic in `page.evaluate`** | Phát hiện chuỗi tiếng Anh còn sót (regex dấu tiếng Việt + từ vựng UI) |
| **Allure + HTML reporter** | `reports/allure-results/*`, `home-scan.html` |
| **Tag system** (`Tag.REGRESSION`) | Lọc test theo `--grep @regression` |

## Chi tiết theo file

### 1. `tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts`
- **Vai trò:** file spec — điều phối toàn bộ luồng quét Home.
- **Đoạn import (dòng 3–14):** dùng path alias + fixtures.
  ```ts
  import { test, expect } from '@fixtures/index';
  import { Tag } from '@/types/testTags';
  import { STATIC_ROUTES, scanRoute, switchToVietnamese, renderI18nReport,
           dedupUntranslated, isUntranslated, type RouteScan } from '@utils/i18nScan';
  import { scanPopup } from '@utils/i18nPopups';
  import { HOME_POPUP_DEFS, scanHomeOrderDialogs, scanHeaderPanels } from '@utils/i18nHome';
  ```
- **Kiểm tra router (dòng ~55–59):** điều kiện để điều hướng SPA.
  ```ts
  const hasRouter = await page.evaluate(
    () => typeof (window as unknown as { __TSR_ROUTER__?: unknown }).__TSR_ROUTER__ === 'object');
  expect(hasRouter, 'TanStack router (__TSR_ROUTER__) must be available ...').toBe(true);
  ```
- **Cổng localization (cuối file):** mỗi surface EN là một `expect.soft` riêng.
  ```ts
  if (process.env.I18N_LENIENT !== '1') {
    for (const s of untranslated) {
      expect.soft(s.ui, `"${s.name}" (${s.route}) còn chuỗi tiếng Anh`).toHaveLength(0);
    }
  }
  ```
- **Công nghệ:** Playwright Test + fixtures + `expect.soft` (liệt kê MỌI surface lỗi thay vì dừng ở lỗi đầu).

### 2. `src/utils/i18nScan.ts` — engine dùng chung
- **`switchToVietnamese` (dòng 624):** đổi ngôn ngữ bằng click thật.
  ```ts
  export async function switchToVietnamese(page: Page): Promise<void> {
    await page.goto('/settings/language', { waitUntil: 'domcontentloaded' });
    const viRow = page.getByText('Tiếng Việt', { exact: true });
    await viRow.waitFor({ state: 'visible', timeout: 15_000 });
    await viRow.click();
    await page.getByText('Đơn đang chờ', { exact: true }).first().waitFor({ timeout: 10_000 });
  }
  ```
- **`routerNavigate` (dòng 638):** điều hướng client-side để **giữ VN** (công nghệ TanStack Router).
  ```ts
  export async function routerNavigate(page: Page, to: string): Promise<void> {
    await page.evaluate((dest) => {
      const r = (window as unknown as { __TSR_ROUTER__?: { navigate: (o: { to: string }) => unknown } }).__TSR_ROUTER__;
      r?.navigate({ to: dest });
    }, to);
  }
  ```
- **Heuristic phát hiện EN (`detectScope`, dòng ~216):** regex dấu tiếng Việt + tập từ vựng UI.
  ```ts
  const viet = /[àáảãạ...ỳýỷỹỵđ]/i;   // có dấu → coi như đã dịch
  const ui = new Set([ 'notification','confirmed','order','total','staff','search', ... ]);
  ```
- **`isUntranslated` (dòng 116):** một surface "còn EN" khi không bị redirect, không phải stub, và còn chuỗi UI.
  ```ts
  export const isUntranslated = (s: RouteScan): boolean =>
    !s.redirected && !s.stub && s.ui.length > 0;
  ```
- **`scanRoute` (dòng 692):** điều hướng + chờ + `detectBody`.
  ```ts
  export async function scanRoute(page: Page, def: RouteDef): Promise<RouteScan> {
    await routerNavigate(page, def.path);
    await page.waitForTimeout(1500);
    ...
    const raw = await detectBody(page);
    const redirected = !raw.path.startsWith(def.path.split('?')[0]);
    return { ...raw, route: def.path, name: def.name, group: def.group, redirected };
  }
  ```
- **`dedupUntranslated` (dòng 125):** gom chuỗi trùng theo số route (fix 1 lần), sắp theo leverage.
- **Công nghệ:** DOM scan qua `page.evaluate` (chạy trong trình duyệt), regex Unicode, TanStack Router.

### 3. `src/utils/i18nHome.ts` — surface riêng Home
- **`HOME_POPUP_DEFS` (dòng 34):** khai báo popup không cần đơn + selector (EN|VN fallback).
  ```ts
  export const HOME_POPUP_DEFS: PopupDef[] = [
    { name: 'Trang chủ · Bán thẻ quà tặng (Sell Gift Card)', group: 'POS', host: '/home',
      open: [ { by: 'text', name: /^gift card$|thẻ quà tặng|bán thẻ/i },
              { by: 'role', role: 'button', name: /gift card|thẻ quà/i } ] }, ... ];
  ```
- **`scanHomeOrderDialogs` (dòng 132):** tạo 1 đơn rồi quét dialog phụ thuộc đơn. Đoạn chọn staff:
  ```ts
  const staffCard = page.locator('#home-staff-listing [class*="cursor"]').first();
  if (!(await staffCard.isVisible().catch(() => false))) return; // no staff → skip
  await staffCard.click({ force: true }).catch(() => {});
  const payBtn = page.getByRole('button', { name: /thanh toán|^pay$/i }).first();
  await payBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  ```
  Nút **In**: tìm theo màu nền xanh `rgb(86, 105, 255)` (icon không có text), rồi **poll** `detectToasts`.
- **`scanHeaderPanels` (dòng 305):** 3 nút icon không có tên → click theo vị trí (hàng trên, phải→trái).
  ```ts
  const btns = [...document.querySelectorAll('header button')]
    .filter((b) => { const r = b.getBoundingClientRect();
      return r.top < 70 && !norm(b.textContent) && !!b.querySelector('svg,img'); })
    .sort((a, b) => b.getBoundingClientRect().x - a.getBoundingClientRect().x);
  ```
- **Công nghệ:** Playwright locator + `page.evaluate` (click theo hình học/màu khi thiếu accessible name), best-effort try/catch để không làm fail cổng.

### 4. `src/fixtures/index.ts` + `src/fixtures/pages.fixture.ts`
- **Vai trò:** cung cấp `test`/`expect` gộp fixtures (page object + api).
  ```ts
  export const test = mergeTests(pagesFixture, apiFixture);
  ```
- **Công nghệ:** Playwright `mergeTests` — dependency injection cho test.

### 5. `playwright.config.ts`
- **Vai trò:** baseURL theo `ENV`, reporter Allure + HTML, `trace/screenshot/video: on`, project `chromium`.
- **Công nghệ:** Playwright config + `cross-env ENV=local` (script `npm test`).

## So với bản map (Skill 3)
- Skill 3 dừng ở **file → file**. File này đi sâu tới **từng hàm/đoạn code** (số dòng), giải
  thích **cơ chế** (TanStack Router giữ VN, heuristic regex+từ vựng, click theo màu/vị trí khi
  thiếu aria-label) và **công nghệ** đứng sau mỗi mắt xích.

## Nguồn trích
- [tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts](../../tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts)
- [src/utils/i18nScan.ts](../../src/utils/i18nScan.ts) · [src/utils/i18nHome.ts](../../src/utils/i18nHome.ts)
- [src/fixtures/index.ts](../../src/fixtures/index.ts) · [playwright.config.ts](../../playwright.config.ts)
