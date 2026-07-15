import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { OWNER_PASSCODE } from '@data/static/staff';
import { renderIncomeSummaryUi, type IsSection } from '@domains/income/incomeSummaryUi';

const pad = (n: number): string => String(n).padStart(2, '0');
const ymd = (dt: Date): string =>
  `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

/**
 * Income Summary — app-faithful HTML (VP-1048).
 *
 * Opens the Income Summary page for the input date, selects the period to load
 * the detail panel, expands all "Show more" sections, then scrapes the panel
 * (Payment Details / Sale Details / Supply Fee / Staff Payout / Salon Earnings)
 * — keeping each row's bold flag — and renders it to an HTML that mirrors the
 * app screen.
 *
 * INPUT  — a date via `REPORT_DATE=YYYY-MM-DD` (defaults to today).
 * OUTPUT — `reports/income-summary/ui/income-summary-ui-<date>.html` (+ latest).
 */
test.describe(`Income Summary — app-faithful HTML ${Tag.REGRESSION}`, () => {
  test('TC-IS-UI: render the Income Summary screen to HTML', async ({
    page,
    incomeSummaryPage,
    passcodeDialog,
  }) => {
    test.setTimeout(120_000);
    const dateObj = process.env.REPORT_DATE
      ? new Date(`${process.env.REPORT_DATE}T00:00:00`)
      : new Date();
    const reportDate = ymd(dateObj);

    await incomeSummaryPage.gotoRange(dateObj, dateObj, 'Day');
    try {
      await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    } catch (err) {
      const verifyFailed = await page
        .getByText(/Failed to verify staff code/i)
        .isVisible()
        .catch(() => false);
      test.skip(verifyFailed, 'App could not verify the passcode (staffList empty/reset)');
      throw err;
    }
    await incomeSummaryPage.waitForReady();

    test.skip((await incomeSummaryPage.rowCount()) === 0, `No income data on ${reportDate}`);
    const totalIncomeText = (
      (await incomeSummaryPage.totalIncomeValue().textContent()) ?? ''
    ).trim();
    const comparePercent = (
      (await incomeSummaryPage
        .comparisonPercent()
        .textContent()
        .catch(() => null)) ?? undefined
    )?.trim();
    const compareLabel = (
      (await incomeSummaryPage
        .comparisonLabel()
        .textContent()
        .catch(() => null)) ?? undefined
    )?.trim();

    await incomeSummaryPage.openPeriodDetail(0);
    await expect(page.getByText('Payment Details', { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Salon Earnings', { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });

    // Expand any collapsed ("Show more") sections, then scrape the detail panel.
    const scraped = await page.evaluate(() => {
      const SECTIONS = [
        'Payment Details',
        'Sale Details',
        'Supply Fee',
        'Staff Payout',
        'Salon Earnings',
      ];
      // Click all "Show more" toggles to expand sections.
      Array.from(document.querySelectorAll('button, [role="button"], span, div')).forEach((el) => {
        if ((el.textContent || '').trim() === 'Show more') (el as HTMLElement).click();
      });

      // The detail panel = the container holding all five sections.
      const panel =
        Array.from(document.querySelectorAll('div')).find(
          (d) =>
            /Payment Details/.test(d.textContent || '') &&
            /Salon Earnings/.test(d.textContent || '') &&
            d.querySelectorAll('*').length < 600,
        ) ?? document.body;

      const out: Array<{
        type: 'section' | 'row';
        title?: string;
        label?: string;
        value?: string;
        bold?: boolean;
      }> = [];
      const seen = new Set<Element>();
      for (const el of Array.from(panel.querySelectorAll('*'))) {
        const txt = (el.textContent || '').trim();
        if (el.childElementCount === 0 && SECTIONS.includes(txt)) {
          out.push({ type: 'section', title: txt });
          continue;
        }
        if (/justify-between/.test((el as HTMLElement).className || '')) {
          const kids = el.children;
          if (kids.length < 2) continue;
          const last = kids[kids.length - 1];
          const value = (last.textContent || '').trim();
          if (!/^-?\$/.test(value)) continue;
          // innermost row only (skip wrappers that contain another row)
          if (el.querySelector('[class*="justify-between"]')) continue;
          if (seen.has(el)) continue;
          seen.add(el);
          const label = (kids[0].textContent || '').replace(/\s+/g, ' ').trim();
          if (!label || /\$/.test(label)) continue;
          const bold = parseInt(getComputedStyle(kids[0] as HTMLElement).fontWeight, 10) >= 600;
          out.push({ type: 'row', label, value, bold });
        }
      }
      return out;
    });

    // Group the flat ordered list into sections.
    const sections: IsSection[] = [];
    for (const item of scraped) {
      if (item.type === 'section') sections.push({ title: item.title as string, rows: [] });
      else if (sections.length) {
        sections[sections.length - 1].rows.push({
          label: item.label as string,
          value: item.value as string,
          bold: !!item.bold,
        });
      }
    }
    test.skip(sections.length === 0, 'Detail panel had no sections to scrape');

    const tip =
      sections.find((s) => s.title === 'Sale Details')?.rows.find((r) => r.label === 'Tip')
        ?.value ?? '$0.00';

    const html = renderIncomeSummaryUi({
      reportDate,
      generatedAt: new Date().toISOString(),
      totalIncomeText,
      legend: { grossIncome: totalIncomeText, netIncome: totalIncomeText, totalTip: tip },
      comparePercent,
      compareLabel,
      sections,
    });

    const outDir = path.resolve('reports', 'income-summary', 'ui');
    mkdirSync(outDir, { recursive: true });
    const htmlPath = path.join(outDir, `income-summary-ui-${reportDate}.html`);
    writeFileSync(htmlPath, html, 'utf8');
    writeFileSync(path.join(outDir, 'income-summary-ui-latest.html'), html, 'utf8');
    await test.info().attach('income-summary-ui.html', { body: html, contentType: 'text/html' });
    // eslint-disable-next-line no-console
    console.log(
      `IS-UI (${reportDate}) · Total Income ${totalIncomeText} · ${sections.length} sections · HTML → ${htmlPath}`,
    );

    expect(sections.length, 'rendered the detail sections').toBeGreaterThanOrEqual(3);
  });
});
