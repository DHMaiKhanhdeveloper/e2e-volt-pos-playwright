import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';

test.describe(`Visual — login ${Tag.VISUAL}`, () => {
  test('login page matches baseline', async ({ loginPage, page }) => {
    await loginPage.goto();
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
