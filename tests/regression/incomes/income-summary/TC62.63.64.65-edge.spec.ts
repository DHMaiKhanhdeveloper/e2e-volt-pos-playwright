import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';

/**
 * Income Summary — edge cases (VP-1048 TC-62…65).
 */

const MONEY = /^-?\$\d{1,3}(,\d{3})*\.\d{2}$/;

test.describe(`Income Summary — edge cases (real data) ${Tag.REGRESSION}`, () => {
  test('TC-63: periods without transactions render $0.00 (never blank/error)', async ({
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    await incomeSummaryPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await incomeSummaryPage.waitForReady();
    // Month grouping spans the whole year, so it includes pre-trading months
    // that must show $0.00 across every money column rather than empty cells.
    await incomeSummaryPage.selectGroupBy('Month');

    const rows = await incomeSummaryPage.rowCount();
    expect(rows).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < rows; i++) {
      const r = await incomeSummaryPage.readRow(i);
      for (const cell of [r.sale, r.tip, r.tax, r.totalPayment]) {
        expect(cell, `row ${i} money cell "${cell}"`).toMatch(MONEY);
      }
    }
  });

  // GC-only day (no service/product) needs a crafted dataset; the live env can't
  // guarantee one. Gross/Net=0 while Total Sale still counts GC is covered by the
  // gift-card exclusion checks in income-summary-total-income.spec.ts (TC-12/14).
  test.fixme('TC-62: a Gift-Card-only day shows Gross/Net = 0 but Total Sale includes GC', () => {});

  // Belongs to the Custom Pay Period editor (VP-1444), not the report surface.
  test.fixme('TC-64: Custom Pay Period — Save is blocked until dates are chosen', () => {});

  // Needs a fractional-cent dataset to force a rounding boundary deterministically.
  test.fixme('TC-65: currency rounding is consistent to 2 dp (totals vs line items)', () => {});
});
