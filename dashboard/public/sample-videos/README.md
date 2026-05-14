# Sample videos directory

Place demo `.webm` or `.mp4` files here named to match the paths referenced in
[`../sample-results.json`](../sample-results.json), e.g.:

```
sample-videos/
├── createOrder-cash-pass/
│   └── video.webm
├── createOrder-multi-fail/
│   └── video.webm
└── ...
```

When Vite serves `/test-results/createOrder-cash-pass/video.webm`, it first
looks in `../../test-results/createOrder-cash-pass/video.webm` (real Playwright
output). If that does not exist, it falls back to
`sample-videos/createOrder-cash-pass/video.webm` (this folder), so the dashboard
demo is still functional before the first real test run.

This directory is empty by default — the UI gracefully degrades to a
"No recording at …" placeholder when no file is found.
