# E2E Dashboard

A React + Vite app that reads the Playwright JSON report and renders a pass/fail dashboard **with embedded video playback** for every test run.

## What it shows

3 tabs:

| Tab | What's there |
| --- | --- |
| **Overview** | Stat cards (total / passed / failed / flaky / skipped / pass-rate / total duration / recordings) + donut chart + per-project bars + per-file bars |
| **Recordings** | Video gallery — click any test to watch its recording, see failure stack, screenshots, trace download |
| **All tests** | Filterable & sortable table — click a row to expand the inline video and error message |

Each test exposes:
- Embedded `<video>` player (1× / 1.5× / 2× / 4× speed selector, download link)
- Poster image from the failure screenshot (if any)
- Error message + stack trace (for failed/flaky tests)
- Trace zip download

## Where the data + videos come from

The Vite dev server has two middlewares:

| Route | Resolves to |
| --- | --- |
| `GET /results.json` | `../reports/json/results.json` (or `public/sample-results.json` fallback) |
| `GET /test-results/*` | `../test-results/*` (or `public/sample-videos/*` fallback) |

So when you run `npm test` at the project root, videos under `test-results/<test-name>/video.webm` become immediately viewable in the dashboard.

## Enabling video for every test

In the parent project's [playwright.config.ts](../playwright.config.ts):

```ts
use: {
  trace: 'on',
  screenshot: 'on',
  video: (process.env.VIDEO ?? 'on') as 'on' | 'retain-on-failure' | 'off',
}
```

- Default: record video for every test (pass + fail)
- CI cost-sensitive: `VIDEO=retain-on-failure npm test` keeps only failures

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

## Architecture

```
src/
├── App.tsx                       # 3-tab shell
├── types.ts                      # Playwright JSON shape + FlatTest + TestArtifact
├── hooks/useResults.ts           # Loads /results.json, exposes summary + tests
├── utils/
│   ├── parseResults.ts           # Flattens suites, extracts video/screenshot/trace artifacts
│   └── format.ts
└── components/
    ├── Header.tsx                # File picker, reload
    ├── SummaryCards.tsx          # 8 KPI cards (including "Recordings" count)
    ├── DonutChart.tsx            # SVG pass/fail donut
    ├── GroupedBar.tsx            # Stacked bars by project / by file
    ├── TestRecordings.tsx        # Video gallery with outcome filter
    ├── TestTable.tsx             # Filterable table with inline video on expand
    └── VideoPlayer.tsx           # <video> + speed picker + 404 fallback
```

## Sample mode

If no run has happened yet, the dashboard renders [public/sample-results.json](public/sample-results.json) which includes:
- A passing **createOrder-cash** flow
- A failing **createOrder-multi-services** flow with mock error message
- A flaky **createOrder-single** flow (1st attempt fail, 2nd pass)
- Other smoke / API examples

The video player gracefully degrades to a "No recording at …" placeholder when the actual `.webm` file doesn't exist yet. Drop real videos into `public/sample-videos/<name>/video.webm` to make the demo fully functional offline.

## Notes

- Built with zero chart libraries — donut and bars are plain SVG / CSS
- TypeScript-strict throughout, ~160 KB minified bundle
- Read-only: never modifies project files or the Playwright report
