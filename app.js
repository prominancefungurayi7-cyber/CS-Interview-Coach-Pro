import { dsaQuestions } from "./data/dsa.js";
import { oopQuestions } from "./data/oop.js";
import { dbmsQuestions } from "./data/dbms.js";
import { osQuestions } from "./data/os.js";
import { networkingQuestions } from "./data/networking.js";
import { softwareEngineeringQuestions } from "./data/softwareEngineering.js";
import { webQuestions } from "./data/web.js";
import { cloudQuestions } from "./data/cloud.js";
import { cybersecurityQuestions } from "./data/cybersecurity.js";
import { behavioralQuestions } from "./data/behavioral.js";
import { internshipQuestions } from "./data/internship.js";
import { graduateQuestions } from "./data/graduate.js";
import { hrQuestions } from "./data/hr.js";
import { codingQuestions } from "./data/coding.js";
import { companyQuestions } from "./data/companyQuestions.js";
import { systemDesignQuestions } from "./data/systemDesign.js";
import { projectQuestions } from "./data/projects.js";

const CATEGORY_LABELS = {
    dsa: "Data Structures & Algorithms",
    oop: "Object Oriented Programming",
    dbms: "Database Management Systems",
    os: "Operating Systems",
    networking: "Computer Networking",
    softwareEngineering: "Software Engineering",
    web: "Web Development",
    cloud: "Cloud Computing",
    cybersecurity: "Cybersecurity",
    behavioral: "Behavioral Interviews",
    internship: "Internship Interviews",
    graduate: "Graduate Trainee",
    hr: "Human Resources",
    coding: "Coding Interviews",
    company: "Company Interviews",
    systemDesign: "System Design",
    projects: "Projects"
};

const questionBanks = {
    dsa: dsaQuestions,
    oop: oopQuestions,
    dbms: dbmsQuestions,
    os: osQuestions,
    coding: codingQuestions,
    networking: networkingQuestions,
    softwareEngineering: softwareEngineeringQuestions,
    web: webQuestions,
    projects: projectQuestions,
    company: companyQuestions,
    systemDesign: systemDesignQuestions,
    cloud: cloudQuestions,
    cybersecurity: cybersecurityQuestions,
    behavioral: behavioralQuestions,
    internship: internshipQuestions,
    graduate: graduateQuestions,
    hr: hrQuestions
};

const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

function assignDifficulty(index, total) {
    const third = Math.ceil(total / 3);
    if (index < third) return "easy";
    if (index < third * 2) return "medium";
    return "hard";
}

function enrichQuestions(category, questions) {
    return questions.map((q, i) => ({
        ...q,
        category,
        categoryLabel: CATEGORY_LABELS[category],
        difficulty: q.difficulty || assignDifficulty(i, questions.length)
    }));
}

const allQuestions = Object.entries(questionBanks).flatMap(([cat, qs]) =>
    enrichQuestions(cat, qs)
);

let stats = JSON.parse(localStorage.getItem("csInterviewStats")) || {
    practiced: 0,
    sessions: 0,
    totalScore: 0,
    mockCount: 0,
    categoryStats: {},
    difficultyStats: { easy: { count: 0, total: 0 }, medium: { count: 0, total: 0 }, hard: { count: 0, total: 0 } },
    history: [],
    lastPracticeDate: null,
    streak: 0
};

let currentQuestion = null;
let mockState = null;
let mockTimerInterval = null;
let speechRecognition = null;
let activeSpeechTarget = null;

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-btn");

function $(id) {
    return document.getElementById(id);
}

function navigateTo(pageId) {
    navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.page === pageId));
    pages.forEach(page => page.classList.toggle("active", page.id === pageId));
}

navButtons.forEach(button => {
    button.addEventListener("click", () => navigateTo(button.dataset.page));
});

function populateCategories() {
    const select = $("categorySelect");
    const bankFilter = $("bankCategoryFilter");
    const mockChecks = $("mockCategoryChecks");

    select.innerHTML = "";
    bankFilter.innerHTML = '<option value="all">All Categories</option>';
    mockChecks.innerHTML = "";

    Object.entries(CATEGORY_LABELS).forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.appendChild(option);

        const filterOption = option.cloneNode(true);
        bankFilter.appendChild(filterOption);

        const labelEl = document.createElement("label");
        labelEl.className = "checkbox-label";
        labelEl.innerHTML = `<input type="checkbox" value="${value}" checked> ${label}`;
        mockChecks.appendChild(labelEl);
    });
}

function getFilteredQuestions(category, difficulty = "all") {
    let pool = category === "random"
        ? [...allQuestions]
        : enrichQuestions(category, questionBanks[category] || []);

    if (difficulty !== "all") {
        pool = pool.filter(q => q.difficulty === difficulty);
    }

    return pool;
}

function pickRandomQuestion(category, difficulty = "all") {
    const pool = getFilteredQuestions(category, difficulty);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

function generateRandomInterview(count = 5, difficulty = "all", categories = null) {
    let pool = allQuestions;

    if (categories && categories.length) {
        pool = pool.filter(q => categories.includes(q.category));
    }

    if (difficulty !== "all") {
        pool = pool.filter(q => q.difficulty === difficulty);
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function calculateScore(answer, keywords) {
    if (!keywords || !keywords.length) return 50;

    let matches = 0;
    const lower = answer.toLowerCase();

    keywords.forEach(word => {
        if (lower.includes(word.toLowerCase())) matches++;
    });

    return Math.max(20, Math.round((matches / keywords.length) * 100));
}

function getReadinessLevel(score) {
    if (score >= 85) return "Graduate Ready";
    if (score >= 70) return "Internship Ready";
    if (score >= 40) return "Intermediate";
    return "Beginner";
}

function computeReadinessScore() {
    if (!stats.practiced) return 0;

    const avgScore = stats.totalScore / stats.practiced;
    const categoryCount = Object.keys(stats.categoryStats).length;
    const coverageBonus = Math.min(categoryCount * 3, 15);
    const sessionBonus = Math.min(stats.sessions * 0.5, 10);
    const mockBonus = Math.min(stats.mockCount * 2, 10);

    return Math.min(100, Math.round(avgScore * 0.75 + coverageBonus + sessionBonus + mockBonus));
}

function recordAnswer(question, score, answer, mode = "practice") {
    const today = new Date().toISOString().slice(0, 10);

    if (stats.lastPracticeDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        stats.streak = stats.lastPracticeDate === yesterdayStr ? stats.streak + 1 : 1;
        stats.lastPracticeDate = today;
    }

    stats.practiced++;
    stats.sessions++;
    stats.totalScore += score;

    if (!stats.categoryStats[question.category]) {
        stats.categoryStats[question.category] = { count: 0, totalScore: 0 };
    }
    stats.categoryStats[question.category].count++;
    stats.categoryStats[question.category].totalScore += score;

    if (!stats.difficultyStats[question.difficulty]) {
        stats.difficultyStats[question.difficulty] = { count: 0, total: 0 };
    }
    stats.difficultyStats[question.difficulty].count++;
    stats.difficultyStats[question.difficulty].total += score;

    stats.history.unshift({
        date: new Date().toLocaleString(),
        category: question.category,
        categoryLabel: question.categoryLabel,
        question: question.question,
        score,
        difficulty: question.difficulty,
        mode
    });

    if (stats.history.length > 100) stats.history.length = 100;

    localStorage.setItem("csInterviewStats", JSON.stringify(stats));
    updateDashboard();
    renderProgress();
}

function getWeakTopics(threshold = 60) {
    return Object.entries(stats.categoryStats)
        .map(([cat, data]) => ({
            category: cat,
            label: CATEGORY_LABELS[cat] || cat,
            avg: Math.round(data.totalScore / data.count),
            count: data.count
        }))
        .filter(item => item.avg < threshold && item.count >= 1)
        .sort((a, b) => a.avg - b.avg);
}

function renderCategoryChart(containerId) {
    const container = $(containerId);
    if (!container) return;

    const entries = Object.entries(stats.categoryStats);
    if (!entries.length) {
        container.innerHTML = '<p class="empty-state">No category data yet.</p>';
        return;
    }

    container.innerHTML = entries.map(([cat, data]) => {
        const avg = Math.round(data.totalScore / data.count);
        return `
            <div class="chart-row">
                <span class="chart-label">${CATEGORY_LABELS[cat] || cat}</span>
                <div class="chart-bar-wrap">
                    <div class="chart-bar" style="width:${avg}%"></div>
                </div>
                <span class="chart-value">${avg}%</span>
            </div>`;
    }).join("");
}

function renderWeakTopics() {
    const container = $("weakTopicsList");
    const weak = getWeakTopics();

    if (!weak.length) {
        container.innerHTML = stats.practiced
            ? '<p class="empty-state success">No weak topics detected — great work!</p>'
            : '<p class="empty-state">Complete practice sessions to detect weak topics.</p>';
        return;
    }

    container.innerHTML = weak.map(item => `
        <div class="weak-topic-item">
            <div>
                <strong>${item.label}</strong>
                <span class="text-muted">${item.count} questions</span>
            </div>
            <span class="weak-score">${item.avg}%</span>
        </div>`).join("");
}

function updateDashboard() {
    $("questionsPracticed").textContent = stats.practiced;
    $("sessionsCompleted").textContent = stats.sessions;

    const avg = stats.practiced ? Math.round(stats.totalScore / stats.practiced) : 0;
    $("averageScore").textContent = avg + "%";

    const readiness = computeReadinessScore();
    $("readinessScore").textContent = readiness;
    $("readiness").textContent = getReadinessLevel(readiness);
    $("readinessBar").style.width = readiness + "%";
    $("readinessText").textContent = `Current readiness level: ${getReadinessLevel(readiness)} (${readiness}/100)`;

    renderCategoryChart("categoryChart");
    renderWeakTopics();
}

function showPracticeQuestion(question) {
    currentQuestion = question;
    $("questionTitle").textContent = question.question;
    $("answerInput").value = "";
    $("feedbackPanel").classList.add("hidden");
    $("modelAnswerBox").classList.add("hidden");

    const meta = $("practiceMeta");
    meta.classList.remove("hidden");
    $("practiceCategory").textContent = question.categoryLabel;
    $("practiceDifficulty").textContent = question.difficulty;
    $("practiceDifficulty").className = `badge badge-${question.difficulty === "hard" ? "orange" : question.difficulty === "medium" ? "grey" : "blue"}`;
}

function startPractice() {
    const category = $("categorySelect").value;
    const difficulty = $("difficultySelect").value;
    const question = pickRandomQuestion(category, difficulty);

    if (!question) {
        alert("No questions found for this category and difficulty.");
        return;
    }

    showPracticeQuestion(question);
}

function startRandomPractice() {
    const difficulty = $("difficultySelect").value;
    const questions = generateRandomInterview(1, difficulty);
    if (!questions.length) {
        alert("No questions available.");
        return;
    }
    showPracticeQuestion(questions[0]);
}

function submitAnswer() {
    if (!currentQuestion) {
        alert("Please start a practice session first.");
        return;
    }

    const answer = $("answerInput").value.trim();
    if (answer.length < 10) {
        alert("Answer is too short. Provide at least 10 characters.");
        return;
    }

    const score = calculateScore(answer, currentQuestion.keywords);
    recordAnswer(currentQuestion, score, answer, "practice");

    $("scoreValue").textContent = score;
    $("feedbackText").textContent = score >= 70
        ? "Strong answer! You covered most key concepts."
        : score >= 40
            ? "Decent start. Review the model answer to fill gaps."
            : "Keep practicing. Focus on the keywords and structure.";
    $("modelAnswerText").textContent = currentQuestion.modelAnswer;
    $("feedbackPanel").classList.remove("hidden");
}

function showModelAnswer() {
    if (!currentQuestion) {
        alert("Start a practice session first.");
        return;
    }
    $("modelAnswerText").textContent = currentQuestion.modelAnswer;
    $("modelAnswerBox").classList.remove("hidden");
    $("feedbackPanel").classList.remove("hidden");
}

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        if (activeSpeechTarget) {
            activeSpeechTarget.value = (activeSpeechTarget.value + " " + transcript).trim();
        }
    };

    recognition.onerror = () => {
        $("speechStatus").textContent = "Speech recognition error";
    };

    recognition.onend = () => {
        $("speechStatus").textContent = "";
    };

    return recognition;
}

function toggleSpeech(targetInput, statusEl) {
    if (!speechRecognition) {
        speechRecognition = initSpeechRecognition();
    }

    if (!speechRecognition) {
        alert("Speech-to-text is not supported in this browser. Try Chrome or Edge.");
        return;
    }

    if (activeSpeechTarget === targetInput) {
        speechRecognition.stop();
        activeSpeechTarget = null;
        if (statusEl) statusEl.textContent = "";
        return;
    }

    activeSpeechTarget = targetInput;
    if (statusEl) statusEl.textContent = "Listening...";
    speechRecognition.start();
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function getSelectedMockCategories() {
    return [...document.querySelectorAll("#mockCategoryChecks input:checked")].map(cb => cb.value);
}

function startMockInterview() {
    const duration = parseInt($("mockDuration").value, 10) * 60;
    const count = parseInt($("mockQuestionCount").value, 10);
    const difficulty = $("mockDifficulty").value;
    const categories = getSelectedMockCategories();

    const questions = generateRandomInterview(count, difficulty, categories);
    if (!questions.length) {
        alert("No questions available for selected filters.");
        return;
    }

    mockState = {
        questions,
        index: 0,
        answers: [],
        scores: [],
        timeRemaining: duration,
        totalDuration: duration,
        startTime: Date.now()
    };

    $("mockSetup").classList.add("hidden");
    $("mockResults").classList.add("hidden");
    $("mockSession").classList.remove("hidden");

    showMockQuestion();
    startMockTimer();
}

function startMockTimer() {
    clearInterval(mockTimerInterval);
    updateTimerDisplays();

    mockTimerInterval = setInterval(() => {
        mockState.timeRemaining--;
        updateTimerDisplays();

        if (mockState.timeRemaining <= 0) {
            finishMockInterview();
        }
    }, 1000);
}

function updateTimerDisplays() {
    const display = formatTime(mockState.timeRemaining);
    $("mockTimerDisplay").textContent = display;
    if ($("fsTimerDisplay")) $("fsTimerDisplay").textContent = display;
}

function showMockQuestion() {
    const q = mockState.questions[mockState.index];
    const counter = `Question ${mockState.index + 1} of ${mockState.questions.length}`;

    $("mockQuestionText").textContent = q.question;
    $("mockCategoryBadge").textContent = q.categoryLabel;
    $("mockDifficultyBadge").textContent = q.difficulty;
    $("mockQuestionCounter").textContent = counter;
    $("mockAnswerInput").value = mockState.answers[mockState.index] || "";

    $("fsQuestionText").textContent = q.question;
    $("fsCategoryBadge").textContent = q.categoryLabel;
    $("fsQuestionCounter").textContent = counter;
    $("fsAnswerInput").value = mockState.answers[mockState.index] || "";
}

function saveMockAnswer() {
    const fromFullscreen = !$("fullscreenOverlay").classList.contains("hidden");
    const value = fromFullscreen
        ? $("fsAnswerInput").value.trim()
        : $("mockAnswerInput").value.trim();
    mockState.answers[mockState.index] = value;
    if (fromFullscreen) {
        $("mockAnswerInput").value = value;
    } else {
        $("fsAnswerInput").value = value;
    }
}

function nextMockQuestion() {
    saveMockAnswer();

    const q = mockState.questions[mockState.index];
    const answer = mockState.answers[mockState.index] || "";
    const score = answer.length >= 10 ? calculateScore(answer, q.keywords) : 0;
    mockState.scores[mockState.index] = score;

    if (mockState.index < mockState.questions.length - 1) {
        mockState.index++;
        showMockQuestion();
    } else {
        finishMockInterview();
    }
}

function skipMockQuestion() {
    mockState.answers[mockState.index] = "";
    mockState.scores[mockState.index] = 0;

    if (mockState.index < mockState.questions.length - 1) {
        mockState.index++;
        showMockQuestion();
    } else {
        finishMockInterview();
    }
}

function finishMockInterview() {
    clearInterval(mockTimerInterval);
    saveMockAnswer();

    mockState.questions.forEach((q, i) => {
        if (mockState.scores[i] === undefined) {
            const answer = mockState.answers[i] || "";
            mockState.scores[i] = answer.length >= 10 ? calculateScore(answer, q.keywords) : 0;
        }
    });

    const totalScore = mockState.scores.reduce((a, b) => a + b, 0);
    const avg = mockState.scores.length ? Math.round(totalScore / mockState.scores.length) : 0;
    const timeUsed = mockState.totalDuration - mockState.timeRemaining;

    stats.mockCount++;
    stats.sessions++;

    const today = new Date().toISOString().slice(0, 10);
    if (stats.lastPracticeDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        stats.streak = stats.lastPracticeDate === yesterdayStr ? stats.streak + 1 : 1;
        stats.lastPracticeDate = today;
    }

    mockState.questions.forEach((q, i) => {
        if (!mockState.answers[i] || mockState.answers[i].length < 10) return;

        stats.practiced++;
        stats.totalScore += mockState.scores[i];

        if (!stats.categoryStats[q.category]) {
            stats.categoryStats[q.category] = { count: 0, totalScore: 0 };
        }
        stats.categoryStats[q.category].count++;
        stats.categoryStats[q.category].totalScore += mockState.scores[i];

        if (!stats.difficultyStats[q.difficulty]) {
            stats.difficultyStats[q.difficulty] = { count: 0, total: 0 };
        }
        stats.difficultyStats[q.difficulty].count++;
        stats.difficultyStats[q.difficulty].total += mockState.scores[i];

        stats.history.unshift({
            date: new Date().toLocaleString(),
            category: q.category,
            categoryLabel: q.categoryLabel,
            question: q.question,
            score: mockState.scores[i],
            difficulty: q.difficulty,
            mode: "mock"
        });
    });

    if (stats.history.length > 100) stats.history.length = 100;
    localStorage.setItem("csInterviewStats", JSON.stringify(stats));

    $("mockSession").classList.add("hidden");
    $("fullscreenOverlay").classList.add("hidden");
    $("mockResults").classList.remove("hidden");
    $("mockOverallScore").textContent = avg + "%";
    $("mockAnsweredCount").textContent = mockState.answers.filter(a => a && a.length >= 10).length;
    $("mockTimeUsed").textContent = formatTime(timeUsed);

    $("mockResultsDetail").innerHTML = mockState.questions.map((q, i) => `
        <div class="result-item">
            <div class="result-header">
                <span class="badge badge-blue">${q.categoryLabel}</span>
                <span class="badge badge-${q.difficulty === "hard" ? "orange" : "grey"}">${q.difficulty}</span>
                <span class="result-score">${mockState.scores[i]}%</span>
            </div>
            <p><strong>Q:</strong> ${q.question}</p>
            ${mockState.answers[i] ? `<p><strong>Your answer:</strong> ${mockState.answers[i].slice(0, 200)}${mockState.answers[i].length > 200 ? "..." : ""}</p>` : "<p><em>Skipped</em></p>"}
        </div>`).join("");

    updateDashboard();
    renderProgress();
}

function exitMockInterview() {
    if (mockState && !confirm("Exit mock interview? Progress will be lost.")) return;
    clearInterval(mockTimerInterval);
    mockState = null;
    $("mockSession").classList.add("hidden");
    $("fullscreenOverlay").classList.add("hidden");
    $("mockSetup").classList.remove("hidden");
}

function enterFullscreen() {
    saveMockAnswer();
    $("fsAnswerInput").value = mockState.answers[mockState.index] || "";
    $("fullscreenOverlay").classList.remove("hidden");
    document.body.classList.add("no-scroll");
}

function exitFullscreen() {
    mockState.answers[mockState.index] = $("fsAnswerInput").value.trim();
    $("mockAnswerInput").value = mockState.answers[mockState.index];
    $("fullscreenOverlay").classList.add("hidden");
    document.body.classList.remove("no-scroll");
}

function renderQuestionBank() {
    const container = $("questionBankContainer");
    const category = $("bankCategoryFilter").value;
    const difficulty = $("bankDifficultyFilter").value;
    const search = $("bankSearch").value.toLowerCase();

    let filtered = allQuestions;

    if (category !== "all") filtered = filtered.filter(q => q.category === category);
    if (difficulty !== "all") filtered = filtered.filter(q => q.difficulty === difficulty);
    if (search) filtered = filtered.filter(q => q.question.toLowerCase().includes(search));

    container.innerHTML = filtered.length
        ? filtered.map(q => `
            <div class="bank-card">
                <div class="bank-card-header">
                    <span class="badge badge-blue">${q.categoryLabel}</span>
                    <span class="badge badge-${q.difficulty === "hard" ? "orange" : q.difficulty === "medium" ? "grey" : "blue"}">${q.difficulty}</span>
                </div>
                <p class="bank-question">${q.question}</p>
                <details>
                    <summary>Model Answer</summary>
                    <p>${q.modelAnswer}</p>
                </details>
            </div>`).join("")
        : '<p class="empty-state">No questions match your filters.</p>';
}

function renderCategoryPage(containerId, category) {
    const container = $(containerId);
    const questions = enrichQuestions(category, questionBanks[category] || []);

    container.innerHTML = questions.map(q => `
        <div class="bank-card">
            <div class="bank-card-header">
                <span class="badge badge-${q.difficulty === "hard" ? "orange" : q.difficulty === "medium" ? "grey" : "blue"}">${q.difficulty}</span>
            </div>
            <p class="bank-question">${q.question}</p>
            <details>
                <summary>Model Answer</summary>
                <p>${q.modelAnswer}</p>
            </details>
        </div>`).join("");
}

function renderDifficultyChart() {
    const container = $("difficultyChart");
    if (!container) return;

    container.innerHTML = DIFFICULTY_ORDER.map(diff => {
        const data = stats.difficultyStats[diff];
        const avg = data.count ? Math.round(data.total / data.count) : 0;
        return `
            <div class="chart-row">
                <span class="chart-label">${diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
                <div class="chart-bar-wrap">
                    <div class="chart-bar difficulty-${diff}" style="width:${avg || 0}%"></div>
                </div>
                <span class="chart-value">${data.count ? avg + "%" : "—"}</span>
            </div>`;
    }).join("");
}

function renderProgress() {
    renderCategoryChart("progressCategoryChart");
    renderDifficultyChart();

    $("mockCount").textContent = stats.mockCount;
    $("practiceStreak").textContent = (stats.streak || 0) + " days";

    const categoryAvgs = Object.entries(stats.categoryStats).map(([cat, data]) => ({
        cat,
        label: CATEGORY_LABELS[cat],
        avg: data.totalScore / data.count
    }));

    if (categoryAvgs.length) {
        const best = categoryAvgs.reduce((a, b) => (a.avg > b.avg ? a : b));
        const worst = categoryAvgs.reduce((a, b) => (a.avg < b.avg ? a : b));
        $("bestCategory").textContent = best.label;
        $("worstCategory").textContent = worst.label;
    }

    const historyContainer = $("historyContainer");
    if (!stats.history.length) {
        historyContainer.innerHTML = '<p class="empty-state">No session history yet.</p>';
        return;
    }

    historyContainer.innerHTML = stats.history.slice(0, 30).map(entry => `
        <div class="history-item">
            <div class="history-meta">
                <span class="badge badge-blue">${entry.categoryLabel}</span>
                <span class="badge badge-grey">${entry.difficulty}</span>
                <span class="badge badge-${entry.mode === "mock" ? "orange" : "blue"}">${entry.mode}</span>
                <span class="history-date">${entry.date}</span>
            </div>
            <p>${entry.question}</p>
            <span class="history-score ${entry.score >= 70 ? "good" : entry.score >= 40 ? "ok" : "low"}">${entry.score}%</span>
        </div>`).join("");
}

function exportProgressToPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const readiness = computeReadinessScore();
    const avg = stats.practiced ? Math.round(stats.totalScore / stats.practiced) : 0;
    let y = 20;

    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text("CS Interview Coach Pro — Progress Report", 20, y);
    y += 15;

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
    y += 12;

    doc.setFontSize(14);
    doc.text("Summary", 20, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Questions Practiced: ${stats.practiced}`, 20, y); y += 7;
    doc.text(`Average Score: ${avg}%`, 20, y); y += 7;
    doc.text(`Readiness Score: ${readiness}/100 (${getReadinessLevel(readiness)})`, 20, y); y += 7;
    doc.text(`Mock Interviews: ${stats.mockCount}`, 20, y); y += 7;
    doc.text(`Practice Streak: ${stats.streak || 0} days`, 20, y); y += 12;

    doc.setFontSize(14);
    doc.text("Category Performance", 20, y);
    y += 8;
    doc.setFontSize(10);

    Object.entries(stats.categoryStats).forEach(([cat, data]) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const catAvg = Math.round(data.totalScore / data.count);
        doc.text(`${CATEGORY_LABELS[cat] || cat}: ${catAvg}% (${data.count} questions)`, 20, y);
        y += 6;
    });

    y += 8;
    const weak = getWeakTopics();
    if (weak.length) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.text("Weak Topics", 20, y);
        y += 8;
        doc.setFontSize(10);
        weak.forEach(item => {
            doc.text(`• ${item.label}: ${item.avg}%`, 25, y);
            y += 6;
        });
    }

    if (stats.history.length) {
        if (y > 240) { doc.addPage(); y = 20; }
        y += 8;
        doc.setFontSize(14);
        doc.text("Recent Sessions", 20, y);
        y += 8;
        doc.setFontSize(9);

        stats.history.slice(0, 15).forEach(entry => {
            if (y > 275) { doc.addPage(); y = 20; }
            const line = `[${entry.score}%] ${entry.categoryLabel} — ${entry.question.slice(0, 70)}`;
            doc.text(line, 20, y);
            y += 6;
        });
    }

    doc.save("interview-progress-report.pdf");
}

$("startPracticeBtn").addEventListener("click", startPractice);
$("randomPracticeBtn").addEventListener("click", startRandomPractice);
$("submitAnswerBtn").addEventListener("click", submitAnswer);
$("showModelBtn").addEventListener("click", showModelAnswer);
$("speechBtn").addEventListener("click", () => toggleSpeech($("answerInput"), $("speechStatus")));
$("startMockBtn").addEventListener("click", startMockInterview);
$("mockNextBtn").addEventListener("click", nextMockQuestion);
$("mockSkipBtn").addEventListener("click", skipMockQuestion);
$("mockSpeechBtn").addEventListener("click", () => toggleSpeech($("mockAnswerInput"), null));
$("fullscreenBtn").addEventListener("click", enterFullscreen);
$("exitMockBtn").addEventListener("click", exitMockInterview);
$("exitFullscreenBtn").addEventListener("click", exitFullscreen);
$("fsNextBtn").addEventListener("click", () => { saveMockAnswer(); nextMockQuestion(); });
$("fsSkipBtn").addEventListener("click", skipMockQuestion);
$("mockRestartBtn").addEventListener("click", () => {
    $("mockResults").classList.add("hidden");
    $("mockSetup").classList.remove("hidden");
});
$("quickRandomBtn").addEventListener("click", () => {
    navigateTo("practice");
    $("difficultySelect").value = "all";
    startRandomPractice();
});
$("quickMockBtn").addEventListener("click", () => navigateTo("mock"));
$("exportPdfBtn").addEventListener("click", exportProgressToPdf);
$("exportPdfBtn2").addEventListener("click", exportProgressToPdf);
$("bankCategoryFilter").addEventListener("change", renderQuestionBank);
$("bankDifficultyFilter").addEventListener("change", renderQuestionBank);
$("bankSearch").addEventListener("input", renderQuestionBank);

populateCategories();
updateDashboard();
renderQuestionBank();
renderCategoryPage("codingContainer", "coding");
renderCategoryPage("internshipContainer", "internship");
renderCategoryPage("graduateContainer", "graduate");
renderProgress();

const bankSubtitle = $("bankSubtitle");
if (bankSubtitle) {
    bankSubtitle.textContent = `Browse ${allQuestions.length} interview questions across all categories`;
}

console.log(`CS Interview Coach Pro loaded — ${allQuestions.length} questions available.`);
