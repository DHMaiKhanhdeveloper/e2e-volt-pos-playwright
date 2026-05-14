import { BaseApiClient } from './BaseApiClient';
import {
  CreatePaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
} from '@api/models/Payment';

export class PaymentApiClient extends BaseApiClient {
  async createPayment(payload: CreatePaymentRequest): Promise<PaymentResponse> {
    const res = await this.post('/payments', { data: payload });
    if (!res.ok()) {
      throw new Error(`Create payment failed: ${res.status()} ${await res.text()}`);
    }
    return (await res.json()) as PaymentResponse;
  }

  async getPayment(paymentId: string): Promise<PaymentResponse> {
    const res = await this.get(`/payments/${paymentId}`);
    if (!res.ok()) {
      throw new Error(`Get payment failed: ${res.status()}`);
    }
    return (await res.json()) as PaymentResponse;
  }

  async listPayments(params: { page?: number; size?: number; status?: string } = {}) {
    const res = await this.get('/payments', { params });
    if (!res.ok()) {
      throw new Error(`List payments failed: ${res.status()}`);
    }
    return res.json();
  }

  async refund(paymentId: string, payload: RefundRequest): Promise<RefundResponse> {
    const res = await this.post(`/payments/${paymentId}/refund`, { data: payload });
    if (!res.ok()) {
      throw new Error(`Refund failed: ${res.status()} ${await res.text()}`);
    }
    return (await res.json()) as RefundResponse;
  }
}
