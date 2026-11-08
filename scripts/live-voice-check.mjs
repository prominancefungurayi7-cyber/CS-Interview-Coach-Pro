// Optional diagnostic: opens one real Gemini Live session and checks for a spoken reply.
import { createAppServer } from "../server.js";

const hostedBaseUrl = process.env.COACH_BASE_URL?.replace(/\/$/, "");
const app = hostedBaseUrl ? null : createAppServer();
if (app) await new Promise(resolve => app.listen(0, "127.0.0.1", resolve));
try {
    const params = new URLSearchParams({ category: "dsa", question: "What is an array?", pace: "medium", level: "medium" });
    const baseUrl = hostedBaseUrl || `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/voice-token?${params}`, { method: "POST" });
    const session = await response.json();
    if (!response.ok) throw new Error(session.error || `Voice token failed: ${response.status}`);
    const result = await new Promise((resolve, reject) => {
        const state = { setupComplete: false, audioReceived: false, transcriptReceived: false };
        const socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(session.token)}`);
        const timer = setTimeout(() => { socket.close(); reject(new Error("Gemini Live did not reply within 30 seconds.")); }, 30000);
        socket.onopen = () => socket.send(JSON.stringify({ setup: {
            model: `models/${session.model}`,
            generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: session.voice } } } },
            systemInstruction: { parts: [{ text: session.instructions }] },
            inputAudioTranscription: {}, outputAudioTranscription: {}
        } }));
        socket.onmessage = async event => {
            let message;
            try { message = JSON.parse(event.data instanceof Blob ? await event.data.text() : String(event.data)); }
            catch { return; }
            if (message.setupComplete) {
                state.setupComplete = true;
                socket.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: "Say a short greeting aloud for a voice check." }] }], turnComplete: true } }));
            }
            if (message.serverContent?.outputTranscription?.text) state.transcriptReceived = true;
            if (message.serverContent?.modelTurn?.parts?.some(part => part.inlineData?.mimeType?.startsWith("audio/pcm"))) state.audioReceived = true;
            if (state.audioReceived) { clearTimeout(timer); socket.close(); resolve(state); }
            if (message.error) { clearTimeout(timer); socket.close(); reject(new Error(message.error.message || "Gemini Live error")); }
        };
        socket.onerror = () => { clearTimeout(timer); reject(new Error("Gemini Live WebSocket connection failed.")); };
        socket.onclose = event => {
            if (state.audioReceived) return;
            clearTimeout(timer);
            reject(new Error(`Gemini Live closed before audio (code ${event.code}, reason ${event.reason || "none"}).`));
        };
    });
    console.log(JSON.stringify(result));
} finally {
    if (app) await new Promise(resolve => app.close(resolve));
}
