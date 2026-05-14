export enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cashier',
  MANAGER = 'manager',
  AUDITOR = 'auditor',
}

export const RoleStoragePath: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'src/data/dynamic/auth/admin.json',
  [UserRole.CASHIER]: 'src/data/dynamic/auth/cashier.json',
  [UserRole.MANAGER]: 'src/data/dynamic/auth/manager.json',
  [UserRole.AUDITOR]: 'src/data/dynamic/auth/auditor.json',
};
