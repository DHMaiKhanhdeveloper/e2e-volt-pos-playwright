export interface Service {
  /** Real DB id (GraphQL `serviceList.id`). */
  id: string;
  name: string;
  /** Display price, pre-tax (e.g. "$10.00"). Mirrors GraphQL `serviceList.price` (cents). */
  price: string;
  /** Raw price in cents as stored in the DB (GraphQL `serviceList.price`). */
  priceCents: number;
}

/**
 * Service catalogue available in the Volt POS dev environment.
 *
 * Values are sourced from the live GraphQL DB (`query { serviceList { id name
 * price type status } }`, `type = "service"` AND `status = "active"`) — NOT
 * hand-typed. Re-run that query and update here if the seed catalogue changes.
 * Prices are stored in cents; `price` is the pre-tax display string.
 *
 * IMPORTANT: only ACTIVE services belong here. Soft-deleted records still come
 * back from `serviceList` but won't appear in the POS UI, so selecting them by
 * name fails. The previous catalogue carried several since-deleted services
 * (Basic Manicure, French/Spa Manicure, Basic Pedicure, Acrylic Full Set/Fill,
 * Dip Powder Nails, Callus Removal — and "Gel Manicure" became a product); those
 * were replaced with currently-active services below.
 */
export const SERVICES = {
  GEL_REMOVAL: {
    id: '019dbed4-cac3-7f8c-9576-88d1511f38fd',
    name: 'Gel Removal',
    price: '$10.00',
    priceCents: 1000,
  },
  DIPPING_OMBRE: {
    id: '019dbed4-cb04-70bf-95b8-c744c43f6672',
    name: 'Dipping Ombre',
    price: '$25.00',
    priceCents: 2500,
  },
  WAXING_LIP_CHIN: {
    id: '019dbed4-cbc2-7961-97b9-e887b2f638dc',
    name: 'Waxing (Lip / Chin)',
    price: '$8.00',
    priceCents: 800,
  },
  SPA_SERVICE: {
    id: '019dbed4-cc90-701b-a619-9215aa8bc9ce',
    name: 'Spa Service',
    price: '$5.80',
    priceCents: 580,
  },
  BLACK_WHITE_FULL_SET: {
    id: '019dbed4-cc72-701e-997e-791ae1369ad0',
    name: 'Black & White Full Set',
    price: '$100.00',
    priceCents: 10000,
  },
  RED_WHITE_FULL_SET: {
    id: '019dbed4-cc79-7635-829b-509728f4246a',
    name: 'Red & White Full Set',
    price: '$15.00',
    priceCents: 1500,
  },
  ACRYLIC_REMOVAL: {
    id: '019dbed4-ca9c-7060-a181-be5440f41227',
    name: 'Acrylic Removal',
    price: '$18.75',
    priceCents: 1875,
  },
  EYEBROW_WAX: {
    id: '019dbed4-cbc6-7735-a312-22d4feb6a352',
    name: 'Eyebrow Wax',
    price: '$12.00',
    priceCents: 1200,
  },
  // ── Replacements for the soft-deleted entries (all currently active) ──
  CLASSIC_MANICURE: {
    id: '019dbed4-ca80-714c-82d4-c1d71ac74fb6',
    name: 'Classic Manicure',
    price: '$100.00',
    priceCents: 10000,
  },
  PEDICURE: {
    id: '019dbed4-ca82-7f76-a31f-739b95e663f6',
    name: 'Pedicure',
    price: '$50.00',
    priceCents: 5000,
  },
  EXPRESS_MANI_PEDI: {
    id: '019dbed4-ca84-7652-8df0-02758dba93ae',
    name: 'Express Mani-Pedi',
    price: '$35.00',
    priceCents: 3500,
  },
  ACRYLIC_FILL_IN: {
    id: '019dbed4-ca88-7cd6-a865-14929acdeade',
    name: 'Acrylic Fill-in',
    price: '$15.00',
    priceCents: 1500,
  },
  ACRYLIC_REFILL: {
    id: '019dbed4-ca8a-72da-80d2-b5b88076d5b5',
    name: 'Acrylic Refill',
    price: '$40.00',
    priceCents: 4000,
  },
  PINK_WHITE_FULL_SET: {
    id: '019dbed4-ca8c-7fc6-89b9-7f6fd698e4e0',
    name: 'Pink & White Full Set',
    price: '$9.00',
    priceCents: 900,
  },
  DIP_POWDER: {
    id: '019dbed4-cad4-7394-aa4e-ef5dd6bb253b',
    name: 'Dip Powder',
    price: '$45.22',
    priceCents: 4522,
  },
  CALLUS_TREATMENT: {
    id: '019dbed4-caa9-7222-aed5-379587755cb0',
    name: 'Callus Treatment',
    price: '$23.44',
    priceCents: 2344,
  },
  NAIL_ART_DESIGN: {
    id: '019dbed4-caa0-7181-8fe8-90ad47ff4fbd',
    name: 'Nail Art Design',
    price: '$67.89',
    priceCents: 6789,
  },
} as const satisfies Record<string, Service>;
