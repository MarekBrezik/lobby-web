import { defineConfig } from '@playwright/test';

const admin = process.env.TEST_TARGET === 'admin';
const baseURL = `http://127.0.0.1:${admin ? '8789' : '4173'}`;

export default defineConfig({
  testDir: admin ? './tests/admin' : './tests',
  testIgnore: admin ? [] : ['**/admin/**', '**/server/**'],
  workers: admin ? 1 : undefined,
  use: { baseURL },
  webServer: {
    command: admin ? 'npm run build && node scripts/dev-cloudflare.mjs --test' : 'npm run preview -- --port 4173',
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: !admin && !process.env.CI,
  },
});
