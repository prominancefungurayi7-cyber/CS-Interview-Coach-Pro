// Past-paper Java OOP questions get more practice without excluding the syllabus.
export function questionWeight(question) {
    return question.category === "oop" && question.pastPaper ? 4 : 1;
}

export function pickWeightedQuestion(questions, random = Math.random) {
    if (!questions.length) return null;
    const total = questions.reduce((sum, question) => sum + questionWeight(question), 0);
    let ticket = random() * total;
    for (const question of questions) {
        ticket -= questionWeight(question);
        if (ticket < 0) return question;
    }
    return questions.at(-1);
}

export function sampleWeightedQuestions(questions, count, random = Math.random) {
    const remaining = [...questions];
    const chosen = [];
    while (remaining.length && chosen.length < count) {
        const question = pickWeightedQuestion(remaining, random);
        chosen.push(question);
        remaining.splice(remaining.indexOf(question), 1);
    }
    return chosen;
}
