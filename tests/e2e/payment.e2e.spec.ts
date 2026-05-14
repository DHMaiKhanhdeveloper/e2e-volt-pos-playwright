import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { buildPaymentPayload } from '@helpers/paymentHelper';

test.describe(`Payments — happy path ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
  test('cashier can create a card payment and see the receipt', async ({
    asCashierContext,
  }) => {
    const page = await asCashierContext.newPage();
    await page.goto('/payments/new');

    const payload = buildPaymentPayload({ method: 'CARD', amount: 250000 });

    await page.getByTestId('payment-amount').fill(String(payload.amount));
    await page.getByTestId('payment-method').selectOption(payload.method);
    await page.getByTestId('payment-description').fill(payload.description ?? '');
    await page.getByTestId('payment-submit').click();

    await expect(page.getByTestId('payment-receipt-modal')).toBeVisible();
    await expect(page.getByTestId('receipt-amount')).toContainText(/250/);
  });
});
