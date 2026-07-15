import { formatUsdFromCents } from '@utils/moneyUtils';
import { OWNER_PASSCODE } from '@data/static/staff';
import { splitSections } from '@domains/income/incomeSummaryDetail';
import type { IncomeSummaryPage } from '@pages/pos/IncomeSummaryPage';
import type { PasscodeDialog } from '@components/modal/PasscodeDialog';
import type { IncomeSummaryService } from '@api/services/IncomeSummaryService';
import type { IncomeSummaryDetailRow } from '@api/models/IncomeSummary';

export interface RecentDetail {
  date: Date;
  row: IncomeSummaryDetailRow;
  /** Section heading → that section's text slice. */
  sections: Record<string, string>;
}

/**
 * Open the Income Summary detail panel for the most recent SETTLED past day
 * that has data and return the API row + parsed section slices. Past days are
 * immutable, so the API row matches the UI exactly (today's live totals drift
 * while orders are still in flight). Returns `null` when no such day exists.
 *
 * Not a `*.spec.ts` file, so Playwright doesn't collect it as a test.
 */
export const openRecentDetail = async (
  incomeSummaryService: IncomeSummaryService,
  incomeSummaryPage: IncomeSummaryPage,
  passcodeDialog: PasscodeDialog,
): Promise<RecentDetail | null> => {
  const found = await incomeSummaryService.findRecentDetailDay();
  if (!found) return null;
  const { date, row } = found;
  await incomeSummaryPage.gotoRange(date, date, 'Day');
  await passcodeDialog.enterPasscode(OWNER_PASSCODE);
  await incomeSummaryPage.waitForReady();
  await incomeSummaryPage.openPeriodDetail(0);
  await incomeSummaryPage.waitForDetailLoaded(formatUsdFromCents(row.incomeSummaryTotalPayment));
  const sections = splitSections(await incomeSummaryPage.detailBodyText());
  return { date, row, sections };
};
