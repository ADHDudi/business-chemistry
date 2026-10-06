// Regenerates every favicon / app icon from scripts/icons/shield.svg (JUS-464).
//
//   npm run icons
//
// Rasterises with the puppeteer devDependency (set PUPPETEER_EXECUTABLE_PATH to
// use a locally installed Chrome) and encodes PNG / ICO here, so no native
// image dependency is needed.

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

// ── Compose the variants from the master ────────────────────────────────────

const master = fs.readFileSync(path.join(ROOT, 'scripts/icons/shield.svg'), 'utf8');
const defs = master.match(/<defs>[\s\S]*?<\/defs>/)[0];
const shield = master.match(/<g id="shield"[\s\S]*?<\/g>/)[0];

const svg = (viewBox, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="512" height="512">\n  ${defs}\n  ${body}\n</svg>\n`;

// Shield bounding box is x 100–412, y 64–452; scale it about its centre.
const scaledShield = scale => `<g transform="translate(256 256) scale(${scale}) translate(-256 -258)">${shield}</g>`;

const VARIANTS = {
  // Desktop browser tabs: the bare shield on a transparent background reads best at 16–32 px.
  favicon: svg('56 58 400 400', shield),
  // In-app logo and manifest "any" icons: white rounded tile, as in the reference.
  tile: svg('0 0 512 512', `<rect width="512" height="512" rx="112" fill="#ffffff"/>${scaledShield(0.76)}`),
  // iOS home screen: full bleed and opaque; iOS applies its own corner mask.
  touch: svg('0 0 512 512', `<rect width="512" height="512" fill="#ffffff"/>${scaledShield(0.76)}`),
  // Android adaptive icons: shield inside the central 80% safe zone.
  maskable: svg('0 0 512 512', `<rect width="512" height="512" fill="#ffffff"/>${scaledShield(0.64)}`),
};

// ── PNG / ICO encoding ──────────────────────────────────────────────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Encode RGBA pixels as PNG; `opaque` drops the alpha channel (colour type 2). */
function encodePng(rgba, size, { opaque = false } = {}) {
  const channels = opaque ? 3 : 4;
  const raw = Buffer.alloc(size * (size * channels + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * channels + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = row + 1 + x * channels;
      for (let c = 0; c < channels; c++) raw[dst + c] = rgba[src + c];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = opaque ? 2 : 6; // RGB : RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** ICO container holding PNG-encoded images. */
function encodeIco(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    header[e] = size >= 256 ? 0 : size;
    header[e + 1] = size >= 256 ? 0 : size;
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(i => i.png)]);
}

// ── Rasterise in Chrome ─────────────────────────────────────────────────────

const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();

async function rasterise(svgText, size) {
  const base64 = await page.evaluate(async (svgText, size) => {
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgText);
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let bin = '';
    for (let i = 0; i < data.length; i += 0x8000) bin += String.fromCharCode(...data.subarray(i, i + 0x8000));
    return btoa(bin);
  }, svgText, size);
  return Buffer.from(base64, 'base64');
}

const write = (rel, data) => {
  fs.mkdirSync(path.dirname(path.join(PUBLIC, rel)), { recursive: true });
  fs.writeFileSync(path.join(PUBLIC, rel), data);
  console.log(`  public/${rel}`);
};

try {
  console.log('Generating icons from scripts/icons/shield.svg');
  write('favicon.svg', VARIANTS.favicon);
  write('bond-icon.svg', VARIANTS.tile);

  const favicons = [];
  for (const size of [16, 32, 48]) favicons.push({ size, png: encodePng(await rasterise(VARIANTS.favicon, size), size) });
  write('favicon.ico', encodeIco(favicons));

  write('apple-touch-icon.png', encodePng(await rasterise(VARIANTS.touch, 180), 180, { opaque: true }));
  write('icons/icon-192.png', encodePng(await rasterise(VARIANTS.tile, 192), 192));
  write('icons/icon-512.png', encodePng(await rasterise(VARIANTS.tile, 512), 512));
  write('icons/icon-maskable-512.png', encodePng(await rasterise(VARIANTS.maskable, 512), 512, { opaque: true }));
} finally {
  await browser.close();
}
