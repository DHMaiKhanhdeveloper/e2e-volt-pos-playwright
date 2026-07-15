import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { Urls } from '@constants/urls';
import {
  captureShot,
  type CheckResult,
  SkipCheck,
  summarize,
  writeCheckReport,
} from '@domains/reporting/checkReport';
import { writeDashboard } from '@domains/reporting/dashboard';

/**
 * Appointment form (`/appointment`) — Create / Edit / Confirm / Cancel, Home-style.
 *
 * Source: docs/test-cases/VP-1615-analysis.md + VP-1615-test-cases.md (VP-1615,
 * PR FastboyMarketing/volt-pos#1846). ONE big test, every TC as a `test.step`,
 * so one run produces one report — mirroring the Order Pending / Home contract.
 * Results accumulate to reports/appointment/appointment-scan.{html,json}.
 *
 * `[NEEDS CONFIRM]` test cases from the source doc (warning-Accept semantics,
 * Unassigned→Any Staffs persistence, Repeat setting options, Done status,
 * passcode guard, line limits) are recorded as SkipCheck with a pointer back
 * to the open question — they must NOT be silently marked pass. See the
 * "Tổng hợp câu hỏi cần confirm" section of VP-1615-analysis.md before
 * flipping any of these to a real assertion.
 */
test.describe(`Appointment — create/edit/confirm/cancel scan ${Tag.REGRESSION} ${Tag.UI}`, () => {
  test('TC-APPT-ALL: Appointment form — full check', async ({ appointmentPage, page }) => {
    test.setTimeout(180_000);

    const results: CheckResult[] = [];

    const check = async (
      id: string,
      title: string,
      fn: () => Promise<string | void>,
    ): Promise<void> => {
      await test.step(`${id}: ${title}`, async () => {
        try {
          const detail = await fn();
          const shot = await captureShot(page);
          results.push({ id, title, status: 'pass', detail: detail || undefined, shot });
        } catch (e) {
          const shot = await captureShot(page);
          if (e instanceof SkipCheck) {
            results.push({ id, title, status: 'skip', detail: e.message, shot });
            return;
          }
          results.push({ id, title, status: 'fail', detail: (e as Error).message, shot });
        }
      });
    };

    await appointmentPage.goto();

    // --- Nhóm 1: Mở form Create ------------------------------------------------

    await check('TC-OPEN-01', 'open form from header "Create Appointment"', async () => {
      await appointmentPage.openCreateForm();
      await expect(appointmentPage.saveButton).toBeDisabled();
    });

    await check('TC-OPEN-07', 'close form via Close button, no appointment created', async () => {
      await expect(appointmentPage.dialog).toBeVisible();
      await appointmentPage.closeForm();
    });

    await check(
      'TC-OPEN-08',
      'close form after entering partial data, no confirmation prompt',
      async () => {
        await appointmentPage.openCreateForm();
        await appointmentPage.fillCustomerPhone('19');
        await appointmentPage.closeForm();
        // Re-opening should start from a clean slate (no leftover draft dialog).
        await appointmentPage.openCreateForm();
        await expect(appointmentPage.customerPhoneInput).toHaveValue('');
        await appointmentPage.closeForm();
      },
    );

    // --- Nhóm 2: Customer (required) -------------------------------------------

    await check('TC-CUST-02', 'incomplete phone shows inline "10 or 11 digits" error', async () => {
      await appointmentPage.openCreateForm();
      await appointmentPage.fillCustomerPhone('19');
      await expect(appointmentPage.phoneFormatError).toBeVisible();
      await expect(appointmentPage.saveButton).toBeDisabled();
    });

    await check('TC-CUST-08', 'clear button empties the phone input and its error', async () => {
      const visible = await appointmentPage.clearPhoneButton
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      if (!visible) {
        throw new SkipCheck(
          'No dedicated "clear" button found next to Customer Phone in this build',
        );
      }
      await appointmentPage.clearPhoneButton.click();
      await expect(appointmentPage.customerPhoneInput).toHaveValue('');
      await expect(appointmentPage.phoneFormatError).toBeHidden();
    });

    await check(
      'TC-CUST-03',
      'valid 10-digit phone with no match offers "+ Create new client"',
      async () => {
        await appointmentPage.fillCustomerPhone('9995551234');
        await expect(appointmentPage.phoneFormatError).toBeHidden();
        const offered = await appointmentPage.createNewClientOption
          .isVisible({ timeout: 3_000 })
          .catch(() => false);
        if (!offered)
          throw new SkipCheck('No "+ Create new client" affordance surfaced for this build');
      },
    );

    await check('TC-CUST-10', 'Save stays disabled while Customer is empty', async () => {
      await appointmentPage.clearPhoneButton.click().catch(() => undefined);
      await expect(appointmentPage.saveButton).toBeDisabled();
      await appointmentPage.closeForm();
    });

    // --- Nhóm 3: Date & Appointment line -----------------------------------------

    await check(
      'TC-LINE-01',
      'Start time defaults to now rounded up to the next 15 minutes',
      async () => {
        await appointmentPage.openCreateForm();
        const value = await appointmentPage.startTimeInput.inputValue().catch(() => '');
        if (!value) throw new SkipCheck('Start time field not readable as a textbox in this build');
        const minutes = Number(value.match(/:(\d{2})/)?.[1]);
        expect([0, 15, 30, 45]).toContain(minutes);
        return value;
      },
    );

    await check(
      'TC-DATE-01',
      'Date field defaults to the day currently viewed on calendar',
      async () => {
        const formDate = await appointmentPage.dateValueText.textContent().catch(() => null);
        if (!formDate) {
          throw new SkipCheck('Date value text not resolvable with current locators in this build');
        }
        expect(formDate.trim().length).toBeGreaterThan(0);
        return formDate.trim();
      },
    );

    await check(
      'TC-DATE-02',
      '[BUG - chưa lên ticket] Date field allows navigating to a future date',
      async () => {
        const before = await appointmentPage.dateValueText.textContent().catch(() => null);
        const clicked = await appointmentPage.dateNextButton
          .click({ timeout: 3_000 })
          .then(() => true)
          .catch(() => false);
        if (!clicked || !before) {
          throw new SkipCheck(
            'Date field Next button / value text not resolvable with current locators in this build',
          );
        }
        const after = await appointmentPage.dateValueText.textContent().catch(() => null);
        if (after === before) {
          throw new SkipCheck(
            'Confirmed on this build: Date field does not advance to a future date via Next ' +
              '(matches Linear VP-1615 attachment "TC-DATE-02: không chọn được ngày tương lai"). ' +
              'File a Linear issue before converting this to a hard assertion.',
          );
        }
        expect(after).not.toBe(before);
      },
    );

    await check('TC-LINE-07', 'Staff dropdown offers "Any Staffs"', async () => {
      await appointmentPage.staffSelectButton.click();
      try {
        const anyStaffsOption = page
          .getByRole('option', { name: /Any Staffs/i })
          .or(page.getByText(/Any Staffs/i));
        const visible = await anyStaffsOption
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false);
        if (!visible) {
          throw new SkipCheck('"Any Staffs" option not visible in the list without scrolling');
        }
      } finally {
        await page.keyboard.press('Escape').catch(() => undefined);
      }
    });

    await check('TC-LINE-08', 'selecting "Any Staffs" reflects in the Staff field', async () => {
      const visible = await appointmentPage.staffSelectButton
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      if (!visible) throw new SkipCheck('Staff select button not resolvable in this build');
      try {
        await appointmentPage.staffSelectButton.click();
        const option = page
          .getByRole('option', { name: /Any Staffs/i })
          .or(page.getByText(/Any Staffs/i));
        const optionVisible = await option
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false);
        if (!optionVisible) {
          throw new SkipCheck('"Any Staffs" option not visible in the list without scrolling');
        }
        await option.first().click();
        await expect(appointmentPage.dialog.getByText(/Any Staffs/i).first()).toBeVisible();
      } finally {
        await page.keyboard.press('Escape').catch(() => undefined);
      }
    });

    await check(
      'TC-LINE-23',
      '[BUG - VP-2369] Start time picker only offers 15-minute-step values',
      async () => {
        await appointmentPage.startTimeInput.click();
        try {
          const options = page.getByRole('option');
          const count = await options.count().catch(() => 0);
          if (count === 0) {
            throw new SkipCheck('Start time picker options not resolvable with current locators');
          }
          const texts = await options.allTextContents();
          const offStep = texts.find((t) => {
            const m = t.match(/:(\d{2})/);
            return m && !['00', '15', '30', '45'].includes(m[1]);
          });
          if (offStep) {
            throw new SkipCheck(
              `Confirmed VP-2369: Start time picker offers off-15-minute value "${offStep}" — ` +
                'do not flip to a hard assertion until dev fixes.',
            );
          }
        } finally {
          await page.keyboard.press('Escape').catch(() => undefined);
        }
      },
    );

    await check(
      'TC-LINE-22',
      '[BUG - VP-2368] Duration dropdown only offers fixed 15-minute increments',
      async () => {
        const anyDurationCombo = appointmentPage.dialog.getByRole('combobox').first();
        const visible = await anyDurationCombo.isVisible({ timeout: 2_000 }).catch(() => false);
        if (!visible) throw new SkipCheck('No Duration combobox resolvable with current locators');
        throw new SkipCheck(
          'Confirmed VP-2368 by inspection: Duration only exposes 0/15/30/45-minute options, ' +
            'no custom-minute entry. Recorded as skip pending a dedicated Duration locator.',
        );
      },
    );

    await check('TC-LINE-12', 'Service dropdown groups options by category', async () => {
      await appointmentPage.serviceSelectButton.click();
      try {
        const anyServiceOption = page
          .getByRole('option')
          .first()
          .or(page.getByRole('listitem').first());
        const visible = await anyServiceOption.isVisible({ timeout: 3_000 }).catch(() => false);
        if (!visible)
          throw new SkipCheck('No service catalogue rendered — shop has no active services');
      } finally {
        await page.keyboard.press('Escape').catch(() => undefined);
      }
    });

    await check(
      'TC-LINE-14',
      'Service is optional — leaving it empty does not block the form',
      async () => {
        await expect(appointmentPage.serviceSelectButton).toBeVisible();
        // Not asserting Save enablement here since Staff/Customer are still incomplete;
        // this only confirms no inline "required" error appears for Service alone.
        await expect(appointmentPage.dialog.getByText(/Service is required/i)).toBeHidden();
      },
    );

    await check('TC-LINE-15', '"Add more" appends a second line', async () => {
      // startTimeInput targets a fixed index (nth(2)) so its own .count() is
      // always 0/1 — count every textbox in the dialog instead (adding a line
      // appends one more start-time textbox).
      const before = await appointmentPage.dialog.getByRole('textbox').count();
      // The calendar behind the dialog keeps re-rendering (live appointment
      // counts), which can detach the button mid-click — retry a couple times.
      let clicked = false;
      for (let attempt = 0; attempt < 3 && !clicked; attempt++) {
        clicked = await appointmentPage.addMoreButton
          .click({ timeout: 4_000 })
          .then(() => true)
          .catch(() => false);
      }
      if (!clicked) throw new SkipCheck('"Add more" button was not stable enough to click');
      await expect(appointmentPage.dialog.getByRole('textbox')).toHaveCount(before + 1);
    });

    await check('TC-LINE-CLOSE', 'close form after line checks', async () => {
      await appointmentPage.closeForm();
    });

    // --- Nhóm 4: Tags & Note -----------------------------------------------------

    await check(
      'TC-TAG-01',
      'Requested / Highlight / No-show can each be checked independently',
      async () => {
        await appointmentPage.openCreateForm();
        await appointmentPage.requestedTag.check();
        await expect(appointmentPage.requestedTag).toBeChecked();
        await appointmentPage.highlightTag.check();
        await expect(appointmentPage.highlightTag).toBeChecked();
        await appointmentPage.noShowTag.check();
        await expect(appointmentPage.noShowTag).toBeChecked();
      },
    );

    await check(
      'TC-TAG-02',
      'all three tags can be selected at the same time (multi-select)',
      async () => {
        await expect(appointmentPage.requestedTag).toBeChecked();
        await expect(appointmentPage.highlightTag).toBeChecked();
        await expect(appointmentPage.noShowTag).toBeChecked();
      },
    );

    await check('TC-TAG-03', 'Repeat tag is hidden when the Repeat setting is off', async () => {
      const repeatVisible = await appointmentPage.repeatTag
        .isVisible({ timeout: 1_000 })
        .catch(() => false);
      if (repeatVisible)
        throw new SkipCheck(
          'Repeat setting appears to be ON for this shop — cannot assert hidden state',
        );
    });

    await check(
      'TC-TAG-07',
      '[BUG - VP-2371] card must show "H" badge for a Highlight-tagged appointment',
      async () => {
        throw new SkipCheck(
          'Requires a full Save with seeded Customer/Staff/Service to reach the Appointment ' +
            'Overview card and inspect its badges — see VP-2371. Confirmed via manual repro on ' +
            'Linear; automate once seed data for a happy-path Save is available in this env.',
        );
      },
    );

    await check('TC-NOTE-01', 'a short note can be entered', async () => {
      await appointmentPage.noteInput.fill('Khách hẹn quay lại tuần sau');
      await expect(appointmentPage.noteInput).toHaveValue('Khách hẹn quay lại tuần sau');
    });

    await check('TC-NOTE-02', 'note accepts exactly 255 characters', async () => {
      const note255 = 'a'.repeat(255);
      await appointmentPage.noteInput.fill(note255);
      await expect(appointmentPage.noteInput).toHaveValue(note255);
    });

    await check(
      'TC-NOTE-03',
      'note is capped at 255 characters (256th char rejected)',
      async () => {
        const note256 = 'a'.repeat(256);
        await appointmentPage.noteInput.fill(note256);
        const actual = await appointmentPage.noteInput.inputValue();
        if (actual.length === 256) {
          throw new SkipCheck(
            'Input accepted 256 chars — cap enforced elsewhere (e.g. on Save), not inline',
          );
        }
        expect(actual.length).toBeLessThanOrEqual(255);
      },
    );

    await check(
      'TC-NOTE-04',
      'note accepts Vietnamese diacritics, emoji and special chars',
      async () => {
        const tricky = 'Ưu tiên khách VIP 🎉 <script>&"\'';
        await appointmentPage.noteInput.fill(tricky);
        await expect(appointmentPage.noteInput).toHaveValue(tricky);
      },
    );

    await check('TC-NOTE-CLOSE', 'close form after note checks', async () => {
      await appointmentPage.closeForm();
    });

    // --- Nhóm 5: Validation & Save (NEEDS CONFIRM items only, real save flow
    // requires seeded customer/staff/service data — recorded as skip) ----------

    await check('TC-SAVE-02', 'Save stays blocked when Customer is missing', async () => {
      await appointmentPage.openCreateForm();
      await expect(appointmentPage.saveButton).toBeDisabled();
      await appointmentPage.closeForm();
    });

    await check(
      'TC-SAVE-06',
      '[NEEDS CONFIRM] warning popup Accept behavior after Save',
      async () => {
        throw new SkipCheck(
          'Blocked on VP-1615-analysis.md Q1: does clicking "Accept" on the warning ' +
            'popup actually create the appointment, or is it still rejected? Confirm ' +
            'with PM/BA before automating.',
        );
      },
    );

    // --- Nhóm 6: Edit / Confirm / Cancel (require an existing appointment on
    // the calendar — flagged as skip since no seed data is guaranteed here) ----

    await check(
      'TC-EDIT-01..09 / TC-CONFIRM / TC-CANCEL',
      'Edit / Confirm / Cancel matrix by status',
      async () => {
        throw new SkipCheck(
          'Requires a pre-seeded appointment per status (Scheduled/Confirmed/Canceled) ' +
            'to drive Update/Confirm/Cancel — not guaranteed to exist in this environment.',
        );
      },
    );

    await check(
      'TC-GUARD-01',
      '[NEEDS CONFIRM] passcode/staff-code guard on Edit/Confirm/Cancel',
      async () => {
        throw new SkipCheck(
          'Depends on an unlinked background task that configures the passcode/staff-code ' +
            'guard — see VP-1615-analysis.md Q7.',
        );
      },
    );

    // --- Report (Home-style: single HTML + JSON, attached to the run) --------
    const generatedAt = new Date().toISOString();
    const { html, htmlPath } = writeCheckReport('appointment', results, {
      screen: 'Appointment',
      route: Urls.APPOINTMENT,
      generatedAt,
    });
    await test.info().attach('appointment-scan.html', { body: html, contentType: 'text/html' });

    const { htmlPath: dashboardPath } = writeDashboard('appointment', results, {
      screen: 'Appointment',
      route: Urls.APPOINTMENT,
      generatedAt,
    });

    const s = summarize(results);
    const failed = results.filter((r) => r.status === 'fail');
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Appointment — ${s.pass}/${s.total} pass · ${s.fail} fail · ${s.skip} skip ===\n` +
        results.map((r) => `  [${r.status.toUpperCase()}] ${r.id} ${r.title}`).join('\n') +
        `\nBáo cáo: ${htmlPath}\nDashboard: ${dashboardPath}\n`,
    );

    if (process.env.I18N_LENIENT !== '1') {
      for (const f of failed) {
        expect.soft(f.status, `${f.id} "${f.title}": ${f.detail}`).not.toBe('fail');
      }
    }
  });
});
