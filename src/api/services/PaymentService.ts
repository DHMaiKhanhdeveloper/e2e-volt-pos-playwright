import { PaymentApiClient } from '@api/clients/PaymentApiClient';
import { CreatePaymentRequest, PaymentResponse, RefundResponse } from '@api/models/Payment';
import { retry } from '@utils/retry';

export class PaymentService {
  constructor(private readonly client: PaymentApiClient) {}

  async createAndWaitCaptured(payload: CreatePaymentRequest): Promise<PaymentResponse> {
    const created = await this.client.createPayment(payload);
    return retry(
      async () => {
        const current = await this.client.getPayment(created.id);
        if (current.status !== 'CAPTURED' && current.status !== 'SETTLED') {
          throw new Error(`Payment ${created.id} is still ${current.status}`);
        }
        return current;
      },
      { retries: 10, delayMs: 1000 },
    );
  }

  async refundFully(paymentId: string, reason = 'E2E_AUTO_REFUND'): Promise<RefundResponse> {
    return this.client.refund(paymentId, { reason });
  }
}
