import test from "node:test";
import assert from "node:assert/strict";
import { oopQuestions } from "../data/oop.js";

test("Java OOP bank spans every HCSE224 unit with distinct, example-based answer styles", () => {
    assert.ok(oopQuestions.length >= 80);
    assert.deepEqual([...new Set(oopQuestions.map(q => q.unit))].sort(), [1, 2, 3, 4, 5, 6]);
    assert.equal(new Set(oopQuestions.map(q => q.question)).size, oopQuestions.length);
    for (const question of oopQuestions) {
        assert.ok(["easy", "medium", "hard"].includes(question.difficulty), question.question);
        assert.ok(question.topic && question.source && question.keywords.length >= 3, question.question);
        assert.equal(question.modelAnswer, question.answers.medium, question.question);
        for (const level of ["easy", "medium", "hard"]) {
            assert.ok(question.answers[level].length > 80, `${question.question}: ${level}`);
        }
        assert.match(Object.values(question.answers).join(" "), /example|e\.g\.|for instance/i,
            `${question.question} needs an example`);
        assert.equal(new Set(Object.values(question.answers)).size, 3, question.question);
    }
});

test("past-paper designs and Java-specific corrections are represented", () => {
    const all = oopQuestions.map(q => `${q.question} ${q.source}`).join("\n");
    for (const topic of ["April 2025", "September 2024", "November 2025", "June 2026",
        "Shape", "Payable", "Product", "Swing", "JDBC", "CRUD"]) assert.match(all, new RegExp(topic, "i"));
    const destructor = oopQuestions.find(q => /destructor/i.test(q.question));
    assert.match(destructor.answers.medium, /no deterministic destructor/i);
});
