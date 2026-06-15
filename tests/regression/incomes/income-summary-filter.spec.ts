import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import type { IncomeSummaryPage } from '@pages/pos/IncomeSummaryPage';
import type { PasscodeDialog } from '@components/modal/PasscodeDialog';

/**
 * Income Summary — Filter: Week / Month grouping & year (VP-1048 TC-2, 5, 7).
 * (Default Day/Today and the Day-range / reshape cases live in the overview spec.)
 */

const open = async (
  incomeSummaryPage: IncomeSummaryPage,
  passcodeDialog: PasscodeDialog,
): Promise<void> => {
  await incomeSummaryPage.goto();
  await passcodeDialog.enterPasscode(OWNER_PASSCODE);
  await incomeSummaryPage.waitForReady();
};

test.describe(`Income Summary — Filter (real data) ${Tag.REGRESSION}`, () => {
  test('TC-2: switching to Week surfaces a year selector (not the "Today" preset)', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await open(incomeSummaryPage, passcodeDialog);
    await incomeSummaryPage.selectGroupBy('Week');
    // In Week/Month mode the preset dropdown becomes a 4-digit year.
    expect(await incomeSummaryPage.periodDropdownText()).toMatch(/\b20\d{2}\b/);
  });

  test('TC-5: Week grouping lists at most 53 week rows (≥ 1)', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await open(incomeSummaryPage, passcodeDialog);
    await incomeSummaryPage.selectGroupBy('Week');
    const rows = await incomeSummaryPage.rowCount();
    expect(rows).toBeGreaterThanOrEqual(1);
    expect(rows, 'a year has at most 53 ISO weeks').toBeLessThanOrEqual(53);
  });

  test('TC-7: Month grouping lists at most 12 month rows (≥ 1)', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await open(incomeSummaryPage, passcodeDialog);
    await incomeSummaryPage.selectGroupBy('Month');
    const rows = await incomeSummaryPage.rowCount();
    expect(rows).toBeGreaterThanOrEqual(1);
    expect(rows, 'a year has at most 12 months').toBeLessThanOrEqual(12);
  });
});
