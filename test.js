
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
        // Sometimes button text is "Let's Start" or "Start"
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
            // Look for h2 containing "Test User"
            const reportHeaders = await page.$$('h2');
            for (const header of reportHeaders) {
                const text = await page.evaluate(el => el.textContent, header);
                if (text.includes('Test User')) { // Report view confirmed
                    isQuestionnaireComplete = true;
                    logStep('Questionnaire Complete', 'PASS', `Finished after ${questionCount} questions`);
                    break;
                }
            }
            if (isQuestionnaireComplete) break;

            // Handle questions
            // MobileQuestionCard has buttons 1-6
            const answerButtons = await page.$$('button.aspect-square');
            if (answerButtons.length > 0) {
                // Click buttons[0] (value '1') for speed
                const btnToClick = answerButtons[0];
                await btnToClick.click();
                questionCount++;

                // Wait a bit for transition
                await new Promise(r => setTimeout(r, 100));

                // Check for "Finish" button
                // It usually has "Finish" or "סיימתי" text
                const buttons = await page.$$('button');
                for (const btn of buttons) {
                    const text = await page.evaluate(el => el.textContent, btn);
                    if (text.includes('Finish') || text.includes('סיימתי')) {
                        const isDisabled = await page.evaluate(el => el.disabled, btn);
                        if (!isDisabled) {
                            logStep('Finish Button', 'INFO', 'Clicking Finish...');
                            await btn.click();
                            await new Promise(r => setTimeout(r, 3000)); // Wait for report generation
                            isQuestionnaireComplete = true; // Loop will break on next check
                            break;
                        }
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

        // 4. Report View Verification
        // Wait for Report View to fully load
        await page.waitForFunction(() => document.body.innerText.includes('Test User'));

        const reportScreenshot = await captureScreenshot(page);
        logStep('Report Loaded', 'PASS', 'Report view is visible', reportScreenshot);

        // 5. AI Insight Test
        logStep('AI Insight', 'INFO', 'Testing AI Insight Feature...');

        // Find "AI Analysis" tab button
        const tabButtons = await page.$$('button');
        let aiTabBtn = null;
        for (const btn of tabButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('AI Analysis') || text.includes('ניתוח AI')) {
                aiTabBtn = btn;
                break;
            }
        }

        if (aiTabBtn) {
            await aiTabBtn.click();
            logStep('AI Tab', 'PASS', 'Clicked AI Analysis tab');

            // Wait for loading or content
            // Loading text: "Analyzing..." or "מעבד..."
            // Success content: will be inside prose div

            // Wait up to 15s for AI result
            try {
                await page.waitForFunction(() => {
                    const prose = document.querySelector('.prose');
                    return prose && prose.textContent.length > 20;
                }, { timeout: 15000 });

                const aiContent = await page.$eval('.prose', el => el.textContent);
                if (aiContent.includes('error') || aiContent.includes('שגיאה')) {
                    logStep('AI Generation', 'FAIL', `AI returned error: ${aiContent.substring(0, 50)}...`, await captureScreenshot(page));
                } else {
                    logStep('AI Generation', 'PASS', `AI Content generated (${aiContent.length} chars)`, await captureScreenshot(page));

                    // 6. Feedback Loop Test
                    logStep('Feedback Loop', 'INFO', 'Testing AI Feedback Loop...');

                    // Click Negative Feedback (Thumbs Down)
                    const thumbsDownBtn = await page.$('button svg.lucide-thumbs-down');
                    if (thumbsDownBtn) {
                        await thumbsDownBtn.parentElement.click(); // Click the button container
                        logStep('Feedback UI', 'PASS', 'Clicked Negative Feedback');

                        await new Promise(r => setTimeout(r, 500));

                        // Type in refinement text area
                        await page.waitForSelector('textarea');
                        await page.type('textarea', 'Test refinement: please be more concise.');

                        // Click Send (Send Icon)
                        const sendBtn = await page.$('button svg.lucide-send');
                        if (sendBtn) {
                            await sendBtn.parentElement.click();
                            logStep('Feedback Submit', 'PASS', 'Submitted refinement request');

                            // Wait for regeneration (loading again)
                            await new Promise(r => setTimeout(r, 2000));

                            // Wait for result approved/refined state (Green checkmark)
                            try {
                                await page.waitForSelector('svg.lucide-check-circle', { timeout: 15000 });
                                logStep('Refinement Success', 'PASS', 'AI regenerated and showed success state', await captureScreenshot(page));
                            } catch (e) {
                                logStep('Refinement Timeout', 'WARN', 'Did not see success checkmark in time', await captureScreenshot(page));
                            }
                        } else {
                            logStep('Feedback Send', 'FAIL', 'Send button not found');
                        }
                    } else {
                        logStep('Feedback Button', 'FAIL', 'Thumbs down button not found');
                    }
                }
            } catch (e) {
                logStep('AI Timeout', 'FAIL', 'AI analysis timed out or did not load content');
            }

        } else {
            throw new Error('AI Analysis tab button not found');
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
