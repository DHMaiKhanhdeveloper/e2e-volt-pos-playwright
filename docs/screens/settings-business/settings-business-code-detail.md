---
title: Luồng code-gen — Thông tin doanh nghiệp (Business Info)
generated-at: 2026-07-06
---

# Luồng code-gen — Thông tin doanh nghiệp (Business Info)

## Sơ đồ (file → file)

```
Linear VP-871 / docs/linear/settings.md
  └─(skill 1 linear-feature-spec: quét Playwright MCP + screenshot)
     → docs/features/settings-business.md  (+ settings-business-assets/business-info.png)
        └─(skill 2 linear-testcase-gen: quét MCP → liệt kê case)
           → docs/testcases/settings-business-testcases.md
              ├─→ src/pages/settings/BusinessInfoPage.ts        (page object — locators + readPayPeriod)
              └─→ tests/regression/settings/business/TC-business-info.spec.ts  (spec, 11 test)
                   └─(khi chạy)→ reports/html, reports/allure-results, test-results/
  └─(skill 5 i18n-vietnamese-scan)
     → docs/i18n/settings-business-i18n-result.md  (+ reports/settings-business/compare.{html,json})
  └─(skill 6 screen-suite-report)
     → tests/regression/settings/business/TC-business-info-ALL.spec.ts
        └─(khi chạy)→ reports/settings-business/settings-business-scan.{html,json}
```

## Bảng mắt xích

| #   | File nguồn                                | →   | File đích                                                             | Khâu tạo                 | Ghi chú                                  |
| --- | ----------------------------------------- | --- | --------------------------------------------------------------------- | ------------------------ | ---------------------------------------- |
| 1   | Linear VP-871 + `docs/linear/settings.md` | →   | `docs/features/settings-business.md`                                  | skill 1                  | Quét MCP live + chụp `business-info.png` |
| 2   | `docs/features/settings-business.md`      | →   | `docs/testcases/settings-business-testcases.md`                       | skill 2                  | 12 case (read-only)                      |
| 3   | testcases.md                              | →   | `src/pages/settings/BusinessInfoPage.ts`                              | skill 2                  | Đã có sẵn — mở rộng thêm locators        |
| 4   | testcases.md                              | →   | `tests/regression/settings/business/TC-business-info.spec.ts`         | skill 2                  | 11 test, chạy xanh                       |
| 5   | route live                                | →   | `docs/i18n/settings-business-i18n-result.md`                          | skill 5                  | 70 ✅ / 0 chưa dịch (sau khi vào gate)   |
| 6   | testcases + spec                          | →   | `TC-business-info-ALL.spec.ts` + `reports/settings-business/*-scan.*` | skill 6                  | 1-big-test kiểu Home                     |
| 7   | mọi `.md`                                 | →   | `reports/settings-business/*.html`                                    | `scripts/md-to-html.mjs` | HTML kèm hero image                      |

## Ghi chú

- **Passcode gate:** màn gated → mọi spec phải unlock `8888` trước; helper dùng `PasscodeDialog`.
- Page object `BusinessInfoPage` đã tồn tại từ pipeline income (đọc Pay Period) → skill 2 chỉ **mở rộng** locators, không tạo mới.
- Mắt xích còn thiếu: chưa có spec Linear riêng cho phần POS (Pay Period / Store Policies) — xem §6 feature doc.


---

---
title: Chi tiết luồng code-gen — Thông tin doanh nghiệp (Business Info)
expands: docs/codegen-flow/settings-business-flow.md
generated-at: 2026-07-06
---

# Chi tiết luồng code-gen — Thông tin doanh nghiệp (Business Info)

## Tổng quan công nghệ

| Công nghệ                    | Vai trò trong luồng gen                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| **Playwright MCP**           | Quét live `/settings/business`, nhập passcode, snapshot cây a11y, chụp full-page |
| **Linear MCP**               | Đọc VP-871 + sub-task để lấy spec/nghiệp vụ                                      |
| **Playwright Test**          | Chạy spec (`@fixtures/index`, `expect`, `test.step`)                             |
| **Page Object (BasePage)**   | `BusinessInfoPage` kế thừa `BasePage` — locator + action, không assert           |
| **PasscodeDialog component** | Mở khoá gate (`enterPasscode`, `tickRemember30m`)                                |
| **TS path alias**            | `@pages`, `@components`, `@fixtures`, `@/`                                       |
| **scripts/md-to-html.mjs**   | Render `.md` → HTML tự-chứa kèm hero image                                       |

## Chi tiết theo file

### 1. src/pages/settings/BusinessInfoPage.ts

- **Vai trò:** page object — locator các section/field + đọc Pay Period.

```ts
this.heading = page.getByRole('heading', { name: 'Business Info' });
this.payPeriodGroup = page.locator('[role="radiogroup"]');
this.editButton = page.getByRole('button', { name: 'Edit', exact: true });
field(name: string): Locator { return this.page.getByRole('textbox', { name, exact: true }); }
daySwitch(day: string): Locator { return this.page.getByRole('switch', { name: `Open on ${day}` }); }
async isFieldEditable(name: string): Promise<boolean> { return this.field(name).first().isEditable().catch(() => false); }
```

- **Giải thích:** dùng **role-based locator** (`getByRole`) — bền hơn CSS, khớp trực tiếp cây a11y đã quét bằng MCP. `readPayPeriod()` đọc `data-state="checked"` của Radix radio.
- **Công nghệ:** Playwright locators + Radix a11y attributes.

### 2. src/components/modal/PasscodeDialog.ts (tái dùng)

- **Vai trò:** mở khoá owner passcode gate.

```ts
await passcodeDialog.tickRemember30m();
await passcodeDialog.enterPasscode('8888'); // click từng nút số, chờ dialog ẩn
```

- **Công nghệ:** Radix dialog + `getByRole('button', { name: digit, exact: true })`.

### 3. tests/regression/settings/business/TC-business-info.spec.ts

- **Vai trò:** 11 test read-only.

```ts
async function openUnlocked(businessInfoPage, passcodeDialog) {
  await businessInfoPage.goto();
  await passcodeDialog.waitForVisible(8_000).catch(() => {}); // cold-load: dialog mount trễ
  if (await passcodeDialog.isOpen()) {
    await passcodeDialog.tickRemember30m();
    await passcodeDialog.enterPasscode(PASSCODE);
  }
  await businessInfoPage.waitForReady();
}
```

- **Giải thích:** bài học khi chạy — trên cold `goto`, dialog passcode mount **sau** khi app render, nên phải `waitForVisible` (best-effort) trước khi kiểm `isOpen()`; nếu kiểm ngay sẽ bỏ qua unlock → form bị gate chặn → `waitForReady` timeout (9/11 test từng fail vì lỗi này).
- **Công nghệ:** Playwright Test + custom fixtures (`businessInfoPage`, `passcodeDialog`).

### 4. scripts/md-to-html.mjs

- **Vai trò:** render mọi `.md` (feature/testcases/flow/i18n) → HTML tự-chứa, nhúng `business-info.png` base64.
- **Công nghệ:** Node script + markdown→HTML + base64 image inlining.

## So với bản map (skill 3)

Bản map chỉ liệt kê file→file; bản này thêm **đoạn code thật** + **bài học runtime** (cold-load passcode race) và **công nghệ** từng mắt xích.
