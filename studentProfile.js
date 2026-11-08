export function normalizeStudentProfile(value) {
    if (!value || typeof value !== "object") return null;
    const name = typeof value.name === "string" ? value.name.trim().replace(/\s+/g, " ") : "";
    const school = typeof value.school === "string" ? value.school.trim().replace(/\s+/g, " ") : "";
    if (!name || !school || name.length > 80 || school.length > 120) return null;
    return { name, school };
}

export function progressFileName(profile) {
    const slug = profile.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    return `interview-progress-${slug || "student"}.pdf`;
}
