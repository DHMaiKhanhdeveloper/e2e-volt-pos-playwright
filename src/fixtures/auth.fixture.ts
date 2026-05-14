import { test as base, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { UserRole, RoleStoragePath } from '@configs/constants/roles';

export interface AuthFixture {
  asAdminContext: BrowserContext;
  asCashierContext: BrowserContext;
}

const storageFor = (role: UserRole): string => {
  const file = path.resolve(process.cwd(), RoleStoragePath[role]);
  if (!fs.existsSync(file)) {
    throw new Error(
      `[auth.fixture] No storage state for role=${role} at ${file}. ` +
        `Run "npm run test" once (global.setup will create it) or ensure CI generated it.`,
    );
  }
  return file;
};

/**
 * Provides pre-authenticated browser contexts for fast role-based tests.
 * Storage states are produced by src/fixtures/global.setup.ts.
 */
export const authFixture = base.extend<AuthFixture>({
  asAdminContext: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: storageFor(UserRole.ADMIN) });
    await use(ctx);
    await ctx.close();
  },
  asCashierContext: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: storageFor(UserRole.CASHIER) });
    await use(ctx);
    await ctx.close();
  },
});
