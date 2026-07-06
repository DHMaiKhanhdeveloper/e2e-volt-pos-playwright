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
  ORDER_PENDING_POPUP_DEFS,
  scanOrderPendingFilter,
  scanOrderPendingDatePicker,
  scanOrderPendingCardOpen,
} from '@utils/i18nOrderPending';

/**
 * VP-462 — Vietnamese DEEP scan of the Order Pending screen ONLY.
 *
 * A focused, fast companion to TC-i18n-vietnamese-scan (which walks the whole
 * app). This one switches to Tiếng Việt once, then exercises just
 * `/order-pending` in depth: the full page, the DatePicker calendar, the inline
 * filter controls (Staff popover / Sort / DatePicker preset), the calendar grid
 * (still English), and the guard dialog a card-open can raise. Use it to iterate
 * quickly when fixing Order Pending localization.
 *
 * SAME CONTRACT as the full scan: switch language via the UI ONCE, then reach
 * /order-pending client-side (router) — never `page.goto` (a reload reverts the
 * language). Output → reports/order-pending/order-pending-scan.{html,json} +
 * reports/order-pending/screens/<page>.png (failing surfaces only). Gate by default;
 * set I18N_LENIENT=1 for an informational run that never fails.
 *
 * Spec map: docs/i18n/order-pending-translation-map.md
 */
test.describe(`i18n — Order Pending Vietnamese deep scan ${Tag.REGRESSION}`, () => {
  test('TC-I18N-VI-ORDER-PENDING: Order Pending screen + dialogs still in English', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const outDir = path.resolve('reports', 'order-pending');
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

    // 2) Scan the full /order-pending page itself.
    const opDef = STATIC_ROUTES.find((r) => r.path === '/order-pending');
    if (opDef) await record(await scanRoute(page, opDef));

    // 3) DatePicker popover (aria + screenshot via the shared popup infra).
    for (const def of ORDER_PENDING_POPUP_DEFS) {
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

    // 4) Inline filter controls, calendar grid, and card-open guard dialog.
    await scanOrderPendingFilter(page, record);
    await scanOrderPendingDatePicker(page, record);
    await scanOrderPendingCardOpen(page, record);

    // 5) Write an Order-Pending-scoped report (HTML + JSON).
    const generatedAt = new Date().toISOString();
    mkdirSync(outDir, { recursive: true });
    const dedup = dedupUntranslated(scans);
    const untranslated = scans.filter(isUntranslated);
    const html = renderI18nReport(scans, generatedAt, { dedup });
    writeFileSync(path.join(outDir, 'order-pending-scan.html'), html, 'utf8');
    writeFileSync(
      path.join(outDir, 'order-pending-scan.json'),
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
      .attach('i18n-order-pending-scan.html', { body: html, contentType: 'text/html' });

    // 6) List Order Pending surfaces still in English (the deliverable).
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Đơn đang chờ — surface CHƯA chuyển Tiếng Việt: ${untranslated.length}/${scans.length} ===\n` +
        (untranslated.length
          ? untranslated
              .map((s) => `  • ${s.name} (${s.route})\n      ${s.ui.join(' · ')}`)
              .join('\n')
          : '  🎉 Toàn bộ Đơn đang chờ đã dịch!') +
        `\n\nChuỗi cần dịch (dedup): ${dedup.length}` +
        `\nBáo cáo: ${path.join(outDir, 'order-pending-scan.html')}\n`,
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
