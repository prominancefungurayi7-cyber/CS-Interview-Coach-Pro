export function createCoachProfile() {
    return { attempts: [], pace: "medium", preferredPace: "auto" };
}

export function updateCoachProfile(profile, attempt) {
    const attempts = [...(profile.attempts || []), {
        category: attempt.category,
        score: Math.max(0, Math.min(100, Number(attempt.score) || 0)),
        usedHint: Boolean(attempt.usedHint),
        seconds: Math.max(0, Number(attempt.seconds) || 0)
    }].slice(-30);
    const recent = attempts.slice(-6);
    const average = recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
    const hintRate = recent.filter(item => item.usedHint).length / recent.length;
    // Pace describes the current coaching setting, not a fixed ability label.
    let pace = "medium";
    if (recent.length >= 3 && (average < 55 || hintRate >= 0.5)) pace = "slow";
    if (recent.length >= 3 && average >= 82 && hintRate <= 0.16) pace = "fast";
    return { ...profile, attempts, pace };
}

export function effectivePace(profile) {
    return ["slow", "medium", "fast"].includes(profile.preferredPace)
        ? profile.preferredPace : profile.pace || "medium";
}

export function nextDifficulty(profile) {
    const pace = effectivePace(profile);
    return pace === "slow" ? "easy" : pace === "fast" ? "hard" : "medium";
}

export function weakestCategory(profile, categories) {
    const attempts = profile.attempts || [];
    const scores = categories.map(category => {
        const items = attempts.filter(item => item.category === category);
        return { category, count: items.length,
            average: items.length ? items.reduce((sum, item) => sum + item.score, 0) / items.length : 100 };
    });
    return scores.filter(item => item.count > 0).sort((a, b) => a.average - b.average)[0]?.category || null;
}
