/**
 * App icon suites (JUS-468): favicon, apple-touch-icon, web manifest and the
 * welcome-screen BrandIcon, checked at a desktop and a mobile viewport.
 *
 * Third-party requests (Tailwind CDN, Google Fonts, gstatic…) are blocked so the
 * result is deterministic; the icon must keep its size and centring without them.
 */

import fs from 'fs';
import { KnownDevices } from 'puppeteer';
import { BASE_URL } from '../lib/config.js';
import { newPage } from '../lib/helpers.js';
import { captureScreenshot, logStep, runSuite } from '../lib/reporter.js';

const SCREENSHOT_DIR = new URL('../../test-output/', import.meta.url);

const VIEWPORTS = {
    desktop: { iconSize: 96, viewport: { width: 1280, height: 800, deviceScaleFactor: 1 } },
    mobile: {
        iconSize: 80,
        viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
        userAgent: KnownDevices['iPhone 13'].userAgent,
    },
};

const step = (name, ok, details = '', screenshot = null) => logStep(name, ok ? 'PASS' : 'FAIL', details, screenshot);

// ── Image header parsing ─────────────────────────────────────────────────────

/** Pixel sizes in a PNG / ICO / SVG response, e.g. ['180x180'] or ['16x16', '32x32', '48x48']. */
function imageSizes(buf, contentType) {
    if (buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
        return [`${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`];
    }
    if (buf.length > 6 && buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) {
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

// ── Checks ───────────────────────────────────────────────────────────────────

async function checkIcons(browser, name) {
    const { iconSize, viewport, userAgent } = VIEWPORTS[name];
    await runSuite(`Icons — ${name} (${viewport.width}×${viewport.height} @${viewport.deviceScaleFactor}x)`, async (track) => {
        const page = track(await newPage(browser, viewport));
        if (userAgent) await page.setUserAgent(userAgent);
        const origin = new URL(BASE_URL).origin;
        await page.setRequestInterception(true);
        page.on('request', req => (new URL(req.url()).origin === origin ? req.continue() : req.abort()));
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

        // 1. <head> icon links resolve to real images / a manifest, not the SPA's index.html
        const links = await page.$$eval('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]', ls =>
            ls.map(l => ({ rel: l.getAttribute('rel'), href: l.href, sizes: l.getAttribute('sizes') })));
        for (const rel of ['icon', 'apple-touch-icon', 'manifest']) {
            step(`<head> has rel="${rel}"`, links.some(l => l.rel === rel));
        }

        let manifestUrl;
        for (const link of links) {
            const res = await get(link.href);
            const label = `${link.rel} ${new URL(link.href).pathname}`;
            if (link.rel === 'manifest') {
                manifestUrl = link.href;
                step(`${label} → 200 manifest`, res.status === 200 && /json/.test(res.type), `${res.status} ${res.type}`);
                continue;
            }
            const sizes = imageSizes(res.buf, res.type);
            step(`${label} → 200 image`, res.status === 200 && res.type.startsWith('image/') && sizes.length > 0,
                `${res.status} ${res.type} [${sizes.join(', ')}]`);
            if (link.rel === 'apple-touch-icon') step('apple-touch-icon is 180x180', sizes[0] === '180x180', sizes[0]);
            if (link.sizes && link.sizes !== 'any') {
                step(`${label} contains declared ${link.sizes}`, sizes.includes(link.sizes), sizes.join(', '));
            }
        }

        // 2. Every manifest icon is served at the size it declares
        if (manifestUrl) {
            let manifest = null;
            try { manifest = JSON.parse((await get(manifestUrl)).buf.toString('utf8')); } catch { /* reported below */ }
            step('manifest parses as JSON', !!manifest);
            for (const icon of manifest?.icons || []) {
                const res = await get(new URL(icon.src, manifestUrl).href);
                const sizes = imageSizes(res.buf, res.type);
                step(`manifest icon ${icon.src} (${icon.purpose}) → ${icon.sizes}`,
                    res.status === 200 && res.type.startsWith('image/') && sizes.includes(icon.sizes),
                    `${res.status} ${res.type} [${sizes.join(', ')}]`);
            }
            step('manifest has a maskable icon', (manifest?.icons || []).some(i => i.purpose === 'maskable'));
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
        } catch { /* reported below */ }

        // Full-viewport capture: Chrome returns a blank image for clipped captures under mobile emulation
        const screenshot = await captureScreenshot(page);
        if (screenshot) {
            fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
            fs.writeFileSync(new URL(`icons-${name}.png`, SCREENSHOT_DIR), Buffer.from(screenshot, 'base64'));
        }

        step('welcome-screen BrandIcon loaded', !!rect,
            rect ? `${rect.src} alt="${rect.alt}"` : 'img.brand-icon not found / not loaded', screenshot);
        if (!rect) return;
        step(`BrandIcon is ${iconSize}×${iconSize}`,
            Math.round(rect.width) === iconSize && Math.round(rect.height) === iconSize, `${rect.width}×${rect.height}`);
        const offset = Math.abs(rect.left + rect.width / 2 - rect.vw / 2);
        step('BrandIcon is horizontally centred', offset <= 2, `${offset.toFixed(1)}px off centre`);
        step('BrandIcon fits inside the viewport',
            rect.left >= 0 && rect.right <= rect.vw && rect.top >= 0 && rect.bottom <= rect.vh,
            `x ${rect.left.toFixed(0)}–${rect.right.toFixed(0)} of ${rect.vw}, y ${rect.top.toFixed(0)}–${rect.bottom.toFixed(0)} of ${rect.vh}`);
    });
}

export const desktopIcons = (browser) => checkIcons(browser, 'desktop');
export const mobileIcons = (browser) => checkIcons(browser, 'mobile');
