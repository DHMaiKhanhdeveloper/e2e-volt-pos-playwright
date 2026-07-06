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
  DIALOG_SELECTOR,
  type RouteScan,
} from '@utils/i18nScan';
import { scanPopup } from '@utils/i18nPopups';
import {
  ORDER_HISTORY_POPUP_DEFS,
  scanOrderHistoryFilter,
  scanOrderHistoryDatePicker,
  scanOrderHistoryDetail,
} from '@utils/i18nOrderHistory';

/**
 * VP-462 — Vietnamese DEEP scan of the Order History screen ONLY.
 *
 * A focused, fast companion to TC-i18n-vietnamese-scan (which walks the whole
 * app). This one switches to Tiếng Việt once, then exercises just
 * `/order-history` in depth: the full page, the DatePicker calendar, the "Bộ
 * lọc" dialog + its four sub-dropdowns, the calendar grid (still English), and
 * the order-detail panel with its Receipt + Refund dialogs. Use it to iterate
 * quickly when fixing Order History localization.
 *
 * SAME CONTRACT as the full scan: switch language via the UI ONCE, then reach
 * /order-history client-side (router) — never `page.goto` (a reload reverts the
 * language). Output → reports/order-history/order-history-scan.{html,json} +
 * reports/order-history/screens/<page>.png (failing surfaces only). Gate by default;
 * set I18N_LENIENT=1 for an informational run that never fails.
 *
 * Spec map: docs/i18n/order-history-translation-map.md
 */
test.describe(`i18n — Order History Vietnamese deep scan ${Tag.REGRESSION}`, () => {
  test('TC-I18N-VI-ORDER-HISTORY: Order History screen + dialogs still in English', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const outDir = path.resolve('reports', 'order-history');
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

    // 2) Scan the full /order-history page itself.
    const ohDef = STATIC_ROUTES.find((r) => r.path === '/order-history');
    if (ohDef) await record(await scanRoute(page, ohDef));

    // 3) DatePicker popover (aria + screenshot via the shared popup infra).
    for (const def of ORDER_HISTORY_POPUP_DEFS) {
      const slug = slugify(`${def.host}-${def.name}`);
      const scan = await scanPopup(page, def, {
        onOpen: async (p) => {
          try {
            mkdirSync(screensDir, { recursive: true });
            const file = `screens/popup-${slug}.png`;
            await p
              .locator(DIALOG_SELECTOR)
              .last()
              .screenshot({ path: path.join(outDir, file) });
            return file;
          } catch {
            return undefined; // screenshot is best-effort
          }
        },
      });
      scans.push(scan);
    }

    // 4) Filter dialog + sub-dropdowns, calendar grid, order detail + dialogs.
    await scanOrderHistoryFilter(page, record);
    await scanOrderHistoryDatePicker(page, record);
    await scanOrderHistoryDetail(page, record);

    // 5) Write an Order-History-scoped report (HTML + JSON).
    const generatedAt = new Date().toISOString();
    mkdirSync(outDir, { recursive: true });
    const dedup = dedupUntranslated(scans);
    const untranslated = scans.filter(isUntranslated);
    const html = renderI18nReport(scans, generatedAt, { dedup });
    writeFileSync(path.join(outDir, 'order-history-scan.html'), html, 'utf8');
    writeFileSync(
      path.join(outDir, 'order-history-scan.json'),
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
    await test
      .info()
      .attach('i18n-order-history-scan.html', { body: html, contentType: 'text/html' });

    // 6) List Order History surfaces still in English (the deliverable).
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Lịch sử đơn — surface CHƯA chuyển Tiếng Việt: ${untranslated.length}/${scans.length} ===\n` +
        (untranslated.length
          ? untranslated
              .map((s) => `  • ${s.name} (${s.route})\n      ${s.ui.join(' · ')}`)
              .join('\n')
          : '  🎉 Toàn bộ Lịch sử đơn hàng đã dịch!') +
        `\n\nChuỗi cần dịch (dedup): ${dedup.length}` +
        `\nBáo cáo: ${path.join(outDir, 'order-history-scan.html')}\n`,
    );

    // 7) Gate — each untranslated surface is its own soft expectation, so the
    //    report enumerates EVERY one still in English. I18N_LENIENT=1 → info-only.
    if (process.env.I18N_LENIENT !== '1') {
      for (const s of untranslated) {
        expect.soft(s.ui, `"${s.name}" (${s.route}) còn chuỗi tiếng Anh`).toHaveLength(0);
      }
    }
  });
});
