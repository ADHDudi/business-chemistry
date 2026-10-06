import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers — read the committed icon assets straight from disk
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readBuf = (p: string) => fs.readFileSync(path.join(ROOT, p));
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

/** Brand tokens as declared in the Tailwind config in index.html (the app's base colours). */
function brandTokens(): Record<string, string> {
  const block = read('index.html').match(/brand:\s*\{([^}]*)\}/);
  if (!block) throw new Error('brand colour block not found in index.html');
  const tokens: Record<string, string> = {};
  for (const [, name, hex] of block[1].matchAll(/(\w+):\s*'(#[0-9a-fA-F]{6})'/g)) {
    tokens[name] = hex.toLowerCase();
  }
  return tokens;
}

/** Every colour value used by fill / stroke / stop-color in an SVG. */
function svgColors(svg: string): string[] {
  const values = [...svg.matchAll(/(?:fill|stroke|stop-color)\s*[=:]\s*"?([^";\s>]+)/g)].map(m => m[1].toLowerCase());
  return values.filter(v => v !== 'none' && !v.startsWith('url('));
}

function viewBox(svg: string): number[] {
  const m = svg.match(/viewBox="([^"]+)"/);
  if (!m) throw new Error('svg has no viewBox');
  return m[1].trim().split(/[\s,]+/).map(Number);
}

const ICON_SVGS = ['public/favicon.svg', 'public/bond-icon.svg', 'scripts/icons/shield.svg'];

// ---------------------------------------------------------------------------
// JUS-464: shield icon master in brand colours + reproducible generator
// ---------------------------------------------------------------------------

describe('JUS-464 – icon artwork uses only the app brand colours', () => {
  it('reads the brand palette from index.html', () => {
    expect(brandTokens()).toMatchObject({ violet: '#a014f0', purple: '#8c50f0', soft: '#f3ecff' });
  });

  it.each(ICON_SVGS)('%s exists', file => {
    expect(exists(file)).toBe(true);
  });

  it.each(ICON_SVGS)('%s only uses brand tokens or white', file => {
    const allowed = new Set([...Object.values(brandTokens()), '#ffffff']);
    const colors = svgColors(read(file));
    expect(colors.length).toBeGreaterThan(0);
    expect(colors.filter(c => !allowed.has(c))).toEqual([]);
  });

  it.each(ICON_SVGS)('%s has a square viewBox and no embedded rasters', file => {
    const svg = read(file);
    const [, , w, h] = viewBox(svg);
    expect(w).toBe(h);
    expect(svg).not.toMatch(/<image|data:image\/(png|jpe?g)/);
  });

  it('is regenerated from one source by `npm run icons`', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts.icons).toBe('node scripts/generate-icons.mjs');
    expect(exists('scripts/generate-icons.mjs')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Binary helpers (PNG header, ICO directory)
// ---------------------------------------------------------------------------

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngInfo(buf: Buffer) {
  expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  // IHDR: width, height, bit depth, colour type (2 = RGB, 6 = RGBA)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), colorType: buf[25] };
}

function icoEntries(buf: Buffer) {
  expect(buf.readUInt16LE(0)).toBe(0);
  expect(buf.readUInt16LE(2)).toBe(1); // type: icon
  return Array.from({ length: buf.readUInt16LE(4) }, (_, i) => {
    const e = 6 + 16 * i;
    const size = buf[e] || 256;
    const length = buf.readUInt32LE(e + 8);
    const offset = buf.readUInt32LE(e + 12);
    return { size, image: buf.subarray(offset, offset + length) };
  });
}

/** All <link> tags in index.html as attribute maps, in document order. */
function headLinks(): Record<string, string>[] {
  return [...read('index.html').matchAll(/<link\b([^>]*)>/g)].map(([, attrs]) =>
    Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v])),
  );
}

// ---------------------------------------------------------------------------
// JUS-465: desktop browser favicon
// ---------------------------------------------------------------------------

describe('JUS-465 – desktop favicon', () => {
  it('favicon.svg is the bare shield (no white app tile behind it)', () => {
    const svg = read('public/favicon.svg');
    expect(svg).toContain('id="shield"');
    expect(svg).not.toMatch(/<rect[^>]*fill="#ffffff"/);
  });

  it('favicon.ico holds 16, 32 and 48 px PNG images', () => {
    const entries = icoEntries(readBuf('public/favicon.ico'));
    expect(entries.map(e => e.size)).toEqual([16, 32, 48]);
    for (const { size, image } of entries) {
      expect(pngInfo(image)).toMatchObject({ width: size, height: size });
    }
  });

  it('index.html links the ICO fallback before the SVG favicon', () => {
    const icons = headLinks().filter(l => l.rel === 'icon');
    expect(icons).toEqual([
      expect.objectContaining({ href: '/favicon.ico', sizes: '48x48' }),
      expect.objectContaining({ href: '/favicon.svg', type: 'image/svg+xml' }),
    ]);
  });
});

// ---------------------------------------------------------------------------
// JUS-466: mobile home-screen icons (iOS touch icon, web manifest, theme colour)
// ---------------------------------------------------------------------------

function headMeta(name: string): string | undefined {
  const tag = read('index.html').match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`));
  return tag?.[1];
}

describe('JUS-466 – mobile home-screen icons', () => {
  const manifest = () => JSON.parse(read('public/manifest.webmanifest'));

  it('manifest describes an installable Bond app in brand colours', () => {
    expect(manifest()).toMatchObject({
      name: expect.stringContaining('Bond'),
      short_name: 'Bond',
      start_url: '/',
      display: 'standalone',
      theme_color: brandTokens().purple,
      background_color: '#ffffff',
    });
  });

  it('every manifest icon exists at the pixel size it declares', () => {
    const icons: { src: string; sizes: string; type: string }[] = manifest().icons;
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      const file = path.join('public', icon.src);
      expect(exists(file), icon.src).toBe(true);
      if (icon.type === 'image/png') {
        const [w, h] = icon.sizes.split('x').map(Number);
        expect(pngInfo(readBuf(file)), icon.src).toMatchObject({ width: w, height: h });
      }
    }
  });

  it('offers 192 and 512 px "any" icons and an opaque 512 px maskable icon', () => {
    const icons: { src: string; sizes: string; purpose: string }[] = manifest().icons;
    const any = icons.filter(i => i.purpose === 'any').map(i => i.sizes);
    expect(any).toEqual(expect.arrayContaining(['192x192', '512x512']));
    const maskable = icons.find(i => i.purpose === 'maskable');
    expect(maskable?.sizes).toBe('512x512');
    expect(pngInfo(readBuf(path.join('public', maskable!.src))).colorType).toBe(2);
  });

  it('apple-touch-icon is 180×180 and opaque, so iOS never shows black corners', () => {
    expect(pngInfo(readBuf('public/apple-touch-icon.png'))).toEqual({ width: 180, height: 180, colorType: 2 });
  });

  it('index.html links the touch icon and manifest and sets the brand theme colour', () => {
    const links = headLinks();
    expect(links).toContainEqual(expect.objectContaining({ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }));
    expect(links).toContainEqual(expect.objectContaining({ rel: 'manifest', href: '/manifest.webmanifest' }));
    expect(headMeta('theme-color')).toBe(brandTokens().purple);
    expect(headMeta('apple-mobile-web-app-title')).toBe('Bond');
  });
});
