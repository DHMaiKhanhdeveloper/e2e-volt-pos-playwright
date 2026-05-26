export interface OtherPaymentLabel {
  label: string;
  methodName: string;
}

/**
 * Real-world "Other" tender labels a US salon would use, plus a couple of
 * edge-case inputs to exercise validation on the custom-name field.
 * Drives the data-driven coverage in tests/e2e/orders/otherPayment.e2e.spec.ts.
 */
export const OTHER_PAYMENT_LABELS = [
  // Banks / wire transfers
  { label: 'Chase wire', methodName: 'Chase' },
  { label: 'Bank of America ACH', methodName: 'Bank of America' },
  { label: 'Wells Fargo transfer', methodName: 'Wells Fargo' },

  // P2P / mobile wallets
  { label: 'Zelle', methodName: 'Zelle' },
  { label: 'Venmo', methodName: 'Venmo' },
  { label: 'Cash App', methodName: 'Cash App' },
  { label: 'PayPal', methodName: 'PayPal' },
  { label: 'Apple Pay', methodName: 'Apple Pay' },

  // Paper instruments
  { label: 'Personal Check', methodName: 'Personal Check' },
  { label: 'Money Order', methodName: 'Money Order' },

  // Edge cases — keep to cover input validation on the custom-name field.
  { label: 'numeric label', methodName: '12345' },
  { label: 'special characters', methodName: 'Crypto-Pay #1' },
] as const satisfies readonly OtherPaymentLabel[];
