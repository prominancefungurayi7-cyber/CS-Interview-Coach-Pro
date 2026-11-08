import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dipQuestions } from "../data/dip.js";
import { visualForQuestion } from "../visuals.js";

test("DIP questions cover every outline week and the applied paper topics", async () => {
    assert.deepEqual([...new Set(dipQuestions.map(q => q.unit))].sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10]);
    assert.equal(dipQuestions.length, 46);
    assert.equal(new Set(dipQuestions.map(q => q.question)).size, dipQuestions.length);
    for (const question of dipQuestions) {
        for (const level of ["easy", "medium", "hard"]) assert.ok(question.answers[level]?.length > 60, `${question.question}: ${level}`);
    }
    const combined = dipQuestions.map(q => `${q.question} ${q.source}`).join(" ");
    for (const topic of ["Sobel", "near-infrared", "geometric", "confusion matrix", "morphological", "JPEG", "Wiener", "CNN"]) {
        assert.match(combined.toLowerCase(), new RegExp(topic.toLowerCase()));
    }
    const manifest = JSON.parse(await readFile(new URL("../assets/visuals/manifest.json", import.meta.url)));
    assert.ok(manifest.length >= 10);
    for (const asset of manifest) {
        assert.match(asset.source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
        assert.ok(asset.author && asset.license);
        assert.ok((await readFile(new URL(`../${asset.path}`, import.meta.url))).length > 100);
    }
    assert.ok(visualForQuestion({ category: "dip", question: "Explain dilation and erosion", topic: "Morphology" }));
});
