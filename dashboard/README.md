# E2E Dashboard

A lightweight React + Vite app that reads the Playwright JSON report and renders a pass/fail dashboard.

## What it shows

- **Stat cards** — total / passed / failed / flaky / skipped / pass-rate / total duration
- **Donut chart** — outcome distribution
- **Stacked bars** — per project (chromium/firefox/webkit/api/…) and per spec file
- **Test table** with:
  - Filter by outcome, project, or free-text (title / suite / file / tag)
  - Sort by outcome, title, project, duration
  - Click a row to expand the failure stack trace

## Where the data comes from

The dashboard reads `/results.json`. The Vite dev server middleware in [vite.config.ts](vite.config.ts) maps that URL to:

1. `../reports/json/results.json` if it exists (i.e. you've run `npm test` in the parent project)
2. `public/sample-results.json` as fallback, so the UI still renders on a fresh clone

You can also load any other Playwright JSON report by clicking **"Open file…"** in the header.

## Run it

```bash
cd dashboard
npm install
npm run dev          # http://localhost:5173
```

Build a static bundle:

```bash
npm run build
npm run preview      # http://localhost:4173
```

## Wiring with the Playwright project

The parent `playwright.config.ts` already includes:

```ts
['json', { outputFile: 'reports/json/results.json' }],
```

so any run (`npm test`, `npm run test:smoke`, CI) updates the file the dashboard reads. Click **⟳ Reload** in the header after a run to refresh the view.

## Notes

- The dashboard never writes or modifies anything — it's read-only.
- No charting library — bars and donut are plain SVG/CSS, so the bundle stays tiny.
- TypeScript-strict throughout. Shape of the Playwright JSON is captured in [src/types.ts](src/types.ts).
