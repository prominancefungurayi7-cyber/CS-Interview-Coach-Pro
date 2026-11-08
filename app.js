import { dsaQuestions } from "./data/dsa.js";
import { oopQuestions } from "./data/oop.js";
import { dipQuestions } from "./data/dip.js";
import { visualForQuestion, mountVisual } from "./visuals.js";
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
import { createCoachProfile, updateCoachProfile, effectivePace, nextDifficulty, weakestCategory } from "./coachProfile.js";
import { composeSpeechTranscript } from "./speechTranscript.js";
import { normalizeStudentProfile, progressFileName } from "./studentProfile.js";

const CATEGORY_LABELS = {
    dsa: "Data Structures & Algorithms",
    oop: "Java OOP (HCSE224)",
    dip: "Digital Image Processing (HCSCI239)",
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
    dip: dipQuestions,
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
const ANSWER_LEVELS = ["easy", "medium", "hard"];
let selectedAnswerLevel = ANSWER_LEVELS.includes(localStorage.getItem("oopAnswerLevel"))
    ? localStorage.getItem("oopAnswerLevel") : "medium";

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}

function answerFor(question, level = selectedAnswerLevel) {
    return question.answers?.[level] || question.modelAnswer;
}

function renderAnswer(question) {
    const variants = question.answers ? `<div class="oop-answer-variants" data-category="${question.category}" data-question="${encodeURIComponent(question.question)}">
        <label>Answer style
            <select class="oop-answer-level" aria-label="Model answer style">
                <option value="easy" ${selectedAnswerLevel === "easy" ? "selected" : ""}>Easier</option>
                <option value="medium" ${selectedAnswerLevel === "medium" ? "selected" : ""}>Medium</option>
                <option value="hard" ${selectedAnswerLevel === "hard" ? "selected" : ""}>Straightforward / hard</option>
            </select>
        </label>
    </div>` : "";
    return `${variants}<p class="oop-answer-content">${escapeHtml(answerFor(question))}</p>`;
}

function renderQuestionSource(question) {
    return question.unit ? `<p class="question-source">${question.category === "dip" ? "Week" : "Unit"} ${question.unit} · ${escapeHtml(question.topic)} · ${escapeHtml(question.source)}</p>` : "";
}

const explanationCache = new Map();
const explanationPending = new Map();

const emptyStats = {
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
let stats;
try {
    const saved = JSON.parse(localStorage.getItem("csInterviewStats"));
    const record = value => value && typeof value === "object" && !Array.isArray(value);
    const previous = record(saved) ? saved : {};
    const savedDifficulty = record(previous.difficultyStats) ? previous.difficultyStats : {};
    stats = {
        ...emptyStats,
        ...previous,
        categoryStats: record(previous.categoryStats) ? previous.categoryStats : {},
        difficultyStats: Object.fromEntries(DIFFICULTY_ORDER.map(level => [level,
            record(savedDifficulty[level]) ? { ...emptyStats.difficultyStats[level], ...savedDifficulty[level] }
                : { ...emptyStats.difficultyStats[level] }])),
        history: Array.isArray(previous.history) ? previous.history : [],
        favorites: Array.isArray(previous.favorites) ? previous.favorites : [],
        spacedRepetition: record(previous.spacedRepetition) ? previous.spacedRepetition : {}
    };
} catch {
    stats = { ...emptyStats, difficultyStats: Object.fromEntries(DIFFICULTY_ORDER.map(level =>
        [level, { ...emptyStats.difficultyStats[level] }])) };
}

let currentTheme = localStorage.getItem("theme") || "light";

let currentQuestion = null;
let practiceAttempt = null;
let mockState = null;
let mockTimerInterval = null;
let speechRecognition = null;
let activeSpeechTarget = null;
let activeSpeechStatus = null;
let speechBaseValue = "";
let speechStopping = false;
let speechErrorMessage = "";

// Chart instances
let categoryChart = null;
let difficultyChart = null;
let performanceChart = null;

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-btn");

function $(id) {
    return document.getElementById(id);
}

let studentProfile = null;

function updateStudentProfileUI() {
    if (!studentProfile) return;
    $("sidebarStudentName").textContent = studentProfile.name;
    $("sidebarSchoolName").textContent = studentProfile.school;
    $("dashboardWelcome").textContent = `Welcome, ${studentProfile.name}. Your progress at ${studentProfile.school} starts here.`;
    $("progressStudent").textContent = `${studentProfile.name} · ${studentProfile.school}`;
}

function closeProfileGate() {
    $("profileGate").classList.add("hidden");
    document.querySelector(".app").inert = false;
    updateStudentProfileUI();
}

function openProfileGate() {
    $("studentName").value = studentProfile?.name || "";
    $("studentSchool").value = studentProfile?.school || "";
    $("profileError").classList.add("hidden");
    $("profileCancelBtn").classList.toggle("hidden", !studentProfile);
    $("profileSaveBtn").textContent = studentProfile ? "Save profile" : "Start learning";
    document.querySelector(".app").inert = true;
    $("profileGate").classList.remove("hidden");
    $("studentName").focus();
}

function initStudentProfile() {
    try { studentProfile = normalizeStudentProfile(JSON.parse(localStorage.getItem("csStudentProfile"))); }
    catch { studentProfile = null; }
    $("profileForm").addEventListener("submit", event => {
        event.preventDefault();
        const profile = normalizeStudentProfile({ name: $("studentName").value, school: $("studentSchool").value });
        if (!profile) {
            $("profileError").textContent = "Enter both your name and school using no more than 80 and 120 characters.";
            $("profileError").classList.remove("hidden");
            return;
        }
        studentProfile = profile;
        try { localStorage.setItem("csStudentProfile", JSON.stringify(profile)); }
        catch { /* The profile still works for this open session if browser storage is unavailable. */ }
        closeProfileGate();
    });
    $("editProfileBtn").addEventListener("click", openProfileGate);
    $("profileCancelBtn").addEventListener("click", closeProfileGate);
    if (studentProfile) closeProfileGate(); else openProfileGate();
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
    if (activeSpeechTarget && !speechStopping) {
        speechRecognition.stop();
        speechStopping = true;
    }
    if (pageId !== "aiCoach") stopCoachCall();
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
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing
        && e.target instanceof HTMLTextAreaElement) {
        const actions = { answerInput: "submitAnswerBtn", mockAnswerInput: "mockNextBtn",
            fsAnswerInput: "fsNextBtn", coachAnswer: "coachSendBtn" };
        const action = $(actions[e.target.id]);
        if (action && !action.disabled) { e.preventDefault(); action.click(); return; }
    }
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

// AI coach: recent performance changes the coaching pace and question difficulty.
let coachProfile;
try { coachProfile = { ...createCoachProfile(), ...JSON.parse(localStorage.getItem("csCoachProfile")) }; }
catch { coachProfile = createCoachProfile(); }
let coachCall = null;
let coachQuestion = null;
let coachUsedHint = false;
let coachStartedAt = 0;
let coachBusy = false;
let coachLastGraded = "";
let coachNotAcquaintedRecorded = false;
const coachSeen = new Set();

function coachStatus(message) {
    $("coachStatus").textContent = message;
}

function coachLine(speaker, message) {
    const row = document.createElement("p");
    const label = document.createElement("strong");
    label.textContent = `${speaker}: `;
    row.append(label, document.createTextNode(message));
    $("coachTranscript").appendChild(row);
    $("coachTranscript").scrollTop = $("coachTranscript").scrollHeight;
}

function showCoachProfile() {
    const pace = effectivePace(coachProfile);
    const names = { slow: "Step by step", medium: "Balanced", fast: "Challenge" };
    const weak = weakestCategory(coachProfile, Object.keys(CATEGORY_LABELS));
    $("coachProfileText").textContent = `${names[pace]} pace based on ${coachProfile.attempts.length} recent answers.${weak ? ` Focus topic: ${CATEGORY_LABELS[weak]}.` : " Your pace will adapt as you practice."}`;
}

function chooseCoachQuestion() {
    const selected = $("coachCategory").value;
    const category = selected === "recommended"
        ? weakestCategory(coachProfile, Object.keys(CATEGORY_LABELS)) || "dsa"
        : selected;
    let pool = getFilteredQuestions(category, nextDifficulty(coachProfile));
    if (!pool.length) pool = getFilteredQuestions(category);
    const fresh = pool.filter(q => !coachSeen.has(q.question));
    const candidates = fresh.length ? fresh : pool;
    const question = candidates[Math.floor(Math.random() * candidates.length)];
    if (question) coachSeen.add(question.question);
    return question;
}

function stopCoachCall() {
    if (!coachCall) return;
    coachCall.channel?.close();
    coachCall.pc?.close();
    coachCall.stream?.getTracks().forEach(track => track.stop());
    coachCall.audio?.remove();
    coachCall = null;
    $("coachStopBtn").disabled = true;
    $("coachSendBtn").disabled = true;
    coachStatus("Voice call ended. Your progress is saved in this browser.");
}

function coachEvent(event) {
    if (!coachCall?.channel || coachCall.channel.readyState !== "open") return;
    coachCall.channel.send(JSON.stringify(event));
}

function handleCoachEvent(event) {
    if (event.type === "conversation.item.input_audio_transcription.completed" && event.transcript?.trim()) {
        const words = event.transcript.trim();
        coachLine("You", words);
        $("coachAnswer").value = words;
        if (/\b(hint|help me|explain|repeat|slower)\b/i.test(words)) coachUsedHint = true;
        $("coachGradeBtn").disabled = words.length < 10;
    }
    if (event.type === "response.output_audio_transcript.done" && event.transcript?.trim()) {
        coachLine("Coach", event.transcript.trim());
    }
    if (event.type === "error") coachStatus(event.error?.message || "Voice connection error.");
}

async function waitForCoachIce(pc) {
    if (pc.iceGatheringState === "complete") return;
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            pc.removeEventListener("icegatheringstatechange", onState);
            reject(new Error("The voice connection timed out while preparing the microphone. Try again or check your network."));
        }, 10000);
        function onState() {
            if (pc.iceGatheringState !== "complete") return;
            clearTimeout(timer);
            pc.removeEventListener("icegatheringstatechange", onState);
            resolve();
        }
        pc.addEventListener("icegatheringstatechange", onState);
        onState();
    });
}

async function startCoach() {
    if (coachBusy) return;
    stopCoachCall();
    coachQuestion = chooseCoachQuestion();
    if (!coachQuestion) return coachStatus("No questions available for this topic.");
    coachUsedHint = false;
    coachStartedAt = Date.now();
    coachLastGraded = "";
    coachNotAcquaintedRecorded = false;
    $("coachQuestion").textContent = coachQuestion.question;
    $("coachDifficulty").textContent = coachQuestion.difficulty;
    $("coachAnswer").value = "";
    $("coachTranscript").replaceChildren();
    $("coachFeedback").classList.add("hidden");
    $("coachGradeBtn").disabled = false;
    $("coachNotAcquaintedBtn").disabled = false;
    $("coachNextBtn").disabled = false;
    coachBusy = true;
    $("coachStartBtn").disabled = true;
    coachStatus("Connecting to your interviewer…");
    let pc, stream, audio;
    try {
        if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error("This browser cannot open a voice call. Use a current browser on localhost or HTTPS.");
        pc = new RTCPeerConnection();
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "failed" && coachCall?.pc === pc) {
                stopCoachCall();
                coachStatus("Voice connection failed. Check your network and try again.");
            }
        };
        audio = document.createElement("audio");
        audio.autoplay = true;
        document.body.appendChild(audio);
        pc.ontrack = event => { audio.srcObject = event.streams[0]; audio.play().catch(() => coachStatus("Click the page to allow audio playback.")); };
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        pc.addTrack(stream.getAudioTracks()[0], stream);
        const channel = pc.createDataChannel("oai-events");
        coachCall = { pc, stream, audio, channel };
        channel.onmessage = message => { try { handleCoachEvent(JSON.parse(message.data)); } catch { /* Ignore malformed events. */ } };
        channel.onerror = () => coachStatus("Voice data channel error. End the call and try again.");
        channel.onopen = () => {
            coachStatus("Live voice call. Speak naturally; the coach will reply aloud.");
            $("coachStopBtn").disabled = false;
            $("coachSendBtn").disabled = false;
            coachEvent({ type: "response.create" });
        };
        channel.onclose = () => { if (coachCall?.channel === channel) stopCoachCall(); };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        coachStatus("Preparing secure voice connection…");
        await waitForCoachIce(pc);
        const sdp = pc.localDescription?.sdp;
        if (!sdp) throw new Error("The browser could not prepare the voice connection.");
        const params = new URLSearchParams({ category: coachQuestion.category, question: coachQuestion.question, pace: effectivePace(coachProfile), level: selectedAnswerLevel });
        const response = await fetch(`/api/realtime-session?${params}`, { method: "POST", headers: { "Content-Type": "application/sdp" }, body: sdp });
        if (!response.ok) {
            const detail = await response.json().catch(() => ({}));
            throw new Error(detail.error || "Could not connect to the voice service.");
        }
        await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });
    } catch (error) {
        stream?.getTracks().forEach(track => track.stop());
        pc?.close();
        audio?.remove();
        coachCall = null;
        coachStatus(error.name === "NotAllowedError"
            ? "Microphone access was denied. Allow microphone access in your browser, then try again."
            : error.message);
    } finally {
        coachBusy = false;
        $("coachStartBtn").disabled = false;
    }
}

function sendCoachText() {
    const text = $("coachAnswer").value.trim();
    if (!text || !coachCall?.channel || coachCall.channel.readyState !== "open") return;
    coachLine("You", text);
    if (/\b(hint|help me|explain|repeat|slower)\b/i.test(text)) coachUsedHint = true;
    coachEvent({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } });
    coachEvent({ type: "response.create" });
}

async function gradeCoachAnswer() {
    const answer = $("coachAnswer").value.trim();
    if (!coachQuestion || answer.length < 10) return coachStatus("Give an answer of at least 10 characters first.");
    if (answer === coachLastGraded || coachBusy) return;
    coachBusy = true;
    $("coachGradeBtn").disabled = true;
    coachStatus("Reviewing your answer…");
    try {
        const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: coachQuestion.category, question: coachQuestion.question, answer, pace: effectivePace(coachProfile), level: selectedAnswerLevel, usedHint: coachUsedHint }) });
        const feedback = await response.json();
        if (!response.ok) throw new Error(feedback.error || "Could not grade your answer.");
        coachLastGraded = answer;
        $("coachNotAcquaintedBtn").disabled = true;
        const panel = $("coachFeedback");
        panel.replaceChildren();
        const heading = document.createElement("h3");
        heading.textContent = `Score: ${feedback.score}%`;
        panel.appendChild(heading);
        for (const [label, value] of [["Assessment", feedback.summary], ["Strengths", feedback.strengths.join("; ")],
            ["Improve", feedback.improvements.join("; ")], ["Your next step", feedback.nextStep], ["Follow-up", feedback.followUp]]) {
            const row = document.createElement("p");
            const strong = document.createElement("strong");
            strong.textContent = `${label}: `;
            row.append(strong, document.createTextNode(value));
            panel.appendChild(row);
        }
        panel.classList.remove("hidden");
        coachProfile = updateCoachProfile(coachProfile, { category: coachQuestion.category, score: feedback.score, usedHint: coachUsedHint, seconds: (Date.now() - coachStartedAt) / 1000 });
        localStorage.setItem("csCoachProfile", JSON.stringify(coachProfile));
        recordAnswer(coachQuestion, feedback.score, answer, "ai-coach");
        updateSpacedRepetition(coachQuestion, feedback.score);
        showCoachProfile();
        coachStatus("Feedback ready. You can discuss it aloud or try the next question.");
        if (coachCall?.channel?.readyState === "open") {
            coachEvent({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: `Please speak a brief summary of this assessment and one next step: ${feedback.summary} ${feedback.nextStep}` }] } });
            coachEvent({ type: "response.create" });
        }
    } catch (error) {
        coachStatus(error.message);
    } finally {
        coachBusy = false;
        $("coachGradeBtn").disabled = false;
    }
}

function markCoachNotAcquainted() {
    if (!coachQuestion || coachNotAcquaintedRecorded || coachBusy) return;
    coachNotAcquaintedRecorded = true;
    coachUsedHint = true;
    $("coachNotAcquaintedBtn").disabled = true;
    const question = coachQuestion;
    const panel = $("coachFeedback");
    panel.innerHTML = `<h3>Not Acquainted</h3><p>Start with this model answer, then open the explanation for examples. This question is due for review.</p>
        <p class="oop-answer-content">${escapeHtml(answerFor(question, "easy"))}</p>${renderExplainControl(question)}`;
    panel.classList.remove("hidden");
    recordAnswer(question, 0, "", "not-acquainted");
    scheduleNotAcquainted(question);
    coachProfile = updateCoachProfile(coachProfile, { category: question.category, score: 0, usedHint: true, seconds: (Date.now() - coachStartedAt) / 1000 });
    localStorage.setItem("csCoachProfile", JSON.stringify(coachProfile));
    showCoachProfile();
    coachStatus("Not Acquainted recorded. Study the answer, or ask the coach to explain it aloud.");
    if (coachCall?.channel?.readyState === "open") {
        coachEvent({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text",
            text: "I am not acquainted with this topic yet. Please explain the answer aloud in simple terms with one concrete example and a short practice step." }] } });
        coachEvent({ type: "response.create" });
    }
}

function initCoach() {
    const select = $("coachCategory");
    select.add(new Option("Recommended focus topic", "recommended"));
    for (const [value, label] of Object.entries(CATEGORY_LABELS)) select.add(new Option(label, value));
    $("coachAnswerLevel").value = selectedAnswerLevel;
    $("coachPace").value = coachProfile.preferredPace || "auto";
    $("coachPace").addEventListener("change", () => {
        coachProfile.preferredPace = $("coachPace").value;
        localStorage.setItem("csCoachProfile", JSON.stringify(coachProfile));
        showCoachProfile();
    });
    $("coachStartBtn").addEventListener("click", startCoach);
    $("coachStopBtn").addEventListener("click", stopCoachCall);
    $("coachSendBtn").addEventListener("click", sendCoachText);
    $("coachGradeBtn").addEventListener("click", gradeCoachAnswer);
    $("coachNotAcquaintedBtn").addEventListener("click", markCoachNotAcquainted);
    $("coachNextBtn").addEventListener("click", startCoach);
    showCoachProfile();
    fetch("/api/status").then(r => r.json()).then(data => {
        $("coachStartBtn").disabled = !data.configured;
        coachStatus(data.configured ? "API key loaded. Start an interview to check voice service availability."
            : "AI coach is offline. Restart the app to refresh its connection.");
    }).catch(() => {
        $("coachStartBtn").disabled = true;
        coachStatus(location.hostname.endsWith("github.io")
            ? "GitHub Pages hosts the study interface. Run npm start locally and open http://127.0.0.1:3000 for AI voice and grading."
            : "Start this app with node server.js to use the AI coach.");
    });
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
    if (score >= 60) sr.notAcquainted = false;
    
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

function scheduleNotAcquainted(question) {
    updateSpacedRepetition(question, 0);
    const id = question.question.substring(0, 50);
    stats.spacedRepetition[id].notAcquainted = true;
    stats.spacedRepetition[id].dueDate = new Date().toISOString().slice(0, 10);
    localStorage.setItem("csInterviewStats", JSON.stringify(stats));
    renderDueForReview();
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
    if (mode !== "mock" && mode !== "not-acquainted-mock") stats.sessions++;
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
    practiceAttempt = { question, recorded: false };
    $("submitAnswerBtn").disabled = false;
    $("practiceNotAcquaintedBtn").disabled = false;
    $("questionTitle").textContent = question.question;
    $("answerInput").value = "";
    $("feedbackPanel").classList.add("hidden");
    $("modelAnswerBox").classList.add("hidden");
    $("practiceAnswerVariants").classList.toggle("hidden", !question.answers);
    $("practiceAnswerVariants").dataset.category = question.category;
    $("practiceAnswerVariants").dataset.question = encodeURIComponent(question.question);
    $("practiceAnswerLevel").value = selectedAnswerLevel;
    const explainButton = $("practiceExplainBtn");
    explainButton.dataset.category = question.category;
    explainButton.dataset.question = encodeURIComponent(question.question);
    explainButton.dataset.level = question.answers ? selectedAnswerLevel : "medium";
    explainButton.setAttribute("aria-expanded", "false");
    explainButton.textContent = "Explain this answer";
    $("practiceExplanation").replaceChildren();
    $("practiceExplanation").classList.add("hidden");

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

async function submitAnswer() {
    if (!currentQuestion) return showToast("Start a practice session first.", "warning");
    const question = currentQuestion;
    const attempt = practiceAttempt;
    if (attempt?.recorded) return showToast("This question has already been recorded. Start another to practice again.", "info");
    const answer = $("answerInput").value.trim();
    if (answer.length < 10) return showToast("Give an answer of at least 10 characters.", "warning");
    const button = $("submitAnswerBtn");
    button.disabled = true;
    $("feedbackPanel").classList.remove("hidden");
    $("scoreValue").textContent = "…";
    $("feedbackText").textContent = "Checking your reasoning and accepting correct alternative wording…";
    try {
        const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: question.category, question: question.question, answer,
                pace: effectivePace(coachProfile), level: question.answers ? selectedAnswerLevel : "medium" }) });
        const feedback = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(feedback.error === "Not found" ? "Restart the app server to enable AI review." : feedback.error || "AI review is unavailable.");
        if (currentQuestion !== question || attempt.recorded) return;
        attempt.recorded = true;
        $("practiceNotAcquaintedBtn").disabled = true;
        $("scoreValue").textContent = feedback.score;
        $("feedbackText").innerHTML = `<p>${escapeHtml(feedback.summary)}</p>
            <p><strong>Strengths:</strong> ${escapeHtml(feedback.strengths.join("; ") || "Keep developing this answer.")}</p>
            <p><strong>Improve:</strong> ${escapeHtml(feedback.improvements.join("; ") || "No major gaps identified.")}</p>
            <p><strong>Next step:</strong> ${escapeHtml(feedback.nextStep)}</p>`;
        recordAnswer(question, feedback.score, answer, "practice");
        updateSpacedRepetition(question, feedback.score);
    } catch (error) {
        if (currentQuestion !== question || attempt.recorded) return;
        $("scoreValue").textContent = "—";
        $("feedbackText").textContent = `${error.message} Your answer has been kept. Compare it with the model answer below; no guessed mark was recorded.`;
    } finally {
        if (currentQuestion === question) {
            button.disabled = Boolean(attempt.recorded);
            $("modelAnswerText").textContent = answerFor(question);
            $("modelAnswerBox").classList.remove("hidden");
        }
    }
}

function markPracticeNotAcquainted() {
    if (!currentQuestion) return showToast("Start a practice question first.", "warning");
    const attempt = practiceAttempt;
    if (!attempt || attempt.recorded) return;
    attempt.recorded = true;
    $("practiceNotAcquaintedBtn").disabled = true;
    $("submitAnswerBtn").disabled = true;
    $("scoreValue").textContent = "0";
    $("feedbackText").textContent = "Not Acquainted recorded. Study the model answer and its examples, then revisit this question from Due for Review.";
    $("modelAnswerText").textContent = answerFor(currentQuestion);
    $("feedbackPanel").classList.remove("hidden");
    $("modelAnswerBox").classList.remove("hidden");
    recordAnswer(currentQuestion, 0, $("answerInput").value.trim(), "not-acquainted");
    scheduleNotAcquainted(currentQuestion);
    coachProfile = updateCoachProfile(coachProfile, { category: currentQuestion.category, score: 0, usedHint: true, seconds: 0 });
    localStorage.setItem("csCoachProfile", JSON.stringify(coachProfile));
    showCoachProfile();
}

function showModelAnswer() {
    try {
        if (!currentQuestion) {
            showToast("Start a practice session first.", 'warning');
            return;
        }
        $("modelAnswerText").textContent = answerFor(currentQuestion);
        $("modelAnswerBox").classList.remove("hidden");
        $("feedbackPanel").classList.remove("hidden");
    } catch (error) {
        handleError(error, 'showing model answer');
    }
}

function renderExplainControl(question) {
    return `<div class="explain-control">
        <button type="button" class="outline-btn explain-answer-btn" data-category="${question.category}" data-question="${encodeURIComponent(question.question)}" data-level="${question.answers ? selectedAnswerLevel : "medium"}" aria-expanded="false">Explain this answer</button>
        <div class="explanation-panel hidden" aria-live="polite"></div>
    </div>`;
}

function renderUnacquaintedControl(question) {
    const id = question.question.substring(0, 50);
    const marked = Boolean(stats.spacedRepetition[id]?.notAcquainted);
    return `<button type="button" class="outline-btn not-acquainted-bank-btn" data-category="${question.category}"
        data-question="${encodeURIComponent(question.question)}" ${marked ? "disabled" : ""}>${marked ? "Added to review" : "Not Acquainted"}</button>`;
}

function renderExplanation(panel, explanation, question) {
    panel.replaceChildren();
    for (const [heading, content] of [
        ["In simple terms", explanation.simpleTerms],
        ["Simple example", explanation.simpleExample],
        ["Medium example", explanation.mediumExample],
        ["Complex example", explanation.complexExample]
    ].filter(([, content]) => content)) {
        const section = document.createElement("section");
        const title = document.createElement("h5");
        const text = document.createElement("p");
        title.textContent = heading;
        text.textContent = content;
        section.append(title, text);
        panel.appendChild(section);
    }
    if (explanation.offline) {
        const note = document.createElement("p");
        note.className = "explanation-note";
        note.textContent = "Saved study explanation. Restart the app and check OpenAI API access for a tailored AI explanation.";
        panel.appendChild(note);
    }
    if (question) mountVisual(panel, visualForQuestion(question));
}

function savedExplanation(question, level) {
    const easy = question.answers?.easy || question.modelAnswer;
    const medium = question.answers?.medium || question.modelAnswer;
    const hard = question.answers?.hard || question.modelAnswer;
    if (!question.answers) return { simpleTerms: question.modelAnswer, offline: true };
    const exampleAt = easy.search(/\b(?:for example|example)\s*:/i);
    return { simpleTerms: exampleAt > 0 ? easy.slice(0, exampleAt).trim() : easy,
        simpleExample: exampleAt > 0 ? easy.slice(exampleAt).trim() : undefined,
        mediumExample: medium, complexExample: hard, offline: true };
}

async function requestExplanation(category, question, level = "medium") {
    const key = `${category}:${question}:${level}`;
    if (explanationCache.has(key)) return explanationCache.get(key);
    if (!explanationPending.has(key)) {
        const request = fetch("/api/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category, question, level })
        }).then(async response => {
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error === "Not found"
                ? "The running server is an older version. Restart it to enable AI explanations."
                : result.error || "Could not explain this answer.");
            explanationCache.set(key, result);
            return result;
        }).finally(() => explanationPending.delete(key));
        explanationPending.set(key, request);
    }
    return explanationPending.get(key);
}

async function toggleExplanation(button) {
    const panel = button.nextElementSibling;
    if (!panel) return;
    const isOpen = !panel.classList.contains("hidden");
    if (isOpen) {
        panel.classList.add("hidden");
        button.setAttribute("aria-expanded", "false");
        button.textContent = "Explain this answer";
        return;
    }
    panel.classList.remove("hidden");
    button.setAttribute("aria-expanded", "true");
    button.textContent = "Hide explanation";
    const category = button.dataset.category;
    const question = decodeURIComponent(button.dataset.question || "");
    const level = button.dataset.level || "medium";
    const reference = allQuestions.find(item => item.category === category && item.question === question);
    panel.textContent = "Preparing a clear explanation and three examples...";
    button.disabled = true;
    try {
        const result = await requestExplanation(category, question, level);
        if (button.dataset.level === level) renderExplanation(panel, result, reference);
    } catch (error) {
        if (reference) {
            renderExplanation(panel, savedExplanation(reference, level), reference);
            const errorNote = document.createElement("p");
            errorNote.className = "explanation-note";
            errorNote.textContent = error.message;
            panel.prepend(errorNote);
        } else panel.textContent = error.message;
    } finally {
        button.disabled = false;
    }
}

document.addEventListener("click", event => {
    const button = event.target.closest(".explain-answer-btn");
    if (button) toggleExplanation(button);
});

document.addEventListener("click", event => {
    const button = event.target.closest(".not-acquainted-bank-btn");
    if (!button || button.disabled) return;
    const question = allQuestions.find(q => q.category === button.dataset.category
        && q.question === decodeURIComponent(button.dataset.question || ""));
    if (!question) return;
    scheduleNotAcquainted(question);
    button.textContent = "Added to review";
    button.disabled = true;
    const details = button.closest(".bank-card")?.querySelector("details");
    if (details) details.open = true;
    showToast("Added to Due for Review. Open the model answer and explanation to study it.", "info");
});

document.addEventListener("change", event => {
    if (!event.target.matches(".oop-answer-level")) return;
    const level = event.target.value;
    if (!ANSWER_LEVELS.includes(level)) return;
    selectedAnswerLevel = level;
    localStorage.setItem("oopAnswerLevel", level);
    document.querySelectorAll(".oop-answer-level").forEach(select => { select.value = level; });
    document.querySelectorAll(".oop-answer-variants").forEach(container => {
        const question = allQuestions.find(item => item.category === container.dataset.category
            && item.question === decodeURIComponent(container.dataset.question || ""));
        if (!question) return;
        const answer = container.parentElement.querySelector(".oop-answer-content");
        if (answer) answer.textContent = answerFor(question);
        const button = container.parentElement.querySelector(".explain-answer-btn");
        if (button) {
            button.dataset.level = level;
            button.setAttribute("aria-expanded", "false");
            button.textContent = "Explain this answer";
            const panel = button.nextElementSibling;
            if (panel) { panel.classList.add("hidden"); panel.replaceChildren(); }
        }
    });
});

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
        if (!activeSpeechTarget) return;
        // Each interim result is a revision of earlier words in this session.
        // Rebuild from the session's results instead of appending every revision.
        activeSpeechTarget.value = composeSpeechTranscript(speechBaseValue, event.results);
    };

    recognition.onerror = (event) => {
        speechErrorMessage = event.error === "not-allowed" || event.error === "service-not-allowed"
            ? "Microphone access denied. Allow it in your browser and try again."
            : event.error === "no-speech" ? "No speech detected. Try again."
            : "Speech recognition error. Try again.";
        if (activeSpeechStatus) activeSpeechStatus.textContent = speechErrorMessage;
        else showToast(speechErrorMessage, "warning");
    };

    recognition.onend = () => {
        if (activeSpeechStatus) activeSpeechStatus.textContent = speechErrorMessage;
        activeSpeechTarget = null;
        activeSpeechStatus = null;
        speechBaseValue = "";
        speechStopping = false;
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

        if (speechStopping) return;

        if (activeSpeechTarget) {
            speechRecognition.stop();
            speechStopping = true;
            if (activeSpeechStatus) activeSpeechStatus.textContent = "Finishing dictation...";
            if (activeSpeechTarget !== targetInput) showToast("Dictation is stopping. Click again to use this field.", "info");
            return;
        }

        activeSpeechTarget = targetInput;
        activeSpeechStatus = statusEl;
        speechBaseValue = targetInput.value;
        speechErrorMessage = "";
        if (statusEl) statusEl.textContent = "Listening...";
        try { speechRecognition.start(); }
        catch (error) {
            activeSpeechTarget = null;
            activeSpeechStatus = null;
            if (statusEl) statusEl.textContent = "";
            throw error;
        }
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
            unacquainted: [],
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
    mockState.unacquainted[mockState.index] = false;
    advanceMockQuestion();
}

function advanceMockQuestion() {
    if (mockState.index < mockState.questions.length - 1) {
        mockState.index++;
        showMockQuestion();
    } else {
        finishMockInterview();
    }
}

function skipMockQuestion() {
    mockState.answers[mockState.index] = "";
    mockState.unacquainted[mockState.index] = false;
    $("mockAnswerInput").value = "";
    $("fsAnswerInput").value = "";
    advanceMockQuestion();
}

function markMockNotAcquainted() {
    if (!mockState || mockState.finishing) return;
    mockState.answers[mockState.index] = "";
    mockState.unacquainted[mockState.index] = true;
    $("mockAnswerInput").value = "";
    $("fsAnswerInput").value = "";
    advanceMockQuestion();
}

async function finishMockInterview() {
    if (!mockState || mockState.finishing) return;
    clearInterval(mockTimerInterval);
    saveMockAnswer();
    mockState.finishing = true;
    const timeUsed = mockState.totalDuration - mockState.timeRemaining;
    mockState.timeUsed = Math.max(0, timeUsed);
    if (!mockState.completedCounted) {
        stats.mockCount++;
        stats.sessions++;
        mockState.completedCounted = true;
        localStorage.setItem("csInterviewStats", JSON.stringify(stats));
    }
    if (!mockState.unacquaintedRecorded) {
        mockState.questions.forEach((q, index) => {
            if (!mockState.unacquainted[index]) return;
            recordAnswer(q, 0, "", "not-acquainted-mock");
            scheduleNotAcquainted(q);
        });
        mockState.unacquaintedRecorded = true;
    }
    saveCompletedMock();
    $("mockSession").classList.add("hidden");
    $("fullscreenOverlay").classList.add("hidden");
    document.body.classList.remove("no-scroll");
    $("mockResults").classList.remove("hidden");
    $("mockOverallScore").textContent = "Reviewing…";
    $("mockAnsweredCount").textContent = mockState.answers.filter(a => a?.trim()).length;
    $("mockTimeUsed").textContent = formatTime(mockState.timeUsed);
    $("mockReviewStatus").textContent = "AI is reviewing each answer for correctness and reasoning. Your written answers are saved below.";
    $("mockRetryReviewBtn").classList.add("hidden");
    renderMockResults();
    await reviewMockInterview();
}

function renderMockResults() {
    if (!mockState) return;
    $("mockResultsDetail").innerHTML = mockState.questions.map((q, i) => {
        const review = mockState.review?.results?.[i];
        const level = review?.answerLevel || selectedAnswerLevel;
        return `
        <div class="result-item">
            <div class="result-header">
                <span class="badge badge-blue">${escapeHtml(q.categoryLabel)}</span>
                <span class="badge badge-${q.difficulty === "hard" ? "orange" : "grey"}">${q.difficulty}</span>
                <span class="result-score">${review ? `${review.score}%` : mockState.unacquainted?.[i] ? "0% · Not Acquainted" : "Awaiting AI review"}</span>
            </div>
            <p><strong>Q:</strong> ${escapeHtml(q.question)}</p>
            <p><strong>Your answer:</strong></p><p class="student-answer">${mockState.answers[i] ? escapeHtml(mockState.answers[i]) : mockState.unacquainted?.[i] ? "<em>Not Acquainted</em>" : "<em>Skipped</em>"}</p>
            ${review ? `<p><strong>AI review:</strong> ${escapeHtml(review.summary)}</p>
                <p><strong>What you got right:</strong> ${escapeHtml(review.strengths.join("; ") || "No strengths identified yet.")}</p>
                <p><strong>Improve:</strong> ${escapeHtml(review.improvements.join("; ") || "No major gaps identified.")}</p>
                <p><strong>Suggested answer depth:</strong> ${level === "easy" ? "Easier" : level === "hard" ? "Advanced" : "Medium"}</p>` : ""}
            ${renderQuestionSource(q)}
            <details open><summary>Model answer to study</summary>
                <p class="oop-answer-content">${escapeHtml(q.answers ? answerFor(q, level) : review?.studyAnswer || answerFor(q, level))}</p>
                ${q.answers ? `<p class="answer-depth-note">Select a different depth in the Question Bank if you want another explanation style.</p>` : ""}
                ${renderExplainControl(q)}</details>
        </div>`;
    }).join("");
}

async function reviewMockInterview() {
    const state = mockState;
    if (!state) return;
    try {
        const response = await fetch("/api/review-interview", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: state.questions.map((q, i) => ({ category: q.category, question: q.question,
                answer: state.answers[i] || "", notAcquainted: Boolean(state.unacquainted?.[i]) })) }) });
        const review = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(review.error === "Not found" ? "Restart the app server to enable AI interview review." : review.error || "AI review could not be completed.");
        if (mockState !== state) return;
        state.review = review;
        const avg = Math.round(review.results.reduce((sum, row) => sum + row.score, 0) / review.results.length);
        $("mockOverallScore").textContent = `${avg}%`;
        $("mockReviewStatus").innerHTML = `<strong>Overall AI review:</strong> ${escapeHtml(review.overallReview)}<br><strong>Learning plan:</strong> ${escapeHtml(review.learningPlan)}`;
        if (!state.recorded) {
            review.results.forEach((row, i) => {
                if (state.answers[i]?.trim()) {
                    recordAnswer(state.questions[i], row.score, state.answers[i], "mock");
                    updateSpacedRepetition(state.questions[i], row.score);
                }
            });
            state.recorded = true;
        }
        saveCompletedMock();
        renderMockResults();
        updateDashboard();
        renderProgress();
    } catch (error) {
        if (mockState !== state) return;
        $("mockOverallScore").textContent = "—";
        $("mockReviewStatus").textContent = `${error.message} Your complete answers and model answers are below. No guessed mark was recorded.`;
        $("mockRetryReviewBtn").classList.remove("hidden");
    }
}

function saveCompletedMock() {
    if (!mockState) return;
    try {
        localStorage.setItem("csLastMock", JSON.stringify({
            questions: mockState.questions.map(q => ({ category: q.category, question: q.question })),
            answers: mockState.answers, unacquainted: mockState.unacquainted, timeUsed: mockState.timeUsed,
            review: mockState.review || null, recorded: Boolean(mockState.recorded), completedCounted: Boolean(mockState.completedCounted),
            unacquaintedRecorded: Boolean(mockState.unacquaintedRecorded)
        }));
    } catch { /* Results remain available until this tab is closed. */ }
}

function restoreCompletedMock() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem("csLastMock") || "null"); } catch { return; }
    if (!saved || !Array.isArray(saved.questions) || !Array.isArray(saved.answers)) return;
    const questions = saved.questions.map(item => allQuestions.find(q => q.category === item.category && q.question === item.question));
    if (!questions.length || questions.some(q => !q)) return;
    mockState = { questions, answers: saved.answers, unacquainted: Array.isArray(saved.unacquainted) ? saved.unacquainted : [],
        review: saved.review, timeUsed: saved.timeUsed || 0,
        recorded: Boolean(saved.recorded), completedCounted: Boolean(saved.completedCounted),
        unacquaintedRecorded: Boolean(saved.unacquaintedRecorded), finishing: true };
    $("mockSetup").classList.add("hidden");
    $("mockSession").classList.add("hidden");
    $("mockResults").classList.remove("hidden");
    $("mockAnsweredCount").textContent = saved.answers.filter(answer => answer?.trim()).length;
    $("mockTimeUsed").textContent = formatTime(mockState.timeUsed);
    if (saved.review?.results?.length === questions.length) {
        const avg = Math.round(saved.review.results.reduce((sum, row) => sum + row.score, 0) / questions.length);
        $("mockOverallScore").textContent = `${avg}%`;
        $("mockReviewStatus").innerHTML = `<strong>Overall AI review:</strong> ${escapeHtml(saved.review.overallReview)}<br><strong>Learning plan:</strong> ${escapeHtml(saved.review.learningPlan)}`;
        $("mockRetryReviewBtn").classList.add("hidden");
    } else {
        $("mockOverallScore").textContent = "—";
        $("mockReviewStatus").textContent = "Your answers are saved. AI review is pending; retry when OpenAI API credits are available.";
        $("mockRetryReviewBtn").classList.remove("hidden");
    }
    renderMockResults();
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
    const unitFilter = $("bankUnitFilter");
    unitFilter.classList.toggle("hidden", category !== "oop" && category !== "dip");
    if (unitFilter.dataset.category !== category && (category === "oop" || category === "dip")) {
        unitFilter.innerHTML = `<option value="all">All ${category === "dip" ? "DIP weeks" : "Java OOP units"}</option>`;
        const count = category === "dip" ? 10 : 6;
        for (let i = 1; i <= count; i++) unitFilter.add(new Option(`${category === "dip" ? "Week" : "Unit"} ${i}`, String(i)));
        unitFilter.dataset.category = category;
    }
    const difficulty = $("bankDifficultyFilter").value;
    const company = $("bankCompanyFilter").value;
    const role = $("bankRoleFilter").value;
    const search = $("bankSearch").value.toLowerCase();

    let filtered = allQuestions;

    if (category !== "all") filtered = filtered.filter(q => q.category === category);
    if ((category === "oop" || category === "dip") && unitFilter.value !== "all") filtered = filtered.filter(q => q.unit === Number(unitFilter.value));
    if (difficulty !== "all") filtered = filtered.filter(q => q.difficulty === difficulty);
    if (company !== "all") filtered = filtered.filter(q => q.company === company || !q.company);
    if (role !== "all") filtered = filtered.filter(q => q.role === role || !q.role);
    if (search) filtered = filtered.filter(q => [q.question, q.topic, q.source].some(value => value?.toLowerCase().includes(search)));

    container.innerHTML = filtered.length
        ? filtered.map(q => `
            <div class="bank-card">
                <div class="bank-card-header">
                    <span class="badge badge-blue">${q.categoryLabel}</span>
                    <span class="badge badge-${q.difficulty === "hard" ? "orange" : q.difficulty === "medium" ? "grey" : "blue"}">${q.difficulty}</span>
                    ${q.company ? `<span class="badge badge-grey">${q.company}</span>` : ''}
                    ${q.role ? `<span class="badge badge-grey">${q.role}</span>` : ''}
                </div>
                <p class="bank-question">${escapeHtml(q.question)}</p>
                ${renderQuestionSource(q)}
                ${renderUnacquaintedControl(q)}
                <details>
                    <summary>Model Answer</summary>
                    ${renderAnswer(q)}
                    ${renderExplainControl(q)}
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
            <p class="bank-question">${escapeHtml(q.question)}</p>
            ${renderQuestionSource(q)}
            ${renderUnacquaintedControl(q)}
            <details>
                <summary>Model Answer</summary>
                ${renderAnswer(q)}
                ${renderExplainControl(q)}
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
            <p class="bank-question">${escapeHtml(q.question)}</p>
            ${renderQuestionSource(q)}
            ${renderUnacquaintedControl(q)}
            <details>
                <summary>Model Answer</summary>
                ${renderAnswer(q)}
                ${renderExplainControl(q)}
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
            <p class="bank-question">${escapeHtml(q.question)}</p>
            ${renderQuestionSource(q)}
            ${renderUnacquaintedControl(q)}
            <details>
                <summary>Model Answer</summary>
                ${renderAnswer(q)}
                ${renderExplainControl(q)}
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
    if (!window.Chart) return;
    const textColor = currentTheme === 'dark' ? '#f1f5f9' : '#1e293b';
    const gridColor = currentTheme === 'dark' ? '#334155' : '#e2e8f0';
    Chart.defaults.color = textColor;

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
        if (!studentProfile) return openProfileGate();
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
        doc.text(`Student: ${studentProfile.name}`, 20, y);
        y += 7;
        const schoolLines = doc.splitTextToSize(`School: ${studentProfile.school}`, 170);
        doc.text(schoolLines, 20, y);
        y += schoolLines.length * 7;
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

        doc.setProperties({ title: `${studentProfile.name} - Interview Progress Report`, author: studentProfile.name });
        doc.save(progressFileName(studentProfile));
        showToast('PDF report exported successfully!', 'success');
    } catch (error) {
        handleError(error, 'exporting PDF');
    }
}

function exportDataToJson() {
    try {
        const dataStr = JSON.stringify({ stats, coachProfile }, null, 2);
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
                const backup = JSON.parse(e.target.result);
                const importedData = backup.stats || backup;
                
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
                if (backup.coachProfile && Array.isArray(backup.coachProfile.attempts)) {
                    coachProfile = createCoachProfile();
                    for (const attempt of backup.coachProfile.attempts.slice(-30)) {
                        if (CATEGORY_LABELS[attempt.category]) coachProfile = updateCoachProfile(coachProfile, attempt);
                    }
                    coachProfile.preferredPace = ["auto", "slow", "medium", "fast"].includes(backup.coachProfile.preferredPace)
                        ? backup.coachProfile.preferredPace : "auto";
                    $("coachPace").value = coachProfile.preferredPace;
                    localStorage.setItem("csCoachProfile", JSON.stringify(coachProfile));
                    showCoachProfile();
                }
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
        localStorage.removeItem("csStudentProfile");
        studentProfile = null;
        localStorage.removeItem("csLastMock");
        mockState = null;
        $("mockResults").classList.add("hidden");
        $("mockSetup").classList.remove("hidden");
        coachProfile = createCoachProfile();
        localStorage.removeItem("csCoachProfile");
        $("coachPace").value = "auto";
        showCoachProfile();
        updateDashboard();
        renderProgress();
        renderFavorites();
        renderDueForReview();
        
        showToast('All data cleared successfully!', 'success');
        openProfileGate();
    } catch (error) {
        handleError(error, 'clearing data');
    }
}

$("startPracticeBtn").addEventListener("click", startPractice);
$("randomPracticeBtn").addEventListener("click", startRandomPractice);
$("submitAnswerBtn").addEventListener("click", submitAnswer);
$("practiceNotAcquaintedBtn").addEventListener("click", markPracticeNotAcquainted);
$("showModelBtn").addEventListener("click", showModelAnswer);
$("speechBtn").addEventListener("click", () => toggleSpeech($("answerInput"), $("speechStatus")));
$("toggleStarBtn").addEventListener("click", () => {
    const starGuide = $("starGuide");
    starGuide.classList.toggle("hidden");
});
$("startMockBtn").addEventListener("click", startMockInterview);
$("mockNextBtn").addEventListener("click", nextMockQuestion);
$("mockSkipBtn").addEventListener("click", skipMockQuestion);
$("mockNotAcquaintedBtn").addEventListener("click", markMockNotAcquainted);
$("mockSpeechBtn").addEventListener("click", () => toggleSpeech($("mockAnswerInput"), null));
$("fullscreenBtn").addEventListener("click", enterFullscreen);
$("exitMockBtn").addEventListener("click", exitMockInterview);
$("exitFullscreenBtn").addEventListener("click", exitFullscreen);
$("fsNextBtn").addEventListener("click", () => { saveMockAnswer(); nextMockQuestion(); });
$("fsSkipBtn").addEventListener("click", skipMockQuestion);
$("fsNotAcquaintedBtn").addEventListener("click", markMockNotAcquainted);
$("mockRestartBtn").addEventListener("click", () => {
    $("mockResults").classList.add("hidden");
    $("mockSetup").classList.remove("hidden");
});
$("mockRetryReviewBtn").addEventListener("click", reviewMockInterview);
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
$("dipPracticeBtn").addEventListener("click", () => {
    navigateTo("practice");
    $("categorySelect").value = "dip";
    startPractice();
});
$("bankUnitFilter").addEventListener("change", renderQuestionBank);
$("bankDifficultyFilter").addEventListener("change", renderQuestionBank);
$("bankCompanyFilter").addEventListener("change", renderQuestionBank);
$("bankRoleFilter").addEventListener("change", renderQuestionBank);
$("bankSearch").addEventListener("input", renderQuestionBank);

initStudentProfile();
populateCategories();
restoreCompletedMock();
initCoach();
updateDashboard();
renderQuestionBank();
renderCategoryPage("codingContainer", "coding");
renderCategoryPage("internshipContainer", "internship");
renderCategoryPage("graduateContainer", "graduate");
renderCategoryPage("dipContainer", "dip");
renderFavorites();
renderDueForReview();
renderProgress();
initTheme();

const bankSubtitle = $("bankSubtitle");
if (bankSubtitle) {
    bankSubtitle.textContent = `Browse ${allQuestions.length} interview questions across all categories`;
}

window.__coachAppReady = true;
console.log(`CS Interview Coach Pro loaded — ${allQuestions.length} questions available.`);
