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
  NATALIE_CARDENAS: {
    nickname: 'Natalie Cardenas',
    firstName: 'Ralph',
    lastName: 'Johnston',
    staffCode: '4199',
  },
  GEORGE_FOX: {
    nickname: 'George Fox',
    firstName: 'Shelby',
    lastName: 'Garcia',
    staffCode: '5922',
  },
  CHRISTIAN_CANTRELL: {
    nickname: 'Christian Cantrell',
    firstName: 'Paula',
    lastName: 'Wynn',
    staffCode: '5244',
  },
  SONYA_MOODY: {
    nickname: 'Sonya Moody',
    firstName: 'Murphy',
    lastName: 'Dejesus',
    staffCode: '0100',
  },
  OCTAVIUS_RICH: {
    nickname: 'Octavius Rich',
    firstName: 'Graiden',
    lastName: 'Pacheco',
    staffCode: '4124',
  },
  MADONNA_VEGA: {
    nickname: 'Madonna Vega',
    firstName: 'Thaddeus',
    lastName: 'Glass',
    staffCode: '6873',
  },
  ORA_SPENCER: {
    nickname: 'Ora Spencer',
    firstName: 'Abel',
    lastName: 'Calderon',
    staffCode: '1077',
  },
  CRUZ_RASMUSSEN: {
    nickname: 'Cruz Rasmussen',
    firstName: 'Coby',
    lastName: 'Castro',
    staffCode: '3309',
  },
  CASEY_FLYNN: {
    nickname: 'Casey Flynn',
    firstName: 'Dahlia',
    lastName: 'Giles',
    staffCode: '7792',
  },
  HARLAN_SMALL: {
    nickname: 'Harlan Small',
    firstName: 'Darryl',
    lastName: 'Monroe',
    staffCode: '5530',
  },
} as const satisfies Record<string, Staff>;

/**
 * Owner/tenant passcode used to authorize payment completion in the passcode dialog.
 * The dialog accepts this rather than per-staff codes.
 */
export const OWNER_PASSCODE = '8888';
