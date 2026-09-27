/** Login page, sign-in validation, sign-up and password reset — no account needed. */

import { DEMO_EMAIL } from '../lib/config.js';
import { runSuite, logStep, captureScreenshot } from '../lib/reporter.js';
import {
    newPage, sleep, clickButton, navigateToLoginPage, fillLoginForm, isStillOnLoginPage, typeInto,
} from '../lib/helpers.js';

/** Inputs of the sign-up modal (the form whose submit button says "Create Account"). */
const signUpInputs = (page) => page.evaluate(() => {
    const form = [...document.querySelectorAll('form')]
        .find(f => f.querySelector('button[type="submit"]')?.textContent.includes('Create Account'));
    return form ? [...form.querySelectorAll('input')].map(i => i.type) : null;
});

async function fillSignUp(page, email, password, confirm) {
    const inputs = await page.$$('form input');
    const signUp = [];
    for (const input of inputs) {
        const inForm = await input.evaluate(el =>
            !!el.closest('form')?.querySelector('button[type="submit"]')?.textContent.includes('Create Account'));
        if (inForm) signUp.push(input);
    }
    const values = [email, password, confirm];
    for (let i = 0; i < signUp.length && i < values.length; i++) await typeInto(page, signUp[i], values[i]);
    await clickButton(page, ['Create Account'], 'button[type="submit"]');
}

const openSignUp = async (page) => {
    await navigateToLoginPage(page);
    const clicked = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button[type="button"]')].find(b => b.textContent.trim() === 'Sign up');
        btn?.click();
        return !!btn;
    });
    await sleep(700);
    return clicked;
};

export async function loginPage(browser) {
    await runSuite('Auth — Login page', async (track) => {
        const page = track(await newPage(browser));

        await navigateToLoginPage(page);
        logStep('Page loads', 'PASS', `Title: "${await page.title()}"`, await captureScreenshot(page));

        for (const [label, selector] of [
            ['Email input', 'input[type="email"]'],
            ['Password input', 'input[type="password"]'],
            ['Sign In submit button', 'button[type="submit"]'],
        ]) {
            const found = !!(await page.$(selector));
            logStep(`${label} present`, found ? 'PASS' : 'FAIL', selector);
        }

        const links = await page.evaluate(() => {
            const btns = [...document.querySelectorAll('button[type="button"]')];
            return {
                signUp: btns.some(b => b.textContent.trim() === 'Sign up'),
                forgot: btns.some(b => b.textContent.includes('Forgot')),
            };
        });
        logStep('"Sign up" link present', links.signUp ? 'PASS' : 'FAIL');
        logStep('"Forgot Password?" link present', links.forgot ? 'PASS' : 'FAIL');

        // Google sign-in — the OAuth popup itself cannot be automated
        const google = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Google'));
            if (!btn) return null;
            const rect = btn.getBoundingClientRect();
            const img = document.querySelector('img[alt="Google"]');
            return {
                text: btn.textContent.trim(),
                visible: rect.width > 0 && rect.height > 0,
                logo: !!img && img.complete && img.naturalWidth > 0,
            };
        });
        logStep('Google sign-in button visible', google?.visible ? 'PASS' : 'FAIL',
            google ? `Text: "${google.text}"` : 'Google sign-in button not found');
        logStep('Google logo loads', google?.logo ? 'PASS' : 'WARN',
            google?.logo ? 'Logo image loaded' : 'Google logo image missing or failed to load');

        let crashed = false;
        page.on('pageerror', () => { crashed = true; });
        await clickButton(page, ['Google']);
        await sleep(1500);
        logStep('Clicking Google sign-in does not crash the page', crashed ? 'FAIL' : 'PASS',
            crashed ? page.errors.join('\n') : 'No uncaught errors (popup is blocked in headless — expected)',
            await captureScreenshot(page));
    });
}

export async function signInValidation(browser) {
    await runSuite('Auth — Sign-in validation', async (track) => {
        const page = track(await newPage(browser));

        const expectBlocked = async (label, detail) => {
            page.click('button[type="submit"]').catch(() => {});
            await sleep(1200);
            const blocked = await isStillOnLoginPage(page);
            logStep(label, blocked ? 'PASS' : 'FAIL',
                blocked ? `Blocked — stayed on login page (${detail})` : `BUG: form submitted (${detail})`,
                await captureScreenshot(page));
        };

        await navigateToLoginPage(page);
        await fillLoginForm(page, '', 'AnyPassword123');
        await expectBlocked('Empty email is blocked', 'HTML5 required');

        // Set the DOM value directly so browser validation (type=email) acts on it
        await navigateToLoginPage(page);
        await page.evaluate(() => {
            const el = document.querySelector('input[type="email"]');
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 'notanemail');
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await typeInto(page, 'input[type="password"]', 'AnyPassword123');
        await expectBlocked('Invalid email format is blocked', '"notanemail", type=email');

        await navigateToLoginPage(page);
        await fillLoginForm(page, 'testuser@example.com', '');
        await expectBlocked('Empty password is blocked', 'HTML5 required');

        // Regression (PR #10): wrong credentials must not reach the questionnaire
        await navigateToLoginPage(page);
        await fillLoginForm(page, 'fake@nonexistent.xyz', 'WrongPass999');
        page.click('button[type="submit"]').catch(() => {});
        const advanced = await page.waitForSelector('button.aspect-square', { timeout: 8000 }).then(() => true, () => false);
        if (advanced) {
            logStep('Wrong credentials are rejected', 'FAIL',
                'BUG: invalid credentials reached the questionnaire', await captureScreenshot(page));
        } else {
            const hasError = await page.evaluate(() => /Invalid|password|account|credential/.test(document.body.textContent));
            logStep('Wrong credentials are rejected', hasError ? 'PASS' : 'WARN',
                hasError ? 'Stayed on login with a Firebase error message' : 'Stayed on login but no error message is visible',
                await captureScreenshot(page));
        }
    });
}

export async function signUpAndReset(browser) {
    await runSuite('Auth — Sign-up & password reset', async (track) => {
        const page = track(await newPage(browser));

        // Sign-up modal: email + password + confirm password
        const clicked = await openSignUp(page);
        const types = await signUpInputs(page);
        const shapeOk = types && types.filter(t => t === 'email').length === 1 && types.filter(t => t === 'password').length === 2;
        logStep('Sign-up modal opens with email, password and confirm fields',
            clicked && shapeOk ? 'PASS' : 'FAIL',
            !clicked ? '"Sign up" button not found' : `Inputs: ${types ? types.join(', ') : 'sign-up form not found'}`,
            await captureScreenshot(page));

        if (shapeOk) {
            await fillSignUp(page, 'mismatch@example.com', 'Password123', 'Different123');
            await sleep(500);
            const mismatch = await page.evaluate(() => document.body.textContent.includes('Passwords do not match'));
            logStep('Mismatched passwords are rejected', mismatch ? 'PASS' : 'FAIL',
                mismatch ? '"Passwords do not match" shown' : 'No mismatch error shown', await captureScreenshot(page));

            // Regression (PR #10): a failed sign-up keeps the form open and shows the error
            await openSignUp(page);
            await fillSignUp(page, DEMO_EMAIL, 'TestPassword123', 'TestPassword123');
            const errorShown = await page.waitForFunction(
                () => document.body.textContent.includes('already registered'), { timeout: 10000 }
            ).then(() => true, () => false);
            const stillOpen = !!(await signUpInputs(page));
            logStep('Existing email: sign-up fails, error shown, form stays open',
                errorShown && stillOpen ? 'PASS' : 'FAIL',
                `Error "already registered" shown: ${errorShown}, form still open: ${stillOpen}`,
                await captureScreenshot(page));
        }

        // Forgot-password modal → Firebase sendPasswordResetEmail
        await navigateToLoginPage(page);
        const forgotClicked = await clickButton(page, ['Forgot'], 'button[type="button"]');
        await sleep(700);
        const emailInputs = await page.$$('input[type="email"]');
        logStep('Forgot-password modal opens', forgotClicked && emailInputs.length > 1 ? 'PASS' : 'FAIL',
            forgotClicked ? `${emailInputs.length} email input(s) visible` : '"Forgot Password?" button not found',
            await captureScreenshot(page));

        if (forgotClicked && emailInputs.length > 1) {
            await typeInto(page, emailInputs.at(-1), 'testuser@example.com');
            await clickButton(page, ['Send Reset Link'], 'button[type="submit"]');
            const outcome = await page.waitForFunction(() => {
                const text = document.body.textContent;
                if (text.includes('sent a password reset link')) return 'sent';
                if (document.querySelector('.bg-red-50, .text-red-700')) return 'error';
                return false;
            }, { timeout: 10000 }).then(h => h.jsonValue(), () => 'timeout');
            logStep('Password reset email is sent', outcome === 'sent' ? 'PASS' : 'FAIL',
                { sent: 'Confirmation shown', error: 'An error was shown', timeout: 'No confirmation within 10s' }[outcome],
                await captureScreenshot(page));
        }
    });
}
