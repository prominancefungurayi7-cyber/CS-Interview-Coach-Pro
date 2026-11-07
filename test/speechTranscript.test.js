import test from "node:test";
import assert from "node:assert/strict";
import { composeSpeechTranscript } from "../speechTranscript.js";

const result = text => [{ transcript: text }];

test("interim revisions replace earlier guesses instead of repeating them", () => {
    const updates = [
        [result("hello")],
        [result("hello how")],
        [result("hello how are you")],
        [result("hello how are you doing")]
    ];
    const rendered = updates.map(results => composeSpeechTranscript("", results));
    assert.deepEqual(rendered, [
        "hello", "hello how", "hello how are you", "hello how are you doing"
    ]);
});

test("keeps prior typed text and finalized speech once per result", () => {
    const results = [result("First sentence."), result("Second sentence")];
    assert.equal(composeSpeechTranscript("My notes:", results), "My notes: First sentence. Second sentence");
    results[1] = result("Second sentence completed.");
    assert.equal(composeSpeechTranscript("My notes:", results), "My notes: First sentence. Second sentence completed.");
});
