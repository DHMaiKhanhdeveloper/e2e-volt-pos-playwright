import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { PRODUCTS } from '@data/static/products';
import { summarizeStaff } from '@domains/orders/orderDetail';
import { computeSectionsFromScrape, type StaffAgg } from '@domains/income/sectionsFromScrape';
import { renderIncomeSummaryHtml } from '@domains/income/incomeSummaryHtml';
import type { OrderDetail } from '@domains/orders/orderDetail';
import type { StaffCompensation } from '@pages/settings/EmployeeSettingsPage';

const pad = (n: number): string => String(n).padStart(2, '0');
const ymd = (dt: Date): string =>
  `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

const SERVICE_SUPPLY_QUERY = `query serviceSupply { serviceList { name supplyFee } }`;

/**
 * Income Summary — PAST day pipeline (VP-1048).
 *
 *   1. Order History → filter to the input date → collect every order of that
 *      day, then open each to read its staff + services.
 *   2. Save orders + staff + products to JSON.
 *   3. Use each staff name in Settings → Employees to read their compensation.
 *   4. Save all staff compensation to JSON.
 *   5. Compute Supply Fee / Staff Payout / Salon Earnings from the scraped
 *      per-staff revenue + service supply fees + compensation
 *      (commission = (service − supply) × serviceStaffRate%).
 *
 * INPUT  — a PAST date via `REPORT_DATE=YYYY-MM-DD` (defaults to yesterday).
 * OUTPUT — `reports/income-summary/past/income-summary-<date>.html` (+ latest),
 *          plus pipeline-orders / staff-compensation / income-summary-full JSON.
 *
 * Totals (Net Sale / Tip / Tax / Total Payment) come from the settled store
 * report for that date (authoritative); the section breakdown is derived from
 * the scraped per-staff service revenue × compensation.
 */
test.describe(`Income Summary — past day pipeline ${Tag.REGRESSION}`, () => {
  test('TC-PAST-PIPELINE: order history (date) → compensation → income summary', async ({
    graphql,
    orderHistoryPage,
    employeeSettingsPage,
    reportService,
  }) => {
    test.setTimeout(420_000);
    const dateObj = process.env.REPORT_DATE
      ? new Date(`${process.env.REPORT_DATE}T00:00:00`)
      : new Date(Date.now() - 86_400_000);
    const reportDate = ymd(dateObj);
    const outDir = path.resolve('reports', 'income-summary', 'past');
    mkdirSync(outDir, { recursive: true });
    const write = (name: string, obj: unknown): string => {
      const body = JSON.stringify(obj, null, 2);
      writeFileSync(path.join(outDir, name), body, 'utf8');
      return body;
    };

    // ───────────────────────── STEP 1 — Order History for the date ─────────────────────────
    await orderHistoryPage.goto();
    await orderHistoryPage.filterToDateIncluding(dateObj);
    const cards = await orderHistoryPage.collectOrdersForDate(dateObj);
    test.skip(cards.length === 0, `No orders on ${reportDate} — pick a day with data`);

    const details: OrderDetail[] = [];
    for (const c of cards) {
      try {
        details.push(await orderHistoryPage.readOrderDetailById(c.orderId, c.orderCode));
      } catch {
        // order detail failed to load (volatile) — skip it
      }
    }

    // ───────────────────────── STEP 2 — orders+staff+product JSON ─────────────────────────
    const productByName = new Map(Object.values(PRODUCTS).map((p) => [p.name.toLowerCase(), p]));
    const orders = details.map((d) => ({
      orderCode: d.orderCode,
      status: d.status,
      orderDate: d.orderDate,
      summary: d.summary,
      staff: d.staff,
      items: d.services.map((s) => ({
        staff: s.staff,
        name: s.service,
        priceCents: s.priceCents,
        product: productByName.get(s.service.toLowerCase()) ?? null,
      })),
      tips: d.tips,
    }));
    write(`pipeline-orders-${reportDate}.json`, {
      meta: {
        step: '1-2',
        source: 'Order History (date-filtered) detail pages',
        reportDate,
        scrapedAt: new Date().toISOString(),
        amountsIn: 'cents',
      },
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

    // ───────────────────────── STEP 5 — sections from the scrape ─────────────────────────
    const { serviceList } = await graphql.query<{
      serviceList: Array<{ name: string; supplyFee: number }>;
    }>(SERVICE_SUPPLY_QUERY, { operationName: 'serviceSupply' });
    const supplyByName = new Map(serviceList.map((s) => [s.name.toLowerCase(), s.supplyFee ?? 0]));

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
    for (const d of details) for (const tp of d.tips) bucket(tp.staff).tip += tp.tipCents;

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

    // Totals from the settled store report for that date (authoritative).
    const store = await reportService.getDailyIncome(dateObj);
    const totals = {
      netSaleCents: store?.dailySaleSale ?? 0,
      tipCents: store?.dailySaleTip ?? 0,
      taxCents: store?.incomeTaxAmount ?? 0,
      totalPaymentCents: store?.dailySaleTotalPayment ?? 0,
    };

    write(`income-summary-full-${reportDate}.json`, {
      meta: {
        step: '5',
        reportDate,
        generatedAt: new Date().toISOString(),
        amountsIn: 'cents',
        note: 'Past day. Totals from settled store report; sections from scraped per-staff revenue + catalog supply × compensation.',
      },
      incomeSummary: totals,
      supplyFee: sections.supplyFee,
      staffPayout: sections.staffPayout,
      salonEarnings: sections.salonEarnings,
      perStaff: sections.perStaff,
    });

    // ───────────────────────── OUTPUT — HTML ─────────────────────────
    const html = renderIncomeSummaryHtml({
      reportDate,
      generatedAt: new Date().toISOString(),
      orderCount: orders.length,
      staffCount: staffNames.length,
      foundCount: compensation.filter((c) => c.found).length,
      totals,
      app: {
        saleCents: totals.netSaleCents,
        tipCents: totals.tipCents,
        taxCents: totals.taxCents,
        totalPaymentCents: totals.totalPaymentCents,
      },
      sections,
    });
    const htmlPath = path.join(outDir, `income-summary-${reportDate}.html`);
    writeFileSync(htmlPath, html, 'utf8');
    writeFileSync(path.join(outDir, 'income-summary-latest.html'), html, 'utf8');
    await test.info().attach('income-summary-past.html', { body: html, contentType: 'text/html' });

    // eslint-disable-next-line no-console
    console.log(
      `PAST PIPELINE (${reportDate}) · ${orders.length} orders, ${staffNames.length} staff ` +
        `(${compensation.filter((c) => c.found).length} comp) · ` +
        `Total Payment ${totals.totalPaymentCents}c · SupplyFee ${sections.supplyFee.totalCents}c · ` +
        `StaffPayout commission ${sections.staffPayout.commissionCents}c · ` +
        `SalonEarnings commission ${sections.salonEarnings.serviceCommissionCents}c · HTML → ${htmlPath}`,
    );

    expect(orders.length, 'scraped at least one order detail').toBeGreaterThan(0);
    expect(sections.matchedStaff, 'at least one staff aggregated').toBeGreaterThan(0);
  });
});
