import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import {
  STATIC_ROUTES,
  scanRoute,
  switchToVietnamese,
  renderI18nReport,
  dedupUntranslated,
  isUntranslated,
  type RouteScan,
} from '@domains/i18n/i18nScan';
import { scanPopup } from '@domains/i18n/i18nPopups';
import {
  HOME_POPUP_DEFS,
  scanHomeOrderDialogs,
  scanHeaderPanels,
  scanTimeKeepingDialog,
} from '@domains/i18n/i18nHome';

/**
 * VP-462 — Vietnamese DEEP scan of the Home screen ONLY.
 *
 * A focused, fast companion to TC-i18n-vietnamese-scan (which walks the whole
 * app in ~5 min). This one switches to Tiếng Việt once, then exercises just
 * `/home` in depth: the full page, every no-order popup (HOME_POPUP_DEFS), and
 * the order-flow dialogs (scanHomeOrderDialogs). Use it to iterate quickly when
 * fixing Home localization without paying for the full-app walk.
 *
 * SAME CONTRACT as the full scan: switch language via the UI ONCE, then reach
 * /home client-side (router) — never `page.goto` (a reload reverts the
 * language). Output → reports/home/home-scan.{html,json} +
 * reports/home/screens/<page>.png (failing surfaces only). Gate by default; set
 * I18N_LENIENT=1 for an informational run that never fails.
 */
test.describe(`i18n — Home Vietnamese deep scan ${Tag.REGRESSION}`, () => {
  test('TC-I18N-VI-HOME: Home screen + popups still in English', async ({ page }) => {
    test.setTimeout(180_000);

    const outDir = path.resolve('reports', 'home');
    const screensDir = path.join(outDir, 'screens');
    const slugify = (s: string): string =>
      s
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'page';

    const scans: RouteScan[] = [];

    // Screenshot a surface only when it FAILS i18n or shows broken UI, mirroring
    // the full scan's recorder. Must run while `page` is still on that surface.
    const record = async (scan: RouteScan): Promise<void> => {
      const brokenUi = (scan.overflow?.length ?? 0) > 0 || (scan.xOverflow ?? 0) > 8;
      if (isUntranslated(scan) || brokenUi) {
        try {
          mkdirSync(screensDir, { recursive: true });
          const file = `screens/${slugify(scan.route)}.png`;
          await page.screenshot({ path: path.join(outDir, file), fullPage: true });
          scan.screenshot = file;
        } catch {
          /* screenshot is best-effort */
        }
      }
      scans.push(scan);
    };

    // 1) Switch to Tiếng Việt (real UI click on the language radio).
    await switchToVietnamese(page);

    // The client-side router must be exposed for state-preserving navigation.
    const hasRouter = await page.evaluate(
      () => typeof (window as unknown as { __TSR_ROUTER__?: unknown }).__TSR_ROUTER__ === 'object',
    );
    expect(hasRouter, 'TanStack router (__TSR_ROUTER__) must be available for SPA navigation').toBe(
      true,
    );

    // 2) Scan the full /home page itself.
    const homeDef = STATIC_ROUTES.find((r) => r.path === '/home');
    if (homeDef) await record(await scanRoute(page, homeDef));

    // 3) No-order Home popups (Sell Gift Card, Select Staff First, search, scanner).
    for (const def of HOME_POPUP_DEFS) {
      const slug = slugify(`${def.host}-${def.name}`);
      const scan = await scanPopup(page, def, {
        onOpen: async (p) => {
          try {
            mkdirSync(screensDir, { recursive: true });
            const file = `screens/popup-${slug}.png`;
            await p
              .locator('[role="dialog"],[role="alertdialog"]')
              .last()
              .screenshot({
                path: path.join(outDir, file),
              });
            return file;
          } catch {
            return undefined; // screenshot is best-effort
          }
        },
      });
      scans.push(scan);
    }

    // 4) Order-flow dialogs (Order Note, Promo & Rewards, Merge Order, Change
    //    Staff, Print toast) — sets up one order.
    await scanHomeOrderDialogs(page, record);

    // 4b) Header status panels (Notifications, Time Keeping, Devices).
    await scanHeaderPanels(page, record);

    // 4c) Chấm công (Time Keeping) dialog via its deep-link — deterministic scan
    //     of the check-in panel (catches the "No staffs found." empty state).
    await scanTimeKeepingDialog(page, record);

    // 5) Write a Home-scoped report (HTML + JSON).
    const generatedAt = new Date().toISOString();
    mkdirSync(outDir, { recursive: true });
    const dedup = dedupUntranslated(scans);
    const untranslated = scans.filter(isUntranslated);
    const html = renderI18nReport(scans, generatedAt, { dedup });
    writeFileSync(path.join(outDir, 'home-scan.html'), html, 'utf8');
    writeFileSync(
      path.join(outDir, 'home-scan.json'),
      JSON.stringify(
        {
          generatedAt,
          scanned: scans.length,
          untranslatedCount: untranslated.length,
          strings: dedup.map((d) => d.text),
          dedup,
          untranslated: untranslated.map((s) => ({ route: s.route, name: s.name, ui: s.ui })),
          all: scans,
        },
        null,
        2,
      ),
      'utf8',
    );
    await test.info().attach('i18n-home-scan.html', { body: html, contentType: 'text/html' });

    // 6) List Home surfaces still in English (the deliverable).
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Home — surface CHƯA chuyển Tiếng Việt: ${untranslated.length}/${scans.length} ===\n` +
        (untranslated.length
          ? untranslated
              .map((s) => `  • ${s.name} (${s.route})\n      ${s.ui.join(' · ')}`)
              .join('\n')
          : '  🎉 Toàn bộ trang Home đã dịch!') +
        `\n\nChuỗi cần dịch (dedup): ${dedup.length}` +
        `\nBáo cáo: ${path.join(outDir, 'home-scan.html')}\n`,
    );

    // 7) Gate — each untranslated Home surface is its own soft expectation, so
    //    the report enumerates EVERY one still in English. I18N_LENIENT=1 → info-only.
    if (process.env.I18N_LENIENT !== '1') {
      for (const s of untranslated) {
        expect.soft(s.ui, `"${s.name}" (${s.route}) còn chuỗi tiếng Anh`).toHaveLength(0);
      }
    }
  });
});
