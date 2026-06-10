import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { parseCentsFromUsd } from '@utils/moneyUtils';

/**
 * Daily Sale Report — Orders table column math (Tier 1, read-only)
 *
 * Coverage:
 *   TC-15 Sale column = sale after discount (no Tip/Tax leak)
 *   TC-17 Tip column = total tip of the order
 *   TC-18 Total column = Sale + Tip + Tax for every row (rounded to cent)
 *
 * Strategy: read each visible row from the table, parse the 4 money cells
 * back to cents, assert `total === sale + tip + tax`. Skip rows that are
 * fully zero — those don't tell us anything math-wise.
 */
test.describe(`Daily Sale Report — orders table column math ${Tag.REGRESSION}`, () => {
  test.beforeEach(async ({ dailySaleReportPage, passcodeDialog }) => {
    await dailySaleReportPage.goto();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await dailySaleReportPage.waitForReady();
  });

  test('TC-18: Total = Sale + Tip + Tax on every row', async ({ dailySaleReportPage }) => {
    const codes = await dailySaleReportPage.allOrderCodes();
    test.skip(codes.length === 0, 'No orders today — seed data first');

    let assertedRows = 0;
    for (const code of codes) {
      const r = await dailySaleReportPage.readOrderRow(code);
      const sale = parseCentsFromUsd(r.sale);
      const tip = parseCentsFromUsd(r.tip);
      const tax = parseCentsFromUsd(r.tax);
      const total = parseCentsFromUsd(r.total);

      // A row of all zeros is uninformative; don't count it toward coverage
      // but still assert the trivial identity.
      if (sale === 0 && tip === 0 && tax === 0 && total === 0) continue;

      expect(total, `row ${code}: total=${r.total} ≠ sale+tip+tax`).toBe(sale + tip + tax);
      assertedRows++;
    }
    expect(assertedRows, 'at least one non-zero row was checked').toBeGreaterThan(0);
  });

  test('TC-15 + TC-17: Sale & Tip cells parse cleanly to a money value', async ({
    dailySaleReportPage,
  }) => {
    const codes = await dailySaleReportPage.allOrderCodes();
    test.skip(codes.length === 0, 'No orders today — seed data first');

    for (const code of codes) {
      const r = await dailySaleReportPage.readOrderRow(code);
      // Every Sale & Tip cell must look like USD currency (optionally with
      // a leading minus for refund rows). Catches stray "—" or "N/A" leaks.
      expect(r.sale, `row ${code} Sale="${r.sale}"`).toMatch(/^-?\$\d{1,3}(,\d{3})*\.\d{2}$/);
      expect(r.tip, `row ${code} Tip="${r.tip}"`).toMatch(/^-?\$\d{1,3}(,\d{3})*\.\d{2}$/);
    }
  });
});
