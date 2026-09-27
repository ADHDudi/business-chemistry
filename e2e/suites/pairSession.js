/**
 * Pair-session flows (JUS-344, JUS-346). Need test accounts in .env.test and a
 * finished report for user A (seeded by the account suites) — skipped otherwise.
 */

import { USER_A, USER_B } from '../lib/config.js';
import { runSuite, logStep, captureScreenshot } from '../lib/reporter.js';
import {
    newPage, requireCreds, signIn, fillQuestionnaire, waitForQuestionnaire, getSessionCode,
    hasSessionCode, submitJoinCode, sleep, MOBILE, FIRESTORE_TIMEOUT,
} from '../lib/helpers.js';

const HOME = '[data-testid="persona-summary"], [data-testid="start-analysis-btn"]';

/** Sign in and confirm the pair-session button is usable; logs a SKIP and returns false if not. */
async function signInWithReport(page, user, buttonTestId) {
    await signIn(page, user);
    const disabled = await page.$eval(`[data-testid="${buttonTestId}"]`, el => el.disabled).catch(() => true);
    if (disabled) {
        logStep('Skipped — user has no finished report yet', 'SKIP',
            `${buttonTestId} is disabled for ${user.email}; run the account suites first`);
        return false;
    }
    return true;
}

export async function hostSession(browser) {
    await runSuite('Pair session — Host creates and exits a session', async (track) => {
        if (!requireCreds(USER_A, 'User A')) return;
        const page = track(await newPage(browser, MOBILE));
        if (!await signInWithReport(page, USER_A, 'start-session-btn')) return;

        await page.click('[data-testid="start-session-btn"]');
        await waitForQuestionnaire(page, FIRESTORE_TIMEOUT);
        const code = await getSessionCode(page);
        logStep('Starting a session opens the questionnaire with a code in the header', 'PASS',
            `Code: ${code}`, await captureScreenshot(page));
        logStep('Session code is 6 uppercase letters/digits', /^[A-Z0-9]{6}$/.test(code) ? 'PASS' : 'FAIL', `"${code}"`);

        const hasCopyIcon = await page.evaluate(() =>
            !!document.querySelector('span.font-mono.tracking-widest')?.closest('div')?.querySelector('svg'));
        logStep('Copy icon shown next to the code', hasCopyIcon ? 'PASS' : 'WARN');

        // Exit via the X button in the header
        await page.evaluate(() => {
            const header = document.querySelector('header');
            const xBtn = [...(header?.querySelectorAll('button') || [])].find(b => b.querySelector('svg'));
            xBtn?.click();
        });
        await page.waitForSelector(HOME, { timeout: FIRESTORE_TIMEOUT });
        logStep('Exiting the session returns to HomeScreen', 'PASS', '', await captureScreenshot(page));
        logStep('Session code cleared from the header', !(await hasSessionCode(page)) ? 'PASS' : 'FAIL');
    });
}

export async function joinModal(browser) {
    await runSuite('Pair session — Join modal', async (track) => {
        if (!requireCreds(USER_A, 'User A')) return;
        const page = track(await newPage(browser, MOBILE));
        if (!await signInWithReport(page, USER_A, 'join-session-btn')) return;

        await page.click('[data-testid="join-session-btn"]');
        await sleep(500);
        const modal = await page.evaluate(() => ({
            open: !!document.querySelector('.fixed.inset-0'),
            input: !!document.querySelector('.fixed.inset-0 input[type="text"]'),
        }));
        logStep('Join modal opens', modal.open ? 'PASS' : 'FAIL', '', await captureScreenshot(page));
        logStep('Code input present', modal.input ? 'PASS' : 'FAIL');

        const cancelled = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('.fixed.inset-0 button')]
                .find(b => b.textContent.includes('Cancel') || b.textContent.includes('ביטול'));
            btn?.click();
            return !!btn;
        });
        await sleep(400);
        const closed = !(await page.$('.fixed.inset-0'));
        logStep('Cancel closes the modal', cancelled && closed ? 'PASS' : 'FAIL');

        // Unknown code → inline error (also covers the "session full" error surface)
        await submitJoinCode(page, 'ZZZZZZ');
        const hasError = await page.waitForFunction(() =>
            /not found|Session is full|שגיאה|לא נמצא/.test(document.querySelector('.fixed.inset-0')?.textContent || ''),
            { timeout: FIRESTORE_TIMEOUT }).then(() => true, () => false);
        const modalText = await page.evaluate(() => document.querySelector('.fixed.inset-0')?.textContent || '');
        logStep('Unknown session code shows an error', hasError ? 'PASS' : 'FAIL',
            hasError ? 'Error message shown in the modal' : `No error within 60s. Modal text: ${modalText.slice(0, 120)}`,
            await captureScreenshot(page));
    });
}

export async function fullPairSession(browser) {
    await runSuite('Pair session — Two users, simultaneous reveal', async (track) => {
        if (!requireCreds(USER_A, 'User A') || !requireCreds(USER_B, 'User B')) return;
        if (USER_B.email === USER_A.email) {
            logStep('Skipped — needs two different accounts', 'SKIP', 'TEST_EMAIL_B is missing or the same as TEST_EMAIL_A');
            return;
        }

        // newPage() gives each user an isolated context (separate auth/storage)
        {
            const pageA = track(await newPage(browser, MOBILE));
            const pageB = track(await newPage(browser, MOBILE));

            await Promise.all([signIn(pageA, USER_A), signIn(pageB, USER_B)]);
            logStep('Both users signed in', 'PASS', `A=${USER_A.email}, B=${USER_B.email}`);

            for (const [page, id, who] of [[pageA, 'start-session-btn', 'A'], [pageB, 'join-session-btn', 'B']]) {
                const disabled = await page.$eval(`[data-testid="${id}"]`, el => el.disabled).catch(() => true);
                if (disabled) {
                    logStep(`Skipped — user ${who} has no finished report yet`, 'SKIP', `${id} is disabled`);
                    return;
                }
            }

            await pageA.click('[data-testid="start-session-btn"]');
            const code = await getSessionCode(pageA);
            logStep('User A created a session', 'PASS', `Code: ${code}`, await captureScreenshot(pageA));

            await submitJoinCode(pageB, code, 0);
            await Promise.all([waitForQuestionnaire(pageA, FIRESTORE_TIMEOUT), waitForQuestionnaire(pageB, FIRESTORE_TIMEOUT)]);
            logStep('User B joined — both users on the questionnaire', 'PASS', '', await captureScreenshot(pageB));

            await Promise.all([fillQuestionnaire(pageA), fillQuestionnaire(pageB)]);
            logStep('Both questionnaires completed', 'PASS');

            await Promise.all([
                pageA.waitForSelector('[data-testid="match-score"]', { timeout: FIRESTORE_TIMEOUT }),
                pageB.waitForSelector('[data-testid="match-score"]', { timeout: FIRESTORE_TIMEOUT }),
            ]);
            logStep('Comparison revealed to both users', 'PASS', '', await captureScreenshot(pageA));

            const scoreA = await pageA.$eval('[data-testid="match-score"]', el => el.textContent.trim());
            const scoreB = await pageB.$eval('[data-testid="match-score"]', el => el.textContent.trim());
            const n = parseInt(scoreA.replace(/\D/g, ''), 10);
            logStep('Match score is 0–100 and the same for both users',
                n >= 0 && n <= 100 && scoreA === scoreB ? 'PASS' : 'FAIL', `A sees "${scoreA}", B sees "${scoreB}"`);

            const labels = await pageA.$$eval('[data-testid="persona-label"]', els => els.map(e => e.textContent.trim()));
            logStep('Persona labels shown for both participants', labels.length >= 2 ? 'PASS' : 'FAIL',
                labels.join(', ') || 'none found');
        }
    });
}
