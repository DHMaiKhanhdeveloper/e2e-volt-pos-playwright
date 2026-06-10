module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'playwright', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:playwright/recommended',
    'prettier',
  ],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'playwright/no-skipped-test': 'warn',
    'playwright/expect-expect': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  overrides: [
    {
      // This config file isn't part of tsconfig.json, so the type-aware
      // parser (parserOptions.project) errors when the editor lints it.
      // Disable project-based parsing for the config file itself.
      files: ['.eslintrc.cjs'],
      parserOptions: { project: null },
    },
    {
      // E2E specs are data-dependent: they self-skip when seed data is
      // missing and guard optional rows with `if`. These Playwright rules
      // fight that intentional pattern, so relax them for the test suite.
      files: ['tests/**/*.ts'],
      rules: {
        'playwright/no-conditional-in-test': 'off',
        'playwright/no-conditional-expect': 'off',
        'playwright/no-skipped-test': 'off',
        'playwright/expect-expect': 'off',
        'playwright/no-wait-for-timeout': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    {
      // Page-object / support layer. The real app under test runs in a
      // separate project (localhost:1420) — everything here is test
      // automation infrastructure. A few POM helpers need deliberate settle
      // waits and a documented `force:true` to bypass a purely-visual
      // overlay, so relax these two rules for the support layer only.
      files: ['src/pages/**/*.ts', 'src/components/**/*.ts'],
      rules: {
        'playwright/no-wait-for-timeout': 'off',
        'playwright/no-force-option': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    'reports',
    'test-results',
    'playwright-report',
    'dashboard', // has its own tsconfig + lint setup
    '*.js',
    '!.eslintrc.cjs',
  ],
};
