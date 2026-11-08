import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import test from "node:test";

test("the hosted server binds to the configured public interface and port", async () => {
    const probe = net.createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = probe.address().port;
    await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));

    const child = spawn(process.execPath, ["server.js"], {
        cwd: new URL("..", import.meta.url),
        env: { ...process.env, HOST: "0.0.0.0", PORT: String(port), GEMINI_API_KEY: "test-only-key" },
        stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stderr.on("data", chunk => { output += chunk; });
    try {
        let response;
        for (let attempt = 0; attempt < 40; attempt++) {
            if (child.exitCode !== null) break;
            try {
                response = await fetch(`http://127.0.0.1:${port}/api/status`);
                break;
            } catch { await new Promise(resolve => setTimeout(resolve, 50)); }
        }
        assert.ok(response, `Hosted server did not start: ${output}`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { configured: true, provider: "gemini" });
    } finally {
        child.kill();
    }
});
