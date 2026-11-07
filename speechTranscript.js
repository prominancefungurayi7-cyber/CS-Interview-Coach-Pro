export function composeSpeechTranscript(existingText, results) {
    const spoken = Array.from(results, result => result?.[0]?.transcript?.trim() || "")
        .filter(Boolean).join(" ");
    return [existingText.trim(), spoken].filter(Boolean).join(" ");
}
