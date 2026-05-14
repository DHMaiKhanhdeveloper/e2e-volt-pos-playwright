import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import * as fs from 'fs';

const PW_RESULTS = path.resolve(__dirname, '../reports/json/results.json');
const SAMPLE_RESULTS = path.resolve(__dirname, 'public/sample-results.json');

/**
 * Middleware that exposes /results.json:
 *   - if reports/json/results.json exists → serve it
 *   - else fall back to public/sample-results.json so the UI still renders
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
  },
});

export default defineConfig({
  plugins: [react(), playwrightResultsPlugin()],
  server: {
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
