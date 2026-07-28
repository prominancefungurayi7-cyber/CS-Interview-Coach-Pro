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
    streak: 0,
    favorites: [],
    spacedRepetition: {}
};

let currentTheme = localStorage.getItem("theme") || "light";

let currentQuestion = null;
let mockState = null;
let mockTimerInterval = null;
let speechRecognition = null;
let activeSpeechTarget = null;

// Chart instances
let categoryChart = null;
let difficultyChart = null;
let performanceChart = null;

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-btn");

function $(id) {
    return document.getElementById(id);
}

function showToast(message, type = 'info', duration = 4000) {
    const container = $('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">×</button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
}

function withLoading(element, callback) {
    if (!element) return callback();
    
    element.classList.add('loading');
    element.disabled = true;
    
    return callback().finally(() => {
        element.classList.remove('loading');
        element.disabled = false;
    });
}

function handleError(error, context = '') {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    showToast(`An error occurred${context ? ` in ${context}` : ''}. Please try again.`, 'error');
}

function initTheme() {
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeUI();
}

function toggleTheme() {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
    updateThemeUI();
    initCharts(); // Refresh charts with new theme colors
}

function updateThemeUI() {
    const themeToggle = $("themeToggle");
    if (themeToggle) {
        const icon = themeToggle.querySelector(".theme-icon");
        const text = themeToggle.querySelector(".theme-text");
        if (currentTheme === "dark") {
            icon.textContent = "☀️";
            text.textContent = "Light Mode";
        } else {
            icon.textContent = "🌙";
            text.textContent = "Dark Mode";
        }
    }
}

function navigateTo(pageId) {
    navButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === pageId);
        btn.setAttribute("aria-current", btn.dataset.page === pageId ? "page" : "false");
    });
    pages.forEach(page => page.classList.toggle("active", page.id === pageId));
    
    // Focus management for accessibility
    const targetPage = $(pageId);
    if (targetPage) {
        const firstHeading = targetPage.querySelector('h1, h2');
        if (firstHeading) {
            firstHeading.setAttribute('tabindex', '-1');
            firstHeading.focus();
        }
    }
}

navButtons.forEach(button => {
    button.addEventListener("click", () => navigateTo(button.dataset.page));
    button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigateTo(button.dataset.page);
        }
    });
});

// Keyboard navigation for the entire app
document.addEventListener("keydown", (e) => {
    // Escape key to exit fullscreen or close modals
    if (e.key === "Escape") {
        const fullscreenOverlay = $("fullscreenOverlay");
        if (fullscreenOverlay && !fullscreenOverlay.classList.contains("hidden")) {
            exitFullscreen();
            return;
        }
        
        const feedbackPanel = $("feedbackPanel");
        if (feedbackPanel && !feedbackPanel.classList.contains("hidden")) {
            feedbackPanel.classList.add("hidden");
            return;
        }
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const bankSearch = $("bankSearch");
        if (bankSearch) {
            bankSearch.focus();
        }
    }
    
    // Ctrl/Cmd + / to show keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        showToast("Keyboard shortcuts: Ctrl+K (search), Ctrl+/ (help), Escape (close)", "info");
    }
});

const themeToggle = $("themeToggle");
if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
}

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
    const words = lower.split(/\s+/);
    const uniqueWords = new Set(words);

    // Exact keyword matching
    keywords.forEach(word => {
        if (lower.includes(word.toLowerCase())) matches++;
    });

    // Semantic scoring factors
    const lengthScore = Math.min(answer.length / 200, 1) * 10; // Up to 10 points for length
    const diversityScore = Math.min(uniqueWords.size / 20, 1) * 10; // Up to 10 points for vocabulary diversity
    const structureScore = calculateStructureScore(answer); // Up to 10 points for structure

    const keywordScore = Math.max(20, Math.round((matches / keywords.length) * 70));
    const totalScore = Math.min(100, Math.round(keywordScore + lengthScore + diversityScore + structureScore));

    return totalScore;
}

function calculateStructureScore(answer) {
    let score = 0;
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Reward for having multiple sentences (structured answer)
    if (sentences.length >= 3) score += 3;
    else if (sentences.length >= 2) score += 2;

    // Reward for using transition words
    const transitions = ['however', 'therefore', 'furthermore', 'additionally', 'consequently', 'moreover', 'firstly', 'secondly', 'finally', 'in conclusion'];
    const lower = answer.toLowerCase();
    const transitionCount = transitions.filter(t => lower.includes(t)).length;
    score += Math.min(transitionCount * 2, 4);

    // Reward for logical structure (has introduction and conclusion)
    if (sentences.length > 0) {
        const firstSentence = sentences[0].toLowerCase();
        const lastSentence = sentences[sentences.length - 1].toLowerCase();
        
        if (firstSentence.length > 20 && lastSentence.length > 20) {
            score += 3;
        }
    }

    return score;
}

function generateDetailedFeedback(score, answer, keywords) {
    const feedback = {
        score: score,
        message: "",
        strengths: [],
        improvements: [],
        keywordCoverage: 0
    };

    if (score >= 85) {
        feedback.message = "Excellent answer! You demonstrated comprehensive understanding.";
        feedback.strengths.push("Strong coverage of key concepts");
        feedback.strengths.push("Well-structured response");
    } else if (score >= 70) {
        feedback.message = "Good answer with room for improvement.";
        feedback.strengths.push("Covered most important concepts");
        feedback.improvements.push("Consider adding more technical details");
    } else if (score >= 50) {
        feedback.message = "Decent start. Focus on key concepts and structure.";
        feedback.improvements.push("Include more specific keywords");
        feedback.improvements.push("Structure your answer better");
    } else {
        feedback.message = "Keep practicing. Focus on fundamentals.";
        feedback.improvements.push("Review the model answer carefully");
        feedback.improvements.push("Practice explaining concepts clearly");
    }

    // Analyze keyword coverage
    if (keywords && keywords.length) {
        const lower = answer.toLowerCase();
        const matchedKeywords = keywords.filter(k => lower.includes(k.toLowerCase()));
        feedback.keywordCoverage = Math.round((matchedKeywords.length / keywords.length) * 100);

        if (feedback.keywordCoverage < 50) {
            feedback.improvements.push(`Only ${feedback.keywordCoverage}% of key concepts covered`);
        }
    }

    // Analyze answer length
    if (answer.length < 100) {
        feedback.improvements.push("Answer is too brief - expand with examples");
    } else if (answer.length > 500) {
        feedback.strengths.push("Comprehensive and detailed answer");
    }

    return feedback;
}

function toggleFavorite(question) {
    const questionId = question.question.substring(0, 50); // Use first 50 chars as ID
    const index = stats.favorites.indexOf(questionId);
    
    if (index > -1) {
        stats.favorites.splice(index, 1);
    } else {
        stats.favorites.push(questionId);
    }
    
    localStorage.setItem("csInterviewStats", JSON.stringify(stats));
    return stats.favorites.includes(questionId);
}

function isFavorite(question) {
    const questionId = question.question.substring(0, 50);
    return stats.favorites.includes(questionId);
}

function updateSpacedRepetition(question, score) {
    const questionId = question.question.substring(0, 50);
    const today = new Date().toISOString().slice(0, 10);
    
    if (!stats.spacedRepetition[questionId]) {
        stats.spacedRepetition[questionId] = {
            interval: 1,
            easeFactor: 2.5,
            dueDate: today,
            reviewCount: 0
        };
    }
    
    const sr = stats.spacedRepetition[questionId];
    sr.reviewCount++;
    
    // Simplified SM-2 algorithm
    if (score >= 80) {
        sr.interval = Math.round(sr.interval * sr.easeFactor);
        sr.easeFactor = Math.max(1.3, sr.easeFactor + 0.1 - (5 - score / 20) * (0.08 + (5 - score / 20) * 0.02));
    } else if (score >= 60) {
        sr.interval = Math.max(1, Math.round(sr.interval * 0.8));
        sr.easeFactor = Math.max(1.3, sr.easeFactor - 0.2);
    } else {
        sr.interval = 1;
        sr.easeFactor = Math.max(1.3, sr.easeFactor - 0.3);
    }
    
    // Calculate next due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + sr.interval);
    sr.dueDate = dueDate.toISOString().slice(0, 10);
    
    localStorage.setItem("csInterviewStats", JSON.stringify(stats));
}

function getDueForReview() {
    const today = new Date().toISOString().slice(0, 10);
    return allQuestions.filter(q => {
        const questionId = q.question.substring(0, 50);
        const sr = stats.spacedRepetition[questionId];
        return sr && sr.dueDate <= today;
    });
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

    // Show STAR guide for behavioral questions
    const starGuide = $("starGuide");
    if (question.category === "behavioral" || question.category === "hr") {
        starGuide.classList.remove("hidden");
    } else {
        starGuide.classList.add("hidden");
    }
}

function startPractice() {
    try {
        const category = $("categorySelect").value;
        const difficulty = $("difficultySelect").value;
        const question = pickRandomQuestion(category, difficulty);

        if (!question) {
            showToast("No questions found for this category and difficulty.", 'warning');
            return;
        }

        showPracticeQuestion(question);
    } catch (error) {
        handleError(error, 'starting practice');
    }
}

function startRandomPractice() {
    try {
        const difficulty = $("difficultySelect").value;
        const questions = generateRandomInterview(1, difficulty);
        if (!questions.length) {
            showToast("No questions available.", 'warning');
            return;
        }
        showPracticeQuestion(questions[0]);
    } catch (error) {
        handleError(error, 'starting random practice');
    }
}

function submitAnswer() {
    try {
        if (!currentQuestion) {
            showToast("Please start a practice session first.", 'warning');
            return;
        }

        const answer = $("answerInput").value.trim();
        if (answer.length < 10) {
            showToast("Answer is too short. Provide at least 10 characters.", 'warning');
            return;
        }

        const score = calculateScore(answer, currentQuestion.keywords);
        const feedback = generateDetailedFeedback(score, answer, currentQuestion.keywords);
        recordAnswer(currentQuestion, score, answer, "practice");
        updateSpacedRepetition(currentQuestion, score);

        $("scoreValue").textContent = score;
        
        // Build detailed feedback HTML
        let feedbackHTML = `<p class="feedback-message">${feedback.message}</p>`;
        
        if (feedback.strengths.length > 0) {
            feedbackHTML += `<div class="feedback-section strengths">
                <h4>✓ Strengths</h4>
                <ul>${feedback.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>`;
        }
        
        if (feedback.improvements.length > 0) {
            feedbackHTML += `<div class="feedback-section improvements">
                <h4>→ Areas to Improve</h4>
                <ul>${feedback.improvements.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>`;
        }
        
        if (feedback.keywordCoverage > 0) {
            feedbackHTML += `<div class="keyword-coverage">
                <span>Keyword Coverage: ${feedback.keywordCoverage}%</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${feedback.keywordCoverage}%"></div>
                </div>
            </div>`;
        }
        
        $("feedbackText").innerHTML = feedbackHTML;
        $("modelAnswerText").textContent = currentQuestion.modelAnswer;
        $("feedbackPanel").classList.remove("hidden");
        
        showToast('Answer submitted successfully!', 'success');
    } catch (error) {
        handleError(error, 'submitting answer');
    }
}

function showModelAnswer() {
    try {
        if (!currentQuestion) {
            showToast("Start a practice session first.", 'warning');
            return;
        }
        $("modelAnswerText").textContent = currentQuestion.modelAnswer;
        $("modelAnswerBox").classList.remove("hidden");
        $("feedbackPanel").classList.remove("hidden");
    } catch (error) {
        handleError(error, 'showing model answer');
    }
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
    try {
        if (!speechRecognition) {
            speechRecognition = initSpeechRecognition();
        }

        if (!speechRecognition) {
            showToast("Speech-to-text is not supported in this browser. Try Chrome or Edge.", 'warning');
            return;
        }

        if (activeSpeechTarget === targetInput) {
            speechRecognition.stop();
            activeSpeechTarget = null;
            if (statusEl) statusEl.textContent = "";
            showToast('Speech recognition stopped', 'info');
            return;
        }

        activeSpeechTarget = targetInput;
        if (statusEl) statusEl.textContent = "Listening...";
        speechRecognition.start();
        showToast('Speech recognition started', 'info');
    } catch (error) {
        handleError(error, 'toggling speech recognition');
    }
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
    try {
        const duration = parseInt($("mockDuration").value, 10) * 60;
        const count = parseInt($("mockQuestionCount").value, 10);
        const difficulty = $("mockDifficulty").value;
        const categories = getSelectedMockCategories();

        const questions = generateRandomInterview(count, difficulty, categories);
        if (!questions.length) {
            showToast("No questions available for selected filters.", 'warning');
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
        showToast('Mock interview started!', 'success');
    } catch (error) {
        handleError(error, 'starting mock interview');
    }
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
    if (mockState) {
        if (!confirm("Exit mock interview? Progress will be lost.")) return;
    }
    clearInterval(mockTimerInterval);
    mockState = null;
    $("mockSession").classList.add("hidden");
    $("fullscreenOverlay").classList.add("hidden");
    $("mockSetup").classList.remove("hidden");
    showToast('Mock interview exited', 'info');
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
    const company = $("bankCompanyFilter").value;
    const role = $("bankRoleFilter").value;
    const search = $("bankSearch").value.toLowerCase();

    let filtered = allQuestions;

    if (category !== "all") filtered = filtered.filter(q => q.category === category);
    if (difficulty !== "all") filtered = filtered.filter(q => q.difficulty === difficulty);
    if (company !== "all") filtered = filtered.filter(q => q.company === company || !q.company);
    if (role !== "all") filtered = filtered.filter(q => q.role === role || !q.role);
    if (search) filtered = filtered.filter(q => q.question.toLowerCase().includes(search));

    container.innerHTML = filtered.length
        ? filtered.map(q => `
            <div class="bank-card">
                <div class="bank-card-header">
                    <span class="badge badge-blue">${q.categoryLabel}</span>
                    <span class="badge badge-${q.difficulty === "hard" ? "orange" : q.difficulty === "medium" ? "grey" : "blue"}">${q.difficulty}</span>
                    ${q.company ? `<span class="badge badge-grey">${q.company}</span>` : ''}
                    ${q.role ? `<span class="badge badge-grey">${q.role}</span>` : ''}
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
                <button class="favorite-btn ${isFavorite(q) ? 'active' : ''}" data-question="${encodeURIComponent(q.question)}">⭐</button>
            </div>
            <p class="bank-question">${q.question}</p>
            <details>
                <summary>Model Answer</summary>
                <p>${q.modelAnswer}</p>
            </details>
        </div>`).join("");
    
    // Add event listeners for favorite buttons
    container.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const questionText = decodeURIComponent(e.target.dataset.question);
            const question = allQuestions.find(q => q.question === questionText);
            if (question) {
                const isFav = toggleFavorite(question);
                e.target.classList.toggle('active', isFav);
            }
        });
    });
}

function renderFavorites() {
    const container = $("favoritesContainer");
    const favoriteQuestions = allQuestions.filter(q => isFavorite(q));

    if (favoriteQuestions.length === 0) {
        container.innerHTML = '<p class="empty-state">No favorite questions yet. Click the ⭐ button on any question to add it to favorites.</p>';
        return;
    }

    container.innerHTML = favoriteQuestions.map(q => `
        <div class="bank-card">
            <div class="bank-card-header">
                <span class="badge badge-blue">${q.categoryLabel}</span>
                <span class="badge badge-${q.difficulty === "hard" ? "orange" : q.difficulty === "medium" ? "grey" : "blue"}">${q.difficulty}</span>
                <button class="favorite-btn active" data-question="${encodeURIComponent(q.question)}">⭐</button>
            </div>
            <p class="bank-question">${q.question}</p>
            <details>
                <summary>Model Answer</summary>
                <p>${q.modelAnswer}</p>
            </details>
        </div>`).join("");
    
    container.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const questionText = decodeURIComponent(e.target.dataset.question);
            const question = allQuestions.find(q => q.question === questionText);
            if (question) {
                const isFav = toggleFavorite(question);
                e.target.classList.toggle('active', isFav);
                renderFavorites(); // Re-render to remove if unfavorited
            }
        });
    });
}

function renderDueForReview() {
    const container = $("reviewContainer");
    const dueQuestions = getDueForReview();

    if (dueQuestions.length === 0) {
        container.innerHTML = '<p class="empty-state">No questions due for review. Practice more questions to build your spaced repetition schedule.</p>';
        return;
    }

    container.innerHTML = dueQuestions.map(q => {
        const questionId = q.question.substring(0, 50);
        const sr = stats.spacedRepetition[questionId];
        return `
        <div class="bank-card">
            <div class="bank-card-header">
                <span class="badge badge-blue">${q.categoryLabel}</span>
                <span class="badge badge-${q.difficulty === "hard" ? "orange" : q.difficulty === "medium" ? "grey" : "blue"}">${q.difficulty}</span>
                <span class="badge badge-grey">Interval: ${sr.interval} days</span>
            </div>
            <p class="bank-question">${q.question}</p>
            <details>
                <summary>Model Answer</summary>
                <p>${q.modelAnswer}</p>
            </details>
        </div>`;
    }).join("");
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

function initCharts() {
    const textColor = currentTheme === 'dark' ? '#f1f5f9' : '#1e293b';
    const gridColor = currentTheme === 'dark' ? '#334155' : '#e2e8f0';

    const categoryCtx = $('categoryChartCanvas');
    if (categoryCtx && Object.keys(stats.categoryStats).length > 0) {
        if (categoryChart) categoryChart.destroy();
        
        const categoryData = Object.entries(stats.categoryStats).map(([cat, data]) => ({
            label: CATEGORY_LABELS[cat] || cat,
            value: Math.round(data.totalScore / data.count)
        }));

        categoryChart = new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: categoryData.map(d => d.label),
                datasets: [{
                    label: 'Average Score',
                    data: categoryData.map(d => d.value),
                    backgroundColor: 'rgba(37, 99, 235, 0.8)',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { color: textColor }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { display: false } }
                }
            }
        });
    }

    const difficultyCtx = $('difficultyChartCanvas');
    if (difficultyCtx) {
        if (difficultyChart) difficultyChart.destroy();

        const difficultyData = DIFFICULTY_ORDER.map(diff => {
            const data = stats.difficultyStats[diff];
            return {
                label: diff.charAt(0).toUpperCase() + diff.slice(1),
                value: data.count ? Math.round(data.total / data.count) : 0,
                count: data.count
            };
        });

        difficultyChart = new Chart(difficultyCtx, {
            type: 'doughnut',
            data: {
                labels: difficultyData.map(d => d.label),
                datasets: [{
                    data: difficultyData.map(d => d.count),
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(100, 116, 139, 0.8)',
                        'rgba(249, 115, 22, 0.8)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
                    }
                }
            }
        });
    }

    const performanceCtx = $('performanceChartCanvas');
    if (performanceCtx && stats.history.length > 0) {
        if (performanceChart) performanceChart.destroy();

        const recentHistory = stats.history.slice(0, 20).reverse();
        const performanceData = recentHistory.map(entry => entry.score);
        const performanceLabels = recentHistory.map(entry => {
            const date = new Date(entry.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        performanceChart = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: performanceLabels,
                datasets: [{
                    label: 'Score',
                    data: performanceData,
                    borderColor: 'rgba(37, 99, 235, 1)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { color: textColor }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { display: false } }
                }
            }
        });
    }
}

function renderProgress() {
    initCharts();
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
    try {
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
        showToast('PDF report exported successfully!', 'success');
    } catch (error) {
        handleError(error, 'exporting PDF');
    }
}

function exportDataToJson() {
    try {
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cs-interview-coach-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Progress data exported successfully!', 'success');
    } catch (error) {
        handleError(error, 'exporting data');
    }
}

function importDataFromJson(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate the imported data structure
                if (!importedData.practiced && importedData.practiced !== 0) {
                    throw new Error('Invalid data format');
                }

                // Merge with existing data
                stats = {
                    ...stats,
                    ...importedData,
                    // Preserve theme separately
                    favorites: importedData.favorites || [],
                    spacedRepetition: importedData.spacedRepetition || {}
                };

                localStorage.setItem("csInterviewStats", JSON.stringify(stats));
                updateDashboard();
                renderProgress();
                renderFavorites();
                renderDueForReview();
                
                showToast('Progress data imported successfully!', 'success');
            } catch (error) {
                handleError(error, 'parsing imported data');
            }
        };
        reader.readAsText(file);
        
        // Reset the file input
        event.target.value = '';
    } catch (error) {
        handleError(error, 'importing data');
    }
}

function clearAllData() {
    if (!confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
        return;
    }
    
    if (!confirm("This will delete all your progress, favorites, and history. Continue?")) {
        return;
    }

    try {
        // Reset stats to default
        stats = {
            practiced: 0,
            sessions: 0,
            totalScore: 0,
            mockCount: 0,
            categoryStats: {},
            difficultyStats: { easy: { count: 0, total: 0 }, medium: { count: 0, total: 0 }, hard: { count: 0, total: 0 } },
            history: [],
            lastPracticeDate: null,
            streak: 0,
            favorites: [],
            spacedRepetition: {}
        };

        localStorage.setItem("csInterviewStats", JSON.stringify(stats));
        updateDashboard();
        renderProgress();
        renderFavorites();
        renderDueForReview();
        
        showToast('All data cleared successfully!', 'success');
    } catch (error) {
        handleError(error, 'clearing data');
    }
}

$("startPracticeBtn").addEventListener("click", startPractice);
$("randomPracticeBtn").addEventListener("click", startRandomPractice);
$("submitAnswerBtn").addEventListener("click", submitAnswer);
$("showModelBtn").addEventListener("click", showModelAnswer);
$("speechBtn").addEventListener("click", () => toggleSpeech($("answerInput"), $("speechStatus")));
$("toggleStarBtn").addEventListener("click", () => {
    const starGuide = $("starGuide");
    starGuide.classList.toggle("hidden");
});
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
$("exportDataBtn").addEventListener("click", exportDataToJson);
$("importDataBtn").addEventListener("click", () => $("importFileInput").click());
$("importFileInput").addEventListener("change", importDataFromJson);
$("clearDataBtn").addEventListener("click", clearAllData);
$("bankCategoryFilter").addEventListener("change", renderQuestionBank);
$("bankDifficultyFilter").addEventListener("change", renderQuestionBank);
$("bankCompanyFilter").addEventListener("change", renderQuestionBank);
$("bankRoleFilter").addEventListener("change", renderQuestionBank);
$("bankSearch").addEventListener("input", renderQuestionBank);

populateCategories();
updateDashboard();
renderQuestionBank();
renderCategoryPage("codingContainer", "coding");
renderCategoryPage("internshipContainer", "internship");
renderCategoryPage("graduateContainer", "graduate");
renderFavorites();
renderDueForReview();
renderProgress();
initTheme();

const bankSubtitle = $("bankSubtitle");
if (bankSubtitle) {
    bankSubtitle.textContent = `Browse ${allQuestions.length} interview questions across all categories`;
}

console.log(`CS Interview Coach Pro loaded — ${allQuestions.length} questions available.`);
