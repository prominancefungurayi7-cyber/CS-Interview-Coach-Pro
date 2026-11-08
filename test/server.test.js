import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createAppServer } from "../server.js";
import { oopQuestions } from "../data/oop.js";

function request(port, route, body, contentType) {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: "127.0.0.1", port, path: route, method: "POST", headers: { "Content-Type": contentType } }, res => {
            const chunks = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
        });
        req.on("error", reject);
        req.end(body);
    });
}

test("serves the coach and keeps the key on the server", async () => {
    const server = createAppServer();
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
        const origin = `http://127.0.0.1:${server.address().port}`;
        const page = await fetch(origin);
        assert.equal(page.status, 200);
        assert.equal(page.headers.get("cache-control"), "no-store");
        const html = await page.text();
        assert.match(html, /AI Voice Coach/);
        assert.match(html, /app\.js\?v=/);
        const script = await fetch(`${origin}/app.js?v=smoke`);
        assert.equal(script.status, 200);
        assert.equal(script.headers.get("cache-control"), "no-store");
        const status = await (await fetch(`${origin}/api/status`)).json();
        assert.equal(typeof status.configured, "boolean");
        const secret = await fetch(`${origin}/.env`);
        assert.equal(secret.status, 404);
        const speechModule = await fetch(`${origin}/speechTranscript.js`);
        assert.equal(speechModule.status, 200);
        const visual = await fetch(`${origin}/assets/visuals/dilationerosion.png`);
        assert.equal(visual.status, 200);
        assert.equal(visual.headers.get("content-type"), "image/png");
        const pdfLibrary = await fetch(`${origin}/assets/vendor/jspdf.umd.min.js`);
        assert.equal(pdfLibrary.status, 200);
        assert.match(pdfLibrary.headers.get("content-type"), /text\/javascript/);
        const chartLibrary = await fetch(`${origin}/assets/vendor/chart.umd.min.js`);
        assert.equal(chartLibrary.status, 200);
        assert.doesNotMatch(html, /Manage OpenAI API billing|platform\.openai\.com\/settings\/organization\/billing/);
        const unknown = await fetch(`${origin}/data/../server.js`);
        assert.equal(unknown.status, 404);
    } finally { await new Promise(resolve => server.close(resolve)); }
});

test("grounds grading in a bank answer and configures the live AI voice", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    const originalFetch = globalThis.fetch;
    process.env.OPENAI_API_KEY = "test-only-key";
    const outbound = [];
    globalThis.fetch = async (url, options) => {
        outbound.push({ url, options });
        if (url.endsWith("/responses")) return new Response(JSON.stringify({ output: [{ content: [{ type: "output_text", text: JSON.stringify({ score: 83, summary: "Correct indexing; explain memory layout.", strengths: ["Indexing"], improvements: ["Memory layout"], nextStep: "Draw an array and label its addresses.", followUp: "How does a linked list differ?" }) }] }] }), { status: 200 });
        return new Response("v=0\r\nanswer", { status: 200 });
    };
    const server = createAppServer();
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
        const port = server.address().port;
        const evaluation = await request(port, "/api/evaluate", JSON.stringify({ category: "dsa", question: "What is an array?", answer: "An array stores elements contiguously and uses an index to access each element.", pace: "slow" }), "application/json");
        assert.equal(evaluation.status, 200);
        assert.equal(JSON.parse(evaluation.body).score, 83);
        const gradingPrompt = JSON.parse(JSON.parse(outbound[0].options.body).input);
        assert.match(gradingPrompt.referenceAnswer, /contiguous memory/);
        assert.equal(gradingPrompt.pace, "slow");
        const voice = await request(port, "/api/realtime-session?category=dsa&question=What%20is%20an%20array%3F&pace=fast", "v=0\r\noffer", "application/sdp");
        assert.equal(voice.status, 200);
        const session = JSON.parse(outbound[1].options.body.get("session"));
        assert.equal(session.audio.output.voice, "marin");
        assert.match(session.instructions, /tradeoffs and edge cases/);
        const oop = oopQuestions.find(q => q.question === "What is Object-Oriented Programming?");
        const oopGrade = await request(port, "/api/evaluate", JSON.stringify({
            category: "oop", question: oop.question, answer: "Objects combine state with behavior.",
            level: "easy"
        }), "application/json");
        assert.equal(oopGrade.status, 200);
        const oopPrompt = JSON.parse(JSON.parse(outbound[2].options.body).input);
        assert.equal(oopPrompt.referenceAnswer, oop.answers.hard);
        assert.equal(oopPrompt.answerLevel, "easy");
        const oopVoiceRoute = `/api/realtime-session?${new URLSearchParams({ category: "oop", question: oop.question, level: "easy" })}`;
        const oopVoice = await request(port, oopVoiceRoute, "v=0\r\noffer", "application/sdp");
        assert.equal(oopVoice.status, 200);
        assert.ok(JSON.parse(outbound[3].options.body.get("session")).instructions.includes(oop.answers.easy));
    } finally {
        await new Promise(resolve => server.close(resolve));
        globalThis.fetch = originalFetch;
        if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = previousKey;
    }
});

test("reports exhausted API credits for both grading and voice without exposing credentials", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    const originalFetch = globalThis.fetch;
    process.env.OPENAI_API_KEY = "test-only-key";
    globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: "credit_balance_exhausted", type: "insufficient_quota", message: "No credits" } }), { status: 429 });
    const server = createAppServer();
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
        const port = server.address().port;
        const grading = await request(port, "/api/evaluate", JSON.stringify({ category: "dsa", question: "What is an array?", answer: "An array stores values in contiguous memory." }), "application/json");
        const explanation = await request(port, "/api/explain", JSON.stringify({ category: "dsa", question: "What is an array?" }), "application/json");
        const voice = await request(port, "/api/realtime-session?category=dsa&question=What%20is%20an%20array%3F", "v=0\r\noffer", "application/sdp");
        for (const result of [grading, explanation, voice]) {
            assert.equal(result.status, 502);
            assert.match(JSON.parse(result.body).error, /API credits are exhausted/);
            assert.doesNotMatch(result.body, /test-only-key/);
        }
    } finally {
        await new Promise(resolve => server.close(resolve));
        globalThis.fetch = originalFetch;
        if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = previousKey;
    }
});

test("explains a validated model answer with simple, medium, and complex examples", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    const originalFetch = globalThis.fetch;
    process.env.OPENAI_API_KEY = "test-only-key";
    let outbound;
    const explanation = {
        simpleTerms: "An array is a numbered row of slots.",
        simpleExample: "Three names in slots 0, 1, and 2.",
        mediumExample: "A list of daily temperatures accessed by day index.",
        complexExample: "A dynamic array resizes and copies elements when capacity is exhausted."
    };
    globalThis.fetch = async (url, options) => {
        outbound = { url, options };
        return new Response(JSON.stringify({ output: [{ content: [{ type: "output_text", text: JSON.stringify(explanation) }] }] }), { status: 200 });
    };
    const server = createAppServer();
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
        const port = server.address().port;
        const invalid = await request(port, "/api/explain", JSON.stringify({ category: "dsa", question: "Invented question" }), "application/json");
        assert.equal(invalid.status, 400);
        assert.equal(outbound, undefined);
        const result = await request(port, "/api/explain", JSON.stringify({ category: "dsa", question: "What is an array?" }), "application/json");
        assert.equal(result.status, 200);
        assert.deepEqual(JSON.parse(result.body), explanation);
        const sent = JSON.parse(outbound.options.body);
        assert.match(JSON.parse(sent.input).referenceAnswer, /contiguous memory/);
        assert.deepEqual(sent.text.format.schema.required, ["simpleTerms", "simpleExample", "mediumExample", "complexExample"]);
        const oop = oopQuestions.find(q => q.question === "What is Object-Oriented Programming?");
        const easy = await request(port, "/api/explain", JSON.stringify({ category: "oop", question: oop.question, level: "easy" }), "application/json");
        assert.equal(easy.status, 200);
        assert.equal(JSON.parse(JSON.parse(outbound.options.body).input).referenceAnswer, oop.answers.easy);
    } finally {
        await new Promise(resolve => server.close(resolve));
        globalThis.fetch = originalFetch;
        if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = previousKey;
    }
});
