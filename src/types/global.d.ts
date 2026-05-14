declare namespace NodeJS {
  interface ProcessEnv {
    ENV?: 'local' | 'stage' | 'prod';
    HEADLESS?: string;
    SLOW_MO?: string;
    BASE_URL?: string;
    LOGIN_PATH?: string;
    DASHBOARD_PATH?: string;
    API_BASE_URL?: string;
    API_VERSION?: string;
    API_TIMEOUT?: string;
    ADMIN_USER?: string;
    ADMIN_PASS?: string;
    CASHIER_USER?: string;
    CASHIER_PASS?: string;
    PAYMENT_GATEWAY_URL?: string;
    PAYMENT_MERCHANT_ID?: string;
    PAYMENT_API_KEY?: string;
    LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
    PLAYWRIGHT_RUN_ID?: string;
  }
}
