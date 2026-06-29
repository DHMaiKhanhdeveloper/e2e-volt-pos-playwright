export interface Staff {
  /** Real DB id (GraphQL `staffList.id`). */
  id: string;
  nickname: string;
  firstName: string | null;
  lastName: string | null;
  /**
   * Login/identification code, zero-padded to 4 digits to match how it is
   * entered in the UI. The DB stores this as an integer (e.g. 123), so the
   * StaffService comparison pads it: `String(staffCode).padStart(4, '0')`.
   */
  staffCode: string;
  /** Account status in the DB ('active' | 'inactive'). */
  status: 'active' | 'inactive';
}

/**
 * Staff data seeded in the Volt POS dev environment.
 *
 * Values are sourced from the live GraphQL DB
 * (`query { staffList { id firstName lastName nickname staffCode status } }`)
 * — NOT hand-typed. Re-run that query and update here if the seed data changes.
 * `staffCode` is stored as an int in the DB and zero-padded to 4 chars here.
 */
export const STAFF = {
  ELISE_TERRY: {
    id: '019dbed4-ce7b-7a43-a6cf-3f63cdc0f9e6',
    nickname: 'Elise Terry',
    firstName: 'Tenant',
    lastName: '4',
    staffCode: '0123',
    status: 'active',
  },
  EMMA2: {
    id: '019dbed4-ce84-7260-acc0-547ed58754b0',
    nickname: 'Emma2',
    firstName: null,
    lastName: null,
    staffCode: '9995',
    status: 'active',
  },
  AMELIA: {
    id: '019dbed4-ce88-7f4b-b2f8-99337706a862',
    nickname: 'Amelia',
    firstName: 'Nhu',
    lastName: 'Nguyen',
    staffCode: '0114',
    status: 'active',
  },
  ISABELLA: {
    id: '019dbed4-ce8b-74c6-8832-25822f59f210',
    nickname: 'Isabella',
    firstName: 'Chau',
    lastName: 'Nguyen',
    staffCode: '0115',
    status: 'active',
  },
  LUNA: {
    id: '019dbed4-ce8d-7e1b-9a1a-f85838998d9f',
    nickname: 'Luna',
    firstName: 'Dev',
    lastName: 'Test',
    staffCode: '1111',
    status: 'active',
  },
  NATALIE_CARDENAS: {
    id: '019dbed4-cf43-7ad8-93b7-1771d6e2bab4',
    nickname: 'Natalie Cardenas',
    firstName: 'Ralph',
    lastName: 'Johnston',
    staffCode: '4199',
    status: 'inactive',
  },
  GEORGE_FOX: {
    id: '019dbed4-cf45-7350-ae13-a37646a0caec',
    nickname: 'George Fox',
    firstName: 'Shelby',
    lastName: 'Garcia',
    staffCode: '5922',
    status: 'active',
  },
  CHRISTIAN_CANTRELL: {
    id: '019dbed4-cf4a-7f6f-b948-397076afff47',
    nickname: 'Christian Cantrell',
    firstName: 'Paula',
    lastName: 'Wynn',
    staffCode: '5244',
    status: 'active',
  },
  SONYA_MOODY: {
    id: '019dbed4-cf4c-7d6e-a35c-35325760b3fb',
    nickname: 'Sonya Moody',
    firstName: 'Murphy',
    lastName: 'Dejesus',
    staffCode: '0100',
    status: 'active',
  },
  OCTAVIUS_RICH: {
    id: '019dbed4-cf4e-778c-a2c7-18ce1876171b',
    nickname: 'Octavius Rich',
    firstName: 'Graiden',
    lastName: 'Pacheco',
    staffCode: '4124',
    status: 'active',
  },
  MADONNA_VEGA: {
    id: '019dbed4-cf51-7390-a937-28dfd330a58f',
    nickname: 'Madonna Vega',
    firstName: 'Thaddeus',
    lastName: 'Glass',
    staffCode: '6873',
    status: 'active',
  },
  ORA_SPENCER: {
    id: '019dbed4-cf53-772e-a3fe-ffae2cd447f6',
    nickname: 'Ora Spencer',
    firstName: 'Abel',
    lastName: 'Calderon',
    staffCode: '1077',
    status: 'active',
  },
  CRUZ_RASMUSSEN: {
    id: '019dbed4-cf56-72e4-a99c-62c650efb66d',
    nickname: 'Cruz Rasmussen',
    firstName: 'Coby',
    lastName: 'Castro',
    staffCode: '3309',
    status: 'inactive',
  },
  CASEY_FLYNN: {
    id: '019dbed4-cf58-7ab4-91b5-82505e25b470',
    nickname: 'Casey Flynn',
    firstName: 'Dahlia',
    lastName: 'Giles',
    staffCode: '7792',
    status: 'active',
  },
  HARLAN_SMALL: {
    id: '019dbed4-cf5f-7378-8777-76f1970a71ff',
    nickname: 'Harlan Small',
    firstName: 'Darryl',
    lastName: 'Monroe',
    staffCode: '5530',
    status: 'active',
  },
} as const satisfies Record<string, Staff>;

/**
 * Owner/tenant passcode used to authorize payment completion in the passcode dialog.
 * The dialog accepts this rather than per-staff codes.
 */
export const OWNER_PASSCODE = '8888';
