# Contributing

## Quick rules

1. **One PR = one feature/fix.** Keep them small and reviewable.
2. **Tests must pass locally** before pushing — `npm run lint && npm run typecheck && npm run test:smoke`.
3. **Don't commit `.env.local` / `.env.stage` / `.env.prod`** — they're git-ignored. Use `.env.example` for shareable defaults.
4. **Don't commit `src/data/dynamic/auth/*`** — these contain session tokens.

## Branch naming

```
feat/<scope>-<short-desc>      e.g. feat/payments-refund-flow
fix/<scope>-<short-desc>       e.g. fix/login-flaky-on-firefox
chore/<short-desc>             e.g. chore/upgrade-playwright-1.48
```

## Commit style

Conventional commits:

```
feat(payments): add refund e2e test
fix(login): wait for dashboard URL before asserting
chore(ci): pin Node to 20.x
```

## Adding a Page Object

1. Subclass `BasePage` (or the most specific page that already exists).
2. Locators are private readonly properties using `byTestId` / `byRole` factories.
3. Methods are user-intent (e.g. `submitForm()`), not low-level (e.g. `clickButton()`).
4. Add an explicit `waitForReady()` if `networkidle` is not enough.
5. Re-export from `src/pages/index.ts`.

## Adding a fixture

1. Create the fixture in `src/fixtures/<name>.fixture.ts`.
2. Merge it into the public `test` in `src/fixtures/index.ts` via `mergeTests`.
3. Document it in [README.md](README.md#authoring-a-new-test).

## Reviewing tests for flakiness

Before merging:

- No `page.waitForTimeout(...)`. Use locator auto-waiting or `waitFor({state: 'visible'})`.
- No order-dependent assertions across spec files (`test.describe.configure({ mode: 'parallel' })` is the default).
- API setup over UI setup whenever possible.
- Test data isolated via `faker` so parallel runs don't collide.
