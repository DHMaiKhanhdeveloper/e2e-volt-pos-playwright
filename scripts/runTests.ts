/* eslint-disable no-console */
import { spawnSync } from 'child_process';

type Suite = 'smoke' | 'e2e' | 'regression' | 'api' | 'visual' | 'all';
type Env = 'local' | 'stage' | 'prod';

const args = process.argv.slice(2);
const env = (args.find((a) => a.startsWith('--env='))?.split('=')[1] ?? 'local') as Env;
const suite = (args.find((a) => a.startsWith('--suite='))?.split('=')[1] ?? 'smoke') as Suite;
const browser = args.find((a) => a.startsWith('--browser='))?.split('=')[1] ?? 'chromium';

const cliArgs: string[] = ['playwright', 'test', `--project=${browser}`];
if (suite !== 'all') cliArgs.push(`tests/${suite}`);

console.info(`Running ENV=${env} suite=${suite} browser=${browser}`);
const result = spawnSync('npx', cliArgs, {
  stdio: 'inherit',
  env: { ...process.env, ENV: env },
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
