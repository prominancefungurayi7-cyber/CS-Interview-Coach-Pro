// Optional local interaction check: node scripts/browser-interaction-smoke.mjs
import { spawn } from "node:child_process";
import http from "node:http";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createAppServer } from "../server.js";

const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(path.join(os.tmpdir(), "cs-coach-interaction-"));
const app = createAppServer();
await new Promise(resolve => app.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${app.address().port}`;
const injected = `<script>
if (!sessionStorage.getItem('smokePhase')) localStorage.setItem('csInterviewStats', '{corrupt');
window.addEventListener('load', async () => {
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  if (sessionStorage.getItem('smokePhase') === 'restore') {
    const restored = JSON.parse(sessionStorage.getItem('smokeChecks') || '{}');
    restored.restoredResults = !document.querySelector('#mockResults').classList.contains('hidden');
    restored.restoredAnswer = document.querySelector('#mockResultsDetail').textContent.includes('END_OF_FULL_ANSWER');
    restored.restoredMark = document.querySelector('#mockOverallScore').textContent === '16%';
    restored.restoredNotAcquainted = document.querySelector('#mockResultsDetail').textContent.includes('Not Acquainted');
    const result = document.createElement('pre'); result.id = 'interactionSmoke'; result.textContent = JSON.stringify(restored); document.body.appendChild(result);
    return;
  }
  const outcome = {};
  try {
    outcome.profileRequired = !document.querySelector('#profileGate').classList.contains('hidden') && document.querySelector('.app').inert;
    document.querySelector('#studentName').value = 'Alex Test';
    document.querySelector('#studentSchool').value = 'Example University';
    document.querySelector('#profileForm').requestSubmit();
    outcome.profileSaved = document.querySelector('#profileGate').classList.contains('hidden') &&
      document.querySelector('#dashboardWelcome').textContent.includes('Alex Test') &&
      document.querySelector('#progressStudent').textContent.includes('Example University');
    outcome.localPdfLibrary = !!window.jspdf?.jsPDF;
    if (window.jspdf?.jsPDF) {
      const nativePdf = window.jspdf.jsPDF;
      const pdfText = [];
      window.jspdf.jsPDF = function (...args) {
        const doc = new nativePdf(...args);
        const nativeText = doc.text;
        doc.text = (...parts) => { pdfText.push(String(parts[0])); return nativeText.apply(doc, parts); };
        doc.save = file => { window.smokePdfFile = file; window.smokePdfSize = doc.output('arraybuffer').byteLength; };
        return doc;
      };
      document.querySelector('#exportPdfBtn').click();
      outcome.pdfPersonalized = pdfText.some(line => line.includes('Alex Test')) && pdfText.some(line => line.includes('Example University')) &&
        window.smokePdfFile === 'interview-progress-alex-test.pdf' && window.smokePdfSize > 100;
    } else outcome.pdfPersonalized = false;
    document.querySelector('[data-page="dip"]').click();
    const first = document.querySelector('#dipContainer .bank-card details');
    const unfamiliar = document.querySelector('#dipContainer .bank-card .not-acquainted-bank-btn');
    unfamiliar.click();
    outcome.bankNotAcquainted = unfamiliar.disabled && document.querySelector('#reviewContainer').textContent.includes('digital image');
    first.open = true; first.querySelector('.explain-answer-btn').click();
    await pause(300);
    const panel = first.querySelector('.explanation-panel');
    outcome.explanation = !!panel.querySelector('canvas') && !panel.textContent.trim().startsWith('Not found');
    document.querySelector('[data-page="practice"]').click();
    document.querySelector('#categorySelect').value = 'dip';
    document.querySelector('#startPracticeBtn').click();
    document.querySelector('#practiceNotAcquaintedBtn').click();
    outcome.practiceNotAcquainted = document.querySelector('#scoreValue').textContent === '0' &&
      !document.querySelector('#modelAnswerBox').classList.contains('hidden');
    document.querySelector('#startPracticeBtn').click();
    document.querySelector('#answerInput').value = 'A digital image is sampled as a grid of pixels whose values represent intensity or colour.';
    document.querySelector('#submitAnswerBtn').click();
    await pause(300);
    outcome.practiceAiScore = document.querySelector('#scoreValue').textContent === '87';
    document.querySelector('[data-page="aiCoach"]').click();
    Object.defineProperty(window, 'RTCPeerConnection', { value: undefined, configurable: true });
    document.querySelector('#coachStartBtn').click();
    await pause(100);
    document.querySelector('#coachNotAcquaintedBtn').click();
    outcome.coachNotAcquainted = document.querySelector('#coachFeedback').textContent.includes('Not Acquainted') &&
      document.querySelector('#coachNotAcquaintedBtn').disabled;
    document.querySelector('[data-page="mock"]').click();
    document.querySelector('#mockQuestionCount').value = '5';
    document.querySelectorAll('#mockCategoryChecks input').forEach(box => box.checked = box.value === 'dip');
    document.querySelector('#startMockBtn').click();
    const answer = 'Pixels are spatial samples with intensity values. '.repeat(7) + 'END_OF_FULL_ANSWER';
    const input = document.querySelector('#mockAnswerInput');
    input.value = answer;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    outcome.enterAdvanced = document.querySelector('#mockQuestionCounter').textContent.includes('Question 2');
    document.querySelector('#mockNotAcquaintedBtn').click();
    for (let i = 0; i < 3; i++) document.querySelector('#mockSkipBtn').click();
    await pause(500);
    outcome.mockResults = !document.querySelector('#mockResults').classList.contains('hidden');
    outcome.fullAnswer = document.querySelector('#mockResultsDetail').textContent.includes('END_OF_FULL_ANSWER');
    outcome.aiMark = document.querySelector('#mockOverallScore').textContent === '16%';
    outcome.review = document.querySelector('#mockReviewStatus').textContent.includes('Overall AI review');
    outcome.mockNotAcquainted = document.querySelector('#mockResultsDetail').textContent.includes('Not Acquainted');
  } catch (error) { outcome.error = error.message; }
  if (!outcome.error) { sessionStorage.setItem('smokeChecks', JSON.stringify(outcome)); sessionStorage.setItem('smokePhase', 'restore'); location.reload(); return; }
  const result = document.createElement('pre'); result.id = 'interactionSmoke'; result.textContent = JSON.stringify(outcome); document.body.appendChild(result);
});
</script>`;
const proxy = http.createServer(async (req, res) => {
    try {
        if (req.url === "/" || req.url.startsWith("/?")) {
            const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(html.replace("</body>", `${injected}</body>`));
            return;
        }
        if (req.url === "/api/explain") {
            res.writeHead(404, { "Content-Type": "application/json" }); res.end('{"error":"Not found"}'); return;
        }
        if (req.url === "/api/status") {
            res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"configured":true}'); return;
        }
        if (req.url === "/api/evaluate") {
            for await (const _ of req) { /* drain */ }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ score: 87, summary: "Correct explanation in different wording.", strengths: ["Meaning"],
                improvements: ["Add an example"], nextStep: "Draw the concept.", followUp: "What is resolution?" }));
            return;
        }
        if (req.url === "/api/review-interview") {
            let body = ""; for await (const chunk of req) body += chunk;
            const answers = JSON.parse(body).answers;
            const results = answers.map((item, index) => ({ index, score: item.answer ? 80 : 0,
                summary: item.answer ? "Correct core idea." : "Skipped.", strengths: item.answer ? ["Core idea"] : [],
                improvements: ["Add an example"], answerLevel: "medium", studyAnswer: "A pixel stores one sampled value in an image grid." }));
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ overallReview: "One answer showed the core idea.", learningPlan: "Practice examples.", results }));
            return;
        }
        const upstream = await fetch(origin + req.url);
        const data = Buffer.from(await upstream.arrayBuffer());
        res.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") || "application/octet-stream" });
        res.end(data);
    } catch (error) { res.writeHead(500); res.end(error.message); }
});
await new Promise(resolve => proxy.listen(0, "127.0.0.1", resolve));
try {
    const url = `http://127.0.0.1:${proxy.address().port}`;
    const result = await new Promise((resolve, reject) => {
        const child = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-gpu-sandbox",
            "--disable-software-rasterizer", "--no-first-run", `--user-data-dir=${profile}`,
            "--virtual-time-budget=18000", "--dump-dom", url], { windowsHide: true });
        let output = "";
        child.stdout.on("data", data => output += data.toString());
        child.on("error", reject);
        child.on("close", code => resolve({ code, output }));
    });
    const match = result.output.match(/<pre id="interactionSmoke">([^<]+)<\/pre>/);
    const checks = match ? JSON.parse(match[1].replaceAll("&quot;", '"')) : { missingResult: true };
    console.log(JSON.stringify(checks));
    if (result.code || Object.values(checks).some(value => value !== true)) process.exitCode = 1;
} finally {
    await new Promise(resolve => proxy.close(resolve));
    await new Promise(resolve => app.close(resolve));
    const resolved = path.resolve(profile);
    if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) await rm(resolved, { recursive: true, force: true });
}
