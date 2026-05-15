import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

export type EnvName = 'local' | 'stage' | 'prod';

export interface AppEnv {
  ENV: EnvName;
  HEADLESS: boolean;
  SLOW_MO: number;

  BASE_URL: string;
  GRAPHQL_URL: string;

  API_TIMEOUT: number;
  OWNER_PASSCODE: string;

  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

const toBool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const toInt = (value: string | undefined, fallback: number): number => {
  if (value === undefined) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Loads environment-specific .env file from configs/env/.
 * Priority:
 *   1. Real OS env vars (CI/CD secret store) — never overridden
 *   2. configs/env/.env.<ENV>
 *   3. configs/env/.env.example (defaults)
 */
export const loadEnv = (): AppEnv => {
  const envName = (process.env.ENV ?? 'local') as EnvName;
  const envDir = path.resolve(__dirname);

  for (const file of [`.env.${envName}`, '.env.example']) {
    const full = path.join(envDir, file);
    if (fs.existsSync(full)) {
      dotenv.config({ path: full, override: false });
    }
  }

  const baseUrl = process.env.BASE_URL ?? 'http://localhost:1420';

  return {
    ENV: envName,
    HEADLESS: toBool(process.env.HEADLESS, true),
    SLOW_MO: toInt(process.env.SLOW_MO, 0),

    BASE_URL: baseUrl,
    GRAPHQL_URL: process.env.GRAPHQL_URL ?? `${baseUrl}/graphql`,

    API_TIMEOUT: toInt(process.env.API_TIMEOUT, 30000),
    OWNER_PASSCODE: process.env.OWNER_PASSCODE ?? '8888',

    LOG_LEVEL: (process.env.LOG_LEVEL as AppEnv['LOG_LEVEL']) ?? 'info',
  };
};

export const env: AppEnv = loadEnv();
