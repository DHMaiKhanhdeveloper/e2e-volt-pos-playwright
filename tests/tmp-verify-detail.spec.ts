import { test, expect } from '@playwright/test';
import { StaffPayrollPage } from '@pages/pos/StaffPayrollPage';
import { PasscodeDialog } from '@components/modal/PasscodeDialog';
import { env } from '@configs/env/loadEnv';

test('verify detail panel reader', async ({ page }) => {
  const staffPayroll = new StaffPayrollPage(page);
  const passcodeDialog = new PasscodeDialog(page);
  await staffPayroll.goto();
  await passcodeDialog.enterPasscode(env.OWNER_PASSCODE);
  await staffPayroll.waitForReady();

  const allRows = await staffPayroll.readAllRows();
  const zeroIdx = allRows.findIndex((r) => r.staff.includes('Wendy'));
  await staffPayroll.openStaffDetail(zeroIdx);
  const zeroDetail = await staffPayroll.readDetailPanel();
  // eslint-disable-next-line no-console
  console.log('ZERO-ACTIVITY DETAIL', JSON.stringify(zeroDetail, null, 2));

  const dupIdx = allRows.findIndex((r) => r.staff.includes('Mr. Kevin'));
  await staffPayroll.openStaffDetail(dupIdx);
  const dupDetail = await staffPayroll.readDetailPanel();
  // eslint-disable-next-line no-console
  console.log('MR KEVIN VU (1st) DETAIL', JSON.stringify(dupDetail, null, 2));
});
