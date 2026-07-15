import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { shopPasscode, shopPeriodDays } from '@data/static/shops';
import { PRODUCTS } from '@data/static/products';
import { parseCentsFromUsd } from '@utils/moneyUtils';
import { computeIncomeFromOrders } from '@domains/income/incomeFromOrders';
import { summarizeStaff } from '@domains/orders/orderDetail';
import type { SectionsFromScrape } from '@domains/income/sectionsFromScrape';
import { computeIncomeSummary, type StaffInput } from '@reports/incomeCalcCore';
import { computePeriodDays } from '@domains/income/payPeriod';
import { renderIncomeSummaryHtml } from '@domains/income/incomeSummaryHtml';
import { renderIncomeSummaryUi } from '@domains/income/incomeSummaryUi';
import {
  renderDailySaleReportPage,
  renderStaffIncomePage,
  renderDataInputPage,
} from '@domains/reporting/reportPages';
import { renderComparePage, type CompareGroup } from '@domains/reporting/comparePage';
import type { StaffCompensation } from '@pages/settings/EmployeeSettingsPage';

const pad = (n: number): string => String(n).padStart(2, '0');
const ymd = (dt: Date): string =>
  `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

const SERVICE_SUPPLY_QUERY = `query serviceSupply { serviceList { name supplyFee } }`;
const MERCHANT_QUERY = `query merchant { merchantSettingList { id businessName } }`;

/**
 * Income Summary — full pipeline (VP-1048).
 *
 *   1. Scrape every order on the Daily Sale Report, incl. its staff.
 *   2. Save orders + staff + products to JSON; compute the TOTALS (Net Sale /
 *      Tip / Tax / Total Payment) from the order rows.
 *   3. Use each staff name in Settings → Employees to read their compensation.
 *   4. Save all staff compensation to JSON.
 *   5. Look up each product/service supply fee BY NAME and save to JSON.
 *   6. Compute Supply Fee / Staff Payout / Salon Earnings from the scraped
 *      per-staff revenue + product supply fees + compensation:
 *          net service     = Σ item price − Σ item supply fee
 *          staff commission = net service × serviceStaffRate%
 *          salon commission = net service − staff commission
 *   7. Render Daily Sale Report + Income Summary + Staff Income + Products as one
 *      app-style HTML.
 *
 * INPUT  — a date via `REPORT_DATE=YYYY-MM-DD` (defaults to today).
 * OUTPUT — `dsr-income-summary-app-<date>.html` (+ latest) and JSON:
 *          pipeline-orders / staff-compensation / product-supply / income-summary-full.
 */
test.describe(`Income Summary — full pipeline (today) ${Tag.REGRESSION}`, () => {
  test('TC-RECON-PIPELINE: orders+staff+product → compensation → income summary', async ({
    page,
    graphql,
    dailySaleReportPage,
    timeTrackingPage,
    employeeSettingsPage,
    businessInfoPage,
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    test.setTimeout(600_000);
    // INPUT: the report date — set REPORT_DATE=YYYY-MM-DD (defaults to today).
    const reportDateObj = process.env.REPORT_DATE
      ? new Date(`${process.env.REPORT_DATE}T00:00:00`)
      : new Date();
    const reportDate = ymd(reportDateObj);

    // Identify the active shop (merchant) so each shop's reports go to its own
    // folder and don't overwrite another shop's — data (staff/orders/products)
    // differs per merchant.
    let merchant: { id: number; businessName: string } = { id: 0, businessName: 'unknown' };
    try {
      const data = await graphql.query<{
        merchantSettingList: Array<{ id: number; businessName: string }>;
      }>(MERCHANT_QUERY, { operationName: 'merchant' });
      merchant = data.merchantSettingList[0] ?? merchant;
    } catch {
      // merchant query unavailable (backend flake) — fall back to SHOP env / 'shop'.
    }
    // SHOP env wins (set it when you switch shops — most reliable); else the
    // auto-detected merchant id; else a generic bucket. The merchant query is
    // flaky on this backend, so don't depend on it for folder naming.
    const shopId = process.env.SHOP ?? (merchant.id ? String(merchant.id) : 'shop');
    const shopName = merchant.id ? merchant.businessName : `Shop ${shopId}`;
    const passcode = shopPasscode(shopId);

    // Each run gets its own per-date folder (…/<shopId>/<reportDate>/); the
    // `-latest` pointers stay at the shop root so "most recent" is still easy.
    const shopDir = path.resolve('reports', 'income-summary', shopId);
    const outDir = path.join(shopDir, reportDate);
    mkdirSync(outDir, { recursive: true });
    const write = (name: string, obj: unknown): string => {
      const body = JSON.stringify(obj, null, 2);
      writeFileSync(path.join(outDir, name), body, 'utf8');
      return body;
    };

    // ───────────────────────── STEP 1 — scrape orders + staff ─────────────────────────
    await dailySaleReportPage.gotoDate(reportDateObj);
    try {
      await passcodeDialog.enterPasscode(passcode);
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
    test.skip(orderRows.length === 0, 'No orders on the selected day — seed data first');
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

    const orderStaffNames = summarizeStaff(details).map((s) => s.staff);

    // ───────────────────────── STEP 3 — Time Tracking check-ins → JSON ─────────────────────────
    await timeTrackingPage.gotoDate(reportDateObj);
    await passcodeDialog.enterPasscode(passcode).catch(() => {});
    await timeTrackingPage.waitForReady();
    const checkIns = await timeTrackingPage.readCheckIns();
    const checkedInNames = new Set(checkIns.filter((c) => c.checkedIn).map((c) => c.staff));
    const ttByName = new Map(checkIns.map((c) => [c.staff, c]));
    write(`time-tracking-${reportDate}.json`, {
      meta: {
        step: '3',
        source: 'Time Tracking — staff check-in/out for the day',
        reportDate,
        scrapedAt: new Date().toISOString(),
      },
      rowCount: checkIns.length,
      checkedInCount: checkedInNames.size,
      checkIns,
    });

    // ───────────────────────── STEP 4+5 — compensation for order ∪ checked-in staff → JSON ─────────────────────────
    // The staff universe is everyone who sold a service OR clocked in — a salaried
    // staff with no sales still earns salary (Income v2 spec).
    const staffNames = [...new Set([...orderStaffNames, ...checkedInNames])];
    await employeeSettingsPage.goto();
    const compensation: StaffCompensation[] = [];
    for (const name of staffNames) {
      compensation.push(await employeeSettingsPage.readCompensationFor(name));
    }
    write(`staff-compensation-${reportDate}.json`, {
      meta: {
        step: '4-5',
        source: 'Settings → Employees → Compensation (order ∪ time-tracking staff)',
        reportDate,
        scrapedAt: new Date().toISOString(),
      },
      staffCount: compensation.length,
      foundCount: compensation.filter((c) => c.found).length,
      compensation,
    });
    writeFileSync(
      path.join(shopDir, 'staff-compensation-latest.json'),
      JSON.stringify({ compensation }, null, 2),
      'utf8',
    );

    // ───────────────────────── STEP 5 — product supply fees by name → JSON ─────────────────────────
    // Look up each product/service in the catalog by name to get its supply fee.
    const { serviceList } = await graphql.query<{
      serviceList: Array<{ name: string; supplyFee: number }>;
    }>(SERVICE_SUPPLY_QUERY, { operationName: 'serviceSupply' });
    const supplyByName = new Map(serviceList.map((s) => [s.name.toLowerCase(), s.supplyFee ?? 0]));

    const productAgg = new Map<string, { qty: number; revenue: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const p = productAgg.get(it.name) ?? { qty: 0, revenue: 0 };
        p.qty += 1;
        p.revenue += it.priceCents;
        productAgg.set(it.name, p);
      }
    }
    const products = [...productAgg.entries()].map(([name, p]) => {
      const found = supplyByName.has(name.toLowerCase());
      const unitSupplyFeeCents = supplyByName.get(name.toLowerCase()) ?? 0;
      return {
        name,
        qty: p.qty,
        revenueCents: p.revenue,
        unitSupplyFeeCents,
        totalSupplyCents: unitSupplyFeeCents * p.qty,
        found,
      };
    });
    write(`product-supply-${reportDate}.json`, {
      meta: {
        step: '5',
        source: 'serviceList catalog (supply fee looked up by product name)',
        reportDate,
        scrapedAt: new Date().toISOString(),
        amountsIn: 'cents',
      },
      productCount: products.length,
      foundCount: products.filter((p) => p.found).length,
      products,
    });

    // ───────────────────────── STEP 6 — sections from the scrape + product supply ─────────────────────────
    // Aggregate revenue + supply + tip per staff from the scraped orders.
    //
    // Sign each order by its status so the per-staff figures match the app /
    // golden: a SALE adds, a REFUND subtracts (its detail line items are scraped
    // as positive magnitudes — the minus sign lives on the order row), a CANCEL
    // is excluded entirely. Only SERVICE line items feed staff commission —
    // retail products and Gift Certificates / Gift Cards are salon Product / Gift
    // Card Sale, never a staff's service revenue.
    const orderSign = (status: string | null): number => {
      if (status && /cancel/i.test(status)) return 0;
      if (status && /refund/i.test(status)) return -1;
      return 1;
    };
    // A SERVICE is anything that isn't a Gift Certificate / Gift Card. We can't
    // use the PRODUCTS catalog to detect retail products here — its names overlap
    // real services (e.g. "Gel Manicure"), so `it.product` wrongly flags services.
    const isServiceItem = (it: { name: string }): boolean =>
      !/gift\s*(certificate|card)/i.test(it.name);

    const agg = new Map<string, { revenue: number; supply: number; tip: number; items: number }>();
    const bucket = (name: string) => {
      let b = agg.get(name);
      if (!b) {
        b = { revenue: 0, supply: 0, tip: 0, items: 0 };
        agg.set(name, b);
      }
      return b;
    };
    // Store-level net SERVICE sale / refund (services only), for Salon Earnings.
    let serviceSaleCents = 0;
    let serviceRefundCents = 0;
    for (const o of orders) {
      const sign = orderSign(o.status);
      if (sign === 0) continue; // cancelled order — excluded from every figure
      for (const it of o.items) {
        if (!isServiceItem(it)) continue; // product / gift card — not staff service revenue
        const b = bucket(it.staff);
        const supply = supplyByName.get(it.name.toLowerCase()) ?? 0;
        b.revenue += sign * it.priceCents;
        b.supply += sign * supply;
        b.items += 1;
        if (sign > 0) serviceSaleCents += it.priceCents;
        else serviceRefundCents += it.priceCents;
      }
    }
    for (const d of details) {
      const sign = orderSign(d.status);
      if (sign === 0) continue;
      for (const tp of d.tips) bucket(tp.staff).tip += sign * tp.tipCents;
    }

    // Include checked-in staff who made no sales (salaried staff still earn salary).
    for (const name of checkedInNames) bucket(name);
    const compByName = new Map(compensation.filter((c) => c.found).map((c) => [c.staff, c]));

    // ───────────────────────── STEP 7 — Business Info → Pay Period → period days ─────────────────────────
    await businessInfoPage.goto();
    await passcodeDialog.enterPasscode(passcode).catch(() => {});
    await businessInfoPage.waitForReady();
    const payPeriod = await businessInfoPage.readPayPeriod();
    // A shop seeded with a golden dataset may prorate Salary by Period over a
    // FIXED number of days that differs from the live Business Info setting —
    // `shopPeriodDays` (PERIOD_DAYS env → per-shop map) wins when present.
    const periodDaysOverride = shopPeriodDays(shopId);
    const periodDays = periodDaysOverride ?? computePeriodDays(payPeriod, reportDateObj);
    write(`pay-period-${reportDate}.json`, {
      meta: {
        step: '7',
        source: 'Settings → Business Info → Pay Period',
        reportDate,
        scrapedAt: new Date().toISOString(),
      },
      payPeriod,
      periodDays,
      periodDaysOverride: periodDaysOverride ?? null,
      note:
        "Today's payroll period isn't locked (finalized=false); salary_by_period = salaryAmount ÷ periodDays." +
        (periodDaysOverride != null
          ? ` periodDays is a per-shop override (${periodDaysOverride}d) — the live Business Info setting is ignored for this shop.`
          : ''),
    });

    // ───────────────────────── STEP 8 — Supply / Staff Payout / Salon via the shared core ─────────────────────────
    const supplyTotalCents = [...agg.values()].reduce((acc, b) => acc + b.supply, 0);
    const staffInputs: StaffInput[] = [...agg.entries()].map(([staff, b]) => {
      const comp = compByName.get(staff);
      return {
        staffId: comp?.staffId ?? staff,
        name: staff,
        serviceNet: b.revenue,
        supplyNet: b.supply,
        tip: b.tip,
        // Service-net on card-paid orders isn't scraped from the UI, so the card
        // fee is out of scope here (matches the previous pipeline behaviour).
        cardBase: 0,
        checkedIn: checkedInNames.has(staff),
        workedMinutes: ttByName.get(staff)?.workedMinutes ?? 0,
        comp: {
          compType: comp?.compensationType ?? 'commission',
          percentService: comp?.serviceStaffPct ?? 0,
          pay1Split: comp?.pay1Pay2Split ?? 0,
          cardFeeCommissionPct: comp?.cardFeeOnCommissionPct ?? 0,
          deductionPerDay: comp?.deductionPerDayCents ?? 0,
          salaryAmount: comp?.salaryAmountCents ?? 0,
          salarySetting: comp?.salarySetting ?? '',
          enablePayrollTip: comp?.enablePayrollTip ?? false,
        },
        // finalizedSalary omitted — today's payroll period isn't locked.
      };
    });
    const core = computeIncomeSummary(
      {
        // Net SERVICE sale / refund (services only) — Salon Earnings "Total
        // Service" is service revenue, not the all-tender Net Sale.
        serviceSale: serviceSaleCents,
        serviceRefund: serviceRefundCents,
        productSale: 0,
        productRefund: 0,
        giftCardSale: 0,
        totalDiscount: 0,
        supplyTotal: supplyTotalCents,
      },
      staffInputs,
      { periodDays, finalized: false },
    );

    // Adapt the core result to the SectionsFromScrape shape the HTML renderer expects.
    const sections: SectionsFromScrape = {
      matchedStaff: core.staff.length,
      supplyFee: { totalCents: core.supplyTotal },
      staffPayout: {
        totalServiceCents: core.staff.reduce((acc, s) => acc + s.serviceNet, 0),
        supplyFeeCents: core.staffSupplyShare,
        commissionCents: core.commission,
        tipCents: core.payoutTip,
        totalCents: core.payoutTotal,
      },
      salonEarnings: { serviceCommissionCents: core.salonCommission },
      perStaff: core.staff.map((s) => ({
        staff: s.name,
        serviceRatePct: s.compType === 'salary' ? null : s.percentService,
        compensationType: s.compType,
        serviceRevenueCents: s.serviceNet,
        supplyFeeCents: s.supplyNet,
        netServiceCents: s.serviceNet - s.supplyNet,
        commissionCents: s.commission,
        salonCommissionCents: s.salonCommission,
        tipCents: s.tip,
      })),
    };

    // ───────────────────────── OUTPUT (1 & 3) — write the files that don't need the IS panel ─────────────────────────
    const generatedAt = new Date().toISOString();
    const writeHtml = (name: string, body: string): void => {
      writeFileSync(path.join(outDir, `${name}-${reportDate}.html`), body, 'utf8');
      writeFileSync(path.join(shopDir, `${name}-latest.html`), body, 'utf8');
    };
    const dsrHtml = renderDailySaleReportPage({
      reportDate,
      generatedAt,
      shop: shopName,
      orders: orderRows,
      stat: {
        totalOrderCount: incomeTotals.saleOrderCount,
        saleCents: incomeTotals.netSaleCents,
        tipCents: incomeTotals.tipCents,
        totalPaymentCents: incomeTotals.totalPaymentCents,
      },
      incomeDetails: income,
      paymentDetails: payment,
    });
    writeHtml('daily-sale-report', dsrHtml);
    await test.info().attach('daily-sale-report.html', { body: dsrHtml, contentType: 'text/html' });
    const staffHtml = renderStaffIncomePage({ reportDate, generatedAt, shop: shopName, sections });
    writeHtml('staff-income', staffHtml);
    await test.info().attach('staff-income.html', { body: staffHtml, contentType: 'text/html' });

    // Data Input — all raw scraped data (orders + staff compensation + products).
    const dataHtml = renderDataInputPage({
      reportDate,
      generatedAt,
      shop: shopName,
      orders: orders.map((o) => {
        const items = o.items.map((it) => ({
          ...it,
          supplyFeeCents: supplyByName.get(it.name.toLowerCase()) ?? 0,
        }));
        const supplyFeeCents = items.reduce((acc, it) => acc + it.supplyFeeCents, 0);
        const subtotalCents = o.detail?.summary.subtotalCents ?? 0;
        const discountCents = o.detail?.summary.totalDiscountCents ?? 0;
        return {
          orderCode: o.orderCode,
          status: o.status,
          items,
          summary: {
            supplyFeeCents,
            subtotalCents,
            discountCents,
            netSaleCents: subtotalCents - discountCents,
            saleCents: o.saleCents,
            taxCents: o.taxCents,
            tipCents: o.tipCents,
            totalCents: o.totalCents,
          },
        };
      }),
      compensation,
      products,
    });
    writeHtml('data-input', dataHtml);
    await test.info().attach('data-input.html', { body: dataHtml, contentType: 'text/html' });

    // ───────────────────────── COMPARE — computed vs app, per feature ─────────────────────────
    // Daily Sale Report group compares against the DSR Income Details panel
    // (always available). Income Summary + Staff Income compare against the
    // app's Income Summary detail panel (scraped below).
    const compareGroups: CompareGroup[] = [
      {
        feature: 'Daily Sale Report',
        rows: [
          {
            metric: 'Net Sale',
            computedCents: incomeTotals.netSaleCents,
            appCents: income.saleCents,
          },
          { metric: 'Tip', computedCents: incomeTotals.tipCents, appCents: income.tipCents },
          { metric: 'Tax', computedCents: incomeTotals.taxCents, appCents: income.taxCents },
          {
            metric: 'Total Payment',
            computedCents: incomeTotals.totalPaymentCents,
            appCents: income.totalPaymentCents,
          },
        ],
      },
    ];
    // The app's Income Summary detail panel (also feeds the faithful IS HTML).
    let appSecs: Array<{
      title: string;
      rows: Array<{ label: string; value: string; bold: boolean }>;
    }> = [];
    let isTotalIncome = '';
    try {
      await incomeSummaryPage.gotoRange(reportDateObj, reportDateObj, 'Day');
      // Unlock if the passcode dialog appears (enterPasscode waits for it); if
      // the route is already authorised it simply times out — ignore that.
      await passcodeDialog.enterPasscode(passcode).catch(() => {});
      await incomeSummaryPage.waitForReady();
      if ((await incomeSummaryPage.rowCount()) > 0) {
        isTotalIncome = ((await incomeSummaryPage.totalIncomeValue().textContent()) ?? '').trim();
        await incomeSummaryPage.openPeriodDetail(0);
        await expect(page.getByText('Salon Earnings', { exact: true }).first()).toBeVisible({
          timeout: 15_000,
        });
        appSecs = await incomeSummaryPage.readDetailSections();
        const find = (title: string, label: string): number | null => {
          const row = appSecs.find((s) => s.title === title)?.rows.find((r) => r.label === label);
          return row ? parseCentsFromUsd(row.value) : null;
        };
        compareGroups.push(
          {
            feature: 'Income Summary',
            rows: [
              {
                metric: 'Net Sale',
                computedCents: incomeTotals.netSaleCents,
                appCents: find('Sale Details', 'Net Total'),
              },
              {
                metric: 'Tip',
                computedCents: incomeTotals.tipCents,
                appCents: find('Sale Details', 'Tip'),
              },
              {
                metric: 'Tax',
                computedCents: incomeTotals.taxCents,
                appCents: find('Sale Details', 'Tax Collected'),
              },
              {
                metric: 'Total Payment',
                computedCents: incomeTotals.totalPaymentCents,
                appCents: find('Sale Details', 'Total Payment'),
              },
              {
                metric: 'Supply Fee Total',
                computedCents: sections.supplyFee.totalCents,
                appCents: find('Supply Fee', 'Total supply fee'),
              },
              {
                metric: 'Salon Commission',
                computedCents: sections.salonEarnings.serviceCommissionCents,
                appCents: find('Salon Earnings', 'Salon Commission'),
              },
            ],
          },
          {
            feature: 'Staff Income',
            rows: [
              {
                metric: 'Total Service',
                computedCents: sections.staffPayout.totalServiceCents,
                appCents: find('Staff Payout', 'Total Service'),
              },
              {
                metric: 'Commission',
                computedCents: sections.staffPayout.commissionCents,
                appCents: find('Staff Payout', 'Staff Commission'),
              },
              {
                metric: 'Tip',
                computedCents: sections.staffPayout.tipCents,
                appCents: find('Staff Payout', 'Tip'),
              },
              {
                metric: 'Staff Salary',
                computedCents: core.salary,
                appCents: find('Staff Payout', 'Staff Salary'),
              },
              {
                metric: 'Total Staff Payout',
                computedCents: sections.staffPayout.totalCents,
                appCents: find('Staff Payout', 'Total Staff Payout'),
              },
            ],
          },
        );
      }
    } catch {
      // IS panel unavailable — keep just the Daily Sale Report comparison group.
    }

    const totalsReconciliation = {
      netSale_matches: incomeTotals.netSaleCents === income.saleCents,
      tip_matches: incomeTotals.tipCents === income.tipCents,
      tax_matches: incomeTotals.taxCents === income.taxCents,
      totalPayment_matches: incomeTotals.totalPaymentCents === income.totalPaymentCents,
    };

    const fullBody = write(`income-summary-full-${reportDate}.json`, {
      meta: {
        step: '8-9',
        reportDate,
        generatedAt: new Date().toISOString(),
        amountsIn: 'cents',
        note: 'Totals from order rows; Staff Payout / Salon / Supply split + salary computed by the shared income core from scraped revenue + supply + compensation + Time Tracking check-in + Business Info pay period.',
      },
      incomeSummary: {
        netSaleCents: incomeTotals.netSaleCents,
        tipCents: incomeTotals.tipCents,
        taxCents: incomeTotals.taxCents,
        totalPaymentCents: incomeTotals.totalPaymentCents,
      },
      appIncomeDetails: income,
      totalsReconciliation,
      payPeriod,
      periodDays,
      supplyFee: {
        totalCents: core.supplyTotal,
        staffSupplyShareCents: core.staffSupplyShare,
        salonSupplyShareCents: core.salonSupplyShare,
      },
      staffPayout: {
        ...sections.staffPayout,
        salaryCents: core.salary,
        cleanUpCents: core.cleanUp,
        cardChargeCents: core.cardCharge,
        pay1Cents: core.pay1,
        pay2Cents: core.pay2,
      },
      salonEarnings: {
        serviceCommissionCents: core.salonCommission,
        netEarningsCents: core.netEarnings,
        totalEarningCents: core.totalEarning,
      },
      perStaff: core.staff,
    });
    writeFileSync(path.join(shopDir, 'income-summary-full-latest.json'), fullBody, 'utf8');

    // OUTPUT (2) — Income Summary HTML: faithful to the app panel when scraped,
    // else a computed fallback.
    const isTip =
      appSecs.find((s) => s.title === 'Sale Details')?.rows.find((r) => r.label === 'Tip')?.value ??
      '$0.00';
    const isHtml = appSecs.length
      ? renderIncomeSummaryUi({
          reportDate,
          generatedAt,
          shop: shopName,
          totalIncomeText: isTotalIncome,
          legend: { grossIncome: isTotalIncome, netIncome: isTotalIncome, totalTip: isTip },
          sections: appSecs,
        })
      : renderIncomeSummaryHtml({
          reportDate,
          generatedAt,
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
    writeHtml('income-summary', isHtml);
    await test.info().attach('income-summary.html', { body: isHtml, contentType: 'text/html' });

    // OUTPUT (4) — Compare report: computed vs app, per feature (DSR / Income
    // Summary / Staff Income), as HTML + JSON.
    const compareHtml = renderComparePage({
      reportDate,
      generatedAt,
      shop: shopName,
      groups: compareGroups,
    });
    writeHtml('compare', compareHtml);
    await test.info().attach('compare.html', { body: compareHtml, contentType: 'text/html' });
    const cmpAll = compareGroups.flatMap((g) => g.rows).filter((r) => r.appCents !== null);
    write(`compare-${reportDate}.json`, {
      meta: { reportDate, generatedAt, amountsIn: 'cents' },
      matched: cmpAll.filter((r) => r.computedCents === r.appCents).length,
      comparable: cmpAll.length,
      groups: compareGroups,
    });

    // eslint-disable-next-line no-console
    console.log(
      `PIPELINE done (${reportDate}) · ${orders.length} orders, ${staffNames.length} staff ` +
        `(${compensation.filter((c) => c.found).length} comp found, ${checkedInNames.size} checked in) · ` +
        `payPeriod ${payPeriod.type} (${periodDays}d) · ` +
        `Total Payment ${incomeTotals.totalPaymentCents}c · ` +
        `SupplyFee ${core.supplyTotal}c (staff ${core.staffSupplyShare}c / salon ${core.salonSupplyShare}c) · ` +
        `StaffPayout commission ${core.commission}c, salary ${core.salary}c, total ${core.payoutTotal}c · ` +
        `SalonEarnings commission ${core.salonCommission}c · ` +
        `HTML → ${outDir}\\{data-input,daily-sale-report,income-summary,staff-income,compare}-${reportDate}.html`,
    );

    // Income Summary totals must equal the app's Income Details panel.
    expect(incomeTotals.netSaleCents, 'Net Sale == app').toBe(income.saleCents);
    expect(incomeTotals.tipCents, 'Tip == app').toBe(income.tipCents);
    expect(incomeTotals.taxCents, 'Tax == app').toBe(income.taxCents);
    expect(incomeTotals.totalPaymentCents, 'Total Payment == app').toBe(income.totalPaymentCents);
    expect(sections.matchedStaff, 'at least one staff aggregated').toBeGreaterThan(0);
  });
});
