import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const testing = process.argv.includes('--test');
const directory = testing ? await mkdtemp(join(tmpdir(), 'lobby-admin-test-')) : '.wrangler/state';
const command = ['node_modules/wrangler/bin/wrangler.js', 'pages', 'dev', 'dist', '--ip', '127.0.0.1', '--port', testing ? '8789' : '8788', '--inspector-port', testing ? '9231' : '9230', '--compatibility-date', '2026-10-01', '--d1', 'MENU_DB', '--r2', 'MENU_IMAGES', '--binding', 'LOCAL_ADMIN=true', '--persist-to', directory];
const child = spawn(process.execPath, command, { stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', async (code) => { if (testing) await rm(directory, { recursive: true, force: true }); process.exitCode = code || 0; });
