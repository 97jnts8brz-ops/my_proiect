import { chromium } from 'playwright-core';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = process.cwd();
const types = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); s.end(d); } }); }).listen(8123);
const shots = process.argv.slice(2).length ? process.argv.slice(2) : ['front_golden','front_night','aerial','delivery','kitchen_cook','kitchen_hand'];
fs.mkdirSync('renders', { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
for (const s of shots) {
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  pg.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()); }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto(`http://localhost:8123/index.html?shot=${s}`);
  await pg.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await pg.screenshot({ path: `renders/${s}.png` }); console.log('ok', s); await pg.close();
}
await b.close(); srv.close();
