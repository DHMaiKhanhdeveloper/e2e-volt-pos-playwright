import { FullConfig } from '@playwright/test';
import { Logger } from '@utils/logger';

const log = Logger.child({ module: 'global.teardown' });

/**
 * Hook for post-suite cleanup: dropping seeded DB rows, deleting test users, etc.
 * Keep it idempotent — teardown may run on partial suites.
 */
export default async function globalTeardown(_config: FullConfig): Promise<void> {
  log.info('Global teardown running');
  // TODO: call cleanup APIs / DB scripts as the project requires.
  log.info('Global teardown complete');
}
