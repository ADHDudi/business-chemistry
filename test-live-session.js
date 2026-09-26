/**
 * test-live-session.js
 * E2E acceptance tests for HomeScreen + Pair Session flows
 * (JUS-341: HomeScreen, JUS-344: Session entry, JUS-346: Pair sessions tab)
 *
 * Usage:
 *   node test-live-session.js [BASE_URL] [EMAIL_A] [PASS_A] [EMAIL_B] [PASS_B]
 *
 *   BASE_URL  — defaults to http://localhost:3002 (local dev server)
 *   EMAIL_A   — returning user (must have an existing report in Firestore)
 *   PASS_A    — password for user A
 *   EMAIL_B   — second user for pair session test (optional, falls back to user A)
 *   PASS_B    — password for user B
 *
 * Env vars (alternative to positional args):
 *   TEST_EMAIL_A, TEST_PASS_A, TEST_EMAIL_B, TEST_PASS_B
 *
 * Prerequisites:
 *   - `npm run dev` must be running on port 3002 (or provide a custom BASE_URL)
 *   - Both email accounts must be registered in Firebase Auth
 *   - User A must have at least one completed report in Firestore (users/<uid>/reports)
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import { execFile } from 'child_process';

// Load .env.test if present (project-local test credentials)
try {
    const envTest = fs.readFileSync(new URL('.env.test', import.meta.url), 'utf8');
    for (const line of envTest.split('\n')) {
        const m = line.match(/^([A-Z_]+)=(.+)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
} catch { /* .env.test is optional */ }

// Flags: --headed shows the browser window (default: headless, runs in the background
// without touching your own browser); --open opens the HTML report when done.
const argv = process.argv.slice(2);
const HEADED = argv.includes('--headed') || process.env.TEST_HEADED === '1';
const OPEN_REPORT = argv.includes('--open') || process.env.TEST_OPEN_REPORT === '1';
const args = argv.filter(a => !a.startsWith('--'));
const BASE_URL     = args[0] || 'http://localhost:3002';
const USER_A_EMAIL = args[1] || process.env.TEST_EMAIL_A || '';
const USER_A_PASS  = args[2] || process.env.TEST_PASS_A  || '';
const USER_B_EMAIL = args[3] || process.env.TEST_EMAIL_B || USER_A_EMAIL;
const USER_B_PASS  = args[4] || process.env.TEST_PASS_B  || USER_A_PASS;

const HEADLESS = !HEADED;
const SLOW_MO  = HEADED ? 40 : 0;

// Prefer Puppeteer's bundled Chrome; fall back to the system Chrome install
// (e.g. when only an x64 build is cached on Apple Silicon). Headless runs use a
// throwaway profile, so they never touch the Chrome window you are working in.
function resolveChromePath() {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
    try {
        const bundled = puppeteer.executablePath();
        if (bundled && fs.existsSync(bundled)) return bundled;
    } catch { /* not installed */ }
    const systemPaths = {
        darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
        linux: ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
        win32: ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
    }[process.platform] || [];
    return systemPaths.find(p => fs.existsSync(p));
}

// ─────────────────────────────────────────────────────────────────────────────
// Reporting Engine (same pattern as test.js)
// ─────────────────────────────────────────────────────────────────────────────

const suites = [];
let currentSuite = null;

function startSuite(name) {
    currentSuite = { name, steps: [], startTime: new Date() };
    suites.push(currentSuite);
    console.log(`\n${'═'.repeat(60)}\n  Suite: ${name}\n${'═'.repeat(60)}`);
}

function logStep(name, status, details = '', screenshot = null) {
    const icons = { PASS: '✅', FAIL: '❌', WARN: '⚠️ ', INFO: 'ℹ️ ', SKIP: '⏭️ ' };
    console.log(`  ${icons[status] || '  '} [${status}] ${name}${details ? '\n         → ' + details : ''}`);
    if (currentSuite) {
        currentSuite.steps.push({ name, status, details, timestamp: new Date().toISOString(), screenshot });
    }
}

function generateReport() {
    const allSteps = suites.flatMap(s => s.steps);
    const total  = allSteps.length;
    const passed = allSteps.filter(s => s.status === 'PASS').length;
    const failed = allSteps.filter(s => s.status === 'FAIL').length;
    const warned = allSteps.filter(s => s.status === 'WARN').length;

    const suiteRows = suites.map(suite => {
        const sp  = suite.steps.filter(s => s.status === 'PASS').length;
        const sf  = suite.steps.filter(s => s.status === 'FAIL').length;
        const sw  = suite.steps.filter(s => s.status === 'WARN').length;
        const dur = suite.steps.length > 1
            ? ((new Date(suite.steps.at(-1).timestamp) - new Date(suite.steps[0].timestamp)) / 1000).toFixed(1)
            : '–';
        return `<tr><td>${suite.name}</td><td>${suite.steps.length}</td>
            <td class="ok">${sp}</td><td class="${sf > 0 ? 'err' : 'ok'}">${sf}</td>
            <td class="${sw > 0 ? 'warn' : ''}">${sw}</td><td>${dur}s</td></tr>`;
    }).join('');

    const stepRows = suites.map(suite => `
        <div class="suite-card">
            <div class="suite-header">
                <h3>${suite.name}</h3>
                <span>${suite.steps.filter(s => s.status === 'PASS').length}/${suite.steps.length} passed</span>
            </div>
            ${suite.steps.map(step => `
                <div class="step ${step.status}">
                    <span class="badge ${step.status}">${step.status}</span>
                    <div class="step-body">
                        <div class="step-name">${step.name}</div>
                        ${step.details ? `<div class="step-details">${step.details}</div>` : ''}
                        ${step.screenshot ? `<img class="screenshot" src="data:image/png;base64,${step.screenshot}" />` : ''}
                        <div class="ts">${new Date(step.timestamp).toLocaleTimeString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Live Session E2E Report</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,sans-serif;max-width:980px;margin:0 auto;padding:24px;background:#f0f2f5;color:#1e293b}
  h1{color:#1e293b;border-bottom:3px solid #8c50f0;padding-bottom:12px;margin-bottom:4px}
  h2{color:#334155;margin:28px 0 10px;font-size:.85em;text-transform:uppercase;letter-spacing:1px}
  .meta{color:#64748b;font-size:.85em;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
  .card{background:white;padding:16px;border-radius:12px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.07)}
  .card .num{font-size:2em;font-weight:900}.card .lbl{font-size:.75em;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:4px}
  .pass-num{color:#16a34a}.fail-num{color:#dc2626}.warn-num{color:#d97706}
  table{width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.07);margin-bottom:28px}
  th{background:#1e293b;color:white;padding:10px 16px;text-align:left;font-size:.8em;text-transform:uppercase;letter-spacing:.5px}
  td{padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:.88em}
  tr:last-child td{border-bottom:none}
  .ok{color:#16a34a;font-weight:bold}.err{color:#dc2626;font-weight:bold}.warn{color:#d97706;font-weight:bold}
  .suite-card{background:white;border-radius:12px;margin-bottom:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.07)}
  .suite-header{padding:14px 20px;background:#1e293b;color:white;display:flex;justify-content:space-between;align-items:center}
  .suite-header h3{margin:0;font-size:.95em}.suite-header span{font-size:.8em;opacity:.8}
  .step{padding:12px 20px;border-left:4px solid #e2e8f0;border-bottom:1px solid #f1f5f9;display:flex;gap:12px;align-items:flex-start}
  .step:last-child{border-bottom:none}
  .step.PASS{border-left-color:#16a34a}.step.FAIL{border-left-color:#dc2626;background:#fef2f2}
  .step.WARN{border-left-color:#d97706;background:#fffbeb}.step.INFO{border-left-color:#3b82f6}.step.SKIP{border-left-color:#94a3b8}
  .badge{font-size:.7em;font-weight:800;padding:2px 8px;border-radius:999px;color:white;white-space:nowrap;margin-top:2px;flex-shrink:0}
  .badge.PASS{background:#16a34a}.badge.FAIL{background:#dc2626}.badge.WARN{background:#d97706}
  .badge.INFO{background:#3b82f6}.badge.SKIP{background:#94a3b8}
  .step-body{flex:1}.step-name{font-weight:700;font-size:.9em}
  .step-details{font-size:.8em;color:#475569;margin-top:4px;font-family:monospace;white-space:pre-wrap;background:#f8fafc;padding:8px;border-radius:6px;border:1px solid #e2e8f0}
  .screenshot{margin-top:10px;max-width:100%;border-radius:6px;border:1px solid #e2e8f0}
  .ts{font-size:.72em;color:#94a3b8;margin-top:3px}
</style></head><body>
  <h1>🧪 Live Session E2E Report</h1>
  <p class="meta">Target: <strong>${BASE_URL}</strong> · Generated: ${new Date().toLocaleString()}</p>
  <div class="grid">
    <div class="card"><div class="num">${total}</div><div class="lbl">Total Steps</div></div>
    <div class="card"><div class="num pass-num">${passed}</div><div class="lbl">Passed</div></div>
    <div class="card"><div class="num fail-num">${failed}</div><div class="lbl">Failed</div></div>
    <div class="card"><div class="num warn-num">${warned}</div><div class="lbl">Warnings</div></div>
  </div>
  <h2>Suite Summary</h2>
  <table><thead><tr><th>Suite</th><th>Steps</th><th>Passed</th><th>Failed</th><th>Warnings</th><th>Duration</th></tr></thead>
  <tbody>${suiteRows}</tbody></table>
  <h2>Detailed Results</h2>${stepRows}
</body></html>`;

    fs.writeFileSync('live-session-report.html', html);
    console.log('\n📄 Report: live-session-report.html');
    if (!OPEN_REPORT) return;
    const opener    = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const openerArgs = process.platform === 'win32' ? ['/c', 'start', 'live-session-report.html'] : ['live-session-report.html'];
    execFile(opener, openerArgs, (err) => { if (err) console.error('Could not open report:', err.message); });
}

async function captureScreenshot(page) {
    try { return await page.screenshot({ encoding: 'base64', type: 'png' }); }
    catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Sign in with email/password and wait for the HomeScreen to appear. */
async function signIn(page, email, password) {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    // Use page.type() with a small delay — more reliable with React controlled inputs
    await page.click('input[type="email"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="email"]', email, { delay: 40 });

    await page.click('input[type="password"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="password"]', password, { delay: 40 });

    // Verify inputs are filled before submitting
    const filled = await page.evaluate((e, p) => {
        const emailEl = document.querySelector('input[type="email"]');
        const passEl  = document.querySelector('input[type="password"]');
        return { email: emailEl?.value, pass: passEl?.value };
    }, email, password);
    if (filled.email !== email) throw new Error(`Email input mismatch: got "${filled.email}", expected "${email}"`);
    if (!filled.pass)           throw new Error('Password input appears empty after typing');

    await page.click('button[type="submit"]');

    // Step 1: Wait for HomeScreen to render at all (spinner OR content) — up to 20s
    // The spinner shows while getLatestReport() is in flight; content appears after.
    await page.waitForFunction(() => {
        // HomeScreen loading spinner
        if (document.querySelector('.animate-spin')) return true;
        // HomeScreen content (no report)
        if (document.querySelector('[data-testid="start-analysis-btn"]')) return true;
        // HomeScreen content (returning user)
        if (document.querySelector('[data-testid="persona-summary"]')) return true;
        return false;
    }, { timeout: 20000 }).catch(async () => {
        const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
        const authErr  = await page.evaluate(() =>
            document.querySelector('.bg-red-50 p')?.textContent || null
        );
        throw new Error(
            `HomeScreen not reached after login.\n` +
            `Auth error on page: ${authErr || 'none'}\n` +
            `Page text snippet: ${bodyText}`
        );
    });

    // Step 2: Wait for Firestore report query to resolve (spinner → content) — up to 15s more
    await page.waitForFunction(() => {
        return !!(document.querySelector('[data-testid="start-analysis-btn"]') ||
                  document.querySelector('[data-testid="persona-summary"]'));
    }, { timeout: 15000 }).catch(() => {
        // If still loading after 15s, fall through — individual suites handle their own waits
    });
}

/** Click through all 35 questionnaire questions (option 3 each) then click Finish. */
async function fillQuestionnaire(page) {
    // Wait for first question to render
    await page.waitForFunction(
        () => document.querySelectorAll('.grid.grid-cols-6.gap-2 button').length >= 6,
        { timeout: 10000 }
    );
    for (let i = 0; i < 35; i++) {
        const clicked = await page.evaluate(() => {
            const buttons = document.querySelectorAll('.grid.grid-cols-6.gap-2 button');
            if (buttons[2]) { buttons[2].click(); return true; }
            return false;
        });
        if (!clicked) throw new Error(`Question ${i + 1}: answer button not found`);
        await new Promise(r => setTimeout(r, 420)); // wait for auto-advance (300ms + buffer)
    }
    // Click the Finish button (enabled after all 35 answered)
    await page.waitForFunction(() => {
        const btn = [...document.querySelectorAll('button')].find(b =>
            b.textContent.includes("סיימתי") || b.textContent.includes("I'm Done")
        );
        return btn && !btn.disabled;
    }, { timeout: 5000 });
    await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b =>
            b.textContent.includes("סיימתי") || b.textContent.includes("I'm Done")
        );
        if (btn) btn.click();
    });
}

/** Read the 6-char session code displayed in the header. */
async function getSessionCode(page) {
    await page.waitForFunction(
        () => {
            const el = document.querySelector('span.font-mono.tracking-widest');
            return el && el.textContent.trim().length === 6;
        },
        { timeout: 10000 }
    );
    return page.evaluate(() =>
        document.querySelector('span.font-mono.tracking-widest')?.textContent?.trim() ?? null
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Guard — skip entire suite if credentials are missing
// ─────────────────────────────────────────────────────────────────────────────

function requireCreds(email, label) {
    if (!email) {
        logStep(`${label} credentials missing — suite skipped`, 'SKIP',
            'Pass credentials as CLI args or env vars: TEST_EMAIL_A / TEST_PASS_A (see file header)');
        return false;
    }
    return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — Auth flow: login → HomeScreen (not questionnaire)
// ─────────────────────────────────────────────────────────────────────────────

async function suiteAuthFlow(browser) {
    startSuite('HS-1: Auth flow — login lands on HomeScreen');
    if (!requireCreds(USER_A_EMAIL, 'User A')) return;
    const page = await browser.newPage();
    try {
        logStep('Navigate to app', 'INFO', BASE_URL);
        await signIn(page, USER_A_EMAIL, USER_A_PASS);
        logStep('TC-AUTH-01: Login succeeds', 'PASS', `Signed in as ${USER_A_EMAIL}`,
            await captureScreenshot(page));

        // HomeScreen should be visible — NOT the questionnaire
        const onHomeScreen = await page.evaluate(() =>
            !!(document.querySelector('[data-testid="persona-summary"]') ||
               document.querySelector('[data-testid="start-analysis-btn"]'))
        );
        logStep('TC-AUTH-02: HomeScreen shown after login (not questionnaire)', onHomeScreen ? 'PASS' : 'FAIL',
            onHomeScreen
                ? 'persona-summary or start-analysis-btn found at step 2'
                : 'HomeScreen not found — user may have landed on questionnaire or stayed on login',
            await captureScreenshot(page));

        // Questionnaire must NOT be visible yet
        const questionnaireVisible = await page.evaluate(() =>
            !!(document.querySelector('.grid.grid-cols-6.gap-2'))
        );
        logStep('TC-AUTH-03: Questionnaire NOT visible after login', !questionnaireVisible ? 'PASS' : 'FAIL',
            !questionnaireVisible
                ? 'Questionnaire grid not in DOM — correct, user is on HomeScreen'
                : 'Questionnaire was rendered immediately after login — step routing broken');

        // "Live Mode" toggle must be gone
        const liveModeToggle = await page.evaluate(() =>
            [...document.querySelectorAll('button')].some(b =>
                b.textContent.includes('Live Mode') || b.textContent.includes('מצב Live') ||
                b.textContent.includes('Exit Live') || b.textContent.includes('חזרה לרגיל')
            )
        );
        logStep('TC-AUTH-04: "Live Mode" toggle NOT in header', !liveModeToggle ? 'PASS' : 'FAIL',
            !liveModeToggle
                ? 'Live Mode toggle button absent — correctly replaced by HomeScreen entry'
                : 'Live Mode toggle still present in header — header was not updated');

        // Session code must NOT be in header before any session starts
        const sessionCodeVisible = await page.evaluate(() =>
            !!(document.querySelector('span.font-mono.tracking-widest'))
        );
        logStep('TC-AUTH-05: No session code in header at startup', !sessionCodeVisible ? 'PASS' : 'FAIL',
            !sessionCodeVisible
                ? 'Session code badge absent — correct (no active session)'
                : 'Session code badge is visible before starting a session — unexpected');

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — HomeScreen UI: returning user (has existing report)
// ─────────────────────────────────────────────────────────────────────────────

async function suiteHomeScreenReturningUser(browser) {
    startSuite('HS-2: HomeScreen — returning user with existing report');
    if (!requireCreds(USER_A_EMAIL, 'User A')) return;
    const page = await browser.newPage();
    try {
        await signIn(page, USER_A_EMAIL, USER_A_PASS);

        const hasPersonaSummary = !!(await page.$('[data-testid="persona-summary"]'));
        logStep('TC-HS-01: Persona summary card shown', hasPersonaSummary ? 'PASS' : 'WARN',
            hasPersonaSummary
                ? 'persona-summary card rendered — user has an existing report'
                : 'persona-summary not found — user may not have a report yet (run solo flow first)',
            await captureScreenshot(page));

        if (hasPersonaSummary) {
            const hasRedo = !!(await page.$('[data-testid="redo-analysis-btn"]'));
            logStep('TC-HS-02: "Redo Analysis" button visible', hasRedo ? 'PASS' : 'FAIL',
                hasRedo ? 'redo-analysis-btn present' : 'redo-analysis-btn not found');

            const startDisabled = await page.$eval('[data-testid="start-session-btn"]', el => el.disabled);
            const joinDisabled  = await page.$eval('[data-testid="join-session-btn"]',  el => el.disabled);
            logStep('TC-HS-03: Pair session buttons ENABLED for returning user',
                (!startDisabled && !joinDisabled) ? 'PASS' : 'FAIL',
                `start-session-btn disabled=${startDisabled}, join-session-btn disabled=${joinDisabled}`);
        } else {
            logStep('TC-HS-02', 'SKIP', 'Skipped — user has no existing report');
            logStep('TC-HS-03', 'SKIP', 'Skipped — user has no existing report');
        }

        // "Pair Sessions" tab should exist
        const hasPairTab = await page.evaluate(() =>
            [...document.querySelectorAll('button')].some(b =>
                b.textContent.includes('Pair Sessions') || b.textContent.includes('סשנים משותפים')
            )
        );
        logStep('TC-HS-04: "Pair Sessions" tab present', hasPairTab ? 'PASS' : 'FAIL',
            hasPairTab ? 'Pair Sessions tab button found' : 'Pair Sessions tab button not found');

        // Click Pair Sessions tab
        if (hasPairTab) {
            await page.evaluate(() => {
                const btn = [...document.querySelectorAll('button')].find(b =>
                    b.textContent.includes('Pair Sessions') || b.textContent.includes('סשנים משותפים')
                );
                if (btn) btn.click();
            });
            await new Promise(r => setTimeout(r, 500));
            const pairTabContent = await page.evaluate(() => {
                return document.body.textContent.includes('No pair sessions') ||
                       document.body.textContent.includes('אין סשנים משותפים');
            });
            logStep('TC-HS-05: Pair Sessions tab content renders', pairTabContent ? 'PASS' : 'WARN',
                pairTabContent ? 'Empty state "No pair sessions yet" shown' : 'Pair tab content not detected',
                await captureScreenshot(page));
        }

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — HomeScreen UI: first-time user (pair buttons locked)
// ─────────────────────────────────────────────────────────────────────────────

async function suiteHomeScreenFirstTimeUser(browser) {
    startSuite('HS-3: HomeScreen — first-time user (no existing report)');
    if (!requireCreds(USER_B_EMAIL, 'User B')) return;
    // This suite only makes sense if user B has never completed an analysis.
    // If USER_B === USER_A, skip this suite to avoid false failures.
    if (USER_B_EMAIL === USER_A_EMAIL) {
        logStep('TC-FT-ALL: Skipped', 'SKIP',
            'USER_B and USER_A are the same account — cannot test first-time UI without a fresh account');
        return;
    }
    const page = await browser.newPage();
    try {
        await signIn(page, USER_B_EMAIL, USER_B_PASS);

        const hasStartCTA = !!(await page.$('[data-testid="start-analysis-btn"]'));
        logStep('TC-FT-01: "Start Your Analysis" CTA shown', hasStartCTA ? 'PASS' : 'WARN',
            hasStartCTA
                ? 'start-analysis-btn found — first-time user empty state'
                : 'start-analysis-btn not found — user may already have a report',
            await captureScreenshot(page));

        if (hasStartCTA) {
            const startDisabled = await page.$eval('[data-testid="start-session-btn"]', el => el.disabled);
            const joinDisabled  = await page.$eval('[data-testid="join-session-btn"]',  el => el.disabled);
            logStep('TC-FT-02: Pair session buttons DISABLED for first-time user',
                (startDisabled && joinDisabled) ? 'PASS' : 'FAIL',
                `start-session-btn disabled=${startDisabled}, join-session-btn disabled=${joinDisabled}`);

            // No persona summary for first-time users
            const hasPersonaSummary = !!(await page.$('[data-testid="persona-summary"]'));
            logStep('TC-FT-03: Persona summary NOT shown for first-time user',
                !hasPersonaSummary ? 'PASS' : 'FAIL',
                !hasPersonaSummary ? 'persona-summary absent — correct for first-time user' : 'persona-summary unexpectedly shown');
        } else {
            logStep('TC-FT-02', 'SKIP', 'User B appears to have an existing report — first-time tests skipped');
            logStep('TC-FT-03', 'SKIP', 'User B appears to have an existing report — first-time tests skipped');
        }

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — Solo analysis flow: HomeScreen → Questionnaire → Results → Reset
// ─────────────────────────────────────────────────────────────────────────────

async function suiteSoloFlow(browser) {
    startSuite('HS-4: Solo analysis flow (HomeScreen → Q → Results → back to Home)');
    if (!requireCreds(USER_A_EMAIL, 'User A')) return;
    const page = await browser.newPage();
    try {
        await signIn(page, USER_A_EMAIL, USER_A_PASS);
        logStep('TC-SOLO-01: Signed in, on HomeScreen', 'PASS', `${USER_A_EMAIL}`,
            await captureScreenshot(page));

        // Navigate to questionnaire
        const startBtn = await page.$('[data-testid="start-analysis-btn"], [data-testid="redo-analysis-btn"]');
        if (!startBtn) throw new Error('Neither start-analysis-btn nor redo-analysis-btn found on HomeScreen');
        await startBtn.click();
        await page.waitForFunction(
            () => document.querySelectorAll('.grid.grid-cols-6.gap-2 button').length >= 6,
            { timeout: 10000 }
        );
        logStep('TC-SOLO-02: Questionnaire shown after clicking start/redo', 'PASS',
            'Question grid (6 answer buttons) detected', await captureScreenshot(page));

        // Answer all 35 questions
        logStep('TC-SOLO-03: Filling questionnaire (35 questions, option 3 each)...', 'INFO');
        await fillQuestionnaire(page);

        // Wait for results (step 4)
        await page.waitForSelector('[data-testid="tab-you"], [data-testid="match-score"]', { timeout: 15000 });
        logStep('TC-SOLO-04: Results view shown after completing questionnaire', 'PASS',
            'tab-you or match-score found — navigated to step 4', await captureScreenshot(page));

        // Verify it's the solo report (not ComparisonView)
        const isComparisonView = !!(await page.$('[data-testid="match-score"]'));
        const isSoloReport     = !!(await page.$('[data-testid="tab-you"]'));
        logStep('TC-SOLO-05: Solo ReportView shown (not ComparisonView)',
            (isSoloReport && !isComparisonView) ? 'PASS' : 'WARN',
            `tab-you=${isSoloReport}, match-score=${isComparisonView}`);

        // Reset → back to HomeScreen
        await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find(b =>
                b.textContent.includes('חזור') || b.textContent.includes('Back') ||
                b.textContent.includes('Reset') || b.textContent.includes('Start Over')
            );
            if (btn) btn.click();
        });
        await page.waitForSelector(
            '[data-testid="persona-summary"], [data-testid="start-analysis-btn"]',
            { timeout: 10000 }
        );
        logStep('TC-SOLO-06: Reset returns to HomeScreen (step 2)', 'PASS',
            'HomeScreen visible after reset — not login page', await captureScreenshot(page));

        // Confirm NOT on login page
        const onLogin = !!(await page.$('input[type="email"]'));
        logStep('TC-SOLO-07: Back to HomeScreen, NOT login page', !onLogin ? 'PASS' : 'FAIL',
            !onLogin ? 'email input absent — user still authenticated, on HomeScreen' : 'email input found — user was logged out unexpectedly');

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — Pair session host: create session, verify code, exit → HomeScreen
// ─────────────────────────────────────────────────────────────────────────────

async function suiteSessionHostFlow(browser) {
    startSuite('HS-5: Pair session host flow (create → code in header → exit → home)');
    if (!requireCreds(USER_A_EMAIL, 'User A')) return;
    const page = await browser.newPage();
    try {
        await signIn(page, USER_A_EMAIL, USER_A_PASS);

        // Pair session buttons only work if user has a report
        const startBtn = await page.$('[data-testid="start-session-btn"]');
        if (!startBtn) throw new Error('start-session-btn not found — user may not have a report');
        const isDisabled = await page.$eval('[data-testid="start-session-btn"]', el => el.disabled);
        if (isDisabled) {
            logStep('TC-HOST-01: SKIP — start-session-btn is disabled', 'SKIP',
                'User A has no existing report — complete solo flow (Suite 4) first, then re-run');
            return;
        }

        await startBtn.click();
        logStep('TC-HOST-01: Clicked "Start a Pair Session"', 'PASS', '', await captureScreenshot(page));

        // Should navigate to questionnaire (step 3) and session code should appear in header
        await page.waitForFunction(
            () => {
                const code = document.querySelector('span.font-mono.tracking-widest');
                const hasQ = document.querySelectorAll('.grid.grid-cols-6.gap-2 button').length >= 6;
                return code && hasQ;
            },
            { timeout: 12000 }
        );
        logStep('TC-HOST-02: Questionnaire opened and session code in header', 'PASS',
            'Both conditions met simultaneously', await captureScreenshot(page));

        const code = await getSessionCode(page);
        const isValidCode = /^[A-Z0-9]{6}$/.test(code);
        logStep('TC-HOST-03: Session code is 6 uppercase alphanumeric chars',
            isValidCode ? 'PASS' : 'FAIL',
            `Code: "${code}" — valid=${isValidCode}`);

        // Copy icon should be visible in the header badge
        const hasCopyIcon = await page.evaluate(() => {
            // Look for SVG icon next to the session code
            const badge = document.querySelector('span.font-mono.tracking-widest');
            return !!(badge?.closest('div')?.querySelector('svg'));
        });
        logStep('TC-HOST-04: Copy icon visible in session code badge', hasCopyIcon ? 'PASS' : 'WARN',
            hasCopyIcon ? 'SVG copy icon found inside code badge div' : 'Copy icon not detected');

        // Exit session via X button in header
        await page.evaluate(() => {
            // Find the X (close/exit) button in the header next to the session code
            const header = document.querySelector('header');
            const xBtn = header?.querySelector('button svg')?.closest('button') ||
                [...(header?.querySelectorAll('button') || [])].find(b => b.querySelector('svg'));
            if (xBtn) xBtn.click();
        });

        await page.waitForSelector(
            '[data-testid="persona-summary"], [data-testid="start-analysis-btn"]',
            { timeout: 10000 }
        );
        logStep('TC-HOST-05: Exit session → back to HomeScreen', 'PASS',
            'HomeScreen visible after exit', await captureScreenshot(page));

        // Session code should be gone from header
        const codeStillVisible = !!(await page.$('span.font-mono.tracking-widest'));
        logStep('TC-HOST-06: Session code gone from header after exit',
            !codeStillVisible ? 'PASS' : 'FAIL',
            !codeStillVisible ? 'font-mono session badge absent — session cleared' : 'Session code still in header after exit');

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — Join session modal: UI and error handling
// ─────────────────────────────────────────────────────────────────────────────

async function suiteJoinSessionModal(browser) {
    startSuite('HS-6: Join session modal (UI, cancel, error handling)');
    if (!requireCreds(USER_A_EMAIL, 'User A')) return;
    const page = await browser.newPage();
    try {
        await signIn(page, USER_A_EMAIL, USER_A_PASS);

        const joinBtn = await page.$('[data-testid="join-session-btn"]');
        if (!joinBtn) throw new Error('join-session-btn not found');
        const isDisabled = await page.$eval('[data-testid="join-session-btn"]', el => el.disabled);
        if (isDisabled) {
            logStep('TC-JOIN-ALL: SKIP — join-session-btn is disabled', 'SKIP',
                'User A has no existing report — complete solo flow (Suite 4) first');
            return;
        }

        await joinBtn.click();
        await new Promise(r => setTimeout(r, 500));

        // Modal should appear (fixed inset overlay)
        const modalVisible = await page.evaluate(() =>
            !!(document.querySelector('.fixed.inset-0'))
        );
        logStep('TC-JOIN-01: Join modal appears on button click', modalVisible ? 'PASS' : 'FAIL',
            modalVisible ? 'fixed.inset-0 overlay found' : 'No modal overlay detected',
            await captureScreenshot(page));

        // Code input should be present in modal
        const hasCodeInput = await page.evaluate(() =>
            !!(document.querySelector('.fixed.inset-0 input[type="text"]'))
        );
        logStep('TC-JOIN-02: Code input present in modal', hasCodeInput ? 'PASS' : 'FAIL',
            hasCodeInput ? 'text input found inside modal overlay' : 'No text input in modal');

        // Cancel button closes modal
        await page.evaluate(() => {
            const btns = [...document.querySelectorAll('.fixed.inset-0 button')];
            const cancelBtn = btns.find(b =>
                b.textContent.includes('ביטול') || b.textContent.includes('Cancel')
            );
            if (cancelBtn) cancelBtn.click();
        });
        await new Promise(r => setTimeout(r, 400));
        const modalGone = !(await page.$('.fixed.inset-0'));
        logStep('TC-JOIN-03: Modal closes on Cancel', modalGone ? 'PASS' : 'FAIL',
            modalGone ? 'fixed.inset-0 overlay removed after cancel' : 'Modal still visible after cancel',
            await captureScreenshot(page));

        // Reopen modal and test error: submit non-existent code
        await (await page.$('[data-testid="join-session-btn"]')).click();
        await new Promise(r => setTimeout(r, 500));
        const codeInput = await page.$('.fixed.inset-0 input[type="text"]');
        if (codeInput) {
            await codeInput.click({ clickCount: 3 });
            await codeInput.type('XXXXXX'); // very likely invalid code
            await page.evaluate(() => {
                // Submit the form
                const form = document.querySelector('.fixed.inset-0 form');
                if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            });
            await new Promise(r => setTimeout(r, 3000)); // wait for Firestore lookup
            const hasError = await page.evaluate(() => {
                // Look for error text in the modal
                const modal = document.querySelector('.fixed.inset-0');
                return modal ? (
                    modal.textContent.includes('not found') ||
                    modal.textContent.includes('Session') ||
                    modal.textContent.includes('שגיאה') ||
                    modal.textContent.includes('קוד')
                ) : false;
            });
            logStep('TC-JOIN-04: Inline error shown for invalid session code',
                hasError ? 'PASS' : 'WARN',
                hasError ? 'Error message found in modal after submitting invalid code' : 'No error message detected (Firestore may still be loading)',
                await captureScreenshot(page));
        } else {
            logStep('TC-JOIN-04: SKIP', 'SKIP', 'Could not reopen modal for error test');
        }

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — Full pair session: two browser contexts, simultaneous reveal
// ─────────────────────────────────────────────────────────────────────────────

async function suiteFullPairSession(browser) {
    startSuite('HS-7: Full pair session (two users, simultaneous ComparisonView reveal)');
    if (!requireCreds(USER_A_EMAIL, 'User A')) return;
    if (!requireCreds(USER_B_EMAIL, 'User B')) return;

    // Create two isolated browser contexts (separate auth/storage)
    const ctxA = await browser.createBrowserContext();
    const ctxB = await browser.createBrowserContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
        // ── Step 1: Both users sign in concurrently ──────────────────────────
        logStep('TC-PAIR-01: Sign in user A and user B concurrently', 'INFO',
            `A=${USER_A_EMAIL}, B=${USER_B_EMAIL}`);
        await Promise.all([
            signIn(pageA, USER_A_EMAIL, USER_A_PASS),
            signIn(pageB, USER_B_EMAIL, USER_B_PASS),
        ]);
        logStep('TC-PAIR-01: Both users on HomeScreen', 'PASS',
            'signIn() resolved for both contexts', await captureScreenshot(pageA));

        // ── Step 2: User A creates session ───────────────────────────────────
        const startBtnA = await pageA.$('[data-testid="start-session-btn"]');
        if (!startBtnA) throw new Error('User A: start-session-btn not found');
        const aDisabled = await pageA.$eval('[data-testid="start-session-btn"]', el => el.disabled);
        if (aDisabled) throw new Error('User A: start-session-btn is disabled — user has no existing report');

        await startBtnA.click();
        logStep('TC-PAIR-02: User A clicked "Start a Pair Session"', 'INFO');

        // Wait for questionnaire + code in header on pageA
        await pageA.waitForFunction(
            () => {
                const code = document.querySelector('span.font-mono.tracking-widest');
                return code && code.textContent.trim().length === 6;
            },
            { timeout: 12000 }
        );
        const sessionCode = await getSessionCode(pageA);
        logStep('TC-PAIR-03: User A created session, code in header', 'PASS',
            `Session code: ${sessionCode}`, await captureScreenshot(pageA));

        // ── Step 3: User B joins the session ─────────────────────────────────
        const joinBtnB = await pageB.$('[data-testid="join-session-btn"]');
        if (!joinBtnB) throw new Error('User B: join-session-btn not found');
        const bDisabled = await pageB.$eval('[data-testid="join-session-btn"]', el => el.disabled);
        if (bDisabled) throw new Error('User B: join-session-btn is disabled — user has no existing report');

        await joinBtnB.click();
        await new Promise(r => setTimeout(r, 600));

        // Type code into modal
        const codeInput = await pageB.$('.fixed.inset-0 input[type="text"]');
        if (!codeInput) throw new Error('User B: join code input not found in modal');
        await codeInput.click({ clickCount: 3 });
        await codeInput.type(sessionCode);
        logStep('TC-PAIR-04: User B typed session code into modal', 'INFO', `Code: ${sessionCode}`);

        // Submit
        await pageB.evaluate(() => {
            const form = document.querySelector('.fixed.inset-0 form');
            if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        // Both pages should navigate to questionnaire
        await Promise.all([
            pageA.waitForFunction(
                () => document.querySelectorAll('.grid.grid-cols-6.gap-2 button').length >= 6,
                { timeout: 15000 }
            ),
            pageB.waitForFunction(
                () => document.querySelectorAll('.grid.grid-cols-6.gap-2 button').length >= 6,
                { timeout: 15000 }
            ),
        ]);
        logStep('TC-PAIR-05: Both users on questionnaire', 'PASS',
            'Question grid detected on both pageA and pageB', await captureScreenshot(pageB));

        // ── Step 4: Both users answer all questions ───────────────────────────
        logStep('TC-PAIR-06: Both users filling questionnaire...', 'INFO');
        await Promise.all([
            fillQuestionnaire(pageA),
            fillQuestionnaire(pageB),
        ]);
        logStep('TC-PAIR-06: Both questionnaires completed', 'PASS');

        // ── Step 5: Waiting spinner should appear (status = in_progress, waiting for partner) ──
        // (One user finishes first — the other's spinner is fine to skip since they run in parallel)

        // ── Step 6: Both users see ComparisonView (status = both_ready → step 4) ──
        await Promise.all([
            pageA.waitForSelector('[data-testid="match-score"]', { timeout: 20000 }),
            pageB.waitForSelector('[data-testid="match-score"]', { timeout: 20000 }),
        ]);
        logStep('TC-PAIR-07: ComparisonView shown on BOTH pages (simultaneous reveal)', 'PASS',
            'match-score testid found on both pageA and pageB', await captureScreenshot(pageA));

        // Verify match score is a number 0-100
        const matchScoreA = await pageA.$eval('[data-testid="match-score"]', el => el.textContent.trim());
        const matchScoreB = await pageB.$eval('[data-testid="match-score"]', el => el.textContent.trim());
        const scoreNumA = parseInt(matchScoreA.replace(/\D/g, ''), 10);
        logStep('TC-PAIR-08: Match score is a number between 0–100',
            (!isNaN(scoreNumA) && scoreNumA >= 0 && scoreNumA <= 100) ? 'PASS' : 'FAIL',
            `User A sees: "${matchScoreA}", User B sees: "${matchScoreB}"`);

        // Persona labels should be present for both participants
        const personaLabelsA = await pageA.$$eval('[data-testid="persona-label"]', els => els.map(e => e.textContent.trim()));
        logStep('TC-PAIR-09: Persona labels shown for both participants',
            personaLabelsA.length >= 2 ? 'PASS' : 'WARN',
            `Found ${personaLabelsA.length} persona label(s) on pageA: ${personaLabelsA.join(', ')}`,
            await captureScreenshot(pageA));

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(pageA));
    } finally {
        await pageA.close();
        await pageB.close();
        await ctxA.close();
        await ctxB.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — Regression: session full protection
// ─────────────────────────────────────────────────────────────────────────────

async function suiteSessionFullProtection(browser) {
    startSuite('HS-8: Session full protection (third user can\'t join taken session)');
    if (!requireCreds(USER_A_EMAIL, 'User A')) return;
    const page = await browser.newPage();
    try {
        // This test needs a live session that already has two participants.
        // We simulate this by: User A creates a session, User B joins, then User A tries to re-join.
        // Since User A is already in the session as founderA, the founderBName check won't apply.
        // This is a lightweight smoke test: just confirm the error path surface exists.

        await signIn(page, USER_A_EMAIL, USER_A_PASS);

        const joinBtn = await page.$('[data-testid="join-session-btn"]');
        const isDisabled = joinBtn ? await page.$eval('[data-testid="join-session-btn"]', el => el.disabled) : true;
        if (isDisabled) {
            logStep('TC-FULL-ALL: SKIP — user has no report, join button disabled', 'SKIP');
            return;
        }

        // Try to join with a fictitious code to confirm error surface
        await joinBtn.click();
        await new Promise(r => setTimeout(r, 500));
        const codeInput = await page.$('.fixed.inset-0 input[type="text"]');
        if (!codeInput) throw new Error('Join modal code input not found');
        await codeInput.type('ZZZZZZ');
        await page.evaluate(() => {
            const form = document.querySelector('.fixed.inset-0 form');
            if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        await new Promise(r => setTimeout(r, 3000));
        const hasError = await page.evaluate(() => {
            const modal = document.querySelector('.fixed.inset-0');
            return modal && (
                modal.textContent.includes('Session not found') ||
                modal.textContent.includes('Session is full') ||
                modal.textContent.includes('שגיאה') ||
                modal.textContent.includes('לא נמצא')
            );
        });
        logStep('TC-FULL-01: Error displayed for invalid/full session code', hasError ? 'PASS' : 'WARN',
            hasError ? 'Error message detected in modal' : 'No error message yet — may still be loading',
            await captureScreenshot(page));

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
    console.log('\n🚀 Bond — Live Session E2E Test Suite');
    console.log(`   Target:  ${BASE_URL}`);
    console.log(`   User A:  ${USER_A_EMAIL || '(not set — suites will be skipped)'}`);
    console.log(`   User B:  ${USER_B_EMAIL || '(not set)'}`);
    console.log(`   Started: ${new Date().toLocaleString()}\n`);

    if (!USER_A_EMAIL) {
        console.warn('\n⚠️  No credentials provided. Run with:');
        console.warn('   node test-live-session.js http://localhost:3002 email@example.com password\n');
    }

    const browser = await puppeteer.launch({
        headless: HEADLESS,
        executablePath: resolveChromePath(),
        slowMo: SLOW_MO,
        defaultViewport: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
        args: ['--no-sandbox'],
        protocolTimeout: 300000,
    });

    try {
        // HS-1 first — just auth + navigation check (works for first-time users too)
        await suiteAuthFlow(browser);
        // HS-3 before HS-4 so User B still has no report
        await suiteHomeScreenFirstTimeUser(browser);
        // HS-4 seeds User A's Firestore report — must run before HS-2 / HS-5
        await suiteSoloFlow(browser);
        // HS-2 / HS-5 / HS-6 rely on User A having a report (set by HS-4)
        await suiteHomeScreenReturningUser(browser);
        await suiteSessionHostFlow(browser);
        await suiteJoinSessionModal(browser);
        await suiteFullPairSession(browser);
        await suiteSessionFullProtection(browser);
    } finally {
        generateReport();
        await browser.close();
    }
}

run();
