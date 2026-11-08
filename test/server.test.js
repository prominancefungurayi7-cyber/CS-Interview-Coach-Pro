import test from "node:test";
import assert from "node:assert/strict";
import { createAppServer } from "../server.js";
import { oopQuestions } from "../data/oop.js";
import { dipQuestions } from "../data/dip.js";

async function withServer(run) {
    const server = createAppServer();
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try { return await run(`http://127.0.0.1:${server.address().port}`); }
    finally { await new Promise(resolve => server.close(resolve)); }
}

async function post(origin, route, data) {
    const response = await fetch(origin + route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return { status: response.status, body: await response.json() };
}

function structured(data) {
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(data) }] } }] }), { status: 200 });
}

test("serves static app and keeps the main API key private", async () => {
    await withServer(async origin => {
        const page = await fetch(origin);
        assert.equal(page.status, 200);
        assert.match(await page.text(), /AI Voice Coach/);
        assert.equal((await fetch(origin + "/geminiLive.js")).status, 200);
        assert.equal((await fetch(origin + "/questionSelection.js")).status, 200);
        assert.equal((await fetch(origin + "/audio-worklet.js")).status, 200);
        assert.equal((await fetch(origin + "/assets/visuals/dilationerosion.png")).status, 200);
        assert.equal((await fetch(origin + "/.env")).status, 404);
        assert.equal((await fetch(origin + "/server.js")).status, 404);
        const status = await (await fetch(origin + "/api/status")).json();
        assert.equal(status.provider, "gemini");
        assert.equal(typeof status.configured, "boolean");
    });
});

test("Gemini grading, explanation and voice token use bank answers", async () => {
    const oldKey = process.env.GEMINI_API_KEY;
    const oldFetch = globalThis.fetch;
    process.env.GEMINI_API_KEY = "test-only-key";
    const outbound = [];
    globalThis.fetch = async (url, options) => {
        if (String(url).startsWith("http://127.0.0.1")) return oldFetch(url, options);
        outbound.push({ url: String(url), options });
        if (String(url).endsWith("/auth_tokens")) return new Response(JSON.stringify({ name: "short-lived-token" }), { status: 200 });
        const input = JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
        if (input.answerLevel && !input.studentAnswer) return structured({ simpleTerms: "Numbered slots", simpleExample: "Three names", mediumExample: "Daily temperatures", complexExample: "Resizing a dynamic array" });
        return structured({ score: 83, summary: "Correct indexing", strengths: ["Indexing"], improvements: ["Memory layout"], nextStep: "Draw addresses", followUp: "What is a list?" });
    };
    try {
        await withServer(async origin => {
            const oop = oopQuestions.find(q => q.question === "What is Object-Oriented Programming?");
            const grade = await post(origin, "/api/evaluate", { category: "oop", question: oop.question, answer: "Objects combine state with behavior.", level: "easy" });
            assert.equal(grade.status, 200);
            assert.equal(grade.body.score, 83);
            const grading = JSON.parse(outbound[0].options.body);
            assert.match(outbound[0].url, /generativelanguage\.googleapis\.com\/v1beta\/models\/.*:generateContent/);
            assert.equal(outbound[0].options.headers["x-goog-api-key"], "test-only-key");
            assert.equal(grading.generationConfig.responseMimeType, "application/json");
            assert.equal(JSON.parse(grading.contents[0].parts[0].text).referenceAnswer, oop.answers.hard);
            const explain = await post(origin, "/api/explain", { category: "oop", question: oop.question, level: "easy" });
            assert.equal(explain.status, 200);
            assert.equal(explain.body.complexExample, "Resizing a dynamic array");
            assert.equal(JSON.parse(JSON.parse(outbound[1].options.body).contents[0].parts[0].text).referenceAnswer, oop.answers.easy);
            const voice = await post(origin, `/api/voice-token?${new URLSearchParams({ category: "oop", question: oop.question, level: "easy" })}`, {});
            assert.equal(voice.status, 200);
            assert.equal(voice.body.token, "short-lived-token");
            assert.equal(voice.body.voice, "Kore");
            assert.ok(voice.body.instructions.includes(oop.answers.easy));
            assert.doesNotMatch(JSON.stringify(voice.body), /test-only-key/);
            const tokenRequest = JSON.parse(outbound[2].options.body);
            assert.equal(tokenRequest.uses, 1);
            assert.equal(tokenRequest.liveConnectConstraints, undefined);
            assert.ok(tokenRequest.expireTime);
            const paper = oopQuestions.find(q => q.pastPaper && q.question.includes("Shape, Circle"));
            const paperVoice = await post(origin, `/api/voice-token?${new URLSearchParams({ category: "oop", question: paper.question, level: "medium" })}`, {});
            assert.equal(paperVoice.status, 200);
            assert.match(paperVoice.body.instructions, /past-paper topic.*clear steps/);
            assert.match(paperVoice.body.instructions, /Why it works:/);
            const dipPaper = dipQuestions.find(q => q.question.startsWith("Apply the horizontal Sobel kernel"));
            const dipVoice = await post(origin, `/api/voice-token?${new URLSearchParams({ category: "dip", question: dipPaper.question, level: "medium" })}`, {});
            assert.equal(dipVoice.status, 200);
            assert.match(dipVoice.body.instructions, /digital image processing past-paper topic/);
            assert.match(dipVoice.body.instructions, /image-processing calculation/);
            assert.match(dipVoice.body.instructions, /Why it works:/);
            assert.equal((await post(origin, "/api/explain", { category: "oop", question: "invented" })).status, 400);
        });
    } finally {
        globalThis.fetch = oldFetch;
        if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
    }
});

test("Gemini quota errors are actionable and do not expose credentials", async () => {
    const oldKey = process.env.GEMINI_API_KEY;
    const oldFetch = globalThis.fetch;
    process.env.GEMINI_API_KEY = "test-only-key";
    globalThis.fetch = async (url, options) => String(url).startsWith("http://127.0.0.1") ? oldFetch(url, options)
        : new Response(JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED", message: "quota" } }), { status: 429 });
    try {
        await withServer(async origin => {
            const grade = await post(origin, "/api/evaluate", { category: "dsa", question: "What is an array?", answer: "An array stores adjacent values." });
            const voice = await post(origin, "/api/voice-token?category=dsa&question=What%20is%20an%20array%3F", {});
            for (const result of [grade, voice]) {
                assert.equal(result.status, 502);
                assert.match(result.body.error, /quota or rate limit/);
                assert.doesNotMatch(JSON.stringify(result.body), /test-only-key/);
            }
        });
    } finally {
        globalThis.fetch = oldFetch;
        if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
    }
});

test("falls back to Flash-Lite when the primary text model is unavailable", async () => {
    const oldKey = process.env.GEMINI_API_KEY;
    const oldFetch = globalThis.fetch;
    process.env.GEMINI_API_KEY = "test-only-key";
    const models = [];
    globalThis.fetch = async (url, options) => {
        if (String(url).startsWith("http://127.0.0.1")) return oldFetch(url, options);
        models.push(String(url));
        return models.length === 1
            ? new Response(JSON.stringify({ error: { status: "UNAVAILABLE" } }), { status: 503 })
            : structured({ score: 90, summary: "Correct", strengths: ["Indexed access"], improvements: ["Add an example"], nextStep: "Draw a small array", followUp: "How are lists different?" });
    };
    try {
        await withServer(async origin => {
            const result = await post(origin, "/api/evaluate", { category: "dsa", question: "What is an array?", answer: "An array stores adjacent elements with indexed access." });
            assert.equal(result.status, 200);
            assert.equal(result.body.score, 90);
            assert.match(models[0], /gemini-3\.5-flash:generateContent/);
            assert.match(models[1], /gemini-3\.5-flash-lite:generateContent/);
        });
    } finally {
        globalThis.fetch = oldFetch;
        if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
    }
});
