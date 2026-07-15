import { type Locator, type Page, expect } from '@playwright/test';
import { PasscodeDialog } from '@components/modal/PasscodeDialog';

/** Enter the passcode if the authorise dialog appears; no-op otherwise. */
export async function enterPasscodeIfPrompted(page: Page, passcode?: string): Promise<void> {
  if (!passcode) return;
  const passcodeDialog = new PasscodeDialog(page);
  const prompted = await passcodeDialog.dialog
    .waitFor({ state: 'visible', timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (prompted) await passcodeDialog.enterPasscode(passcode);
}

/**
 * Cancel an unsettled order. Caller is responsible for being on the order
 * detail page already and clicking the Cancel button beforehand.
 */
export async function cancelOrder(
  page: Page,
  dialog: Locator,
  opts: { reason?: string; passcode?: string } = {},
): Promise<void> {
  await expect(dialog).toBeVisible();

  // A cancellation reason is mandatory — "Confirm Cancel" stays disabled
  // until one is chosen from the dropdown. Reasons are a fixed list (the
  // Select renders its options in a portal, outside the dialog), so use the
  // requested reason if it's a valid option, else the first available one.
  await dialog.getByRole('combobox').click();
  const requested = opts.reason
    ? page.getByRole('option', { name: opts.reason, exact: true })
    : null;
  const reason =
    requested && (await requested.count()) > 0 ? requested : page.getByRole('option').first();
  await reason.click();

  const confirm = dialog.getByRole('button', { name: /Confirm Cancel/i });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(dialog).toBeHidden();

  // Voiding payments is passcode-gated: a passcode dialog pops up after the
  // confirm. Enter it when present (it may be skipped if the merchant ticked
  // "don't require for 30 minutes" earlier in the run).
  await enterPasscodeIfPrompted(page, opts.passcode);
}

/**
 * Issue a full refund on a settled order. Partial-refund variant takes a
 * service list — extend when needed.
 */
export async function refundOrder(
  page: Page,
  dialog: Locator,
  opts: { reason?: string; passcode?: string } = {},
): Promise<void> {
  await expect(dialog).toBeVisible();

  // Mirror the cancel flow: if the confirm is gated behind a reason
  // dropdown, pick the requested reason (or the first valid one).
  const combobox = dialog.getByRole('combobox');
  if (await combobox.count()) {
    await combobox.click();
    const requested = opts.reason
      ? page.getByRole('option', { name: opts.reason, exact: true })
      : null;
    const reason =
      requested && (await requested.count()) > 0 ? requested : page.getByRole('option').first();
    await reason.click();
  }

  const confirm = dialog.getByRole('button', { name: /Confirm Refund|Confirm|Refund/i });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(dialog).toBeHidden();

  // Refunds void payments and are passcode-gated, same as cancel.
  await enterPasscodeIfPrompted(page, opts.passcode);
}
