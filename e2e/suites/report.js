/** Report view, reached through the demo-persona shortcut — no account needed. */

import { runSuite, logStep, captureScreenshot } from '../lib/reporter.js';
import {
    newPage, sleep, clickButton, clickTestId, openDemoReport, isStillOnLoginPage,
    selectPersonaAndWaitForAI, MOBILE,
} from '../lib/helpers.js';

const TABS = ['you', 'them', 'together'];
const PERSONAS = ['guardian', 'driver', 'integrator', 'pioneer'];
const RESTART_TEXTS = ['Start New Assessment', 'התחל אבחון חדש'];

export async function reportTabs(browser) {
    await runSuite('Report — Demo report, tabs & restart', async (track) => {
        const page = track(await newPage(browser));

        await openDemoReport(page);
        logStep('Demo shortcut opens the report', 'PASS', 'Owner email → Pioneer demo → report view',
            await captureScreenshot(page));

        for (const tab of TABS) {
            const exists = !!(await page.$(`[data-testid="tab-${tab}"]`));
            logStep(`Tab "${tab}" present`, exists ? 'PASS' : 'FAIL', `[data-testid="tab-${tab}"]`);
        }

        const youVisible = !!(await page.$('[data-testid="tab-content-you"]'));
        logStep('"You" is the default tab', youVisible ? 'PASS' : 'FAIL',
            youVisible ? 'tab-content-you rendered on load' : 'tab-content-you not visible on load');

        for (const tab of ['them', 'together', 'you']) {
            await clickTestId(page, `tab-${tab}`);
            await sleep(500);
            const visible = !!(await page.$(`[data-testid="tab-content-${tab}"]`));
            logStep(`Tab "${tab}" shows its content`, visible ? 'PASS' : 'FAIL',
                `tab-content-${tab} ${visible ? 'visible' : 'missing after click'}`, await captureScreenshot(page));
        }

        // Demo users are not signed in, so restarting returns to the login screen
        const clicked = await clickButton(page, RESTART_TEXTS);
        await sleep(1000);
        const onLogin = await isStillOnLoginPage(page);
        logStep('"Start New Assessment" returns to the login screen', clicked && onLogin ? 'PASS' : 'FAIL',
            !clicked ? 'Restart button not found' : (onLogin ? 'Login form visible' : 'Login form not visible after restart'),
            await captureScreenshot(page));
    });
}

export async function aiCoaching(browser) {
    await runSuite('Report — AI coaching per persona (Them tab)', async (track) => {
        const page = track(await newPage(browser));
        await openDemoReport(page);
        await clickTestId(page, 'tab-them');
        await sleep(500);

        for (const persona of PERSONAS) {
            const found = !!(await page.$(`[data-testid="persona-btn-${persona}"]`));
            logStep(`Persona button "${persona}" present`, found ? 'PASS' : 'FAIL');
        }

        for (const persona of PERSONAS) {
            const started = Date.now();
            try {
                const result = await selectPersonaAndWaitForAI(page, persona);
                const secs = ((Date.now() - started) / 1000).toFixed(1);
                if (!result.ok) {
                    logStep(`AI coaching loads for ${persona}`, 'FAIL', `Error after ${secs}s: ${result.error}`,
                        await captureScreenshot(page));
                    continue;
                }
                const hasFriction = /Clash|חיכוך/.test(result.text);
                const hasStrategy = /Game Plan|Script|אסטרטגיה/.test(result.text);
                logStep(`AI coaching loads for ${persona}`, result.text.trim().length > 10 ? 'PASS' : 'FAIL',
                    `${secs}s — friction section: ${hasFriction}, strategy section: ${hasStrategy}`,
                    await captureScreenshot(page));
            } catch {
                const blank = await page.evaluate(() => document.body.innerText.trim().length === 0);
                const errors = page.errors.length ? `\nPage errors:\n${page.errors.slice(-5).join('\n')}` : '';
                logStep(`AI coaching loads for ${persona}`, 'FAIL',
                    (blank ? 'Page went blank (app crashed) while loading' : 'No result or error within 60s') + errors,
                    await captureScreenshot(page));
            }
        }
    });
}

export async function togetherTab(browser) {
    await runSuite('Report — Together tab', async (track) => {
        const page = track(await newPage(browser));
        await openDemoReport(page);
        await clickTestId(page, 'tab-together');
        await sleep(600);

        const content = await page.evaluate(() => {
            const el = document.querySelector('[data-testid="tab-content-together"]');
            return el ? el.textContent.trim().length : -1;
        });
        logStep('Together tab renders with content', content > 20 ? 'PASS' : 'FAIL',
            content < 0 ? 'tab-content-together missing' : `${content} characters of content`,
            await captureScreenshot(page));

        const bars = !!(await page.$('[data-testid="resonance-bars"]'));
        logStep('Resonance bars present', bars ? 'PASS' : 'FAIL', '[data-testid="resonance-bars"]');

        await clickTestId(page, 'tab-you');
        await sleep(300);
        await clickTestId(page, 'tab-together');
        await sleep(400);
        const again = !!(await page.$('[data-testid="tab-content-together"]'));
        logStep('Together tab re-renders after switching away and back', again ? 'PASS' : 'FAIL');
    });
}

export async function mobileReport(browser) {
    await runSuite('Report — Mobile layout (390px)', async (track) => {
        const page = track(await newPage(browser, MOBILE));
        await openDemoReport(page);
        logStep('Report loads on a 390×844 viewport', 'PASS', '', await captureScreenshot(page));

        const consultation = await page.$('[data-testid="consultation-mobile"]');
        if (consultation) await consultation.scrollIntoView();
        logStep('Consultation section renders', consultation ? 'PASS' : 'FAIL',
            '[data-testid="consultation-mobile"]', consultation ? await captureScreenshot(page) : null);

        for (const tab of TABS) {
            const exists = !!(await page.$(`[data-testid="tab-${tab}"]`));
            logStep(`Tab "${tab}" present on mobile`, exists ? 'PASS' : 'FAIL');
        }

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
        }));
        logStep('No horizontal overflow', scrollWidth <= clientWidth ? 'PASS' : 'FAIL',
            `scrollWidth ${scrollWidth}px, viewport ${clientWidth}px`);
    });
}
