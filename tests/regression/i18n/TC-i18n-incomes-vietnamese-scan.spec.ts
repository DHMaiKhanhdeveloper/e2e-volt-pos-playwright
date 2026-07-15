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
} from '@domains/i18n/i18nScan';
import { scanPopup } from '@domains/i18n/i18nPopups';
import {
  INCOMES_POPUP_DEFS,
  scanIncomesGate,
  scanIncomesDatePicker,
  scanIncomesDetail,
} from '@domains/i18n/i18nIncomes';

/**
 * VP-462 — Vietnamese DEEP scan of the three INCOME report screens ONLY:
 * Daily Sale Report, Income Summary, Staff Income (all gated).
 *
 * A focused, fast companion to TC-i18n-vietnamese-scan. Switches to Tiếng Việt
 * once, scans the passcode gate dialog, unlocks, then walks the three report
 * routes plus the DatePicker calendar, the calendar grid (still English), and
 * the per-route detail panel (Print button, Order Details dialog).
 *
 * SAME CONTRACT as the full scan: switch language via the UI ONCE, then reach
 * the routes client-side (router) — never `page.goto` (a reload reverts the
 * language). Output → reports/i18n-audit/incomes-scan.{html,json} +
 * incomes-screens/<page>.png (failing surfaces only). Gate by default; set
 * I18N_LENIENT=1 for an informational run that never fails.
 *
 * Spec map: docs/i18n/incomes-translation-map.md
 */
test.describe(`i18n — Incomes (reports) Vietnamese deep scan ${Tag.REGRESSION}`, () => {
  test('TC-I18N-VI-INCOMES: Daily/Summary/Staff income screens still in English', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const outDir = path.resolve('reports', 'i18n-audit');
    const screensDir = path.join(outDir, 'incomes-screens');
    const slugify = (s: string): string =>
      s
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'page';

    const scans: RouteScan[] = [];

    const record = async (scan: RouteScan): Promise<void> => {
      const brokenUi = (scan.overflow?.length ?? 0) > 0 || (scan.xOverflow ?? 0) > 8;
      if (isUntranslated(scan) || brokenUi) {
        try {
          mkdirSync(screensDir, { recursive: true });
          const file = `incomes-screens/${slugify(scan.route)}.png`;
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

    const hasRouter = await page.evaluate(
      () => typeof (window as unknown as { __TSR_ROUTER__?: unknown }).__TSR_ROUTER__ === 'object',
    );
    expect(hasRouter, 'TanStack router (__TSR_ROUTER__) must be available for SPA navigation').toBe(
      true,
    );

    // 2) Scan the passcode gate dialog FIRST (before unlocking), then unlock.
    await scanIncomesGate(page, record);

    // 3) Scan each of the three gated report routes (now unlocked).
    for (const p of ['/incomes/income-daily', '/incomes/income-summary', '/incomes/income-staff']) {
      const def = STATIC_ROUTES.find((r) => r.path === p);
      if (def) await record(await scanRoute(page, def));
    }

    // 4) DatePicker popover (aria + screenshot via the shared popup infra).
    for (const def of INCOMES_POPUP_DEFS) {
      const slug = slugify(`${def.host}-${def.name}`);
      const scan = await scanPopup(page, def, {
        onOpen: async (p) => {
          try {
            mkdirSync(screensDir, { recursive: true });
            const file = `incomes-screens/popup-${slug}.png`;
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

    // 5) Calendar grid + per-route detail panel (Print, Order Details dialog).
    await scanIncomesDatePicker(page, record);
    await scanIncomesDetail(page, record);

    // 6) Write an Incomes-scoped report (HTML + JSON).
    const generatedAt = new Date().toISOString();
    mkdirSync(outDir, { recursive: true });
    const dedup = dedupUntranslated(scans);
    const untranslated = scans.filter(isUntranslated);
    const html = renderI18nReport(scans, generatedAt, { dedup });
    writeFileSync(path.join(outDir, 'incomes-scan.html'), html, 'utf8');
    writeFileSync(
      path.join(outDir, 'incomes-scan.json'),
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
    await test.info().attach('i18n-incomes-scan.html', { body: html, contentType: 'text/html' });

    // 7) List Income surfaces still in English (the deliverable).
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Báo cáo thu nhập — surface CHƯA chuyển Tiếng Việt: ${untranslated.length}/${scans.length} ===\n` +
        (untranslated.length
          ? untranslated
              .map((s) => `  • ${s.name} (${s.route})\n      ${s.ui.join(' · ')}`)
              .join('\n')
          : '  🎉 Toàn bộ 3 trang báo cáo đã dịch!') +
        `\n\nChuỗi cần dịch (dedup): ${dedup.length}` +
        `\nBáo cáo: ${path.join(outDir, 'incomes-scan.html')}\n`,
    );

    // 8) Gate — each untranslated surface is its own soft expectation.
    if (process.env.I18N_LENIENT !== '1') {
      for (const s of untranslated) {
        expect.soft(s.ui, `"${s.name}" (${s.route}) còn chuỗi tiếng Anh`).toHaveLength(0);
      }
    }
  });
});
