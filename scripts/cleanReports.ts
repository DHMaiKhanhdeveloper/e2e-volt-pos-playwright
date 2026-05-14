import * as fs from 'fs';
import * as path from 'path';

const targets = ['reports', 'test-results', 'playwright-report', 'allure-results', 'allure-report'];

for (const t of targets) {
  const full = path.resolve(process.cwd(), t);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.info(`Removed ${t}`);
  }
}

console.info('Reports clean.');
