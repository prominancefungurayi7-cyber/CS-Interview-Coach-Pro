// Optional local UI smoke check: node scripts/browser-smoke.mjs
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createAppServer } from "../server.js";

const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(path.join(os.tmpdir(), "cs-coach-smoke-"));
const server = createAppServer();
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
try {
    const url = `http://127.0.0.1:${server.address().port}`;
    const result = await new Promise((resolve, reject) => {
        const process = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-gpu-sandbox",
            "--disable-software-rasterizer", "--no-first-run", `--user-data-dir=${profile}`,
            "--virtual-time-budget=8000", "--dump-dom", url], { windowsHide: true });
        let output = "", error = "";
        process.stdout.on("data", data => output += data.toString());
        process.stderr.on("data", data => error += data.toString());
        process.on("error", reject);
        process.on("close", code => resolve({ code, output, error }));
    });
    const cards = (result.output.match(/class="bank-card"/g) || []).length;
    const dip = /id="dipContainer"[\s\S]*?class="bank-card"/.test(result.output);
    const subtitle = /Browse \d+ interview questions across all categories/.test(result.output);
    const profileGate = /id="profileGate" class="profile-gate"/.test(result.output) && /class="app" inert/.test(result.output);
    console.log(JSON.stringify({ chromeExit: result.code, cards, dipRendered: dip, subtitleUpdated: subtitle, profileGate,
        subtitleNode: result.output.match(/<p id="bankSubtitle"[^>]*>[^<]*/)?.[0] }));
    if (result.code || cards < 46 || !dip || !subtitle || !profileGate) process.exitCode = 1;
} finally {
    await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(profile);
    if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) await rm(resolved, { recursive: true, force: true });
}
