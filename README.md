# CS Interview Coach Pro

The app includes a static question bank and an AI Voice Coach. The coach uses the existing CS questions as reference material, a live OpenAI Realtime voice conversation, and a separate AI evaluation of each answer. Recent scores and hint use adjust the coaching pace and the next question's difficulty. The learner can override the pace at any time. Progress is stored in this browser's local storage.

On first launch, enter your name and school before using the app. You can edit them from the sidebar. The dashboard and Progress page show them, and downloaded progress PDFs include both details and use your name in the filename. The profile stays in browser storage and is not sent to the AI. **Clear All Data** removes the profile too.

After opening any model answer, select **Explain this answer** for a plain-language explanation and simple, medium, and complex examples. AI explanations use the bank answer as reference and require API credits. If the API is unavailable, the app shows saved answer depths and a visual sketch workspace where available, with a clear offline notice.

Practice and mock interviews use AI assessment of factual meaning and reasoning, accepting correct alternative wording. The old literal keyword score has been removed. If the AI cannot grade, the app keeps your answer and shows model material without inventing a percentage. The last completed mock is saved in this browser, so its full answers remain available after reopening the page and its AI review can be retried. When AI access works, results include the mark, an AI review and learning plan, and a suggested model-answer depth for each question. In answer boxes, **Enter** submits or advances; **Shift+Enter** inserts a new line.

Choose **Not Acquainted** if you do not know an answer. In Practice and Voice Coach, it records a zero, opens study material and schedules the question for review. During an active voice call, the coach is asked to explain it aloud. In mock interviews it is saved separately from Skip and appears in the final review. In question browsing it adds the question to **Due for Review** without recording a mark.

## Java OOP exam preparation

Choose **Java OOP (HCSE224)** in Practice or Question Bank. The bank has 86 questions across the six outline units, including program-writing and past-paper-style tasks. In Question Bank, filter by unit and question difficulty. After opening a model answer, choose **Easier**, **Medium**, or **Straightforward / hard** to change answer depth; each authored answer includes an example and works without API credits. The choice is saved in this browser and also guides Java OOP voice coaching and AI feedback when those services are available. Question difficulty and answer style are independent.

The [source and coverage map](docs/java-oop-coverage.md) records how each supplied course material informed the bank and where the saved Classroom page has limited content.

## Digital Image Processing exam preparation

Choose **Digital Image Processing** in the sidebar or **Digital Image Processing (HCSCI239)** in Practice, Voice Coach or Mock Interview. The 46-question bank covers every week of the ten-week outline and relevant HCSCI239 and HSVG paper themes. Each question has easier, medium and advanced answers. The [DIP source and coverage map](docs/dip-coverage.md) lists all ten supplied documents and where they informed the content.

Explanations use 14 downloaded Wikimedia Commons diagrams with author and license attribution, plus original diagrams for topics such as image filtering, segmentation, arrays, web requests, databases and system architecture. You can draw over any visual, clear it and download an annotated PNG. The drawings run locally. The download script `python scripts/download-visuals.py` refreshes the curated Commons assets and their `manifest.json`; it checks licenses and file types before saving.

## Run locally

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` to an API key with access to the configured text and Realtime models.
3. Run `node server.js` (or `npm start` where the npm launcher is available).
4. Open `http://127.0.0.1:3000`, then choose **AI Voice Coach** and allow microphone access.

The API key stays on the server. Do not open `index.html` directly for the AI features. Use headphones if the microphone picks up the coach's voice. A typed answer can still be graded if microphone access is unavailable. The live coach speaks with an AI-generated voice; it is not a HeyGen voice clone. PDF export and progress charts use locally bundled copies of jsPDF and Chart.js, with their licenses under `assets/vendor/`.

The GitHub Pages site can show the question bank, study material, progress and personalized PDF. GitHub Pages cannot run `server.js`, so live AI voice, grading and generated explanations require the local Node server or a separately hosted backend. The site preserves existing browser progress when loading newer app versions.

`node --test` runs local profile and server checks. `node scripts/browser-smoke.mjs`, `node scripts/browser-interaction-smoke.mjs` and `node scripts/browser-pages-smoke.mjs` run optional Chrome UI checks on Windows. `node scripts/live-ai-check.mjs` makes one real grading request to check the configured API project and may incur a small charge. Live voice and grading require a working API key, **available OpenAI Platform API credits**, model access and a network connection; ChatGPT Plus is separate from API billing.

## How adaptation works

After at least three graded answers, the app checks the last six answers. Scores below 55 on average or hints on at least half of attempts select a step-by-step pace. Scores at least 82 on average with few hints select a challenge pace. Otherwise it uses a balanced pace. The next question follows the pace, and the recommended topic follows the weakest practiced category. These are adjustable coaching settings, not fixed labels for a student's ability.

This is personalized coaching using a pretrained model and a local learner profile. No model weights are trained or fine-tuned by this repository. A robust fine-tuning program would require consented, reviewed answer examples, a grading rubric, and a held-out evaluation set.
