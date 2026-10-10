#!/usr/bin/env node
// UI 회귀 검사: tools/ui-check.html(32개 항목, ?qa 부팅이라 저장을 쓰지 않음)을 헤드리스로 돌립니다. 개발 서버(npm run dev)가 떠 있어야 합니다.
// 사용: node tools/qa/ui-check.mjs   (발열: 무거운 작업과 동시에 돌리지 않기, taskpolicy -b 권장)
import { chromium, DEV } from '../art/playwright.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(DEV + '/tools/ui-check.html');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 120000 });
const text = await page.textContent('#out');
console.log(text);
console.log('page errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
process.exit(/(\d+)\/\1 passed/.test(text) && !errors.length ? 0 : 1);
