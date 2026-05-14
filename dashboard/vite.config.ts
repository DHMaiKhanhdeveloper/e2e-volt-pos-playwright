import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import * as fs from 'fs';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PW_RESULTS = path.resolve(PROJECT_ROOT, 'reports/json/results.json');
const TEST_RESULTS_DIR = path.resolve(PROJECT_ROOT, 'test-results');
const SAMPLE_RESULTS = path.resolve(__dirname, 'public/sample-results.json');
const SAMPLE_VIDEOS_DIR = path.resolve(__dirname, 'public/sample-videos');

const CONTENT_TYPES: Record<string, string> = {
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.zip': 'application/zip',
};

const serveFile = (res: import('http').ServerResponse, filePath: string): boolean => {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(filePath).pipe(res);
  return true;
};

/**
 * Middleware that exposes:
 *   GET /results.json        → ../reports/json/results.json (or sample fallback)
 *   GET /test-results/*      → ../test-results/* (Playwright videos/screenshots/traces)
 *                              with public/sample-videos/* as last-resort fallback
 */
const playwrightResultsPlugin = (): Plugin => ({
  name: 'playwright-results',
  configureServer(server) {
    server.middlewares.use('/results.json', (_req, res) => {
      const file = fs.existsSync(PW_RESULTS) ? PW_RESULTS : SAMPLE_RESULTS;
      try {
        const data = fs.readFileSync(file);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(data);
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err) }));
      }
    });

    server.middlewares.use('/test-results', (req, res) => {
      // Strip the prefix added by the dashboard URL.
      const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '');
      const real = path.join(TEST_RESULTS_DIR, rel);
      if (serveFile(res, real)) return;

      // Fall back to bundled sample videos so the UI works on a fresh clone.
      const fallback = path.join(SAMPLE_VIDEOS_DIR, rel);
      if (serveFile(res, fallback)) return;

      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Not found: ${rel}` }));
    });
  },
});

export default defineConfig({
  plugins: [react(), playwrightResultsPlugin()],
  server: {
    port: 5173,
    fs: { allow: ['..'] },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
