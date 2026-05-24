export interface Service {
  name: string;
  price: string;
}

/**
 * Service catalogue available in the Volt POS dev environment.
 * Update prices / names if the seed catalogue changes.
 */
export const SERVICES = {
  GEL_REMOVAL: { name: 'Gel Removal', price: '$10.00' },
  DIPPING_OMBRE: { name: 'Dipping Ombre', price: '$25.00' },
  WAXING_LIP_CHIN: { name: 'Waxing (Lip / Chin)', price: '$8.00' },
  SPA_SERVICE: { name: 'Spa Service', price: '$5.80' },
  BLACK_WHITE_FULL_SET: { name: 'Black & White Full Set', price: '$20.00' },
  RED_WHITE_FULL_SET: { name: 'Red & White Full Set', price: '$15.00' },
  ACRYLIC_REMOVAL: { name: 'Acrylic Removal', price: '$18.75' },
  BASIC_MANICURE: { name: 'Basic Manicure', price: '$25.00' },
  GEL_MANICURE: { name: 'Gel Manicure', price: '$50.00' },
  FRENCH_MANICURE: { name: 'French Manicure', price: '$35.00' },
  SPA_MANICURE: { name: 'Spa Manicure', price: '$45.00' },
  BASIC_PEDICURE: { name: 'Basic Pedicure', price: '$35.00' },
  ACRYLIC_FULL_SET: { name: 'Acrylic Full Set', price: '$60.00' },
  ACRYLIC_FILL: { name: 'Acrylic Fill', price: '$40.00' },
  DIP_POWDER_NAILS: { name: 'Dip Powder Nails', price: '$60.00' },
  EYEBROW_WAX: { name: 'Eyebrow Wax', price: '$12.00' },
  CALLUS_REMOVAL: { name: 'Callus Removal', price: '$15.00' },
} as const satisfies Record<string, Service>;
