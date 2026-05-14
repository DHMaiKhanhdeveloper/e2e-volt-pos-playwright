import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { buildPaymentPayload } from '@helpers/paymentHelper';

test.describe(`Payments — refund flow ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
  test('admin can refund a captured payment', async ({ paymentService, authService, asAdminContext }) => {
    // Seed a captured payment via API to keep the test independent of order-creation UI flow.
    const payment = await paymentService.createAndWaitCaptured(
      buildPaymentPayload({ amount: 100_000, method: 'CARD' }),
    );

    const page = await asAdminContext.newPage();
    await page.goto(`/payments/${payment.id}`);

    await page.getByTestId('payment-refund-btn').click();
    await page.getByTestId('refund-reason').fill('Customer changed mind');
    await page.getByTestId('refund-confirm').click();

    await expect(page.getByTestId('payment-status')).toContainText(/refunded/i);
  });
});
