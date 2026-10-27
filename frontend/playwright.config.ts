import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Isolated SQLite DB for e2e runs - never touches the developer's real
// local-bridge data at ~/Library/Application Support/Retail Manager.
const e2eDataDir = path.resolve(__dirname, '../backend/local-bridge/data/e2e');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `rm -rf "${e2eDataDir}" && mkdir -p "${e2eDataDir}" && DATA_DIR="${e2eDataDir}" npm run seed && DATA_DIR="${e2eDataDir}" npm run dev`,
      cwd: path.resolve(__dirname, '../backend/local-bridge'),
      url: 'http://localhost:8787/health',
      timeout: 60_000,
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --port 5173',
      cwd: __dirname,
      url: 'http://localhost:5173',
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
