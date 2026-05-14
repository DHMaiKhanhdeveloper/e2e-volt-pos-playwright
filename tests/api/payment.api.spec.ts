import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { buildPaymentPayload } from '@helpers/paymentHelper';
import { assertSchema } from '@utils/schemaValidator';
import { PaymentResponse } from '@api/models/Payment';
import paymentSchema from '@schemas/payment.schema.json';

test.describe(`API — payments ${Tag.API} ${Tag.REGRESSION}`, () => {
  test('POST /payments creates a payment matching the schema', async ({
    authService,
    paymentClient,
  }) => {
    const session = await authService.loginAs(
      process.env.ADMIN_USER ?? '',
      process.env.ADMIN_PASS ?? '',
    );
    paymentClient.setToken(session.accessToken);

    const created = await paymentClient.createPayment(buildPaymentPayload({ amount: 99000 }));
    assertSchema<PaymentResponse>(paymentSchema, created, 'POST /payments');

    expect(created.id).toBeTruthy();
    expect(['PENDING', 'AUTHORIZED', 'CAPTURED']).toContain(created.status);
  });
});
