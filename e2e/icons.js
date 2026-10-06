/**
 * Icon E2E against a fresh production build (JUS-468).
 *
 *   npm run test:e2e:icons                         build dist/, serve it, run the icons suites
 *   npm run test:e2e:icons -- https://business-chemistry.web.app/   check a deployed site
 *
 * SKIP_BUILD=1 reuses the existing dist/. The suites themselves live in
 * e2e/suites/icons.js and also run as part of `npm run test:e2e` (group "icons").
 */

import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PORT = 4179;

const run = (url) => new Promise(resolve => {
    spawn('node', ['e2e/run.js', url, '--only=icons'], { cwd: ROOT, stdio: 'inherit' }).on('exit', code => resolve(code ?? 1));
});

const target = process.argv.slice(2).find(a => !a.startsWith('--'));
if (target) process.exit(await run(target));

if (!process.env.SKIP_BUILD) {
    console.log('🛠️  Building dist/ …');
    execSync('npx vite build', { cwd: ROOT, stdio: 'ignore' });
}

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT, stdio: 'ignore', detached: true,
});
const url = `http://127.0.0.1:${PORT}/`;
let up = false;
for (let i = 0; i < 60 && !up; i++) {
    up = await fetch(url).then(r => r.ok, () => false);
    if (!up) await new Promise(r => setTimeout(r, 500));
}

let code = 1;
try {
    if (up) code = await run(url);
    else console.error(`❌ vite preview did not answer on ${url}`);
} finally {
    process.kill(-server.pid);
}
process.exit(code);
