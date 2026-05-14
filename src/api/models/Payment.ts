export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'SETTLED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export type PaymentMethod = 'CARD' | 'QR' | 'CASH' | 'WALLET' | 'BANK_TRANSFER';

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  method: PaymentMethod;
  orderId: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  orderId: string;
  createdAt: string;
  updatedAt: string;
  reference?: string;
}

export interface RefundRequest {
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}
