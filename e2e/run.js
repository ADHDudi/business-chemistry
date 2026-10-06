/**
 * Bond — end-to-end test suite (Puppeteer).
 *
 *   npm run test:e2e                      asks: local or production
 *   npm run test:e2e -- --env=local       skip the question
 *   npm run test:e2e -- --only=auth,report
 *   npm run test:e2e:icons                build dist/ and run only the icons group
 *   npm run test:e2e:headed               watch it run, open the report after
 *
 * See e2e/lib/config.js for every flag and the .env.test credentials.
 * Exits non-zero when any step fails.
 */

import { BASE_URL, HEADED, ONLY, USER_A, USER_B } from './lib/config.js';
import { generateReport, summarize } from './lib/reporter.js';
import { launchBrowser } from './lib/helpers.js';
import * as auth from './suites/auth.js';
import * as report from './suites/report.js';
import * as account from './suites/account.js';
import * as pair from './suites/pairSession.js';
import * as icons from './suites/icons.js';

// Groups run in this order; within "account" and "pair" the order is load-bearing
// (see the header of suites/account.js).
const GROUPS = {
    auth: [auth.loginPage, auth.signInValidation, auth.signUpAndReset],
    report: [report.reportTabs, report.aiCoaching, report.togetherTab, report.mobileReport],
    account: [account.loginLandsOnHome, account.firstTimeUser, account.soloFlow, account.returningUser],
    pair: [pair.hostSession, pair.joinModal, pair.fullPairSession],
    icons: [icons.desktopIcons, icons.mobileIcons],
};

const unknown = ONLY.filter(name => !GROUPS[name]);
if (unknown.length) {
    console.error(`Unknown suite group(s): ${unknown.join(', ')} — choose from ${Object.keys(GROUPS).join(', ')}.`);
    process.exit(1);
}
const selected = Object.keys(GROUPS).filter(name => !ONLY.length || ONLY.includes(name));

console.log('\n🚀 Bond — E2E Test Suite');
console.log(`   Target:  ${BASE_URL}`);
console.log(`   Suites:  ${selected.join(', ')}`);
console.log(`   Browser: ${HEADED ? 'visible window' : 'headless (background)'}`);
console.log(`   User A:  ${USER_A.email || '(not set — signed-in suites will be skipped)'}`);
console.log(`   User B:  ${USER_B.email && USER_B.email !== USER_A.email ? USER_B.email : '(not set)'}`);
console.log(`   Started: ${new Date().toLocaleString()}`);

const browser = await launchBrowser();
try {
    for (const group of selected) {
        for (const suite of GROUPS[group]) await suite(browser);
    }
} finally {
    generateReport();
    await browser.close();
}

const { total, passed, failed, warned, skipped } = summarize();
console.log(`\n${failed ? '❌' : '✅'} ${passed}/${total} steps passed · ${failed} failed · ${warned} warnings · ${skipped} skipped`);
process.exitCode = failed ? 1 : 0;
