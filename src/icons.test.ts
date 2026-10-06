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
