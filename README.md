# E2E Volt POS Test — Playwright (TypeScript)

Enterprise-grade Playwright automation framework for the **Volt POS / Bamboo Pay** product. Multi-env, multi-browser, API + UI + visual coverage, with Allure reporting and ready-to-run CI/CD.

---

## Highlights

- **Page Object Model** with a shared `BasePage` and component objects (`BaseModal`, `DataTable`, `Sidebar`, …)
- **API layer** separated into `clients`, `models`, `services` so endpoints can change in one place
- **Fixtures** — `mergeTests` of `pagesFixture`, `apiFixture`, `authFixture` exposes one `test` object with pre-built page objects, service objects, and pre-authenticated browser contexts per role
- **Multi-environment** config via typed `loadEnv()` reading `configs/env/.env.<ENV>`
- **JSON-schema validation** of API responses (Ajv)
- **Allure + HTML + JUnit + JSON** reports, traces/screenshots/videos on failure
- **CI/CD ready** — GitHub Actions for PR + nightly regression, parametrised by env and suite
- **Docker** image for reproducible runs

---

## Project structure

```
.
├── .github/workflows/         # GitHub Actions: PR + nightly
├── configs/
│   ├── env/                   # .env.local / .env.stage / .env.prod + loadEnv.ts
│   └── constants/             # timeouts, role → storageState map
├── src/
│   ├── api/                   # clients + models + services
│   ├── pages/                 # POM (auth/, dashboard/, payment/)
│   ├── components/            # reusable UI (modal/, table/, sidebar/)
│   ├── fixtures/              # Playwright fixtures + global setup/teardown
│   ├── helpers/               # business helpers (loginHelper, paymentHelper, dataFactory)
│   ├── utils/                 # technical utilities (logger, retry, schema, date, money)
│   ├── data/
│   │   ├── static/            # JSON test data
│   │   └── dynamic/           # generated at runtime (auth states, fixtures)
│   ├── schemas/               # JSON Schemas for API validation
│   ├── types/                 # global.d.ts, test tag enum
│   └── constants/             # error messages, URL paths, enums
├── tests/
│   ├── smoke/                 # critical path — runs on every PR
│   ├── e2e/                   # full end-to-end UI scenarios
│   ├── regression/            # broader nightly coverage
│   ├── api/                   # API-only tests
│   └── visual/                # visual regression with toHaveScreenshot
├── scripts/                   # node scripts (cleanReports, runTests)
├── docker/                    # Dockerfile + docker-compose
├── reports/                   # generated reports (html/, allure-results/)
├── test-results/              # generated artifacts (screenshots, video, trace)
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Prerequisites

| Tool      | Version       |
| --------- | ------------- |
| Node.js   | 18+ (LTS 20)  |
| npm       | 9+            |
| OS        | Win / mac / Linux |

---

## Setup

```bash
# 1. Install deps + Playwright browsers
npm install

# 2. Configure your env
cp configs/env/.env.example configs/env/.env.local
#   edit it (BASE_URL, ADMIN_USER, ADMIN_PASS, …)

# 3. Run the smoke suite on local
npm run test:smoke
```

> Real `configs/env/.env.local | .env.stage | .env.prod` files are git-ignored — only `.env.example` is committed. CI/CD injects secrets through workflow env vars.

---

## Running tests

```bash
npm run test                  # default project, ENV=local
npm run test:smoke            # tests/smoke on stage
npm run test:regression       # tests/regression on stage
npm run test:e2e              # tests/e2e on stage
npm run test:api              # tests/api on stage
npm run test:visual           # tests/visual on stage
npm run test:visual:update    # regenerate visual baselines

npm run test:headed           # run with browser visible
npm run test:ui               # Playwright UI mode
npm run test:debug            # PWDEBUG=1 step-through
npm run codegen               # record a new test
```

### Filtering by tag

Test titles carry tags like `@smoke`, `@regression`, `@payment`, `@api`. Filter with:

```bash
npx playwright test --grep @smoke
npx playwright test --grep "@payment.*@regression"
```

Tag constants live in [src/types/testTags.ts](src/types/testTags.ts).

### Per-browser / per-project

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=mobile-chrome
npx playwright test --project=api
```

---

## Reports

```bash
npm run report                # opens reports/html
npm run report:allure         # generates and opens Allure
npm run report:allure:serve   # serves Allure live
```

CI uploads `reports/html`, `reports/allure-results` and `test-results/` (traces & video) as artifacts.

### Custom React dashboard

A standalone React dashboard in [dashboard/](dashboard/) reads `reports/json/results.json` and renders pass/fail stats with charts, per-project / per-file breakdown, and a filterable test table.

```bash
cd dashboard
npm install
npm run dev          # http://localhost:5173
```

If no run has happened yet, the dashboard falls back to a bundled sample so the UI still renders. See [dashboard/README.md](dashboard/README.md) for details.

---

## Authoring a new test

```ts
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';

test.describe(`Feature X ${Tag.REGRESSION} ${Tag.PAYMENT}`, () => {
  test('does the thing', async ({ asCashierContext, paymentService }) => {
    // 1. Set up state via API (fast, deterministic)
    const payment = await paymentService.createAndWaitCaptured({...});

    // 2. Drive the UI from a pre-authenticated context
    const page = await asCashierContext.newPage();
    await page.goto(`/payments/${payment.id}`);
    await expect(page.getByTestId('payment-status')).toContainText('CAPTURED');
  });
});
```

Patterns to follow:
- **Use storage-state auth** (`asAdminContext`, `asCashierContext`) instead of logging in via UI per test — that flow is exercised in `tests/smoke/login.smoke.spec.ts` only.
- **Set up data via API services**, not UI clicks — UI is for the behaviour under test, not for fixtures.
- **Locate via `data-testid`** through `getByTestId`. Avoid text or CSS selectors that can churn.
- **Validate API contracts with Ajv** (`assertSchema(...)`) — surfaces backend drift early.

---

## Docker

```bash
docker compose -f docker/docker-compose.yml run --rm e2e
```

Image is based on `mcr.microsoft.com/playwright` so browsers are pre-installed.

---

## CI/CD

- `.github/workflows/e2e.yml` — PR + push + manual; matrix over browsers
- `.github/workflows/nightly-regression.yml` — full regression nightly, uploads Allure report

Secrets required:
`BASE_URL`, `API_BASE_URL`, `ADMIN_USER`, `ADMIN_PASS`, `CASHIER_USER`, `CASHIER_PASS`, `PAYMENT_GATEWAY_URL`, `PAYMENT_MERCHANT_ID`, `PAYMENT_API_KEY`.

---

## Conventions

- Files: `PascalCase` for classes (`LoginPage.ts`), `camelCase` for utilities (`dateUtils.ts`).
- Spec files: `<feature>.<type>.spec.ts` (e.g. `login.smoke.spec.ts`, `payment.api.spec.ts`).
- Selectors: always use `data-testid` attributes — the framework is built around `getByTestId`.
- Test data: never commit real credentials, customer info or production data. Use `@faker-js/faker` via the helpers in [src/helpers/](src/helpers/).
- Lint + format on commit via Husky + lint-staged (run `npm run prepare` once to install hooks).

---

## Troubleshooting

| Symptom                                           | Likely cause / fix                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Missing required environment variable: BASE_URL` | No env file for the chosen `ENV`. Copy `.env.example` to `.env.<env>`.             |
| `No storage state for role=admin at ...`          | First run hasn't created auth state. Run `npm test` once — `global.setup` seeds it. |
| Visual diff failures                              | Update baselines: `npm run test:visual:update` — then commit the new PNGs.         |
| Slow / flaky tests                                | Tag with `@slow` or `@flaky`. Avoid `page.waitForTimeout` — use specific locators. |
