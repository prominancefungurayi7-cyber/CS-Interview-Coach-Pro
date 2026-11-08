// Run with: node scripts/browser-pages-smoke.mjs
// Reproduces GitHub Pages hosting under /CS-Interview-Coach-Pro/.
import { spawn } from "node:child_process";
import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createAppServer } from "../server.js";

const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(path.join(os.tmpdir(), "cs-coach-pages-"));
const app = createAppServer();
await new Promise(resolve => app.listen(0, "127.0.0.1", resolve));
const appOrigin = `http://127.0.0.1:${app.address().port}`;
const prefix = "/CS-Interview-Coach-Pro/";
const diagnostic = `<script>
window.__bootErrors = [];
localStorage.setItem('csInterviewStats', JSON.stringify({ practiced: 4, sessions: 2,
  totalScore: 280, mockCount: 1, categoryStats: { oop: { count: 4, totalScore: 280 } },
  difficultyStats: { easy: { count: 1, total: 80 }, medium: { count: 2, total: 140 },
    hard: { count: 1, total: 60 } }, history: [], lastPracticeDate: null, streak: 1 }));
window.addEventListener('error', event => window.__bootErrors.push(event.message || event.target?.src || 'resource error'), true);
window.addEventListener('unhandledrejection', event => window.__bootErrors.push(String(event.reason)));
window.addEventListener('load', () => setTimeout(() => {
  const form = document.getElementById('profileForm');
  document.getElementById('studentName').value = 'Alex Test';
  document.getElementById('studentSchool').value = 'Example University';
  form.requestSubmit();
  const report = document.createElement('pre');
  report.id = 'pagesSmoke';
  report.textContent = JSON.stringify({ready: !!window.__coachAppReady,
    gateHidden: document.getElementById('profileGate').classList.contains('hidden'),
    appEnabled: !document.querySelector('.app').inert,
    progressPreserved: document.getElementById('questionsPracticed').textContent === '4',
    pdfReady: !!window.jspdf?.jsPDF, chartReady: !!window.Chart,
    error: document.getElementById('profileError').textContent, errors: window.__bootErrors});
  document.body.appendChild(report);
}, 100));
</script>`;
const proxy = http.createServer(async (req, res) => {
    if (!req.url.startsWith(prefix)) { res.writeHead(404); res.end("Not found"); return; }
    const target = req.url.slice(prefix.length - 1);
    const upstream = await fetch(appOrigin + target);
    const contentType = upstream.headers.get("content-type") || "text/plain";
    let body = await upstream.arrayBuffer();
    if (target === "/") {
        const html = Buffer.from(body).toString("utf8");
        body = Buffer.from(html.replace("<script type=\"module\"", `${diagnostic}<script type="module"`));
    }
    res.writeHead(upstream.status, { "Content-Type": contentType });
    res.end(Buffer.from(body));
});
await new Promise(resolve => proxy.listen(0, "127.0.0.1", resolve));
try {
    const url = `http://127.0.0.1:${proxy.address().port}${prefix}`;
    const result = await new Promise((resolve, reject) => {
        const child = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
            `--user-data-dir=${profile}`, "--virtual-time-budget=5000", "--dump-dom", url], { windowsHide: true });
        let output = "", error = "";
        child.stdout.on("data", data => output += data);
        child.stderr.on("data", data => error += data);
        child.on("error", reject);
        child.on("close", code => resolve({ code, output, error }));
    });
    const encoded = result.output.match(/<pre id="pagesSmoke">([^<]*)<\/pre>/)?.[1];
    const decoded = encoded?.replaceAll("&quot;", '"').replaceAll("&amp;", "&");
    console.log(decoded || JSON.stringify({ chromeExit: result.code, browserError: result.error.slice(-500) }));
    if (!decoded) process.exitCode = 1;
    else {
        const checks = JSON.parse(decoded);
        if (!checks.ready || !checks.gateHidden || !checks.appEnabled || !checks.progressPreserved ||
            !checks.pdfReady || !checks.chartReady || checks.error || checks.errors.length) process.exitCode = 1;
    }
} finally {
    await new Promise(resolve => proxy.close(resolve));
    await new Promise(resolve => app.close(resolve));
    const resolved = path.resolve(profile);
    if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) await rm(resolved, { recursive: true, force: true });
}
