# E2E Volt POS Test — Playwright (TypeScript)

Enterprise-grade Playwright automation framework for the **Volt POS** application (nail-salon point-of-sale). Multi-env config, POM, GraphQL helper, Allure reporting, CI/CD and a custom React pass/fail dashboard.

> Target app: `http://localhost:1420` (Tauri + Vite frontend, GraphQL at `/graphql`).

---

## Highlights

- **Page Object Model** with a shared [BasePage](src/pages/BasePage.ts) and POs for the Volt POS flow (`HomePage`, `CheckoutPage`, `PaymentSuccessPage`, `PasscodeDialog`)
- **GraphQL client** in [GraphQLClient.ts](src/api/clients/GraphQLClient.ts) + a `StaffService` wrapping the `staffList` query
- **Fixtures** — `mergeTests` of `pagesFixture` + `apiFixture` exposes one `test` object with all POs and the GraphQL services pre-built
- **Multi-environment** typed config via [loadEnv()](configs/env/loadEnv.ts) reading `configs/env/.env.<ENV>`
- **Pre-test health check** — `npm test` first hits `BASE_URL` and fails fast with a helpful message if the app isn't running
- **Reports** — HTML + JUnit + JSON + Allure, traces/screenshots/videos on failure
- **CI/CD** — GitHub Actions workflows for PR and nightly regression
- **Docker** runner image based on the official Playwright image
- **React dashboard** in [dashboard/](dashboard/) for visual pass/fail analysis

---

## Project structure

```
.
├── .github/workflows/         # GitHub Actions: PR + nightly
├── configs/
│   ├── env/                   # .env.local / .env.stage / .env.prod + loadEnv.ts
│   └── constants/             # timeouts
├── src/
│   ├── api/                   # GraphQL client + services + models
│   ├── pages/
│   │   ├── BasePage.ts
│   │   └── pos/               # HomePage, CheckoutPage, PaymentSuccessPage
│   ├── components/
│   │   └── modal/             # BaseModal, PasscodeDialog
│   ├── fixtures/              # pages.fixture, api.fixture, merged index.ts
│   ├── helpers/               # cross-cutting business helpers (placeholder)
│   ├── utils/                 # logger, retry, date, money, string, file
│   ├── data/
│   │   ├── static/            # staff.ts, services.ts (typed catalogues)
│   │   └── dynamic/           # generated at runtime (gitignored)
│   ├── types/                 # global.d.ts, test tag enum
│   └── constants/             # URL paths, error messages
├── tests/
│   ├── smoke/                 # voltPos.smoke.spec.ts — home page, navigation
│   ├── e2e/orders/            # createOrder, deleteOrder
│   ├── regression/orders/     # bulkCreateOrders (10 orders serial)
│   └── api/                   # staff.api.spec.ts — GraphQL coverage
├── dashboard/                 # React dashboard for pass/fail visualisation
├── scripts/
│   └── check-server.mjs       # pretest health check
├── docker/                    # Dockerfile + docker-compose
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Prerequisites

| Tool         | Version           |
| ------------ | ----------------- |
| Node.js      | 18+ (LTS 20)      |
| npm          | 9+                |
| Volt POS app | running on 1420   |
| OS           | Win / mac / Linux |

---

## First-time setup

```bash
# 1. Install dependencies + Playwright Chromium browser
npm run setup

# 2. Apply the Tauri-detector guard in the app repo (browser-only testing)
#    In ../app/src/lib/i18n/tauri-language-detector.ts, wrap Tauri calls:
#      if (!window.__TAURI_INTERNALS__) { callback(undefined); return }

# 3. Start the Volt POS app (separate terminal)
cd ../app && npm run start    # Full Tauri (recommended)
# OR
cd ../app && npm run dev      # Vite dev server only

# 4. Run tests
npm test
```

`npm test` triggers `pretest` which calls [scripts/check-server.mjs](scripts/check-server.mjs) — if the app isn't reachable at `BASE_URL`, it prints how to start it and exits.

---

## Running tests

```bash
npm test                       # all tests, ENV=local (headless)
npm run test:headed            # with browser visible
npm run test:ui                # Playwright UI mode
npm run test:debug             # PWDEBUG=1 step-through
npm run test:smoke             # tagged @smoke
npm run test:regression        # tagged @regression
npm run test:e2e               # tests/e2e folder
npm run test:orders            # tests/e2e/orders
npm run test:api               # API project (GraphQL tests)
npm run test:bulk              # 10-order bulk regression
npm run codegen                # record a new test against localhost:1420
```

### Filtering by tag

Test titles carry tags like `@smoke`, `@regression`, `@payment`, `@api`, `@slow`. Filter with:

```bash
npx playwright test --grep @smoke
npx playwright test --grep "@regression.*@payment"
```

Tag constants live in [src/types/testTags.ts](src/types/testTags.ts).

---

## Reports

```bash
npm run report                 # opens reports/html
npm run report:allure          # generates and opens Allure
npm run report:allure:serve    # serves Allure live
```

### React pass/fail dashboard

```bash
cd dashboard
npm install
npm run dev                    # http://localhost:5173
```

It reads `reports/json/results.json` after every test run and renders pass/fail stats, charts, per-project & per-file breakdown, and a filterable test table. See [dashboard/README.md](dashboard/README.md).

---

## Authoring a new test

```ts
import { test, expect } from '@fixtures/index';
import { Tag } from '@/types/testTags';
import { STAFF, OWNER_PASSCODE } from '@data/static/staff';
import { SERVICES } from '@data/static/services';

test.describe(`Feature ${Tag.REGRESSION}`, () => {
  test.describe.configure({ mode: 'serial' });

  test('does the thing', async ({ homePage, checkoutPage, passcodeDialog, paymentSuccessPage }) => {
    await homePage.goto();
    await homePage.selectStaff(STAFF.LUNA.nickname);
    await homePage.selectService(SERVICES.SPA_SERVICE.name);
    await homePage.clickPay();
    await checkoutPage.selectPaymentMethod('Cash');
    await checkoutPage.clickCompletePayment();
    await passcodeDialog.enterPasscode(OWNER_PASSCODE);
    await paymentSuccessPage.waitForSuccess();
    await paymentSuccessPage.clickNoReceipt();
  });
});
```

Patterns to follow:

- Import `test, expect` from `@fixtures/index` — **not** from `@playwright/test` directly. Without this, fixtures aren't available.
- Order-creating tests should clean up by calling `paymentSuccessPage.clickNoReceipt()` to return to home.
- Order tests must run with `mode: 'serial'` because the home page only holds one active order at a time.
- Service names must be specific enough to avoid partial matches (e.g. `Acrylic Removal`, not `Black & White Full Set` which collides with other items).
- Use `OWNER_PASSCODE` (`8888`) for the passcode dialog — the dialog accepts the owner code, not per-staff codes.

---

## Volt POS knowledge

### Staff (dev environment)

| Nickname    | Staff code | Notes          |
| ----------- | ---------- | -------------- |
| Elise Terry | 0123       | Tenant / Owner |
| Emma2       | 9995       |                |
| Amelia      | 0114       |                |
| Isabella    | 0115       |                |
| Luna        | 1111       |                |

### App flow — Create Order

1. Home → click staff card (left panel)
2. Order panel appears (middle) → click services (right panel) to add
3. Click **Pay** → Checkout page
4. Choose payment method (Card / Cash / Gift Card / Other)
5. Click **Complete Payment** → Passcode dialog
6. Enter owner passcode (`8888`) → Payment Success page
7. Choose receipt option → back to Home

### GraphQL

Endpoint: `<BASE_URL>/graphql`. Useful queries seeded in code:

- `staffList { id firstName lastName nickname staffCode }` — see [StaffService](src/api/services/StaffService.ts)

---

## Known limitations

- **Browser mode only**: tests run in Chromium, not the Tauri webview. Tauri-specific features (printer, card terminal) can't be fully exercised.
- **Card payments**: cannot be completed end-to-end in browser mode. Use **Cash** for payment-completion tests.
- **Console errors**: a few non-critical errors are expected in browser mode (`asset://` scheme, printer image fetch). The smoke test filters them via `IGNORED_CONSOLE_ERRORS`.

---

## Docker

```bash
docker compose -f docker/docker-compose.yml run --rm e2e
```

---

## CI/CD

- `.github/workflows/e2e.yml` — runs on PR + push
- `.github/workflows/nightly-regression.yml` — nightly with Allure artifact upload

When the Volt POS app is hosted somewhere CI can reach, set `BASE_URL` and `GRAPHQL_URL` via GitHub Secrets.

---

## Troubleshooting

| Symptom                                                   | Fix                                                                              |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `✗ Volt POS app is not running at http://localhost:1420`  | Start the app: `cd ../app && npm run dev`                                        |
| App crashes in Chromium (`__TAURI_INTERNALS__` undefined) | Add the Tauri-detector guard in `../app/src/lib/i18n/tauri-language-detector.ts` |
| GraphQL test fails with HTTP 404                          | App is running but `/graphql` is gated — check `GRAPHQL_URL`                     |
| Test passes locally, fails in CI                          | CI uses retries; check trace artifacts in `test-results/` for race conditions    |
