import test from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { studyGuides } from "../data/studyGuides.js";

test("every question has a contextual prompt and three distinct worked examples", async () => {
    const files = (await readdir(new URL("../data/", import.meta.url))).filter(file =>
        file.endsWith(".js") && file !== "studyGuides.js");
    const expected = new Set();
    for (const file of files) {
        const category = file === "companyQuestions.js" ? "company" : file.slice(0, -3);
        const module = await import(`../data/${file}`);
        const questions = Object.values(module).find(Array.isArray);
        assert.ok(questions, `Question bank missing from ${file}`);
        for (const question of questions) {
            const key = `${category}:${question.question}`;
            expected.add(key);
            const guide = studyGuides[key];
            assert.ok(guide, `Missing study guide: ${key}`);
            assert.ok(guide.context.length >= 30, `Short context: ${key}`);
            assert.ok(guide.answer.length >= 90, `Short expanded answer: ${key}`);
            const examples = [guide.simpleExample, guide.mediumExample, guide.complexExample];
            assert.ok(examples.every(example => typeof example === "string" && example.length >= 20), `Missing worked example: ${key}`);
            assert.equal(new Set(examples.map(example => example.toLowerCase())).size, 3, `Repeated worked example: ${key}`);
        }
    }
    assert.equal(expected.size, 487);
    assert.deepEqual(new Set(Object.keys(studyGuides)), expected);
});
