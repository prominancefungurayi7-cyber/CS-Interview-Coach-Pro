# CS Interview Coach Pro

The app includes a static question bank and an AI Voice Coach. The coach uses the existing CS questions as reference material, a live OpenAI Realtime voice conversation, and a separate AI evaluation of each answer. Recent scores and hint use adjust the coaching pace and the next question's difficulty. The learner can override the pace at any time. Progress is stored in this browser's local storage.

## Run locally

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` to an API key with access to the configured text and Realtime models.
3. Run `node server.js` (or `npm start` where the npm launcher is available).
4. Open `http://127.0.0.1:3000`, then choose **AI Voice Coach** and allow microphone access.

The API key stays on the server. Do not open `index.html` directly for the AI features. Use headphones if the microphone picks up the coach's voice. A typed answer can still be graded if microphone access is unavailable. The live coach speaks with an AI-generated voice; it is not a HeyGen voice clone.

`node --test` runs local profile and server checks. Live voice and grading require a working API key and network connection.

## How adaptation works

After at least three graded answers, the app checks the last six answers. Scores below 55 on average or hints on at least half of attempts select a step-by-step pace. Scores at least 82 on average with few hints select a challenge pace. Otherwise it uses a balanced pace. The next question follows the pace, and the recommended topic follows the weakest practiced category. These are adjustable coaching settings, not fixed labels for a student's ability.

This is personalized coaching using a pretrained model and a local learner profile. No model weights are trained or fine-tuned by this repository. A robust fine-tuning program would require consented, reviewed answer examples, a grading rubric, and a held-out evaluation set.
