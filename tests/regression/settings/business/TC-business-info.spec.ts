import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import type { BusinessInfoPage } from '@pages/settings/BusinessInfoPage';
import type { PasscodeDialog } from '@components/modal/PasscodeDialog';

/**
 * VP-2269 / VP-871 — Business Info (Settings → Store & Account).
 *
 * The screen is passcode-gated, so every test navigates then unlocks with the
 * owner passcode (8888) before asserting. Scope is READ-ONLY: presence of the
 * five sections, the profile fields (incl. role-locked read-only ones), Work
 * Hours, Pay Period parsing, and Store Policies. No Save is triggered — the
 * shared dev backend must not be mutated by the suite.
 *
 * Test cases: docs/testcases/settings-business-testcases.md
 */
const PASSCODE = process.env.OWNER_PASSCODE || '8888';

/** goto → unlock (tick "remember 30m" + enter passcode) → wait for the form. */
async function openUnlocked(
  businessInfoPage: BusinessInfoPage,
  passcodeDialog: PasscodeDialog,
): Promise<void> {
  await businessInfoPage.goto();
  if (await passcodeDialog.isOpen()) {
    await passcodeDialog.tickRemember30m();
    await passcodeDialog.enterPasscode(PASSCODE);
  }
  await businessInfoPage.waitForReady();
}

test.describe(`Settings — Business Info ${Tag.REGRESSION}`, () => {
  test('TC-BIZ-01: passcode gate shows on entry', async ({ businessInfoPage, passcodeDialog }) => {
    await businessInfoPage.goto();
    await passcodeDialog.waitForVisible();
    await expect(passcodeDialog.dialog).toBeVisible();
  });

  test('TC-BIZ-02: correct passcode unlocks the form', async ({
    businessInfoPage,
    passcodeDialog,
  }) => {
    await businessInfoPage.goto();
    await passcodeDialog.waitForVisible();
    await passcodeDialog.tickRemember30m();
    await passcodeDialog.enterPasscode(PASSCODE);
    await businessInfoPage.waitForReady();
    await expect(businessInfoPage.heading).toBeVisible();
  });

  test('TC-BIZ-03: five sections render', async ({ businessInfoPage, passcodeDialog }) => {
    await openUnlocked(businessInfoPage, passcodeDialog);
    for (const s of ['Information', 'Work Hours', 'Pay Period', 'Store Brand', 'Store Policies']) {
      await expect(businessInfoPage.section(s).first(), `section "${s}"`).toBeVisible();
    }
  });

  test('TC-BIZ-04: profile fields present', async ({ businessInfoPage, passcodeDialog }) => {
    await openUnlocked(businessInfoPage, passcodeDialog);
    for (const f of ['Business Name', 'Legal Name', 'Phone', 'Website', 'Address', 'City']) {
      await expect(businessInfoPage.field(f).first(), `field "${f}"`).toBeVisible();
    }
  });

  test('TC-BIZ-05: Name/Legal/Phone are read-only', async ({
    businessInfoPage,
    passcodeDialog,
  }) => {
    await openUnlocked(businessInfoPage, passcodeDialog);
    for (const f of ['Business Name', 'Legal Name', 'Phone']) {
      expect(await businessInfoPage.isFieldEditable(f), `"${f}" should be read-only`).toBe(false);
    }
  });

  test('TC-BIZ-06: Website/Address/City are editable', async ({
    businessInfoPage,
    passcodeDialog,
  }) => {
    await openUnlocked(businessInfoPage, passcodeDialog);
    for (const f of ['Website', 'Address', 'City']) {
      expect(await businessInfoPage.isFieldEditable(f), `"${f}" should be editable`).toBe(true);
    }
  });

  test('TC-BIZ-07: Edit button is present', async ({ businessInfoPage, passcodeDialog }) => {
    await openUnlocked(businessInfoPage, passcodeDialog);
    await expect(businessInfoPage.editButton).toBeVisible();
  });

  test('TC-BIZ-08: Work Hours has all 7 weekday switches', async ({
    businessInfoPage,
    passcodeDialog,
  }) => {
    await openUnlocked(businessInfoPage, passcodeDialog);
    for (const d of [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]) {
      await expect(businessInfoPage.daySwitch(d), `switch "${d}"`).toBeVisible();
    }
  });

  test('TC-BIZ-10: Pay Period parses to a known type', async ({
    businessInfoPage,
    passcodeDialog,
  }) => {
    await openUnlocked(businessInfoPage, passcodeDialog);
    const pp = await businessInfoPage.readPayPeriod();
    expect(['Weekly', 'Biweekly', 'Monthly', 'Custom']).toContain(pp.type);
    if (pp.type === 'Custom') expect(pp.customDays.length).toBeGreaterThan(0);
  });

  test('TC-BIZ-11: Store Policies has three inputs', async ({
    businessInfoPage,
    passcodeDialog,
  }) => {
    await openUnlocked(businessInfoPage, passcodeDialog);
    for (const p of ['Liability Policies', 'Cancellation Policies', 'Other Policies']) {
      await expect(businessInfoPage.policy(p).first(), `policy "${p}"`).toBeVisible();
    }
  });

  test('TC-BIZ-12: Vietnamese scan is clean (no leftover English)', async () => {
    // Asserts the skill-5 compare output: 0 untranslated strings on this screen.
    const jsonPath = path.resolve('reports', 'settings-business', 'compare.json');
    test.skip(!existsSync(jsonPath), 'compare.json chưa có — chạy TC-i18n-screen-compare trước');
    const data = JSON.parse(readFileSync(jsonPath, 'utf8')) as { missing?: unknown[] };
    expect(data.missing ?? [], 'Business Info còn chuỗi tiếng Anh').toHaveLength(0);
  });
});
