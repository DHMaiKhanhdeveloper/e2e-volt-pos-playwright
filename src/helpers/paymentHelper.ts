import { faker } from '@faker-js/faker';
import { CreatePaymentRequest, PaymentMethod } from '@api/models/Payment';

/**
 * Generates a realistic but fully synthetic payment payload.
 * Defaults can be overridden — use the spread pattern for partial overrides.
 */
export const buildPaymentPayload = (
  overrides: Partial<CreatePaymentRequest> = {},
): CreatePaymentRequest => ({
  amount: faker.number.int({ min: 10_000, max: 5_000_000 }),
  currency: 'VND',
  method: faker.helpers.arrayElement<PaymentMethod>(['CARD', 'QR', 'CASH', 'WALLET']),
  orderId: `ORD-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`,
  customerId: faker.string.uuid(),
  description: faker.commerce.productDescription(),
  metadata: { source: 'e2e-test', runId: process.env.PLAYWRIGHT_RUN_ID ?? 'local' },
  ...overrides,
});
