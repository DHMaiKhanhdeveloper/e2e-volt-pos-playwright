import { mergeTests, expect } from '@playwright/test';
import { pagesFixture } from './pages.fixture';
import { apiFixture } from './api.fixture';
import { authFixture } from './auth.fixture';

/**
 * Single entry point for tests:
 *
 *   import { test, expect } from '@fixtures/index';
 *
 *   test('...', async ({ loginPage, authService, asAdminContext }) => { ... });
 */
export const test = mergeTests(pagesFixture, apiFixture, authFixture);
export { expect };
