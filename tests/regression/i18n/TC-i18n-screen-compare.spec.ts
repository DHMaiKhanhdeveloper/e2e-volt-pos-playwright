import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { LanguageSettingsPage } from '@pages/settings/LanguageSettingsPage';
import {
  switchToVietnamese,
  routerNavigate,
  enterPasscodeIfPrompted,
  detectBody,
  scrollThroughPage,
} from '@utils/i18nScan';
import {
  SCREENS,
  captureTexts,
  pairAndClassify,
  summarize,
  suggestFor,
  renderCompareReport,
} from '@utils/i18nCompare';

/**
 * EN ↔ VI translation-quality compare for ONE screen (VP-462, đi kèm skill
 * `i18n-vietnamese-scan`). Pick the screen with the `I18N_SCREEN` env var (key
 * from {@link SCREENS}, default `home`):
 *
 *   I18N_SCREEN=home npx playwright test tests/regression/i18n/TC-i18n-screen-compare.spec.ts --project=chromium
 *
 * Flow: scan the screen in ENGLISH, switch to Tiếng Việt, scan again, then join
 * every string by its DOM-path key and classify (missing / suspect / ok). Also
 * captures leftover-English + UI vỡ from the VN pass. Output →
 * reports/<screen>/compare.json (consumed by the skill to write the
 * docs/i18n markdown, including the suggested standard term for each mismatch).
 *
 * Gate: fails on `missing` (untranslated) unless I18N_LENIENT=1. `suspect`
 * (translated to a non-standard term) and UI vỡ are report-only — a human/Claude
 * confirms the wording before they become hard failures.
 */
const SCREEN = process.env.I18N_SCREEN || 'home';

test.describe(`i18n — so sánh EN↔VI theo màn ${Tag.REGRESSION}`, () => {
  test(`TC-I18N-COMPARE: ${SCREEN}`, async ({ page }) => {
    test.setTimeout(180_000);

    const def = SCREENS[SCREEN];
    expect(
      def,
      `Màn "${SCREEN}" chưa khai báo trong SCREENS (src/utils/i18nCompare.ts)`,
    ).toBeTruthy();

    // 1) ENGLISH pass — switch to English, navigate client-side, capture.
    const lang = new LanguageSettingsPage(page);
    await page.goto('/settings/language', { waitUntil: 'domcontentloaded' });
    await lang.waitForReady();
    await lang.select('en');
    await routerNavigate(page, def.route);
    await page.waitForTimeout(1800);
    if (def.gated) {
      await enterPasscodeIfPrompted(page).catch(() => {});
      await page.waitForTimeout(1000);
    }
    // Scroll the whole body so lazy/below-the-fold content mounts before capture.
    await scrollThroughPage(page);
    const en = await captureTexts(page);

    // 2) VIETNAMESE pass — switch to VN, navigate, capture + leftover-English + UI vỡ.
    await switchToVietnamese(page);
    await routerNavigate(page, def.route);
    await page.waitForTimeout(1800);
    if (def.gated) {
      await enterPasscodeIfPrompted(page).catch(() => {});
      await page.waitForTimeout(1000);
    }
    // Same scroll walk as the EN pass so the EN↔VI DOM-path keys line up.
    await scrollThroughPage(page);
    const vi = await captureTexts(page);
    const viScan = await detectBody(page);

    // 3) Compare. `missing` = the AUTHORITATIVE leftover-English list from the
    //    data-filtered scan (not the raw pairs), annotated with a glossary
    //    suggestion where known. `suspect` = glossary terms translated to a
    //    non-standard word. `pairs` (glossary-anchored) drives the quality view.
    const pairs = pairAndClassify(en, vi);
    const missing = viScan.ui.map((text) => ({ text, suggestion: suggestFor(text) }));
    const suspect = pairs.filter((p) => p.status === 'suspect');
    const summary = { ...summarize(SCREEN, pairs), missing: missing.length };

    // Per-screen report home: reports/<screen>/ holds this screen's compare +
    // suite scan side by side (see scripts/build-reports-index.mjs dashboard).
    const outDir = path.resolve('reports', SCREEN);
    mkdirSync(outDir, { recursive: true });
    const generatedAt = new Date().toISOString();
    const uiBroken = { clipped: viScan.overflow ?? [], xOverflow: viScan.xOverflow ?? 0 };
    const jsonPath = path.join(outDir, `compare.json`);
    writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          screen: SCREEN,
          route: def.route,
          generatedAt,
          summary,
          missing, // untranslated (data-filtered) + suggested standard term
          suspect, // translated but non-standard term
          uiBroken,
          pairs, // glossary-anchored EN↔VI classification
        },
        null,
        2,
      ),
      'utf8',
    );

    // Self-contained HTML twin of the JSON — eyeball translation quality.
    const html = renderCompareReport({
      screen: SCREEN,
      route: def.route,
      generatedAt,
      summary,
      missing,
      pairs,
      uiBroken,
    });
    const htmlPath = path.join(outDir, `compare.html`);
    writeFileSync(htmlPath, html, 'utf8');
    await test.info().attach(`compare-${SCREEN}.html`, { body: html, contentType: 'text/html' });

    // eslint-disable-next-line no-console
    console.log(
      `\n=== EN↔VI "${SCREEN}" (${def.route}) ===\n` +
        `❌ chưa dịch ${missing.length} · ⚠️ sai chuẩn ${suspect.length} · ✅ thuật ngữ đúng ${summary.ok}\n` +
        (missing.length
          ? missing
              .map(
                (m) =>
                  `  [CHƯA DỊCH] "${m.text}"${m.suggestion ? `  ⇒ nên: "${m.suggestion}"` : ''}`,
              )
              .join('\n')
          : '  🎉 không còn tiếng Anh') +
        (suspect.length
          ? '\n' +
            suspect
              .map((p) => `  [SAI CHUẨN] "${p.vi}" (gốc "${p.en}")  ⇒ nên: "${p.suggestion}"`)
              .join('\n')
          : '') +
        ((viScan.xOverflow ?? 0) > 8 || (viScan.overflow?.length ?? 0) > 0
          ? `\n📐 UI vỡ: tràn ngang ${viScan.xOverflow ?? 0}px · cắt chữ ${viScan.overflow?.length ?? 0}`
          : '') +
        `\nJSON: ${jsonPath}\nHTML: ${htmlPath}\n`,
    );

    // Gate on untranslated (authoritative, data-filtered); suspect + UI vỡ report-only.
    if (process.env.I18N_LENIENT !== '1') {
      expect
        .soft(missing, `Màn "${SCREEN}": còn ${missing.length} chuỗi CHƯA dịch sang Tiếng Việt`)
        .toHaveLength(0);
    }
  });
});
