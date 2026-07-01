import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';

/**
 * VP-462 — Language switch feature (English ⇄ Tiếng Việt).
 *
 * Settings → Language exposes a two-option radiogroup. Selecting an option must
 * re-render the whole app in that language immediately. These tests verify the
 * switch in both directions, that the radio reflects the active language, that
 * real UI strings (nav + sidebar + a settings screen) are translated, and they
 * document the known "language is not persisted across reload" defect.
 */
test.describe(`Settings — Language switch ${Tag.REGRESSION}`, () => {
  test.beforeEach(async ({ languageSettingsPage }) => {
    await languageSettingsPage.goto();
    await languageSettingsPage.waitForReady();
  });

  test('TC-LANG-01: default language is English', async ({ languageSettingsPage }) => {
    expect(await languageSettingsPage.selectedLanguage()).toBe('en');
    expect(await languageSettingsPage.isLanguageActive('en')).toBe(true);
  });

  test('TC-LANG-02: switch English → Tiếng Việt translates the app', async ({
    page,
    languageSettingsPage,
  }) => {
    await languageSettingsPage.select('vi');

    // Radio state + app chrome both reflect Vietnamese.
    expect(await languageSettingsPage.selectedLanguage()).toBe('vi');
    expect(await languageSettingsPage.isLanguageActive('vi')).toBe(true);

    // Spot-check concrete translated strings across the UI.
    await expect(page.getByText('Đơn đang chờ', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Cài đặt', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Thông tin doanh nghiệp', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Chọn ngôn ngữ chính của bạn', { exact: true })).toBeVisible();

    // The English chrome must be gone.
    expect(await languageSettingsPage.isLanguageActive('en')).toBe(false);
  });

  test('TC-LANG-03: switch back Tiếng Việt → English', async ({ page, languageSettingsPage }) => {
    await languageSettingsPage.select('vi');
    expect(await languageSettingsPage.isLanguageActive('vi')).toBe(true);

    await languageSettingsPage.select('en');
    expect(await languageSettingsPage.selectedLanguage()).toBe('en');
    expect(await languageSettingsPage.isLanguageActive('en')).toBe(true);
    await expect(page.getByText('Pending Orders', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Choose your primary language', { exact: true })).toBeVisible();
  });

  test('TC-LANG-04: Vietnamese persists across in-app navigation', async ({
    page,
    languageSettingsPage,
  }) => {
    await languageSettingsPage.select('vi');

    // Client-side navigate to another screen and back — language must hold.
    await page.evaluate(() => {
      const r = (
        window as unknown as { __TSR_ROUTER__?: { navigate: (o: { to: string }) => unknown } }
      ).__TSR_ROUTER__;
      r?.navigate({ to: '/settings/business' });
    });
    await expect(page.getByText('Thông tin doanh nghiệp', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    });
    expect(await languageSettingsPage.isLanguageActive('vi')).toBe(true);
  });

  /**
   * KNOWN BUG (VP-462): the language choice is NOT persisted — a full reload
   * reverts the app to English (`tauri-store:settings.json` stays empty and
   * `<html lang>` returns to "en"). This test asserts the DESIRED behavior
   * (Vietnamese survives a reload) and is marked `fail()` so it tracks the bug:
   * when persistence is implemented, it will start passing → remove `test.fail`.
   */
  test('TC-LANG-05: language persists across a full reload (known bug)', async ({
    page,
    languageSettingsPage,
  }) => {
    test.fail(true, 'Language is not persisted across reload — VP-462 known defect');
    await languageSettingsPage.select('vi');
    expect(await languageSettingsPage.selectedLanguage()).toBe('vi');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await languageSettingsPage.waitForReady();

    // Capture the post-reload state of the screen under test, regardless of the
    // assertion outcome, so the failing screen is documented (screenshot + HTML).
    const expected = 'vi' as const;
    const actual = await languageSettingsPage.selectedLanguage();
    const htmlLang = await page.evaluate(() => document.documentElement.lang);

    const outDir = path.resolve('reports', 'i18n-audit', 'lang-persist-fail');
    mkdirSync(outDir, { recursive: true });
    const shot = 'settings-language-after-reload.png';
    await page.screenshot({ path: path.join(outDir, shot), fullPage: true });

    if (actual !== expected) {
      const generatedAt = new Date().toISOString();
      const reportHtml = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>TC-LANG-05 — màn hình fail</title>
<style>
  :root{--bg:#eef1f6;--surface:#fff;--ink:#0f172a;--muted:#64748b;--line:#e6eaf0;--red:#dc2626;--shadow:0 1px 2px rgba(16,24,40,.04),0 4px 16px rgba(16,24,40,.06)}
  *{box-sizing:border-box}body{font:14px/1.55 ui-sans-serif,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:var(--bg);color:var(--ink)}
  .wrap{max-width:960px;margin:0 auto;padding:28px 22px 60px}
  h1{font-size:24px;font-weight:800;margin:0 0 4px}.meta{color:var(--muted);font-size:13px;margin-bottom:18px}
  table{width:100%;border-collapse:collapse;background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);margin-bottom:18px}
  th,td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--line);font-size:13px}
  th{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;background:#fafbfd}
  tr:last-child td{border-bottom:none}.route{font-family:ui-monospace,Consolas,monospace;font-size:12px;color:var(--muted)}
  .b-fail{display:inline-block;background:#fef2f2;color:var(--red);font-weight:800;font-size:11px;padding:2px 9px;border-radius:999px}
  code{background:#f1f5f9;padding:1px 6px;border-radius:5px;font-size:12.5px;font-family:ui-monospace,Consolas,monospace}
  .shot{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:14px}
  .shot img{width:100%;border:1px solid var(--line);border-radius:8px;display:block}
  .cap{font-size:12px;color:var(--muted);margin-top:8px}
</style></head><body><div class="wrap">
  <h1>TC-LANG-05 — Màn hình FAIL</h1>
  <div class="meta">Test chuyển ngôn ngữ · persist sau reload · ${generatedAt}</div>
  <table><thead><tr><th>Màn fail</th><th>Kết quả</th><th>Mong đợi</th><th>Thực tế</th><th>&lt;html lang&gt;</th></tr></thead>
  <tbody><tr>
    <td><b>Cài đặt · Ngôn ngữ</b><div class="route">/settings/language (sau full reload)</div></td>
    <td><span class="b-fail">FAIL</span></td>
    <td><code>vi</code> (giữ Tiếng Việt)</td>
    <td><code>${actual}</code> (revert English)</td>
    <td><code>${htmlLang}</code></td>
  </tr></tbody></table>
  <div class="shot"><img src="${shot}" alt="settings language after reload"/>
    <div class="cap">Ảnh chụp màn <code>/settings/language</code> ngay sau khi reload — radio quay về <b>English</b> dù trước đó đã chọn Tiếng Việt. Nguyên nhân: lựa chọn ngôn ngữ không được persist (tauri-store rỗng) — bug VP-462.</div>
  </div>
</div></body></html>`;
      writeFileSync(path.join(outDir, 'index.html'), reportHtml, 'utf8');
      await test.info().attach('TC-LANG-05-fail.html', {
        body: reportHtml,
        contentType: 'text/html',
      });
      await test.info().attach('settings-language-after-reload.png', {
        path: path.join(outDir, shot),
        contentType: 'image/png',
      });
      // eslint-disable-next-line no-console
      console.log(
        `\nTC-LANG-05 FAIL — màn /settings/language sau reload: mong đợi 'vi', thực tế '${actual}' (html lang="${htmlLang}").` +
          `\nBáo cáo: ${path.join(outDir, 'index.html')}\n`,
      );
    }

    // Desired: still Vietnamese after reload (currently reverts to English).
    expect(actual, 'Ngôn ngữ phải giữ Tiếng Việt sau reload').toBe(expected);
  });
});
