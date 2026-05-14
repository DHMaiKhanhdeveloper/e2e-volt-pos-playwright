export const ErrorMessages = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  ACCOUNT_LOCKED: 'Your account has been locked',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  NETWORK_ERROR: 'Network error. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  PAYMENT_DECLINED: 'Payment was declined',
  INVALID_AMOUNT: 'Amount must be greater than zero',
} as const;
