import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { PRODUCTS } from '@data/static/products';
import { computeIncomeFromOrders } from '@utils/incomeFromOrders';
import { summarizeStaff } from '@utils/orderDetail';
import { computeSectionsFromScrape, type StaffAgg } from '@utils/sectionsFromScrape';
import { renderIncomeSummaryHtml } from '@utils/incomeSummaryHtml';
import type { StaffCompensation } from '@pages/settings/EmployeeSettingsPage';

const pad = (n: number): string => String(n).padStart(2, '0');
const ymd = (dt: Date): string =>
  `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

const SERVICE_SUPPLY_QUERY = `query serviceSupply { serviceList { name supplyFee } }`;

/**
 * Income Summary — full 5-step pipeline for TODAY (VP-1048).
 *
 *   1. Scrape every order on the Daily Sale Report, incl. its staff (order
 *      detail dialogs).
 *   2. Save orders + staff + products to JSON; compute the Income Summary TOTALS
 *      (Net Sale / Tip / Tax / Total Payment) from the order rows.
 *   3. Use each staff name in Settings → Employees to read their compensation.
 *   4. Save all staff compensation to JSON.
 *   5. Compute the Supply Fee / Staff Payout / Salon Earnings sections for TODAY
 *      from the scraped per-staff revenue + service supply fees + compensation:
 *          net service     = Σ item price − Σ item supply fee
 *          staff commission = net service × serviceStaffRate%
 *          salon commission = net service − staff commission
 *      (Today isn't settled and the live per-staff query is unavailable, so the
 *      per-staff numbers come from the scrape, not the API. Past days are handled
 *      separately.)
 *
 * INPUT  — TODAY (the report the app opens on).
 * OUTPUT — `reports/income-summary/income-summary-<date>.html` (+ latest) and
 *          JSON: pipeline-orders / staff-compensation / income-summary-full.
 */
test.describe(`Income Summary — full pipeline (today) ${Tag.REGRESSION}`, () => {
  test('TC-RECON-PIPELINE: orders+staff+product → compensation → income summary', async ({
    page,
    graphql,
    dailySaleReportPage,
    employeeSettingsPage,
    passcodeDialog,
  }) => {
    test.setTimeout(420_000);
    const reportDate = ymd(new Date());
    const outDir = path.resolve('reports', 'income-summary');
    mkdirSync(outDir, { recursive: true });
    const write = (name: string, obj: unknown): string => {
      const body = JSON.stringify(obj, null, 2);
      writeFileSync(path.join(outDir, name), body, 'utf8');
      return body;
    };

    // ───────────────────────── STEP 1 — scrape orders + staff ─────────────────────────
    await dailySaleReportPage.goto();
    try {
      await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    } catch (err) {
      const verifyFailed = await page
        .getByText(/Failed to verify staff code/i)
        .isVisible()
        .catch(() => false);
      test.skip(
        verifyFailed,
        'App could not verify the passcode (staffList empty/reset) — seed staff',
      );
      throw err;
    }
    await dailySaleReportPage.waitForReady();

    const orderRows = await dailySaleReportPage.readAllOrderRows();
    test.skip(orderRows.length === 0, 'No orders today — seed data first');
    const income = await dailySaleReportPage.readIncomeDetailsPanel();
    const payment = await dailySaleReportPage.readPaymentDetailsPanel();
    const details = await dailySaleReportPage.readAllOrderDetails();

    // ───────────────────────── STEP 2 — orders+staff+product JSON + totals ─────────────────────────
    const productByName = new Map(Object.values(PRODUCTS).map((p) => [p.name.toLowerCase(), p]));
    const detailByCode = new Map(details.map((d) => [d.orderCode, d]));
    const orders = orderRows.map((o) => {
      const detail = detailByCode.get(o.orderCode) ?? null;
      const items = (detail?.services ?? []).map((s) => ({
        staff: s.staff,
        name: s.service,
        priceCents: s.priceCents,
        product: productByName.get(s.service.toLowerCase()) ?? null,
      }));
      return { ...o, status: detail?.status ?? null, staff: detail?.staff ?? [], items, detail };
    });
    const incomeTotals = computeIncomeFromOrders(orderRows);

    write(`pipeline-orders-${reportDate}.json`, {
      meta: {
        step: '1-2',
        source: 'Daily Sale Report orders + detail dialogs',
        reportDate,
        scrapedAt: new Date().toISOString(),
        amountsIn: 'cents',
      },
      incomeTotals,
      appIncomeDetails: income,
      appPaymentDetails: payment,
      orderCount: orders.length,
      orders,
    });

    const staffNames = summarizeStaff(details).map((s) => s.staff);

    // ───────────────────────── STEP 3+4 — compensation per staff → JSON ─────────────────────────
    await employeeSettingsPage.goto();
    const compensation: StaffCompensation[] = [];
    for (const name of staffNames) {
      compensation.push(await employeeSettingsPage.readCompensationFor(name));
    }
    write(`staff-compensation-${reportDate}.json`, {
      meta: {
        step: '3-4',
        source: 'Settings → Employees → Compensation',
        reportDate,
        scrapedAt: new Date().toISOString(),
      },
      staffCount: compensation.length,
      foundCount: compensation.filter((c) => c.found).length,
      compensation,
    });
    writeFileSync(
      path.join(outDir, 'staff-compensation-latest.json'),
      JSON.stringify({ compensation }, null, 2),
      'utf8',
    );

    // ───────────────────────── STEP 5 — sections for TODAY (from the scrape) ─────────────────────────
    // Per-service supply fees from the catalog (the scraped order lines don't
    // carry supply fee), keyed by service name.
    const { serviceList } = await graphql.query<{
      serviceList: Array<{ name: string; supplyFee: number }>;
    }>(SERVICE_SUPPLY_QUERY, { operationName: 'serviceSupply' });
    const supplyByName = new Map(serviceList.map((s) => [s.name.toLowerCase(), s.supplyFee ?? 0]));

    // Aggregate revenue + supply + tip per staff from the scraped orders.
    const agg = new Map<string, { revenue: number; supply: number; tip: number; items: number }>();
    const bucket = (name: string) => {
      let b = agg.get(name);
      if (!b) {
        b = { revenue: 0, supply: 0, tip: 0, items: 0 };
        agg.set(name, b);
      }
      return b;
    };
    for (const o of orders) {
      for (const it of o.items) {
        const b = bucket(it.staff);
        b.revenue += it.priceCents;
        b.supply += supplyByName.get(it.name.toLowerCase()) ?? 0;
        b.items += 1;
      }
    }
    for (const d of details) {
      for (const tp of d.tips) bucket(tp.staff).tip += tp.tipCents;
    }

    const compByName = new Map(compensation.filter((c) => c.found).map((c) => [c.staff, c]));
    const staffAggs: StaffAgg[] = [...agg.entries()].map(([staff, b]) => {
      const comp = compByName.get(staff);
      return {
        staff,
        serviceRatePct: comp?.serviceStaffPct ?? null,
        compensationType: comp?.compensationType ?? 'unknown',
        serviceRevenueCents: b.revenue,
        supplyFeeCents: b.supply,
        tipCents: b.tip,
        itemCount: b.items,
      };
    });
    const sections = computeSectionsFromScrape(staffAggs);

    const totalsReconciliation = {
      netSale_matches: incomeTotals.netSaleCents === income.saleCents,
      tip_matches: incomeTotals.tipCents === income.tipCents,
      tax_matches: incomeTotals.taxCents === income.taxCents,
      totalPayment_matches: incomeTotals.totalPaymentCents === income.totalPaymentCents,
    };

    const fullBody = write(`income-summary-full-${reportDate}.json`, {
      meta: {
        step: '5',
        reportDate,
        generatedAt: new Date().toISOString(),
        amountsIn: 'cents',
        note: 'Today: totals from order rows; sections from scraped per-staff revenue + catalog supply fee × compensation.',
      },
      incomeSummary: {
        netSaleCents: incomeTotals.netSaleCents,
        tipCents: incomeTotals.tipCents,
        taxCents: incomeTotals.taxCents,
        totalPaymentCents: incomeTotals.totalPaymentCents,
      },
      appIncomeDetails: income,
      totalsReconciliation,
      supplyFee: sections.supplyFee,
      staffPayout: sections.staffPayout,
      salonEarnings: sections.salonEarnings,
      perStaff: sections.perStaff,
    });
    writeFileSync(path.join(outDir, 'income-summary-full-latest.json'), fullBody, 'utf8');

    // OUTPUT — render the result as a standalone HTML file.
    const html = renderIncomeSummaryHtml({
      reportDate,
      generatedAt: new Date().toISOString(),
      orderCount: orders.length,
      staffCount: staffNames.length,
      foundCount: compensation.filter((c) => c.found).length,
      totals: {
        netSaleCents: incomeTotals.netSaleCents,
        tipCents: incomeTotals.tipCents,
        taxCents: incomeTotals.taxCents,
        totalPaymentCents: incomeTotals.totalPaymentCents,
      },
      app: income,
      sections,
    });
    const htmlPath = path.join(outDir, `income-summary-${reportDate}.html`);
    writeFileSync(htmlPath, html, 'utf8');
    writeFileSync(path.join(outDir, 'income-summary-latest.html'), html, 'utf8');
    await test.info().attach('income-summary.html', { body: html, contentType: 'text/html' });

    // eslint-disable-next-line no-console
    console.log(
      `PIPELINE done (${reportDate}) · ${orders.length} orders, ${staffNames.length} staff ` +
        `(${compensation.filter((c) => c.found).length} comp found) · ` +
        `Total Payment ${incomeTotals.totalPaymentCents}c · ` +
        `SupplyFee ${sections.supplyFee.totalCents}c · ` +
        `StaffPayout commission ${sections.staffPayout.commissionCents}c · ` +
        `SalonEarnings commission ${sections.salonEarnings.serviceCommissionCents}c · ` +
        `HTML → ${htmlPath}`,
    );

    // Income Summary totals must equal the app's Income Details panel.
    expect(incomeTotals.netSaleCents, 'Net Sale == app').toBe(income.saleCents);
    expect(incomeTotals.tipCents, 'Tip == app').toBe(income.tipCents);
    expect(incomeTotals.taxCents, 'Tax == app').toBe(income.taxCents);
    expect(incomeTotals.totalPaymentCents, 'Total Payment == app').toBe(income.totalPaymentCents);
    expect(sections.matchedStaff, 'at least one staff aggregated').toBeGreaterThan(0);
  });
});
