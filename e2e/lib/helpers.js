/** Browser launch and page-level helpers shared by all suites. */

import fs from 'fs';
import puppeteer from 'puppeteer';
import { BASE_URL, DEMO_EMAIL, HEADED, SLOW_MO } from './config.js';
import { logStep } from './reporter.js';

export const DESKTOP = { width: 1280, height: 800 };
export const MOBILE = { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 };

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Firestore reads/writes are slow in headless Chrome (its Listen channel keeps
// reconnecting with backoff), so anything waiting on Firestore gets a long budget.
export const FIRESTORE_TIMEOUT = 60000;

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

export function launchBrowser() {
    return puppeteer.launch({
        headless: !HEADED,
        executablePath: resolveChromePath(),
        slowMo: SLOW_MO,
        defaultViewport: DESKTOP,
        protocolTimeout: 300000,  // Firebase / AI calls can be slow
    });
}

/**
 * Open a page in its own incognito-style context, so cookies, localStorage and
 * Firebase auth never leak between suites. Closing the page closes the context.
 * Collects uncaught page errors and console errors in `page.errors`.
 */
export async function newPage(browser, viewport = DESKTOP) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(viewport);
    page.errors = [];
    page.on('pageerror', err => page.errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') page.errors.push(msg.text()); });
    const closePage = page.close.bind(page);
    page.close = async () => {
        await closePage().catch(() => {});
        await context.close().catch(() => {});
    };
    return page;
}

/** Clear a React-controlled input and type a new value into it. */
export async function typeInto(page, elementOrSelector, value, delay = 0) {
    const el = typeof elementOrSelector === 'string' ? await page.$(elementOrSelector) : elementOrSelector;
    await el.evaluate(input => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await el.focus();
    if (value) await el.type(value, { delay });
}

/** Click the first button whose text contains any of `texts`. Returns whether one was found. */
export function clickButton(page, texts, selector = 'button') {
    return page.evaluate((texts, selector) => {
        const btn = [...document.querySelectorAll(selector)]
            .find(b => texts.some(t => b.textContent.includes(t)));
        btn?.click();
        return !!btn;
    }, texts, selector);
}

export const clickTestId = (page, id) =>
    page.evaluate((id) => document.querySelector(`[data-testid="${id}"]`)?.click(), id);

// ─────────────────────────────────────────────────────────────────────────────
// Login page
// ─────────────────────────────────────────────────────────────────────────────

/** Navigate to the app and wait for the login form to be ready. */
export async function navigateToLoginPage(page) {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
}

/**
 * Fill the email/password login form using keyboard simulation so React
 * controlled inputs receive proper onChange events.
 * Pass null to skip a field entirely, '' to leave it empty (test HTML5 validation).
 */
export async function fillLoginForm(page, email, password) {
    if (email !== null) await typeInto(page, 'input[type="email"]', email);
    if (password !== null) await typeInto(page, 'input[type="password"]', password);
}

/** Returns true if the login form is still visible (submission was blocked). */
export async function isStillOnLoginPage(page) {
    return !!(await page.$('input[type="email"]'));
}

/**
 * Reach the report view without an account: typing the owner email reveals the
 * demo-persona buttons; clicking Pioneer loads a report instantly.
 */
export async function openDemoReport(page) {
    await navigateToLoginPage(page);
    await typeInto(page, 'input[type="email"]', DEMO_EMAIL);
    await sleep(600);
    const clicked = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
            .find(b => b.textContent.trim().toUpperCase().includes('PIONEER'));
        btn?.click();
        return !!btn;
    });
    if (!clicked) throw new Error('Demo Pioneer button not found — isDudiMode may not be active');
    await page.waitForSelector('[data-testid="tab-them"]', { timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Report — AI coaching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Select a persona on the Them tab and wait for its AI coaching to finish.
 * Waits for the previous persona's block to unmount first, so a stale result is
 * never mistaken for the new one. Returns { ok, text?, error? }.
 */
export async function selectPersonaAndWaitForAI(page, persona, timeout = 60000) {
    await clickTestId(page, `persona-btn-${persona}`);
    await page.waitForFunction(() => !document.querySelector('[data-testid="ai-loaded"]'), { timeout: 5000 })
        .catch(() => { /* same persona re-selected, or result cached */ });
    await page.waitForFunction(
        () => document.querySelector('[data-testid="ai-loaded"]') || document.querySelector('[data-testid="ai-error"]'),
        { timeout }
    );
    const error = await page.evaluate(() =>
        document.querySelector('[data-testid="ai-error"]')?.textContent?.trim().slice(0, 160) || null);
    if (error) return { ok: false, error };
    const text = await page.evaluate(() => document.querySelector('[data-testid="ai-loaded"]').textContent);
    return { ok: true, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// Signed-in flows (test accounts)
// ─────────────────────────────────────────────────────────────────────────────

/** Skip the current suite with a SKIP step when an account is not configured. */
export function requireCreds(user, label) {
    if (user.email && user.password) return true;
    logStep(`${label} credentials missing — suite skipped`, 'SKIP',
        'Set TEST_EMAIL_A / TEST_PASS_A (and _B for pair tests) in .env.test or the environment');
    return false;
}

/** Sign in with email/password and wait for the HomeScreen to finish loading. Returns { homeLoadMs }. */
export async function signIn(page, { email, password }) {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    // A small typing delay is more reliable with React controlled inputs
    await typeInto(page, 'input[type="email"]', email, 40);
    await typeInto(page, 'input[type="password"]', password, 40);

    const filled = await page.evaluate(() => ({
        email: document.querySelector('input[type="email"]')?.value,
        hasPass: !!document.querySelector('input[type="password"]')?.value,
    }));
    if (filled.email !== email) throw new Error(`Email input mismatch: got "${filled.email}", expected "${email}"`);
    if (!filled.hasPass) throw new Error('Password input appears empty after typing');

    await page.click('button[type="submit"]');
    const submittedAt = Date.now();

    // Wait for the login form to go away (auth accepted) — HomeScreen then shows
    // "Loading profile…" while the latest report is fetched from Firestore
    await page.waitForFunction(() => !document.querySelector('input[type="password"]'), { timeout: 20000 })
        .catch(async () => {
            const authErr = await page.evaluate(() => document.querySelector('.bg-red-50 p')?.textContent || null);
            throw new Error(`Still on the login form 20s after submitting.\nAuth error on page: ${authErr || 'none'}`);
        });
    await page.waitForSelector(
        '[data-testid="start-analysis-btn"], [data-testid="persona-summary"]', { timeout: FIRESTORE_TIMEOUT }
    ).catch(async () => {
        const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));
        throw new Error(`HomeScreen did not finish loading within 60s of signing in.\nPage text: ${bodyText}`);
    });
    return { homeLoadMs: Date.now() - submittedAt };
}

const QUESTION_BUTTONS = '.grid.grid-cols-6.gap-2 button';

export const waitForQuestionnaire = (page, timeout = 10000) =>
    page.waitForFunction((sel) => document.querySelectorAll(sel).length >= 6, { timeout }, QUESTION_BUTTONS);

/** Click through all 35 questionnaire questions (option 3 each) then click Finish. */
export async function fillQuestionnaire(page) {
    await waitForQuestionnaire(page);
    for (let i = 0; i < 35; i++) {
        const clicked = await page.evaluate((sel) => {
            const btn = document.querySelectorAll(sel)[2];
            btn?.click();
            return !!btn;
        }, QUESTION_BUTTONS);
        if (!clicked) throw new Error(`Question ${i + 1}: answer button not found`);
        await sleep(420); // auto-advance is 300ms
    }
    const finishTexts = ['סיימתי', "I'm Done"];
    await page.waitForFunction((texts) => {
        const btn = [...document.querySelectorAll('button')].find(b => texts.some(t => b.textContent.includes(t)));
        return btn && !btn.disabled;
    }, { timeout: 5000 }, finishTexts);
    await clickButton(page, finishTexts);
}

const SESSION_CODE = 'span.font-mono.tracking-widest';

/** Read the 6-char session code displayed in the header. */
export async function getSessionCode(page) {
    await page.waitForFunction(
        (sel) => document.querySelector(sel)?.textContent.trim().length === 6,
        { timeout: FIRESTORE_TIMEOUT }, SESSION_CODE
    );
    return page.$eval(SESSION_CODE, el => el.textContent.trim());
}

export const hasSessionCode = async (page) => !!(await page.$(SESSION_CODE));

/** Open the join modal, submit `code`, and return the modal's text afterwards. */
export async function submitJoinCode(page, code, waitMs = 0) {
    await page.click('[data-testid="join-session-btn"]');
    const input = await page.waitForSelector('.fixed.inset-0 input[type="text"]', { timeout: 5000 });
    await typeInto(page, input, code);
    await page.evaluate(() => {
        document.querySelector('.fixed.inset-0 form')
            ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await sleep(waitMs);
    return page.evaluate(() => document.querySelector('.fixed.inset-0')?.textContent || '');
}
