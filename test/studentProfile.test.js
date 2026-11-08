import test from "node:test";
import assert from "node:assert/strict";
import { normalizeStudentProfile, progressFileName } from "../studentProfile.js";

test("student profile requires a name and school and gives a safe personalized report filename", () => {
    assert.equal(normalizeStudentProfile({ name: "   ", school: "Example University" }), null);
    assert.equal(normalizeStudentProfile({ name: "Alex", school: "  " }), null);
    assert.equal(normalizeStudentProfile({ name: "A".repeat(81), school: "School" }), null);
    const profile = normalizeStudentProfile({ name: "  Alex   Ndlovu  ", school: "  Midlands State University  " });
    assert.deepEqual(profile, { name: "Alex Ndlovu", school: "Midlands State University" });
    assert.equal(progressFileName(profile), "interview-progress-alex-ndlovu.pdf");
    assert.equal(progressFileName({ name: "../../reports", school: "School" }), "interview-progress-reports.pdf");
});
