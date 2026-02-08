
import puppeteer from 'puppeteer';
import fs from 'fs';
import { exec } from 'child_process';

const args = process.argv.slice(2);
const BASE_URL = args[0] || 'https://business-chemistry.web.app/';
const HEADLESS = false; // Set to true for headless mode
const SLOW_MO = 50; // Slow down operations by 50ms for visibility

const steps = [];

function logStep(name, status, details = '', screenshot = null) {
    console.log(`[${status}] ${name} ${details ? '- ' + details : ''}`);
    steps.push({
        name,
        status,
        details,
        timestamp: new Date().toISOString(),
        screenshot
    });
}

function generateReport() {
    const total = steps.length;
    const passed = steps.filter(s => s.status === 'PASS').length;
    const failed = steps.filter(s => s.status === 'FAIL').length;
    const duration = (new Date(steps[steps.length - 1].timestamp) - new Date(steps[0].timestamp)) / 1000;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceptance Test Report</title>
        <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f4f4f9; }
            h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
            .summary { display: flex; gap: 20px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 20px; }
            .summary-item { display: flex; flex-col; font-weight: bold; }
            .summary-item span { font-weight: normal; color: #666; font-size: 0.9em; }
            .step { background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 5px solid #ccc; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .step.PASS { border-left-color: #4caf50; }
            .step.FAIL { border-left-color: #f44336; }
            .step.WARN { border-left-color: #ff9800; }
            .step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
            .step-name { font-weight: bold; font-size: 1.1em; }
            .step-status { font-weight: bold; padding: 2px 8px; border-radius: 4px; color: white; font-size: 0.8em; }
            .PASS .step-status { background: #4caf50; }
            .FAIL .step-status { background: #f44336; }
            .WARN .step-status { background: #ff9800; }
            .step-details { color: #555; margin-top: 5px; white-space: pre-wrap; font-family: monospace; background: #fafafa; padding: 10px; border-radius: 4px; }
            .screenshot { margin-top: 10px; max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
            .timestamp { color: #999; font-size: 0.8em; margin-top: 5px; }
        </style>
    </head>
    <body>
        <h1>Acceptance Test Report</h1>
        <div class="summary">
            <div class="summary-item">Total Steps<br><span>${total}</span></div>
            <div class="summary-item">Passed<br><span>${passed}</span></div>
            <div class="summary-item">Failed<br><span>${failed}</span></div>
            <div class="summary-item">Duration<br><span>${duration.toFixed(2)}s</span></div>
            <div class="summary-item">Target URL<br><span>${BASE_URL}</span></div>
        </div>
        
        <div class="steps">
            ${steps.map(step => `
                <div class="step ${step.status}">
                    <div class="step-header">
                        <span class="step-name">${step.name}</span>
                        <span class="step-status">${step.status}</span>
                    </div>
                    ${step.details ? `<div class="step-details">${step.details}</div>` : ''}
                    ${step.screenshot ? `<img class="screenshot" src="data:image/png;base64,${step.screenshot}" alt="Screenshot for ${step.name}" />` : ''}
                    <div class="timestamp">${new Date(step.timestamp).toLocaleTimeString()}</div>
                </div>
            `).join('')}
        </div>
    </body>
    </html>
    `;

    fs.writeFileSync('acceptance_report.html', html);
    console.log('📄 Report generated: acceptance_report.html');

    // Auto-open report
    const command = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    console.log(`Opening report with command: ${command} acceptance_report.html`);
    exec(`${command} acceptance_report.html`, (err) => {
        if (err) console.error('Failed to open report:', err);
    });
}

async function captureScreenshot(page) {
    try {
        return await page.screenshot({ encoding: 'base64', type: 'png' });
    } catch (e) {
        return null;
    }
}

async function runAcceptanceTest() {
    logStep('Test Start', 'INFO', `Target: ${BASE_URL}`);

    const browser = await puppeteer.launch({
        headless: HEADLESS,
        slowMo: SLOW_MO,
        defaultViewport: { width: 1280, height: 800 }
    });
    const page = await browser.newPage();

    try {
        // 1. Setup & Navigation
        logStep('Navigation', 'INFO', `Navigating to ${BASE_URL}`);
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

        // Check if loaded
        const title = await page.title();
        logStep('Page Load', 'PASS', `Page Title: ${title}`, await captureScreenshot(page));

        // 2. Login / Registration Flow
        await page.waitForSelector('input[type="text"]');

        logStep('Login Form', 'INFO', 'Entering user details...');
        await page.type('input[type="text"]', 'Test User');
        await page.type('input[type="email"]', 'test@example.com');

        // Click submit button
        const submitButtonSelector = 'button[type="submit"]';
        await page.waitForSelector(submitButtonSelector);

        const submitScreenshot = await captureScreenshot(page);
        logStep('Registration', 'PASS', 'User details entered, submitting...', submitScreenshot);

        await Promise.all([
            page.click(submitButtonSelector),
            // We wait for some change. Navigation might happen or just state change.
            // waiting for h2 "Which side are you on?" is safer
            page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => { })
        ]);

        // 3. Questionnaire Flow (Happy Path)
        // Wait for the first question or the "Which side are you on?" text
        // The h2 from step 2 says "Which side are you on?" or Hebrew equivalent
        await page.waitForSelector('h2');
        logStep('Questionnaire Start', 'PASS', 'Entered questionnaire section');

        let isQuestionnaireComplete = false;
        let questionCount = 0;
        const MAX_QUESTIONS = 50; // Safety break

        // We need to continuously loop until we finish.
        // The page updates dynamically without full reload often.
        while (!isQuestionnaireComplete && questionCount < MAX_QUESTIONS) {

            // Check if we are at the Report View (step 3)
            const reportHeader = await page.$('h2.text-3xl');
            if (reportHeader) {
                const text = await page.evaluate(el => el.textContent, reportHeader);
                if (text.includes('Test User')) { // Report view confirmed
                    isQuestionnaireComplete = true;
                    logStep('Questionnaire Complete', 'PASS', `Finished after ${questionCount} questions`);
                    break;
                }
            }

            // Handle questions
            // MobileQuestionCard has buttons 1-6
            const answerButtons = await page.$$('button.aspect-square');
            if (answerButtons.length > 0) {
                // Click buttons[3] approx middle
                const btnToClick = answerButtons[Math.min(3, answerButtons.length - 1)];
                await btnToClick.click();
                questionCount++;

                // Wait a bit for transition
                await new Promise(r => setTimeout(r, 300));

                // Check for "Finish" button
                const finishBtn = await page.$('button.bg-\\[\\#E46B3F\\]');
                if (finishBtn) {
                    const isDisabled = await page.evaluate(el => el.disabled, finishBtn);
                    if (!isDisabled) {
                        logStep('Finish Button', 'INFO', 'Clicking Finish...');
                        await finishBtn.click();
                        await new Promise(r => setTimeout(r, 2000)); // Wait for report generation
                        isQuestionnaireComplete = true;
                        break;
                    }
                }
            } else {
                // Wait a bit and try again
                await new Promise(r => setTimeout(r, 500));
            }
        }

        if (questionCount >= MAX_QUESTIONS) {
            throw new Error('Questionnaire loop exceeded max questions. Test stuck?');
        }

        // 4. Report View & Language Alignment
        await page.waitForSelector('h2.text-3xl'); // Report header
        const reportScreenshot = await captureScreenshot(page);
        logStep('Report Loaded', 'PASS', 'Report view is visible', reportScreenshot);

        // Check Hebrew Default
        const htmlDir = await page.evaluate(() => document.documentElement.dir);
        const bodyText = await page.evaluate(() => document.body.innerText);

        if (htmlDir === 'rtl' || bodyText.includes('סקירה')) {
            logStep('Hebrew Alignment', 'PASS', `Direction: ${htmlDir}, Text detected: "סקירה"`);
        } else {
            logStep('Hebrew Alignment', 'WARN', `Expected RTL/Hebrew but found dir="${htmlDir}"`, await captureScreenshot(page));
        }

        // Switch to English
        // The language toggle button contains "ENGLISH" or "עברית"
        const langBtn = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ENGLISH') || b.textContent.includes('עברית'));
        });

        if (langBtn) {
            logStep('Language Switch', 'INFO', 'Clicking language toggle...');
            await langBtn.click();
            await new Promise(r => setTimeout(r, 1000));

            const newHtmlDir = await page.evaluate(() => document.documentElement.dir);
            const newBodyText = await page.evaluate(() => document.body.innerText);

            if (newHtmlDir === 'ltr' || newBodyText.includes('Overview')) {
                logStep('English Alignment', 'PASS', `Direction: ${newHtmlDir}, Text detected: "Overview"`, await captureScreenshot(page));
            } else {
                throw new Error('Language switch to English failed.');
            }
        } else {
            throw new Error('Language toggle button not found.');
        }

        logStep('Test Completion', 'PASS', 'All steps executed successfully');

    } catch (error) {
        const errorScreenshot = await captureScreenshot(page);
        logStep('Error', 'FAIL', error.message, errorScreenshot);
        console.error('❌ ACCEPTANCE TEST FAILED:', error);
    } finally {
        generateReport();
        await browser.close();
    }
}

runAcceptanceTest();
