import test from "node:test";
import assert from "node:assert/strict";
import { oopQuestions } from "../data/oop.js";
import { pickWeightedQuestion, questionWeight, sampleWeightedQuestions } from "../questionSelection.js";

test("the supplied HCSE224 papers are tagged for extra practice", () => {
    const tagged = oopQuestions.filter(question => question.pastPaper);
    assert.ok(tagged.length >= 30);
    for (const year of ["September 2024", "April 2025", "November 2025", "June 2026"])
        assert.ok(tagged.some(question => question.source.includes(year)), year);
    assert.ok(oopQuestions.some(question => !question.pastPaper));
});

test("paper weighting preserves other questions and samples without replacement", () => {
    const ordinary = { category: "oop", pastPaper: false, question: "outline" };
    const paper = { category: "oop", pastPaper: true, question: "paper" };
    assert.equal(questionWeight(ordinary), 1);
    assert.equal(questionWeight(paper), 4);
    assert.equal(questionWeight({ category: "dip", pastPaper: true }), 1);
    assert.equal(pickWeightedQuestion([ordinary, paper], () => 0.1), ordinary);
    assert.equal(pickWeightedQuestion([ordinary, paper], () => 0.3), paper);
    assert.deepEqual(sampleWeightedQuestions([ordinary, paper], 3, () => 0.9), [paper, ordinary]);
    assert.equal(pickWeightedQuestion([], () => 0), null);
});
