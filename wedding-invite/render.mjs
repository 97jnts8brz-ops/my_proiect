import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
const [,, html, out, fpsArg, only] = process.argv;
const fps = +fpsArg || 30;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1.5 });
await p.goto('file://' + html); await p.evaluate(() => document.fonts.ready);
const dur = await p.evaluate(() => window.DUR);
if (only) { for (const t of only.split(',')) { await p.evaluate(t => render(t), +t); await p.screenshot({ path: `${out}_${t}.png` }); } await b.close(); process.exit(0); }
const ff = spawn('ffmpeg', ['-y','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','medium',out], { stdio: ['pipe','ignore','inherit'] });
const n = Math.round(dur * fps);
for (let i = 0; i < n; i++) { await p.evaluate(t => render(t), i / fps); const buf = await p.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
