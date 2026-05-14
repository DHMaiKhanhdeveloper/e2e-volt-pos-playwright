import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

export type EnvName = 'local' | 'stage' | 'prod';

export interface AppEnv {
  ENV: EnvName;
  HEADLESS: boolean;
  SLOW_MO: number;

  BASE_URL: string;
  LOGIN_PATH: string;
  DASHBOARD_PATH: string;

  API_BASE_URL: string;
  API_VERSION: string;
  API_TIMEOUT: number;

  ADMIN_USER: string;
  ADMIN_PASS: string;
  CASHIER_USER: string;
  CASHIER_PASS: string;

  PAYMENT_GATEWAY_URL: string;
  PAYMENT_MERCHANT_ID: string;
  PAYMENT_API_KEY: string;

  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

const required = (name: string, value: string | undefined): string => {
  if (!value || value.trim() === '') {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
};

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
 *   3. configs/env/.env.example (last-resort defaults)
 */
export const loadEnv = (): AppEnv => {
  const envName = (process.env.ENV ?? 'local') as EnvName;
  const envDir = path.resolve(__dirname);

  const candidates = [`.env.${envName}`, '.env.example'];
  for (const file of candidates) {
    const full = path.join(envDir, file);
    if (fs.existsSync(full)) {
      dotenv.config({ path: full, override: false });
    }
  }

  return {
    ENV: envName,
    HEADLESS: toBool(process.env.HEADLESS, true),
    SLOW_MO: toInt(process.env.SLOW_MO, 0),

    BASE_URL: required('BASE_URL', process.env.BASE_URL),
    LOGIN_PATH: process.env.LOGIN_PATH ?? '/auth/login',
    DASHBOARD_PATH: process.env.DASHBOARD_PATH ?? '/dashboard',

    API_BASE_URL: required('API_BASE_URL', process.env.API_BASE_URL),
    API_VERSION: process.env.API_VERSION ?? 'v1',
    API_TIMEOUT: toInt(process.env.API_TIMEOUT, 30000),

    ADMIN_USER: required('ADMIN_USER', process.env.ADMIN_USER),
    ADMIN_PASS: required('ADMIN_PASS', process.env.ADMIN_PASS),
    CASHIER_USER: required('CASHIER_USER', process.env.CASHIER_USER),
    CASHIER_PASS: required('CASHIER_PASS', process.env.CASHIER_PASS),

    PAYMENT_GATEWAY_URL: process.env.PAYMENT_GATEWAY_URL ?? '',
    PAYMENT_MERCHANT_ID: process.env.PAYMENT_MERCHANT_ID ?? '',
    PAYMENT_API_KEY: process.env.PAYMENT_API_KEY ?? '',

    LOG_LEVEL: (process.env.LOG_LEVEL as AppEnv['LOG_LEVEL']) ?? 'info',
  };
};

export const env: AppEnv = loadEnv();
