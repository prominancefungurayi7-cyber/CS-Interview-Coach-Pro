# CS Interview Coach Pro

The app includes a static question bank and an AI Voice Coach. The coach uses the existing CS questions as reference material, a live Gemini voice conversation, and a separate AI evaluation of each answer. Recent scores and hint use adjust the coaching pace and the next question's difficulty. The learner can override the pace at any time. Progress is stored in this browser's local storage.

On first launch, enter your name and school before using the app. You can edit them from the sidebar. The dashboard and Progress page show them, and downloaded progress PDFs include both details and use your name in the filename. The profile stays in browser storage and is not sent to the AI. **Clear All Data** removes the profile too.

Use the sidebar button in the top bar to close or reopen navigation. On narrow screens the sidebar opens over the page and closes when you choose a section, tap outside it, or press Escape. Its state is saved in this browser.

Every question now has an applied scenario and a fuller saved study guide. Open its model answer to see labeled simple, practical, and advanced examples immediately, including offline. The **Easier**, **Medium**, and **Straightforward / hard** answer styles work across topics. Select **Explain this answer** for a further plain-language explanation; Gemini generates one when available, and the saved examples remain available when it is offline. The original Java OOP and DIP answer levels remain authored from their course material.

Practice and mock interviews use AI assessment of factual meaning and reasoning, accepting correct alternative wording. The old literal keyword score has been removed. If the AI cannot grade, the app keeps your answer and shows model material without inventing a percentage. The last completed mock is saved in this browser, so its full answers remain available after reopening the page and its AI review can be retried. When AI access works, results include the mark, an AI review and learning plan, and a suggested model-answer depth for each question. In answer boxes, **Enter** submits or advances; **Shift+Enter** inserts a new line.

Choose **Not Acquainted** if you do not know an answer. In Practice and Voice Coach, it records a zero, opens study material and schedules the question for review. During an active voice call, the coach is asked to explain it aloud. In mock interviews it is saved separately from Skip and appears in the final review. In question browsing it adds the question to **Due for Review** without recording a mark.

## Java OOP exam preparation

Choose **Java OOP (HCSE224)** in Practice, Voice Coach, or Mock Interview. The bank has 86 questions across the six outline units, including program-writing and past-paper-style tasks. Questions linked to the supplied September 2024, April 2025, November 2025, and June 2026 papers are sampled four times as often as other Java OOP questions. Difficulty filters still apply, and mock interviews do not repeat a question. In Question Bank, filter by unit and question difficulty. After opening a model answer, choose **Easier**, **Medium**, or **Straightforward / hard** to change answer depth. Medium and hard answers for paper-linked questions include a further explanation and worked examples offline; the AI voice coach also explains these topics step by step. The choice is saved in this browser and guides voice coaching and AI feedback. Question difficulty and answer style are independent.

The [source and coverage map](docs/java-oop-coverage.md) records how each supplied course material informed the bank and where the saved Classroom page has limited content.

## Digital Image Processing exam preparation

Choose **Digital Image Processing** in the sidebar or **Digital Image Processing (HCSCI239)** in Practice, Voice Coach or Mock Interview. The 46-question bank covers every week of the ten-week outline and relevant HCSCI239 and HSVG paper themes. Its 26 paper-linked questions are sampled four times as often as other DIP questions, after difficulty filtering. Each question has easier, medium and advanced answers. Medium and hard answers for paper-linked questions include a further saved explanation and worked examples offline; the AI voice coach uses calculations or visual walkthroughs where useful. The [DIP source and coverage map](docs/dip-coverage.md) lists all ten supplied documents and where they informed the content.

Explanations use 14 downloaded Wikimedia Commons diagrams with author and license attribution, plus original diagrams for topics such as image filtering, segmentation, arrays, web requests, databases and system architecture. You can draw over any visual, clear it and download an annotated PNG. The drawings run locally. The download script `python scripts/download-visuals.py` refreshes the curated Commons assets and their `manifest.json`; it checks licenses and file types before saving.

## Run locally

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to a key from [Google AI Studio](https://aistudio.google.com/apikey). Free-tier quotas and model availability vary by project and region.
3. Run `node server.js` (or `npm start` where the npm launcher is available).
4. Open `http://127.0.0.1:3000`, then choose **AI Voice Coach** and allow microphone access.

The main API key stays on the server; the browser receives a short-lived, single-use token for Gemini Live. The server uses `gemini-3.5-flash` for text by default and tries `gemini-3.5-flash-lite` if that model is temporarily unavailable or out of quota. You can change both in `.env`. Do not open `index.html` directly for the AI features. Use headphones if the microphone picks up the coach's voice. A typed answer can still be graded if microphone access is unavailable. The live coach speaks with an AI-generated voice; it is not a HeyGen voice clone. PDF export and progress charts use locally bundled copies of jsPDF and Chart.js, with their licenses under `assets/vendor/`.

The GitHub Pages site can show the question bank, study material, progress and personalized PDF. GitHub Pages cannot run `server.js`; open the [full app on Render](https://cs-interview-coach-pro.onrender.com/) for live AI voice, grading and generated explanations. The site preserves existing browser progress when loading newer app versions.

## Deploy the full app on Render

The repository includes [Render Blueprint settings](render.yaml) and a [GitHub Actions test workflow](.github/workflows/test.yml). Render runs the Node server at [cs-interview-coach-pro.onrender.com](https://cs-interview-coach-pro.onrender.com/), with voice, grading, and generated explanations. New commits on `main` deploy automatically **after the GitHub tests pass**.

1. Sign in to [Render](https://dashboard.render.com/) with GitHub and select **New → Blueprint**.
2. Choose `prominancefungurayi7-cyber/CS-Interview-Coach-Pro` and allow Render access to that repository. Render reads `render.yaml` from `main`.
3. When Render asks for `GEMINI_API_KEY`, enter your Google AI Studio key in Render's secret field. Do not add it to GitHub or `render.yaml`.
4. Create the Blueprint, wait for its first successful deploy, and open the `https://...onrender.com` URL Render provides. Check `/api/status` on that URL to confirm `"configured":true`.

The free Render service can sleep after 15 minutes without requests, so the first visit later may take about a minute. It has usage limits, and Gemini has separate API quotas. Progress is saved in each browser's local storage for each site URL; progress on GitHub Pages does not automatically appear on the Render URL.

`node --test` runs local profile, content coverage, voice protocol, and server checks. `node scripts/browser-smoke.mjs`, `node scripts/browser-interaction-smoke.mjs` and `node scripts/browser-pages-smoke.mjs` run optional Chrome UI checks on Windows. `node scripts/live-ai-check.mjs` makes one real grading request; `node scripts/live-voice-check.mjs` opens one short spoken Gemini Live session. Set `COACH_BASE_URL=https://cs-interview-coach-pro.onrender.com` to check the hosted voice endpoint instead of the local server. Both AI diagnostics use the configured project quota. Live voice and grading require a working Gemini API key, model access and a network connection. The [Gemini API free tier](https://ai.google.dev/gemini-api/docs/pricing) has limits and Google may use free-tier data to improve its products. Live connections may reset after about 10 minutes; start a new interview to continue.

## How adaptation works

After at least three graded answers, the app checks the last six answers. Scores below 55 on average or hints on at least half of attempts select a step-by-step pace. Scores at least 82 on average with few hints select a challenge pace. Otherwise it uses a balanced pace. The next question follows the pace, and the recommended topic follows the weakest practiced category. These are adjustable coaching settings, not fixed labels for a student's ability.

This is personalized coaching using a pretrained model and a local learner profile. No model weights are trained or fine-tuned by this repository. A robust fine-tuning program would require consented, reviewed answer examples, a grading rubric, and a held-out evaluation set.
