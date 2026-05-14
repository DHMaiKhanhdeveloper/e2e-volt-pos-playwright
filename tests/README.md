# Tests

| Folder        | Purpose                                                   | Tag suggestions    |
| ------------- | --------------------------------------------------------- | ------------------ |
| `smoke/`      | Fast critical path tests run on every PR / deploy         | `@smoke @critical` |
| `e2e/`        | End-to-end UI scenarios spanning multiple pages           | `@e2e`             |
| `regression/` | Broader coverage — runs nightly or before releases        | `@regression`      |
| `api/`        | Pure API tests using `APIRequestContext`                  | `@api`             |
| `visual/`     | Visual regression tests with `toHaveScreenshot` baselines | `@visual`          |

## Filtering

```sh
npm run test:smoke              # any spec tagged @smoke
npm run test -- --grep @payment # any spec tagged @payment
npm run test -- --project=api   # only the api project
```

## Adding a test

1. Pick the folder that matches the test type.
2. Import the merged test object: `import { test, expect } from '@fixtures/index';`
3. Use the right fixture:
   - UI test for one role → `asAdminContext` or `asCashierContext` (already logged in)
   - UI test that _is about_ login → `loginPage`
   - API only → `authService`, `paymentClient`, etc.
4. Tag the test in the `describe` title using `Tag` from `src/types/testTags.ts`.
