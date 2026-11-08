// Optional diagnostic: node scripts/live-ai-check.mjs
// Sends one real grading request and uses the configured Gemini API quota.
import { createAppServer } from "../server.js";

const app = createAppServer();
await new Promise(resolve => app.listen(0, "127.0.0.1", resolve));
try {
    const origin = `http://127.0.0.1:${app.address().port}`;
    const status = await (await fetch(`${origin}/api/status`)).json();
    if (!status.configured) {
        console.log("Gemini API key is not configured in the server process.");
    } else {
        const response = await fetch(`${origin}/api/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: "dsa", question: "What is an array?",
                answer: "An array keeps values in neighboring memory locations and lets us retrieve an item by its numeric position." }) });
        const body = await response.json();
        console.log(JSON.stringify({ status: response.status, score: body.score, summary: body.summary, error: body.error }));
        if (!response.ok) process.exitCode = 1;
    }
} finally {
    await new Promise(resolve => app.close(resolve));
}
