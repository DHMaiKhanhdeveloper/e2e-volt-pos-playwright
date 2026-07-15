import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import {
  type CheckResult,
  type CheckStatus,
  captureShot,
  SkipCheck,
  summarize,
  writeCheckReport,
} from '@domains/reporting/checkReport';

/**
 * Business Info — one big test (kiểu Home): gộp toàn bộ verification của màn
 * `/settings/business` thành MỘT `test()`; mỗi case là một `test.step` chạy nối
 * tiếp trên cùng phiên (unlock passcode một lần), gom kết quả → report tự-chứa
 * `reports/settings-business/settings-business-scan.{html,json}`.
 *
 * Read-only: không bấm Save (backend dev dùng chung). Case gộp từ
 * docs/testcases/settings-business-testcases.md.
 */
const PASSCODE = process.env.OWNER_PASSCODE || '8888';

test.describe(`Settings — Business Info suite ${Tag.REGRESSION} ${Tag.UI}`, () => {
  test('TC-BIZ-ALL: Business Info — full check', async ({
    businessInfoPage,
    passcodeDialog,
    page,
  }) => {
    test.setTimeout(180_000);
    const results: CheckResult[] = [];

    const check = async (
      id: string,
      title: string,
      fn: () => Promise<string | void>,
    ): Promise<void> => {
      await test.step(`${id}: ${title}`, async () => {
        let status: CheckStatus = 'pass';
        let detail: string | undefined;
        try {
          detail = (await fn()) || undefined;
        } catch (e) {
          if (e instanceof SkipCheck) {
            status = 'skip';
            detail = e.message;
          } else {
            status = 'fail';
            detail = (e as Error).message;
          }
        }
        const shot = await captureShot(page);
        results.push({ id, title, status, detail, shot });
      });
    };

    // Navigate + unlock ONCE — mọi check chạy nối tiếp trên cùng phiên.
    await businessInfoPage.goto();
    await passcodeDialog.waitForVisible(8_000).catch(() => {});
    if (await passcodeDialog.isOpen()) {
      await passcodeDialog.tickRemember30m();
      await passcodeDialog.enterPasscode(PASSCODE);
    }
    await businessInfoPage.waitForReady();

    await check('TC-BIZ-03', 'Năm section hiển thị', async () => {
      for (const s of [
        'Information',
        'Work Hours',
        'Pay Period',
        'Store Brand',
        'Store Policies',
      ]) {
        await expect(businessInfoPage.section(s).first()).toBeVisible();
      }
      return '5/5 section';
    });

    await check('TC-BIZ-04', 'Field hồ sơ hiển thị', async () => {
      for (const f of ['Business Name', 'Legal Name', 'Phone', 'Website', 'Address', 'City']) {
        await expect(businessInfoPage.field(f).first()).toBeVisible();
      }
      return '6 field';
    });

    await check('TC-BIZ-05', 'Name/Legal/Phone read-only', async () => {
      for (const f of ['Business Name', 'Legal Name', 'Phone']) {
        expect(await businessInfoPage.isFieldEditable(f), `"${f}" phải khoá`).toBe(false);
      }
      return 'khoá đúng 3 field';
    });

    await check('TC-BIZ-06', 'Website/Address/City editable', async () => {
      for (const f of ['Website', 'Address', 'City']) {
        expect(await businessInfoPage.isFieldEditable(f), `"${f}" phải sửa được`).toBe(true);
      }
      return 'sửa được 3 field';
    });

    await check('TC-BIZ-07', 'Nút Edit tồn tại', async () => {
      await expect(businessInfoPage.editButton).toBeVisible();
    });

    await check('TC-BIZ-08', 'Work Hours 7 ngày', async () => {
      for (const d of [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]) {
        await expect(businessInfoPage.daySwitch(d)).toBeVisible();
      }
      return '7 switch';
    });

    await check('TC-BIZ-10', 'Pay Period đọc được', async () => {
      const pp = await businessInfoPage.readPayPeriod();
      expect(['Weekly', 'Biweekly', 'Monthly', 'Custom']).toContain(pp.type);
      return `type=${pp.type}${pp.type === 'Custom' ? ` days=${pp.customDays.join(',')}` : ''}`;
    });

    await check('TC-BIZ-11', 'Store Policies 3 ô', async () => {
      for (const p of ['Liability Policies', 'Cancellation Policies', 'Other Policies']) {
        await expect(businessInfoPage.policy(p).first()).toBeVisible();
      }
      return '3 policy input';
    });

    // Report kiểu Home
    const generatedAt = new Date().toISOString();
    const { html, htmlPath } = writeCheckReport('settings-business', results, {
      screen: 'Thông tin doanh nghiệp',
      route: '/settings/business',
      generatedAt,
    });
    await test
      .info()
      .attach('settings-business-scan.html', { body: html, contentType: 'text/html' });

    const s = summarize(results);
    const failed = results.filter((r) => r.status === 'fail');
    // eslint-disable-next-line no-console
    console.log(
      `\n=== Business Info — ${s.pass}/${s.total} pass · ${s.fail} fail · ${s.skip} skip ===\n` +
        results.map((r) => `  [${r.status.toUpperCase()}] ${r.id} ${r.title}`).join('\n') +
        `\nBáo cáo: ${htmlPath}\n`,
    );

    if (process.env.I18N_LENIENT !== '1') {
      for (const f of failed) {
        expect.soft(f.status, `${f.id} "${f.title}": ${f.detail}`).not.toBe('fail');
      }
    }
  });
});
