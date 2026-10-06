/** Collects suite/step results, prints them, and writes the HTML report. */

import fs from 'fs';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { BASE_URL, OPEN_REPORT, REPORT_PATH } from './config.js';

const suites = [];
let currentSuite = null;

export function startSuite(name) {
    currentSuite = { name, steps: [] };
    suites.push(currentSuite);
    console.log(`\n${'═'.repeat(60)}\n  Suite: ${name}\n${'═'.repeat(60)}`);
}

export function logStep(name, status, details = '', screenshot = null) {
    const icons = { PASS: '✅', FAIL: '❌', WARN: '⚠️ ', INFO: 'ℹ️ ', SKIP: '⏭️ ' };
    console.log(`  ${icons[status] || '  '} [${status}] ${name}${details ? '\n         → ' + details : ''}`);
    currentSuite?.steps.push({ name, status, details, timestamp: new Date().toISOString(), screenshot });
}

export async function captureScreenshot(page) {
    try { return await page.screenshot({ encoding: 'base64', type: 'png' }); }
    catch { return null; }
}

/** Run a suite body, turning any uncaught error into a FAIL step with a screenshot. */
export async function runSuite(name, body) {
    startSuite(name);
    const pages = [];
    const track = (page) => { pages.push(page); return page; };
    try {
        await body(track);
    } catch (err) {
        const page = pages.at(-1);
        logStep('Suite error', 'FAIL', err.message, page ? await captureScreenshot(page) : null);
    } finally {
        for (const page of pages) await page.close().catch(() => {});
    }
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function summarize() {
    const checks = suites.flatMap(s => s.steps).filter(s => s.status !== 'INFO');
    const count = (status) => checks.filter(s => s.status === status).length;
    return { total: checks.length, passed: count('PASS'), failed: count('FAIL'), warned: count('WARN'), skipped: count('SKIP') };
}

export function generateReport() {
    const { total, passed, failed, warned, skipped } = summarize();

    const suiteRows = suites.map(suite => {
        const n = (status) => suite.steps.filter(s => s.status === status).length;
        const dur = suite.steps.length > 1
            ? ((new Date(suite.steps.at(-1).timestamp) - new Date(suite.steps[0].timestamp)) / 1000).toFixed(1)
            : '–';
        return `<tr><td>${escapeHtml(suite.name)}</td><td>${suite.steps.length}</td>
            <td class="ok">${n('PASS')}</td><td class="${n('FAIL') ? 'err' : 'ok'}">${n('FAIL')}</td>
            <td class="${n('WARN') ? 'warn' : ''}">${n('WARN')}</td><td>${n('SKIP')}</td><td>${dur}s</td></tr>`;
    }).join('');

    const stepRows = suites.map(suite => `
        <div class="suite-card">
            <div class="suite-header">
                <h3>${escapeHtml(suite.name)}</h3>
                <span>${suite.steps.filter(s => s.status === 'PASS').length}/${suite.steps.length} passed</span>
            </div>
            ${suite.steps.map(step => `
                <div class="step ${step.status}">
                    <span class="badge ${step.status}">${step.status}</span>
                    <div class="step-body">
                        <div class="step-name">${escapeHtml(step.name)}</div>
                        ${step.details ? `<div class="step-details">${escapeHtml(step.details)}</div>` : ''}
                        ${step.screenshot ? `<img class="screenshot" src="data:image/png;base64,${step.screenshot}" />` : ''}
                        <div class="ts">${new Date(step.timestamp).toLocaleTimeString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Bond E2E Report</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,sans-serif;max-width:980px;margin:0 auto;padding:24px;background:#f0f2f5;color:#1e293b}
  h1{color:#1e293b;border-bottom:3px solid #8c50f0;padding-bottom:12px;margin-bottom:4px}
  h2{color:#334155;margin:28px 0 10px;font-size:.85em;text-transform:uppercase;letter-spacing:1px}
  .meta{color:#64748b;font-size:.85em;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px}
  .card{background:white;padding:16px;border-radius:12px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.07)}
  .card .num{font-size:2em;font-weight:900}.card .lbl{font-size:.75em;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:4px}
  .pass-num{color:#16a34a}.fail-num{color:#dc2626}.warn-num{color:#d97706}.skip-num{color:#94a3b8}
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
  <h1>🧪 Bond E2E Report</h1>
  <p class="meta">Target: <strong>${escapeHtml(BASE_URL)}</strong> · Generated: ${new Date().toLocaleString()}</p>
  <div class="grid">
    <div class="card"><div class="num">${total}</div><div class="lbl">Checks</div></div>
    <div class="card"><div class="num pass-num">${passed}</div><div class="lbl">Passed</div></div>
    <div class="card"><div class="num fail-num">${failed}</div><div class="lbl">Failed</div></div>
    <div class="card"><div class="num warn-num">${warned}</div><div class="lbl">Warnings</div></div>
    <div class="card"><div class="num skip-num">${skipped}</div><div class="lbl">Skipped</div></div>
  </div>
  <h2>Suite Summary</h2>
  <table><thead><tr><th>Suite</th><th>Steps</th><th>Passed</th><th>Failed</th><th>Warnings</th><th>Skipped</th><th>Duration</th></tr></thead>
  <tbody>${suiteRows}</tbody></table>
  <h2>Detailed Results</h2>${stepRows}
</body></html>`;

    const reportFile = fileURLToPath(REPORT_PATH);
    fs.writeFileSync(reportFile, html);
    console.log(`\n📄 Report: ${reportFile}`);
    if (!OPEN_REPORT) return;
    // execFile (not exec) — the path is ours, no shell involved
    const opener = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const openerArgs = process.platform === 'win32' ? ['/c', 'start', '', reportFile] : [reportFile];
    execFile(opener, openerArgs, (err) => { if (err) console.error('Could not open report:', err.message); });
}
