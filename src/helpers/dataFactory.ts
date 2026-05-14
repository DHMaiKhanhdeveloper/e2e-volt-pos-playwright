import { faker } from '@faker-js/faker';

export interface TestCustomer {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

export const makeCustomer = (overrides: Partial<TestCustomer> = {}): TestCustomer => ({
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  address: faker.location.streetAddress({ useFullAddress: true }),
  ...overrides,
});

export const makeOrderId = (): string =>
  `ORD-${Date.now()}-${faker.string.alphanumeric({ length: 6, casing: 'upper' })}`;
