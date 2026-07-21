import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { AccessibilitySettingsPage } from '@pages/settings/AccessibilitySettingsPage';
import { BusinessInfoPage } from '@pages/settings/BusinessInfoPage';
import { PasscodeDialog } from '@components/modal/PasscodeDialog';

/**
 * VP-2400 — Passcode Setting (Settings → General → Accessibility).
 *
 * A single switch, "Enable Passcode Verification", lets a merchant turn the
 * passcode-verification modal off for gated actions across the whole POS
 * (default ON). `/settings/business` is used as the representative gated
 * route (declared `gated: true` in `src/domains/i18n/i18nCompare.ts`).
 *
 * Test cases: docs/screens/settings-accessibility/settings-accessibility-test-cases.md
 */
const PASSCODE = process.env.OWNER_PASSCODE || '8888';

test.describe(`Settings — Passcode Setting ${Tag.REGRESSION}`, () => {
  test.beforeEach(async ({ accessibilitySettingsPage }) => {
    await accessibilitySettingsPage.goto();
  });

  test.afterEach(async ({ accessibilitySettingsPage }) => {
    // Tests may navigate away (e.g. to the gated Business Info route) — come
    // back before resetting, then leave the merchant-wide setting ON for
    // other suites (TC-PASSCODE-07).
    await accessibilitySettingsPage.goto();
    await accessibilitySettingsPage.setPasscodeEnabled(true);
  });

  test('TC-PASSCODE-01: default state is ON', async ({ accessibilitySettingsPage }) => {
    expect(await accessibilitySettingsPage.isPasscodeEnabled()).toBe(true);
  });

  test('TC-PASSCODE-02: turning OFF hides the passcode dialog on a gated route', async ({
    page,
    accessibilitySettingsPage,
  }) => {
    await accessibilitySettingsPage.setPasscodeEnabled(false);

    const businessInfoPage = new BusinessInfoPage(page);
    const passcodeDialog = new PasscodeDialog(page);
    await businessInfoPage.goto();

    await expect(businessInfoPage.heading).toBeVisible({ timeout: 10_000 });
    expect(await passcodeDialog.isOpen()).toBe(false);
  });

  test('TC-PASSCODE-03: turning back ON shows the passcode dialog again', async ({
    page,
    accessibilitySettingsPage,
  }) => {
    await accessibilitySettingsPage.setPasscodeEnabled(false);
    await accessibilitySettingsPage.setPasscodeEnabled(true);

    const businessInfoPage = new BusinessInfoPage(page);
    const passcodeDialog = new PasscodeDialog(page);
    await businessInfoPage.goto();

    await passcodeDialog.waitForVisible();
    await expect(passcodeDialog.dialog).toBeVisible();
    await passcodeDialog.enterPasscode(PASSCODE);
    await businessInfoPage.waitForReady();
    await expect(businessInfoPage.heading).toBeVisible();
  });

  test('TC-PASSCODE-04: OFF state persists across a full reload', async ({
    page,
    accessibilitySettingsPage,
  }) => {
    await accessibilitySettingsPage.setPasscodeEnabled(false);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await accessibilitySettingsPage.waitForReady();

    expect(await accessibilitySettingsPage.isPasscodeEnabled()).toBe(false);
  });

  test('TC-PASSCODE-05: toggling Passcode Setting does not affect Keyboard Setting', async ({
    accessibilitySettingsPage,
  }) => {
    const before = await accessibilitySettingsPage.isVirtualKeyboardEnabled();

    await accessibilitySettingsPage.setPasscodeEnabled(false);

    expect(await accessibilitySettingsPage.isVirtualKeyboardEnabled()).toBe(before);
  });

  /**
   * KNOWN BUG (VP-2586, sub-task of VP-2400): the setting is stored per merchant
   * and should apply "immediately across the whole POS", but a second session
   * of the same merchant does not pick up the change without its own reload.
   * Marked `test.fail` so it tracks the bug — remove `test.fail` once VP-2586
   * is fixed and this starts passing.
   */
  test('TC-PASSCODE-06: setting syncs to a second session of the same merchant (known bug VP-2586)', async ({
    accessibilitySettingsPage,
    browser,
  }) => {
    test.fail(true, 'Passcode setting does not sync across sessions — VP-2586 known defect');

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const accessibilityB = new AccessibilitySettingsPage(pageB);
    await accessibilityB.goto();
    expect(await accessibilityB.isPasscodeEnabled()).toBe(true);

    await accessibilitySettingsPage.setPasscodeEnabled(false);

    // No reload on session B — per the business rule this should already be OFF.
    expect(await accessibilityB.isPasscodeEnabled()).toBe(false);

    await contextB.close();
  });
});
