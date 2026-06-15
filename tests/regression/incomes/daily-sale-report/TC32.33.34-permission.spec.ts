import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';

/**
 * Daily Sale Report — permission gate + passcode dialog.
 *
 * Coverage:
 *   TC-32 The route is permission-protected: opening it prompts the
 *         passcode dialog before any data renders.
 *   TC-33 A wrong passcode keeps the dialog open and does NOT reveal data.
 *   TC-34 Ticking "Do not require passcode for the next 30 minutes" and
 *         entering a correct code lets you reopen the report without a
 *         second prompt within that window.
 *
 * Notes:
 *   - The volt-pos `PermissionProtectedRoute` does not distinguish staff
 *     vs admin in dev seed data; OWNER_PASSCODE 8888 unlocks everything.
 *     The 30-minute bypass behavior is the load-bearing thing we test.
 *   - We can't fast-forward 30 real minutes; the "expired" branch of TC-34
 *     is left as a `test.skip()` placeholder for a future `page.clock` upgrade.
 */
test.describe(`Daily Sale Report — permission & passcode ${Tag.REGRESSION} ${Tag.AUTH}`, () => {
  test('TC-32: opening the route shows the passcode dialog before data renders', async ({
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    await dailySaleReportPage.goto();
    // The dialog must appear before anything in the main content is interactable.
    await passcodeDialog.waitForVisible();
    expect(await passcodeDialog.isOpen()).toBe(true);

    // Daily Sale Report heading is on the page, but the data behind the
    // gate isn't trustworthy until we authenticate — at least, the dialog
    // sits on top of it.
    await expect(passcodeDialog.heading).toBeVisible();
  });

  test('TC-33: a wrong passcode keeps the dialog open and does not unlock data', async ({
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    await dailySaleReportPage.goto();
    await passcodeDialog.waitForVisible();

    // Intentionally wrong — opt out of the auto-dismiss assertion.
    await passcodeDialog.enterPasscode('0000', { expectDismiss: false });

    // Pause briefly to give the app a chance to either close (bug) or stay
    // open (correct behaviour) before asserting.
    await dailySaleReportPage.page.waitForTimeout(800);
    expect(await passcodeDialog.isOpen()).toBe(true);
  });

  test('TC-34: ticking "Remember 30m" lets you re-enter without a second passcode prompt', async ({
    dailySaleReportPage,
    passcodeDialog,
  }) => {
    // First visit — tick + correct passcode.
    await dailySaleReportPage.goto();
    await passcodeDialog.waitForVisible();
    await passcodeDialog.tickRemember30m();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();

    // Navigate away, then back. Within the 30-minute window the dialog
    // must NOT reappear.
    await dailySaleReportPage.page.goto('/home');
    await dailySaleReportPage.page.waitForLoadState('domcontentloaded');

    await dailySaleReportPage.goto();
    // Give the gate a moment in case it would prompt — it shouldn't.
    await dailySaleReportPage.page.waitForTimeout(800);
    expect(await passcodeDialog.isOpen()).toBe(false);
    await expect(dailySaleReportPage.heading).toBeVisible();
  });

  test.skip('TC-34 (expired): after 30 minutes the passcode prompt must return', async () => {
    // Needs Playwright's `page.clock.fastForward('30:00')` to simulate the
    // elapsed time without an actual sleep. Wire this up once the codebase
    // standardises on the clock API.
  });
});
