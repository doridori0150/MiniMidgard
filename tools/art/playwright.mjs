// Playwright for the headless tools: this repo has none of its own, so it borrows another checkout's (PLAYWRIGHT_FROM, default ../RiftLoopPrototype).
// Headless runs use their own browser profile, so they never touch the player's save in the in-app browser.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const from = process.env.PLAYWRIGHT_FROM || path.join(root, '..', 'RiftLoopPrototype');
let pw;
try { pw = createRequire(path.join(from, 'package.json'))('playwright'); } catch { throw new Error(`playwright를 찾지 못했습니다. PLAYWRIGHT_FROM=<playwright가 설치된 저장소>로 알려 주세요 (지금: ${from})`); }
export const { chromium } = pw;
/** the dev server the tools read (npm run dev, port 4200); restart it after copying new PNGs (Vite keeps the old ones) */
export const DEV = process.env.DEV_URL || 'http://localhost:4200';
