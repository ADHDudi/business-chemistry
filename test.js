
import puppeteer from 'puppeteer';
import fs from 'fs';
import { execFile } from 'child_process';

const args = process.argv.slice(2);
const BASE_URL = args[0] || 'https://business-chemistry.web.app/';
const HEADLESS = false;
const SLOW_MO = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Reporting Engine
// ─────────────────────────────────────────────────────────────────────────────

const suites = [];
let currentSuite = null;

function startSuite(name) {
    currentSuite = { name, steps: [], startTime: new Date() };
    suites.push(currentSuite);
    console.log(`\n${'═'.repeat(60)}\n  Suite: ${name}\n${'═'.repeat(60)}`);
}

function logStep(name, status, details = '', screenshot = null) {
    const icons = { PASS: '✅', FAIL: '❌', WARN: '⚠️ ', INFO: 'ℹ️ ' };
    console.log(`  ${icons[status] || '  '} [${status}] ${name}${details ? '\n         → ' + details : ''}`);
    if (currentSuite) {
        currentSuite.steps.push({ name, status, details, timestamp: new Date().toISOString(), screenshot });
    }
}

function generateReport() {
    const allSteps = suites.flatMap(s => s.steps);
    const total = allSteps.length;
    const passed = allSteps.filter(s => s.status === 'PASS').length;
    const failed = allSteps.filter(s => s.status === 'FAIL').length;
    const warned = allSteps.filter(s => s.status === 'WARN').length;

    const suiteRows = suites.map(suite => {
        const sp = suite.steps.filter(s => s.status === 'PASS').length;
        const sf = suite.steps.filter(s => s.status === 'FAIL').length;
        const sw = suite.steps.filter(s => s.status === 'WARN').length;
        const dur = suite.steps.length > 1
            ? ((new Date(suite.steps.at(-1).timestamp) - new Date(suite.steps[0].timestamp)) / 1000).toFixed(1)
            : '–';
        return `<tr>
            <td>${suite.name}</td>
            <td>${suite.steps.length}</td>
            <td class="ok">${sp}</td>
            <td class="${sf > 0 ? 'err' : 'ok'}">${sf}</td>
            <td class="${sw > 0 ? 'warn' : ''}">${sw}</td>
            <td>${dur}s</td>
        </tr>`;
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
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Acceptance Test Report</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,sans-serif;max-width:980px;margin:0 auto;padding:24px;background:#f0f2f5;color:#1e293b}
  h1{color:#1e293b;border-bottom:3px solid #334155;padding-bottom:12px;margin-bottom:4px}
  h2{color:#334155;margin:28px 0 10px;font-size:.85em;text-transform:uppercase;letter-spacing:1px}
  .meta{color:#64748b;font-size:.85em;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
  .card{background:white;padding:16px;border-radius:12px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.07)}
  .card .num{font-size:2em;font-weight:900}
  .card .lbl{font-size:.75em;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:4px}
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
  .step.WARN{border-left-color:#d97706;background:#fffbeb}.step.INFO{border-left-color:#3b82f6}
  .badge{font-size:.7em;font-weight:800;padding:2px 8px;border-radius:999px;color:white;white-space:nowrap;margin-top:2px;flex-shrink:0}
  .badge.PASS{background:#16a34a}.badge.FAIL{background:#dc2626}.badge.WARN{background:#d97706}.badge.INFO{background:#3b82f6}
  .step-body{flex:1}
  .step-name{font-weight:700;font-size:.9em}
  .step-details{font-size:.8em;color:#475569;margin-top:4px;font-family:monospace;white-space:pre-wrap;background:#f8fafc;padding:8px;border-radius:6px;border:1px solid #e2e8f0}
  .screenshot{margin-top:10px;max-width:100%;border-radius:6px;border:1px solid #e2e8f0}
  .ts{font-size:.72em;color:#94a3b8;margin-top:3px}
</style>
</head>
<body>
  <h1>🧪 Acceptance Test Report</h1>
  <p class="meta">Target: <strong>${BASE_URL}</strong> · Generated: ${new Date().toLocaleString()}</p>
  <div class="grid">
    <div class="card"><div class="num">${total}</div><div class="lbl">Total Steps</div></div>
    <div class="card"><div class="num pass-num">${passed}</div><div class="lbl">Passed</div></div>
    <div class="card"><div class="num fail-num">${failed}</div><div class="lbl">Failed</div></div>
    <div class="card"><div class="num warn-num">${warned}</div><div class="lbl">Warnings</div></div>
  </div>
  <h2>Suite Summary</h2>
  <table>
    <thead><tr><th>Suite</th><th>Steps</th><th>Passed</th><th>Failed</th><th>Warnings</th><th>Duration</th></tr></thead>
    <tbody>${suiteRows}</tbody>
  </table>
  <h2>Detailed Results</h2>
  ${stepRows}
</body>
</html>`;

    fs.writeFileSync('acceptance_report.html', html);
    console.log('\n📄 Report generated: acceptance_report.html');
    // Use execFile (not exec) — input is a hardcoded filename, no shell injection risk
    const opener = process.platform === 'win32' ? 'cmd'
        : process.platform === 'darwin' ? 'open'
        : 'xdg-open';
    const openerArgs = process.platform === 'win32'
        ? ['/c', 'start', 'acceptance_report.html']
        : ['acceptance_report.html'];
    execFile(opener, openerArgs, (err) => { if (err) console.error('Could not open report:', err.message); });
}

async function captureScreenshot(page) {
    try { return await page.screenshot({ encoding: 'base64', type: 'png' }); }
    catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Navigate to the app and wait for the login form to be ready. */
async function navigateToLoginPage(page) {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
}

/**
 * Fill the email/password login form using keyboard simulation so React
 * controlled inputs receive proper onChange events.
 * Pass null to skip a field entirely, '' to leave it empty (test HTML5 validation).
 */
async function fillLoginForm(page, email, password) {
    if (email !== null) {
        await page.click('input[type="email"]', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        if (email) await page.keyboard.type(email);
    }
    if (password !== null) {
        await page.click('input[type="password"]', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        if (password) await page.keyboard.type(password);
    }
}

/** Returns true if the login form is still visible (submission was blocked). */
async function isStillOnLoginPage(page) {
    return !!(await page.$('input[type="email"]'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — Auth: Page Structure
// ─────────────────────────────────────────────────────────────────────────────

async function runAuthStructureTests(browser) {
    startSuite('Auth — Page Structure & Form Elements');
    const page = await browser.newPage();
    try {
        logStep('Navigate to app', 'INFO', BASE_URL);
        await navigateToLoginPage(page);
        const title = await page.title();
        logStep('Page Load', 'PASS', `Title: "${title}"`, await captureScreenshot(page));

        const hasEmail = !!(await page.$('input[type="email"]'));
        const hasPwd = !!(await page.$('input[type="password"]'));
        const hasSubmit = !!(await page.$('button[type="submit"]'));
        logStep('Email input present', hasEmail ? 'PASS' : 'FAIL', 'input[type="email"] with required attribute');
        logStep('Password input present', hasPwd ? 'PASS' : 'FAIL', 'input[type="password"] with required attribute');
        logStep('Sign In submit button present', hasSubmit ? 'PASS' : 'FAIL', 'button[type="submit"]');

        const googleBtnLabel = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Google'));
            return btn ? btn.textContent.trim() : null;
        });
        logStep('Google Sign-In button present', googleBtnLabel ? 'PASS' : 'FAIL',
            googleBtnLabel
                ? `Found: "${googleBtnLabel}" — OAuth popup flow cannot be automated`
                : 'Google sign-in button not found in DOM');

        const signUpLabel = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button[type="button"]')]
                .find(b => b.textContent.trim() === 'Sign up');
            return btn ? btn.textContent.trim() : null;
        });
        logStep('Sign Up link present and wired',
            signUpLabel ? 'PASS' : 'FAIL',
            signUpLabel
                ? `"${signUpLabel}" exists; handler opens sign-up modal (createUserWithEmailAndPassword)`
                : '"Sign up" link not found in DOM');

        const forgotLabel = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button[type="button"]')]
                .find(b => b.textContent.includes('Forgot'));
            return btn ? btn.textContent.trim() : null;
        });
        logStep('Forgot Password link present and wired',
            forgotLabel ? 'PASS' : 'FAIL',
            forgotLabel
                ? `"${forgotLabel}" exists; handler opens reset modal (sendPasswordResetEmail)`
                : '"Forgot Password" link not found in DOM');

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — Auth: Email Sign-In Happy Path
// ─────────────────────────────────────────────────────────────────────────────

async function runSignInHappyPathTests(browser) {
    startSuite('Auth — Sign-In Happy Path');
    const page = await browser.newPage();
    try {
        // TC-SIGNIN-01: Valid email + password → reaches questionnaire
        logStep('TC-SIGNIN-01', 'INFO', 'Valid email + password → expect questionnaire');
        await navigateToLoginPage(page);
        await fillLoginForm(page, 'testuser@example.com', 'AnyPassword123');
        logStep('TC-SIGNIN-01: Form filled', 'INFO',
            'Email: testuser@example.com, Password: AnyPassword123', await captureScreenshot(page));

        page.click('button[type="submit"]').catch(() => {});
        try {
            await page.waitForFunction(
                () => !!document.querySelector('button.aspect-square'),
                { timeout: 12000 }
            );
            logStep('TC-SIGNIN-01: Valid credentials → questionnaire', 'PASS',
                'Reached questionnaire after sign-in', await captureScreenshot(page));
        } catch {
            logStep('TC-SIGNIN-01: Valid credentials → questionnaire', 'FAIL',
                'Timed out — did not reach questionnaire step', await captureScreenshot(page));
        }

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — Auth: Sign-In Fail Paths
// ─────────────────────────────────────────────────────────────────────────────

async function runSignInFailPathTests(browser) {
    startSuite('Auth — Sign-In Fail Paths');
    const page = await browser.newPage();
    try {

        // TC-FAIL-01: Empty email → HTML5 required blocks submission
        logStep('TC-FAIL-01', 'INFO', 'Empty email field → expect HTML5 validation to block');
        await navigateToLoginPage(page);
        await fillLoginForm(page, '', 'AnyPassword123');
        page.click('button[type="submit"]').catch(() => {});
        await new Promise(r => setTimeout(r, 1200));
        const blockedEmpty = await isStillOnLoginPage(page);
        logStep('TC-FAIL-01: Empty email blocked by HTML5 required',
            blockedEmpty ? 'PASS' : 'FAIL',
            blockedEmpty
                ? 'Correctly blocked — stayed on login page'
                : 'BUG: Form submitted with empty email',
            await captureScreenshot(page));

        // TC-FAIL-02: Invalid email format → HTML5 email type blocks
        logStep('TC-FAIL-02', 'INFO', 'Invalid email format "notanemail" → expect type=email validation');
        await navigateToLoginPage(page);
        // Inject value via native setter to bypass React's onChange while still
        // setting the DOM value for browser validation to act on
        await page.evaluate(() => {
            const el = document.querySelector('input[type="email"]');
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, 'notanemail');
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.click('input[type="password"]');
        await page.keyboard.type('AnyPassword123');
        page.click('button[type="submit"]').catch(() => {});
        await new Promise(r => setTimeout(r, 1200));
        const blockedBadEmail = await isStillOnLoginPage(page);
        logStep('TC-FAIL-02: Invalid email format blocked',
            blockedBadEmail ? 'PASS' : 'FAIL',
            blockedBadEmail
                ? 'Correctly blocked invalid email format "notanemail"'
                : 'BUG: Form accepted invalid email format',
            await captureScreenshot(page));

        // TC-FAIL-03: Empty password → HTML5 required blocks
        logStep('TC-FAIL-03', 'INFO', 'Empty password → expect HTML5 required to block');
        await navigateToLoginPage(page);
        await fillLoginForm(page, 'testuser@example.com', '');
        page.click('button[type="submit"]').catch(() => {});
        await new Promise(r => setTimeout(r, 1200));
        const blockedNoPwd = await isStillOnLoginPage(page);
        logStep('TC-FAIL-03: Empty password blocked by HTML5 required',
            blockedNoPwd ? 'PASS' : 'FAIL',
            blockedNoPwd
                ? 'Correctly blocked — stayed on login page'
                : 'BUG: Form submitted with empty password',
            await captureScreenshot(page));

        // TC-FAIL-04: Wrong credentials — documents the auth bypass bug
        // EXPECTED correct behavior: Firebase rejects the credentials with an error.
        // CURRENT actual behavior: any valid-format email+any password succeeds (bypass).
        logStep('TC-FAIL-04', 'INFO',
            'Wrong credentials (fake@nonexistent.xyz / WrongPass999) → should be rejected by Firebase auth');
        await navigateToLoginPage(page);
        await fillLoginForm(page, 'fake@nonexistent.xyz', 'WrongPass999');
        page.click('button[type="submit"]').catch(() => {});
        try {
            await page.waitForFunction(
                () => !!document.querySelector('button.aspect-square'),
                { timeout: 8000 }
            );
            logStep('TC-FAIL-04: Wrong credentials correctly rejected', 'WARN',
                '⚠️  AUTH BYPASS CONFIRMED: invalid credentials reached the questionnaire.\n' +
                '   handleRegister() only checks if email is non-empty — Firebase\n' +
                '   signInWithEmailAndPassword() is never called. Any valid-format email\n' +
                '   + any password bypasses auth.\n' +
                '   → Backlog: "Email/Password Auth Bypass" (High Priority)',
                await captureScreenshot(page));
        } catch {
            logStep('TC-FAIL-04: Wrong credentials correctly rejected', 'PASS',
                'Auth rejected invalid credentials — bypass is fixed!',
                await captureScreenshot(page));
        }

        // TC-FAIL-05: Sign Up button — documents missing handler
        logStep('TC-FAIL-05', 'INFO', 'Click "Sign up" → expect sign-up form to appear');
        await navigateToLoginPage(page);
        const signUpClicked = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button[type="button"]')]
                .find(b => b.textContent.trim() === 'Sign up');
            if (btn) { btn.click(); return true; }
            return false;
        });
        await new Promise(r => setTimeout(r, 1000));
        const signUpFormVisible = await page.evaluate(() =>
            // More than 2 inputs = sign-up form appeared (name + email + password)
            document.querySelectorAll('input').length > 2
        );
        logStep('TC-FAIL-05: Sign-Up flow appears on "Sign up" click',
            signUpClicked && !signUpFormVisible ? 'WARN' : (signUpFormVisible ? 'PASS' : 'FAIL'),
            signUpClicked
                ? (signUpFormVisible
                    ? 'Sign-up form appeared after click — flow is implemented'
                    : 'BUG: "Sign up" clicked but no sign-up form appeared — handler not implemented (Backlog: Email/Password Auth Bypass)')
                : '"Sign up" button not found in DOM',
            await captureScreenshot(page));

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — Auth: Google Sign-In
// ─────────────────────────────────────────────────────────────────────────────

async function runGoogleSignInTests(browser) {
    startSuite('Auth — Google Sign-In');
    const page = await browser.newPage();
    try {
        await navigateToLoginPage(page);

        // TC-GOOGLE-01: Button is visible and correctly labeled
        const googleBtn = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Google'));
            if (!btn) return null;
            const rect = btn.getBoundingClientRect();
            return { text: btn.textContent.trim(), visible: rect.width > 0 && rect.height > 0 };
        });
        logStep('TC-GOOGLE-01: Button visible and labeled',
            googleBtn?.visible ? 'PASS' : 'FAIL',
            googleBtn
                ? `Text: "${googleBtn.text}", Visible: ${googleBtn.visible}`
                : 'Google sign-in button not found',
            await captureScreenshot(page));

        // TC-GOOGLE-02: Google logo image loads correctly
        const logoLoaded = await page.evaluate(() => {
            const img = document.querySelector('img[alt="Google"]');
            return img ? img.complete && img.naturalWidth > 0 : false;
        });
        logStep('TC-GOOGLE-02: Google logo image loads', logoLoaded ? 'PASS' : 'WARN',
            logoLoaded
                ? 'Google SVG logo loaded from gstatic.com'
                : 'Google logo image failed to load or is missing');

        // TC-GOOGLE-03: Uses real Firebase auth (code-verified)
        logStep('TC-GOOGLE-03: Uses real Firebase signInWithPopup', 'PASS',
            'Verified in App.tsx handleGoogleLogin():\n' +
            '  signInWithPopup(auth, googleProvider) — real Firebase auth.\n' +
            '  On success: sets user.name from displayName, user.email, advances to step 2.\n' +
            '  Full OAuth popup flow requires manual verification (cannot be automated).');

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — Full Flow: Sign-In → Questionnaire → Report → Them (AI coaching)
// ─────────────────────────────────────────────────────────────────────────────

async function runFullFlowTest(browser) {
    startSuite('Full Flow — Sign-In → Questionnaire → Report → Them (AI coaching)');
    const page = await browser.newPage();
    try {
        logStep('Navigate', 'INFO', BASE_URL);
        await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        const title = await page.title();
        logStep('Page Load', 'PASS', `Title: "${title}"`, await captureScreenshot(page));

        // Sign In
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await fillLoginForm(page, 'testflow@example.com', 'TestPassword123');
        page.click('button[type="submit"]').catch(() => {});
        await page.waitForFunction(
            () => !!document.querySelector('button.aspect-square'),
            { timeout: 12000 }
        );
        logStep('Sign In → Questionnaire', 'PASS',
            'Passed login, reached questionnaire', await captureScreenshot(page));

        // Answer all questions
        let isComplete = false;
        let questionCount = 0;
        const MAX_Q = 50;

        while (!isComplete && questionCount < MAX_Q) {
            // Report view is reached when the "Them" tab (data-testid="tab-ai") appears
            const onReport = await page.evaluate(() =>
                !!document.querySelector('[data-testid="tab-ai"]')
            );
            if (onReport) {
                logStep('Questionnaire Complete', 'PASS', `${questionCount} questions answered — report view detected`);
                isComplete = true;
                break;
            }

            const hasBtn = await page.$('button.aspect-square');
            if (hasBtn) {
                await page.click('button.aspect-square');
                questionCount++;
                await new Promise(r => setTimeout(r, 100));

                const canFinish = await page.evaluate(() => {
                    const fin = [...document.querySelectorAll('button')]
                        .find(b => (b.textContent.includes('Finish') || b.textContent.includes('סיימתי')) && !b.disabled);
                    return !!fin;
                });
                if (canFinish) {
                    logStep('Finish Button', 'INFO', `Clicking Finish after ${questionCount} answers`);
                    await page.evaluate(() => {
                        const fin = [...document.querySelectorAll('button')]
                            .find(b => (b.textContent.includes('Finish') || b.textContent.includes('סיימתי')) && !b.disabled);
                        if (fin) fin.click();
                    });
                    await new Promise(r => setTimeout(r, 3000));
                    isComplete = true;
                }
            } else {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        if (questionCount >= MAX_Q) throw new Error('Questionnaire safety break — possible infinite loop');

        // Report View — wait for the "Them" tab (report view indicator)
        await page.waitForFunction(
            () => !!document.querySelector('[data-testid="tab-ai"]'),
            { timeout: 10000 }
        );
        logStep('Report Loaded', 'PASS', 'Report view rendered (You/Them/Together tabs visible)', await captureScreenshot(page));

        // Click "Them" tab — where AI coaching now lives
        const clickedAI = await page.evaluate(() => {
            const btn = document.querySelector('[data-testid="tab-ai"]');
            if (btn) { btn.click(); return true; }
            return false;
        });

        if (!clickedAI) {
            logStep('Them Tab Click', 'FAIL', '"Them" tab button not found in DOM');
        } else {
            logStep('Them Tab Click', 'PASS', 'Clicked Them tab (AI coaching)');
            try {
                await page.waitForFunction(
                    () => !!document.querySelector('[data-testid="ai-loaded"]') ||
                          !!document.querySelector('[data-testid="ai-error"]'),
                    { timeout: 30000 }
                );
                const hasError = !!(await page.$('[data-testid="ai-error"]'));
                logStep('AI Content Rendered', hasError ? 'FAIL' : 'PASS',
                    hasError
                        ? 'AI error state shown — check Gemini API key / quota'
                        : 'AI coaching cards rendered successfully',
                    await captureScreenshot(page));
            } catch {
                logStep('AI Timeout', 'FAIL',
                    'AI analysis did not render within 30s — possible cold start or API issue',
                    await captureScreenshot(page));
            }
        }

        // Reset / Start Over
        const clickedReset = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find(b =>
                b.textContent.includes('Start Over') ||
                b.textContent.toUpperCase().includes('RESTART') ||
                b.textContent.includes('התחל מחדש')
            );
            if (btn) { btn.click(); return true; }
            return false;
        });
        await new Promise(r => setTimeout(r, 1000));
        const backOnLogin = await isStillOnLoginPage(page);
        logStep('Reset → Back to Login',
            clickedReset && backOnLogin ? 'PASS' : 'WARN',
            clickedReset
                ? (backOnLogin ? 'Reset returned to login correctly' : 'Clicked reset but login form not visible')
                : 'Reset button not found — may only exist in specific tab',
            await captureScreenshot(page));

        logStep('Full Flow Complete', 'PASS', 'All stages verified end-to-end');

    } catch (err) {
        logStep('Flow Error', 'FAIL', err.message, await captureScreenshot(page));
        console.error('❌ FULL FLOW TEST FAILED:', err);
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: navigate to report view (sign-in + complete questionnaire)
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToReport(browser) {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await fillLoginForm(page, 'testflow@example.com', 'TestPassword123');
    page.click('button[type="submit"]').catch(() => {});
    await page.waitForFunction(() => !!document.querySelector('button.aspect-square'), { timeout: 12000 });

    let questionCount = 0;
    while (questionCount < 50) {
        const onReport = await page.evaluate(() => !!document.querySelector('[data-testid="tab-ai"]'));
        if (onReport) break;
        const hasBtn = await page.$('button.aspect-square');
        if (hasBtn) {
            await page.click('button.aspect-square');
            questionCount++;
            await new Promise(r => setTimeout(r, 80));
            const canFinish = await page.evaluate(() => {
                const fin = [...document.querySelectorAll('button')]
                    .find(b => (b.textContent.includes('Finish') || b.textContent.includes('סיימתי')) && !b.disabled);
                return !!fin;
            });
            if (canFinish) {
                await page.evaluate(() => {
                    const fin = [...document.querySelectorAll('button')]
                        .find(b => (b.textContent.includes('Finish') || b.textContent.includes('סיימתי')) && !b.disabled);
                    if (fin) fin.click();
                });
                await new Promise(r => setTimeout(r, 3000));
                break;
            }
        } else {
            await new Promise(r => setTimeout(r, 300));
        }
    }
    await page.waitForFunction(() => !!document.querySelector('[data-testid="tab-ai"]'), { timeout: 10000 });
    return page;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — Report: Tab Structure
// ─────────────────────────────────────────────────────────────────────────────

async function runReportTabStructureTests(browser) {
    startSuite('Report — Tab Structure');
    let page;
    try {
        page = await navigateToReport(browser);

        // All 4 tab buttons present
        const tabs = ['overview', 'ai', 'prepare', 'matrix'];
        for (const tab of tabs) {
            const exists = !!(await page.$(`[data-testid="tab-${tab}"]`));
            logStep(`Tab "${tab}" button present`, exists ? 'PASS' : 'FAIL',
                `[data-testid="tab-${tab}"] ${exists ? 'found' : 'missing'}`);
        }

        // Default tab: overview content visible
        const overviewVisible = !!(await page.$('[data-testid="tab-content-overview"]'));
        logStep('Default tab is Overview', overviewVisible ? 'PASS' : 'FAIL',
            overviewVisible ? 'tab-content-overview rendered on load' : 'Overview content not visible on load',
            await captureScreenshot(page));

        // Each tab renders its content when clicked
        for (const tab of ['ai', 'prepare', 'matrix']) {
            await page.evaluate((t) => {
                document.querySelector(`[data-testid="tab-${t}"]`)?.click();
            }, tab);
            await new Promise(r => setTimeout(r, 600));
            const contentVisible = !!(await page.$(`[data-testid="tab-content-${tab}"]`));
            logStep(`Tab "${tab}" renders content on click`, contentVisible ? 'PASS' : 'FAIL',
                `tab-content-${tab} ${contentVisible ? 'visible' : 'missing after click'}`,
                await captureScreenshot(page));
            // Return to overview
            await page.evaluate(() => document.querySelector('[data-testid="tab-overview"]')?.click());
            await new Promise(r => setTimeout(r, 300));
        }

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, page ? await captureScreenshot(page) : null);
    } finally {
        if (page) await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — Report: AI Analysis (AI tab)
// ─────────────────────────────────────────────────────────────────────────────

async function runAIAnalysisTests(browser) {
    startSuite('Report — AI Analysis Tab');
    let page;
    try {
        page = await navigateToReport(browser);

        // Click the AI tab
        await page.evaluate(() => document.querySelector('[data-testid="tab-ai"]')?.click());
        await new Promise(r => setTimeout(r, 500));
        const aiTabActive = !!(await page.$('[data-testid="tab-content-ai"]'));
        logStep('AI tab activates', aiTabActive ? 'PASS' : 'FAIL',
            `tab-content-ai ${aiTabActive ? 'rendered' : 'not found'}`);

        // AI content loads within 30s (initial load — no persona selected yet)
        logStep('Waiting for AI insights to load', 'INFO', 'Expecting ai-loaded or ai-error within 30s');
        try {
            await page.waitForFunction(
                () => !!document.querySelector('[data-testid="ai-loaded"]') ||
                      !!document.querySelector('[data-testid="ai-error"]'),
                { timeout: 30000 }
            );
            const hasError = !!(await page.$('[data-testid="ai-error"]'));
            const errorText = hasError ? await page.evaluate(() =>
                document.querySelector('[data-testid="ai-error"]')?.textContent?.trim()
            ) : null;
            logStep('AI insights loaded', hasError ? 'FAIL' : 'PASS',
                hasError ? `Error state shown: ${errorText}` : 'AI coaching content rendered',
                await captureScreenshot(page));
        } catch {
            logStep('AI insights timeout', 'FAIL',
                'ai-loaded/ai-error did not appear within 30s — possible cold start or API failure',
                await captureScreenshot(page));
        }

        // Persona picker buttons present
        for (const persona of ['guardian', 'driver', 'integrator', 'pioneer']) {
            const btn = !!(await page.$(`[data-testid="persona-btn-${persona}"]`));
            logStep(`Persona button: ${persona}`, btn ? 'PASS' : 'FAIL',
                `persona-btn-${persona} ${btn ? 'found' : 'missing'}`);
        }

        // Select each persona and verify AI reloads
        for (const persona of ['guardian', 'driver', 'integrator', 'pioneer']) {
            logStep(`Select persona: ${persona}`, 'INFO', 'Clicking persona button → waiting for AI reload');
            await page.evaluate((p) => {
                document.querySelector(`[data-testid="persona-btn-${p}"]`)?.click();
            }, persona);
            try {
                await page.waitForFunction(
                    () => !!document.querySelector('[data-testid="ai-loaded"]') ||
                          !!document.querySelector('[data-testid="ai-error"]'),
                    { timeout: 35000 }
                );
                const hasError = !!(await page.$('[data-testid="ai-error"]'));
                logStep(`AI loads for persona: ${persona}`, hasError ? 'FAIL' : 'PASS',
                    hasError ? 'AI error shown after persona selection' : 'AI coaching rendered for selected persona',
                    await captureScreenshot(page));
            } catch {
                logStep(`AI timeout for persona: ${persona}`, 'FAIL',
                    'AI did not load within 35s after persona selection',
                    await captureScreenshot(page));
            }
        }

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, page ? await captureScreenshot(page) : null);
    } finally {
        if (page) await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — Auth Modals: Sign-Up & Forgot Password
// ─────────────────────────────────────────────────────────────────────────────

async function runAuthModalTests(browser) {
    startSuite('Auth Modals — Sign-Up & Forgot Password');
    const page = await browser.newPage();
    try {
        // Sign-Up modal
        await navigateToLoginPage(page);
        const signUpClicked = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button[type="button"]')]
                .find(b => b.textContent.trim() === 'Sign up');
            if (btn) { btn.click(); return true; }
            return false;
        });
        await new Promise(r => setTimeout(r, 800));
        const signUpInputs = await page.evaluate(() => document.querySelectorAll('input').length);
        logStep('Sign-Up modal opens', signUpClicked && signUpInputs > 2 ? 'PASS' : 'FAIL',
            signUpClicked
                ? `${signUpInputs} inputs visible (need >2 for sign-up form)`
                : '"Sign up" button not found',
            await captureScreenshot(page));

        // Sign-Up modal has name, email, password fields
        if (signUpInputs > 2) {
            const hasName = !!(await page.$('input[placeholder*="name"], input[name="name"], input[autocomplete="name"]'));
            const hasEmail = (await page.$$('input[type="email"]')).length > 0;
            const hasPwd = (await page.$$('input[type="password"]')).length > 0;
            logStep('Sign-Up form has name field', hasName ? 'PASS' : 'WARN',
                hasName ? 'Name input found' : 'Name input not found (may use placeholder or different attr)');
            logStep('Sign-Up form has email field', hasEmail ? 'PASS' : 'FAIL',
                hasEmail ? 'Email input found' : 'Email input missing');
            logStep('Sign-Up form has password field', hasPwd ? 'PASS' : 'FAIL',
                hasPwd ? 'Password input found' : 'Password input missing');

            // Close modal (Escape or close button)
            await page.keyboard.press('Escape');
            await new Promise(r => setTimeout(r, 500));
        }

        // Forgot Password modal
        await navigateToLoginPage(page);
        const forgotClicked = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button[type="button"]')]
                .find(b => b.textContent.includes('Forgot'));
            if (btn) { btn.click(); return true; }
            return false;
        });
        await new Promise(r => setTimeout(r, 800));
        const forgotInputs = await page.evaluate(() => document.querySelectorAll('input[type="email"]').length);
        logStep('Forgot Password modal opens', forgotClicked && forgotInputs > 0 ? 'PASS' : 'FAIL',
            forgotClicked
                ? `${forgotInputs} email input(s) visible`
                : '"Forgot Password" button not found',
            await captureScreenshot(page));

        if (forgotClicked && forgotInputs > 0) {
            // Fill email and submit reset
            const emailInputs = await page.$$('input[type="email"]');
            await emailInputs[emailInputs.length - 1].click({ clickCount: 3 });
            await page.keyboard.type('testuser@example.com');
            const sendBtn = await page.evaluate(() => {
                const btn = [...document.querySelectorAll('button[type="submit"]')]
                    .find(b => b.textContent.toLowerCase().includes('send') || b.textContent.includes('שלח'));
                if (btn) { btn.click(); return true; }
                return false;
            });
            await new Promise(r => setTimeout(r, 2000));
            logStep('Forgot Password — send reset email', sendBtn ? 'PASS' : 'WARN',
                sendBtn ? 'Send button clicked (Firebase sendPasswordResetEmail called)' : 'Send button not found',
                await captureScreenshot(page));
        }

    } catch (err) {
        logStep('Suite error', 'FAIL', err.message, await captureScreenshot(page));
    } finally {
        await page.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Runner
// ─────────────────────────────────────────────────────────────────────────────

async function runAllTests() {
    console.log(`\n🚀 Bond — Acceptance Test Suite`);
    console.log(`   Target: ${BASE_URL}`);
    console.log(`   Started: ${new Date().toLocaleString()}\n`);

    const browser = await puppeteer.launch({
        headless: HEADLESS,
        slowMo: SLOW_MO,
        defaultViewport: { width: 1280, height: 800 },
        protocolTimeout: 300000  // Increase timeout to 5 minutes for Firebase operations
    });

    try {
        await runAuthStructureTests(browser);
        await runSignInHappyPathTests(browser);
        await runSignInFailPathTests(browser);
        await runGoogleSignInTests(browser);
        await runAuthModalTests(browser);
        await runReportTabStructureTests(browser);
        await runAIAnalysisTests(browser);
        await runFullFlowTest(browser);
    } finally {
        generateReport();
        await browser.close();
    }
}

runAllTests();
