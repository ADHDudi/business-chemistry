// JUS-468: app icon checks in a real browser, at desktop and mobile viewports.
//
//   npm run test:e2e:icons                    # builds dist/ and serves it with vite preview
//   BASE_URL=https://business-chemistry.web.app/ npm run test:e2e:icons   # check a deployed site
//
// Env: PUPPETEER_EXECUTABLE_PATH (use a local Chrome), SKIP_BUILD=1 (reuse dist/).
// Third-party requests (Tailwind CDN, Google Fonts, gstatic…) are blocked so the
// result is deterministic offline and in CI; the icon must hold up without them.

import puppeteer, { KnownDevices } from 'puppeteer';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'test-output');
const PREVIEW_PORT = 4179;

const VIEWPORTS = [
  {
    name: 'desktop',
    iconSize: 96,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  },
  {
    name: 'mobile',
    iconSize: 80,
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    userAgent: KnownDevices['iPhone 13'].userAgent,
  },
];

// ── Reporting ────────────────────────────────────────────────────────────────

const results = [];
function check(viewport, name, ok, details = '') {
  results.push({ viewport, name, ok });
  console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${name}${details ? `  → ${details}` : ''}`);
}

// ── Image header parsing ─────────────────────────────────────────────────────

const PNG_SIGNATURE = '89504e470d0a1a0a';

function imageSizes(buf, contentType) {
  if (buf.subarray(0, 8).toString('hex') === PNG_SIGNATURE) {
    return [`${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`];
  }
  if (buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) {
    return Array.from({ length: buf.readUInt16LE(4) }, (_, i) => {
      const s = buf[6 + 16 * i] || 256;
      return `${s}x${s}`;
    });
  }
  if (contentType.includes('svg') && buf.toString('utf8').includes('<svg')) return ['any'];
  return [];
}

async function get(url) {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, type: res.headers.get('content-type') || '', buf };
}

// ── Local server ─────────────────────────────────────────────────────────────

async function startPreview() {
  if (!process.env.SKIP_BUILD) {
    console.log('Building dist/ …');
    execSync('npx vite build', { cwd: ROOT, stdio: 'ignore' });
  }
  const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: true,
  });
  const url = `http://127.0.0.1:${PREVIEW_PORT}/`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return { url, stop: () => process.kill(-server.pid) };
    } catch {
      /* not up yet */
    }
    await new Promise(r => setTimeout(r, 500));
  }
  process.kill(-server.pid);
  throw new Error('vite preview did not start');
}

// ── Checks per viewport ──────────────────────────────────────────────────────

async function checkViewport(browser, baseUrl, { name, iconSize, viewport, userAgent }) {
  console.log(`\n── ${name} (${viewport.width}×${viewport.height} @${viewport.deviceScaleFactor}x) ──`);
  const page = await browser.newPage();
  await page.setViewport(viewport);
  if (userAgent) await page.setUserAgent(userAgent);

  const origin = new URL(baseUrl).origin;
  await page.setRequestInterception(true);
  page.on('request', req => (new URL(req.url()).origin === origin ? req.continue() : req.abort()));

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  // 1. <head> icon links resolve to real images / a manifest (not the SPA's index.html)
  const links = await page.$$eval('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]', ls =>
    ls.map(l => ({ rel: l.getAttribute('rel'), href: l.href, sizes: l.getAttribute('sizes') })),
  );
  for (const rel of ['icon', 'apple-touch-icon', 'manifest']) {
    check(name, `<head> has rel="${rel}"`, links.some(l => l.rel === rel));
  }

  let manifestUrl;
  for (const link of links) {
    const res = await get(link.href);
    const label = `${link.rel} ${new URL(link.href).pathname}`;
    if (link.rel === 'manifest') {
      manifestUrl = link.href;
      check(name, `${label} → 200 manifest`, res.status === 200 && /json/.test(res.type), `${res.status} ${res.type}`);
      continue;
    }
    const sizes = imageSizes(res.buf, res.type);
    const isImage = res.status === 200 && res.type.startsWith('image/') && sizes.length > 0;
    check(name, `${label} → 200 image`, isImage, `${res.status} ${res.type} [${sizes.join(', ')}]`);
    if (link.rel === 'apple-touch-icon') check(name, 'apple-touch-icon is 180x180', sizes[0] === '180x180', sizes[0]);
    if (link.sizes && link.sizes !== 'any') {
      check(name, `${label} contains declared ${link.sizes}`, sizes.includes(link.sizes), sizes.join(', '));
    }
  }

  // 2. Every manifest icon is served at the size it declares
  if (manifestUrl) {
    let manifest = null;
    try {
      manifest = JSON.parse((await get(manifestUrl)).buf.toString('utf8'));
    } catch {
      /* reported below */
    }
    check(name, 'manifest parses as JSON', !!manifest);
    for (const icon of manifest?.icons || []) {
      const res = await get(new URL(icon.src, manifestUrl).href);
      const sizes = imageSizes(res.buf, res.type);
      check(name, `manifest icon ${icon.src} (${icon.purpose}) → ${icon.sizes}`,
        res.status === 200 && res.type.startsWith('image/') && sizes.includes(icon.sizes),
        `${res.status} ${res.type} [${sizes.join(', ')}]`);
    }
    check(name, 'manifest has a maskable icon', (manifest?.icons || []).some(i => i.purpose === 'maskable'));
  }

  // 3. The welcome-screen BrandIcon loads, is sized for this viewport, centred and on-screen
  let rect = null;
  try {
    await page.waitForSelector('img.brand-icon', { visible: true, timeout: 10000 });
    await page.waitForFunction(() => {
      const img = document.querySelector('img.brand-icon');
      return img && img.complete && img.naturalWidth > 0;
    }, { timeout: 10000 });
    rect = await page.$eval('img.brand-icon', img => {
      const r = img.getBoundingClientRect();
      return {
        left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height,
        src: new URL(img.src).pathname, alt: img.alt,
        vw: document.documentElement.clientWidth, vh: window.innerHeight,
      };
    });
  } catch {
    /* reported below */
  }
  check(name, 'welcome-screen BrandIcon loaded', !!rect, rect ? `${rect.src} alt="${rect.alt}"` : 'img.brand-icon not found / not loaded');
  if (rect) {
    check(name, `BrandIcon is ${iconSize}×${iconSize}`,
      Math.round(rect.width) === iconSize && Math.round(rect.height) === iconSize,
      `${rect.width}×${rect.height}`);
    const offset = Math.abs(rect.left + rect.width / 2 - rect.vw / 2);
    check(name, 'BrandIcon is horizontally centred', offset <= 2, `${offset.toFixed(1)}px off centre`);
    check(name, 'BrandIcon fits inside the viewport',
      rect.left >= 0 && rect.right <= rect.vw && rect.top >= 0 && rect.bottom <= rect.vh,
      `x ${rect.left.toFixed(0)}–${rect.right.toFixed(0)} of ${rect.vw}, y ${rect.top.toFixed(0)}–${rect.bottom.toFixed(0)} of ${rect.vh}`);
  }

  // 4. Viewport screenshot for visual review (no `clip`: Chrome returns a blank
  //    image for clipped captures under mobile emulation)
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `icons-${name}.png`);
  await page.screenshot({ path: file });
  console.log(`  📸 ${path.relative(ROOT, file)}`);
  await page.close();
}

// ── Main ─────────────────────────────────────────────────────────────────────

const preview = process.env.BASE_URL ? null : await startPreview();
const baseUrl = process.env.BASE_URL || preview.url;
console.log(`Icon E2E against ${baseUrl}`);

const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  args: ['--no-sandbox'],
});
try {
  for (const vp of VIEWPORTS) await checkViewport(browser, baseUrl, vp);
} finally {
  await browser.close();
  preview?.stop();
}

console.log('');
for (const { name } of VIEWPORTS) {
  const mine = results.filter(r => r.viewport === name);
  console.log(`${name}: ${mine.filter(r => r.ok).length}/${mine.length} passed`);
}
const failed = results.filter(r => !r.ok).length;
console.log(failed ? `\n❌ ${failed} icon check(s) failed` : '\n✅ All icon checks passed');
process.exit(failed ? 1 : 0);
