import test from "node:test";
import assert from "node:assert/strict";
import { createCoachProfile, updateCoachProfile, effectivePace, nextDifficulty, weakestCategory } from "../coachProfile.js";

test("adapts the pace after repeated low scores and hint use", () => {
    let profile = createCoachProfile();
    for (const score of [48, 52, 61]) profile = updateCoachProfile(profile, { category: "dsa", score, usedHint: true, seconds: 80 });
    assert.equal(profile.pace, "slow");
    assert.equal(nextDifficulty(profile), "easy");
    assert.equal(weakestCategory(profile, ["dsa", "oop"]), "dsa");
});

test("advances after sustained strong answers and respects a student override", () => {
    let profile = createCoachProfile();
    for (const score of [90, 86, 94]) profile = updateCoachProfile(profile, { category: "oop", score, usedHint: false, seconds: 45 });
    assert.equal(profile.pace, "fast");
    assert.equal(nextDifficulty(profile), "hard");
    profile.preferredPace = "slow";
    assert.equal(effectivePace(profile), "slow");
    assert.equal(nextDifficulty(profile), "easy");
});
