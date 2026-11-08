import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createAppServer } from "../server.js";

function post(port, path, payload) {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: "127.0.0.1", port, path, method: "POST", headers: { "Content-Type": "application/json" } }, res => {
            const chunks = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }));
        });
        req.on("error", reject);
        req.end(JSON.stringify(payload));
    });
}

test("interview review accepts alternative wording, returns study depth, and rejects invented questions", async () => {
    const key = process.env.GEMINI_API_KEY;
    const oldFetch = globalThis.fetch;
    process.env.GEMINI_API_KEY = "test-only-key";
    const outbound = [];
    globalThis.fetch = async (_url, options) => {
        outbound.push(JSON.parse(options.body));
        return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({
            overallReview: "Good core idea; add a code example.", learningPlan: "Draw an array and explain an index.",
            results: [{ index: 0, score: 88, summary: "Correctly described indexed contiguous storage.",
                strengths: ["Correct relationship between index and location"], improvements: ["Add a concrete index example"],
                answerLevel: "medium", studyAnswer: "An array stores same-type elements in adjacent slots; a[2] reads the third item." }] }) }] } }] }), { status: 200 });
    };
    const server = createAppServer();
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
        const port = server.address().port;
        const invalid = await post(port, "/api/review-interview", { answers: [{ category: "dsa", question: "Invented", answer: "Anything" }] });
        assert.equal(invalid.status, 400);
        assert.equal(outbound.length, 0);
        const answer = "Values are placed in adjacent memory cells, so the position number finds one directly.";
        const result = await post(port, "/api/review-interview", { answers: [{ category: "dsa", question: "What is an array?", answer }] });
        assert.equal(result.status, 200);
        assert.equal(result.body.results[0].answerLevel, "medium");
        assert.equal(result.body.results[0].score, 88);
        assert.equal(JSON.parse(outbound[0].contents[0].parts[0].text).answers[0].studentAnswer, answer);
        assert.match(outbound[0].systemInstruction.parts[0].text, /alternative wording/);
        assert.equal(outbound[0].generationConfig.responseJsonSchema.properties.results.items.required.at(-1), "studyAnswer");
        const unfamiliar = await post(port, "/api/review-interview", { answers: [{ category: "dsa", question: "What is an array?",
            answer: "", notAcquainted: true }] });
        assert.equal(unfamiliar.status, 200);
        assert.equal(unfamiliar.body.results[0].score, 0);
        assert.equal(unfamiliar.body.results[0].answerLevel, "easy");
        assert.equal(JSON.parse(outbound[1].contents[0].parts[0].text).answers[0].notAcquainted, true);
    } finally {
        await new Promise(resolve => server.close(resolve));
        globalThis.fetch = oldFetch;
        if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
    }
});
