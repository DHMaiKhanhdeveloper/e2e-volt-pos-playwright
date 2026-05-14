import { test as base } from '@playwright/test';
import { AuthApiClient } from '@api/clients/AuthApiClient';
import { PaymentApiClient } from '@api/clients/PaymentApiClient';
import { AuthService } from '@api/services/AuthService';
import { PaymentService } from '@api/services/PaymentService';

export interface ApiFixture {
  authClient: AuthApiClient;
  paymentClient: PaymentApiClient;
  authService: AuthService;
  paymentService: PaymentService;
}

export const apiFixture = base.extend<ApiFixture>({
  authClient: async ({}, use) => {
    const client = new AuthApiClient();
    await client.init();
    await use(client);
    await client.dispose();
  },
  paymentClient: async ({}, use) => {
    const client = new PaymentApiClient();
    await client.init();
    await use(client);
    await client.dispose();
  },
  authService: async ({ authClient }, use) => {
    await use(new AuthService(authClient));
  },
  paymentService: async ({ paymentClient }, use) => {
    await use(new PaymentService(paymentClient));
  },
});
