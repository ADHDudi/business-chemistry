/**
 * Run configuration: CLI flags, target environment and test-account credentials.
 *
 * Flags:
 *   --env=local|prod   target environment (or TEST_ENV); a URL as the first
 *                      positional argument overrides it
 *   --ask              prompt for the environment when none is given
 *   --only=a,b         run only these suites (see e2e/run.js for names)
 *   --headed           show the browser window (default: headless, so it never
 *                      touches the browser you are working in)
 *   --open             open the HTML report when the run finishes
 *
 * Credentials for the signed-in suites come from env vars or `.env.test`
 * (git-ignored): TEST_EMAIL_A, TEST_PASS_A, TEST_EMAIL_B, TEST_PASS_B.
 */

import fs from 'fs';
import readline from 'readline/promises';

const ROOT = new URL('../../', import.meta.url);

// Load .env.test if present (project-local test credentials)
try {
    const envTest = fs.readFileSync(new URL('.env.test', ROOT), 'utf8');
    for (const line of envTest.split('\n')) {
        const m = line.match(/^([A-Z_]+)=(.+)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
} catch { /* .env.test is optional */ }

const argv = process.argv.slice(2);
const args = argv.filter(a => !a.startsWith('--'));
const flagValue = (name) => (argv.find(a => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);

export const HEADED = argv.includes('--headed') || process.env.TEST_HEADED === '1';
export const OPEN_REPORT = argv.includes('--open') || process.env.TEST_OPEN_REPORT === '1';
export const SLOW_MO = HEADED ? 50 : 0;
export const ONLY = flagValue('only').split(',').map(s => s.trim()).filter(Boolean);

export const ENVIRONMENTS = {
    local: 'http://localhost:3002/',
    prod: 'https://business-chemistry.web.app/',
};

async function resolveBaseUrl() {
    if (args[0]) return args[0];
    const envFlag = flagValue('env') || process.env.TEST_ENV || '';
    const envKey = { local: 'local', prod: 'prod', production: 'prod' }[envFlag.toLowerCase()];
    if (envFlag && !envKey) {
        console.error(`Unknown environment "${envFlag}" — use local or prod.`);
        process.exit(1);
    }
    if (envKey) return ENVIRONMENTS[envKey];
    if (!argv.includes('--ask')) return ENVIRONMENTS.prod;

    if (!process.stdin.isTTY) {
        console.error('No terminal to ask in — pass --env=local or --env=prod.');
        process.exit(1);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        while (true) {
            const answer = (await rl.question(
                '\nWhich environment should the tests run against?\n' +
                `  1) local       ${ENVIRONMENTS.local}\n` +
                `  2) production  ${ENVIRONMENTS.prod}\n` +
                'Choose 1 or 2: '
            )).trim().toLowerCase();
            if (['1', 'l', 'local'].includes(answer)) return ENVIRONMENTS.local;
            if (['2', 'p', 'prod', 'production'].includes(answer)) return ENVIRONMENTS.prod;
            console.log('Please type 1 (local) or 2 (production).');
        }
    } finally {
        rl.close();
    }
}

export const BASE_URL = await resolveBaseUrl();

if (BASE_URL.startsWith('http://localhost')) {
    try {
        await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) });
    } catch {
        console.error(`\n❌ Nothing is answering at ${BASE_URL} — start the dev server first (npm run dev).`);
        process.exit(1);
    }
}

// Owner email unlocks the demo-persona shortcut on the login screen (isDudiMode in App.tsx)
export const DEMO_EMAIL = 'tsur.david@gmail.com';

export const USER_A = { email: process.env.TEST_EMAIL_A || '', password: process.env.TEST_PASS_A || '' };
export const USER_B = {
    email: process.env.TEST_EMAIL_B || USER_A.email,
    password: process.env.TEST_PASS_B || USER_A.password,
};

export const REPORT_PATH = new URL('e2e/report.html', ROOT);
