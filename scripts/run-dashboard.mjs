#!/usr/bin/env node
/**
 * Single command: run the WHOLE Playwright suite, then build and open the
 * React pass/fail dashboard — regardless of whether tests pass or fail.
 *
 *   npm run dashboard
 *
 * Extra Playwright args pass through, e.g.:
 *   npm run dashboard -- --grep @smoke
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const extraArgs = process.argv.slice(2);

console.log('▶ Running full test suite (this can take a while)...');
const testRun = spawnSync(
  'npx',
  ['cross-env', 'ENV=local', 'playwright', 'test', ...extraArgs],
  { stdio: 'inherit', shell: true },
);
if (testRun.status !== 0) {
  console.log(`(suite finished with failing tests — exit code ${testRun.status}, continuing to build dashboard)`);
}

console.log('▶ Building dashboard from reports/json/results.json...');
const build = spawnSync('node', ['scripts/build-dashboard.mjs'], { stdio: 'inherit', shell: true });
if (build.status !== 0) process.exit(build.status);

const dashboardPath = path.resolve('reports/dashboard/index.html');
console.log(`▶ Dashboard ready: ${dashboardPath}`);

const opener =
  process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
spawnSync(opener, [dashboardPath], { shell: true, stdio: 'ignore' });
