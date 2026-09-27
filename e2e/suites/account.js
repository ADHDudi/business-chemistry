/**
 * Signed-in HomeScreen and solo-analysis flows (JUS-341, JUS-344, JUS-346).
 * Need test accounts in .env.test — suites are skipped without them.
 * Order matters: firstTimeUser runs before soloFlow so user B has no report yet,
 * and soloFlow seeds user A's report for the returning-user and pair suites.
 */

import { USER_A, USER_B } from '../lib/config.js';
import { runSuite, logStep, captureScreenshot } from '../lib/reporter.js';
import {
    newPage, sleep, clickButton, requireCreds, signIn, fillQuestionnaire, waitForQuestionnaire,
    hasSessionCode, MOBILE, FIRESTORE_TIMEOUT,
} from '../lib/helpers.js';

const PAIR_TAB_TEXTS = ['Pair Sessions', 'סשנים משותפים'];
const HOME = '[data-testid="persona-summary"], [data-testid="start-analysis-btn"]';

const isDisabled = (page, testId) => page.$eval(`[data-testid="${testId}"]`, el => el.disabled);

export async function loginLandsOnHome(browser) {
    await runSuite('Account — Login lands on HomeScreen', async (track) => {
        if (!requireCreds(USER_A, 'User A')) return;
        const page = track(await newPage(browser, MOBILE));

        const { homeLoadMs } = await signIn(page, USER_A);
        const secs = (homeLoadMs / 1000).toFixed(1);
        logStep('Profile loads within 10s of signing in', homeLoadMs <= 10000 ? 'PASS' : 'WARN',
            `HomeScreen ready after ${secs}s${homeLoadMs > 10000 ? ' — "Loading profile…" (getLatestReport) is slow' : ''}`);
        const state = await page.evaluate(() => ({
            home: !!(document.querySelector('[data-testid="persona-summary"]') ||
                     document.querySelector('[data-testid="start-analysis-btn"]')),
            questionnaire: !!document.querySelector('.grid.grid-cols-6.gap-2'),
            liveModeToggle: [...document.querySelectorAll('button')].some(b =>
                /Live Mode|מצב Live|Exit Live|חזרה לרגיל/.test(b.textContent)),
            sessionCode: !!document.querySelector('span.font-mono.tracking-widest'),
        }));
        logStep('HomeScreen shown after login', state.home ? 'PASS' : 'FAIL',
            state.home ? `Signed in as ${USER_A.email}` : 'HomeScreen not found after login',
            await captureScreenshot(page));
        logStep('Questionnaire not shown straight after login', !state.questionnaire ? 'PASS' : 'FAIL');
        logStep('Old "Live Mode" toggle is gone from the header', !state.liveModeToggle ? 'PASS' : 'FAIL');
        logStep('No session code in the header before a session starts', !state.sessionCode ? 'PASS' : 'FAIL');
    });
}

export async function firstTimeUser(browser) {
    await runSuite('Account — First-time user HomeScreen', async (track) => {
        if (!requireCreds(USER_B, 'User B')) return;
        if (USER_B.email === USER_A.email) {
            logStep('Skipped — needs a separate, fresh user B account', 'SKIP',
                'TEST_EMAIL_B is missing or the same as TEST_EMAIL_A');
            return;
        }
        const page = track(await newPage(browser, MOBILE));
        await signIn(page, USER_B);

        const hasStartCTA = !!(await page.$('[data-testid="start-analysis-btn"]'));
        if (!hasStartCTA) {
            logStep('Skipped — user B already has a report', 'SKIP',
                'First-time checks need an account that has never finished an analysis', await captureScreenshot(page));
            return;
        }
        logStep('"Start Your Analysis" call to action shown', 'PASS', '', await captureScreenshot(page));

        const startDisabled = await isDisabled(page, 'start-session-btn');
        const joinDisabled = await isDisabled(page, 'join-session-btn');
        logStep('Pair-session buttons are locked', startDisabled && joinDisabled ? 'PASS' : 'FAIL',
            `start disabled=${startDisabled}, join disabled=${joinDisabled}`);

        const hasSummary = !!(await page.$('[data-testid="persona-summary"]'));
        logStep('No persona summary for a first-time user', !hasSummary ? 'PASS' : 'FAIL');
    });
}

export async function soloFlow(browser) {
    await runSuite('Account — Solo analysis (HomeScreen → questionnaire → report → home)', async (track) => {
        if (!requireCreds(USER_A, 'User A')) return;
        const page = track(await newPage(browser, MOBILE));
        await signIn(page, USER_A);

        const startBtn = await page.$('[data-testid="start-analysis-btn"], [data-testid="redo-analysis-btn"]');
        if (!startBtn) throw new Error('Neither start-analysis-btn nor redo-analysis-btn found on HomeScreen');
        await startBtn.click();
        await waitForQuestionnaire(page);
        logStep('Questionnaire opens from HomeScreen', 'PASS', '', await captureScreenshot(page));

        logStep('Answering all 35 questions…', 'INFO');
        await fillQuestionnaire(page);

        await page.waitForSelector('[data-testid="tab-you"], [data-testid="match-score"]', { timeout: FIRESTORE_TIMEOUT });
        const isSolo = !!(await page.$('[data-testid="tab-you"]'));
        const isComparison = !!(await page.$('[data-testid="match-score"]'));
        logStep('Solo report shown (not the pair comparison)', isSolo && !isComparison ? 'PASS' : 'FAIL',
            `tab-you=${isSolo}, match-score=${isComparison}`, await captureScreenshot(page));

        await clickButton(page, ['Start New Assessment', 'התחל אבחון חדש']);
        await page.waitForSelector(HOME, { timeout: FIRESTORE_TIMEOUT });
        const onLogin = !!(await page.$('input[type="email"]'));
        logStep('Restart returns to HomeScreen and stays signed in', !onLogin ? 'PASS' : 'FAIL',
            !onLogin ? 'HomeScreen visible' : 'Login form shown — user was signed out', await captureScreenshot(page));

        logStep('No session code after a solo analysis', !(await hasSessionCode(page)) ? 'PASS' : 'FAIL');
    });
}

export async function returningUser(browser) {
    await runSuite('Account — Returning user HomeScreen', async (track) => {
        if (!requireCreds(USER_A, 'User A')) return;
        const page = track(await newPage(browser, MOBILE));
        await signIn(page, USER_A);

        const hasSummary = !!(await page.$('[data-testid="persona-summary"]'));
        logStep('Persona summary card shown', hasSummary ? 'PASS' : 'FAIL',
            hasSummary ? 'User A has a report' : 'No persona summary — the solo analysis suite should have created one',
            await captureScreenshot(page));

        if (hasSummary) {
            const hasRedo = !!(await page.$('[data-testid="redo-analysis-btn"]'));
            logStep('"Redo Analysis" button visible', hasRedo ? 'PASS' : 'FAIL');
            const startDisabled = await isDisabled(page, 'start-session-btn');
            const joinDisabled = await isDisabled(page, 'join-session-btn');
            logStep('Pair-session buttons are enabled', !startDisabled && !joinDisabled ? 'PASS' : 'FAIL',
                `start disabled=${startDisabled}, join disabled=${joinDisabled}`);
        }

        const hasPairTab = await clickButton(page, PAIR_TAB_TEXTS);
        logStep('"Pair Sessions" tab present', hasPairTab ? 'PASS' : 'FAIL');
        if (hasPairTab) {
            await sleep(500);
            logStep('Pair Sessions tab opens', 'PASS', '', await captureScreenshot(page));
        }
    });
}
