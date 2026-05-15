export interface Staff {
  nickname: string;
  firstName: string | null;
  lastName: string | null;
  staffCode: string;
}

/**
 * Staff data seeded in the Volt POS dev environment.
 * `staffCode` is the passcode used for completing payments.
 * Update these values if dev seed data changes.
 */
export const STAFF = {
  ELISE_TERRY: {
    nickname: 'Elise Terry',
    firstName: 'Tenant',
    lastName: '4',
    staffCode: '0123',
  },
  EMMA2: {
    nickname: 'Emma2',
    firstName: null,
    lastName: null,
    staffCode: '9995',
  },
  AMELIA: {
    nickname: 'Amelia',
    firstName: 'Nhu',
    lastName: 'Nguyen',
    staffCode: '0114',
  },
  ISABELLA: {
    nickname: 'Isabella',
    firstName: 'Chau',
    lastName: 'Nguyen',
    staffCode: '0115',
  },
  LUNA: {
    nickname: 'Luna',
    firstName: 'Dev',
    lastName: 'Test',
    staffCode: '1111',
  },
} as const satisfies Record<string, Staff>;

/**
 * Owner/tenant passcode used to authorize payment completion in the passcode dialog.
 * The dialog accepts this rather than per-staff codes.
 */
export const OWNER_PASSCODE = '8888';
