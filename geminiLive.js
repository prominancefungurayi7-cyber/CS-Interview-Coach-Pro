const liveEndpoint = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";

export function mergeSpeech(previous, incoming) {
    const a = String(previous || "").trim();
    const b = String(incoming || "").trim();
    if (!a || !b) return a || b;
    if (b.startsWith(a)) return b;
    if (a.endsWith(b) || a.includes(b)) return a;
    const left = a.toLowerCase();
    const right = b.toLowerCase();
    for (let n = Math.min(a.length, b.length); n > 0; n--) {
        if (left.slice(-n) === right.slice(0, n)) return a + b.slice(n);
    }
    return `${a} ${b}`;
}

function pcmBase64(samples) {
    const bytes = new Uint8Array(samples.length * 2);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < samples.length; i++) {
        const value = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(i * 2, value < 0 ? value * 32768 : value * 32767, true);
    }
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
}

function decodePcm(base64) {
    const binary = atob(base64);
    const samples = new Float32Array(Math.floor(binary.length / 2));
    for (let i = 0; i < samples.length; i++) {
        const lo = binary.charCodeAt(i * 2);
        const hi = binary.charCodeAt(i * 2 + 1);
        const value = (hi << 8) | lo;
        samples[i] = (value > 32767 ? value - 65536 : value) / 32768;
    }
    return samples;
}

export async function createGeminiLiveCall(session, handlers = {}) {
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.AudioWorkletNode || !window.WebSocket)
        throw new Error("Live voice needs a current browser on localhost or HTTPS with microphone support.");

    let stream, inputContext, outputContext, source, capture, socket;
    let nextPlayTime = 0;
    let closed = false;
    let ready = false;
    const playing = new Set();
    const send = value => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(value)); };
    const close = () => {
        if (closed) return;
        closed = true;
        ready = false;
        stream?.getTracks().forEach(track => track.stop());
        capture?.disconnect();
        source?.disconnect();
        for (const node of playing) { try { node.stop(); } catch { /* Already stopped. */ } }
        playing.clear();
        inputContext?.close().catch(() => {});
        outputContext?.close().catch(() => {});
        if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
        handlers.onClose?.();
    };
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
        try { inputContext = new AudioContext({ sampleRate: 16000 }); }
        catch { inputContext = new AudioContext(); }
        outputContext = new AudioContext();
        await Promise.all([inputContext.resume(), outputContext.resume(), inputContext.audioWorklet.addModule("/audio-worklet.js")]);
        source = inputContext.createMediaStreamSource(stream);
        capture = new AudioWorkletNode(inputContext, "microphone-capture");
        source.connect(capture);
        capture.connect(inputContext.destination);

        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Gemini voice connection timed out. Please try again.")), 15000);
            const fail = error => { clearTimeout(timer); reject(error); };
            socket = new WebSocket(`${liveEndpoint}?access_token=${encodeURIComponent(session.token)}`);
            socket.onerror = () => fail(new Error("Could not connect to Gemini Live. Check your network and model access."));
            socket.onclose = () => { if (!ready) fail(new Error("Gemini closed the voice connection before it started.")); else close(); };
            socket.onopen = () => send({ setup: {
                model: `models/${session.model}`,
                generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: session.voice } } } },
                systemInstruction: { parts: [{ text: session.instructions }] },
                inputAudioTranscription: {}, outputAudioTranscription: {}
            } });
            socket.onmessage = async event => {
                let message;
                try {
                    const raw = event.data instanceof Blob ? await event.data.text()
                        : event.data instanceof ArrayBuffer ? new TextDecoder().decode(event.data) : event.data;
                    message = JSON.parse(raw);
                } catch { return; }
                if (message.setupComplete) {
                    clearTimeout(timer);
                    ready = true;
                    capture.port.onmessage = chunk => {
                        if (!closed && ready && socket.readyState === WebSocket.OPEN)
                            send({ realtimeInput: { audio: { mimeType: `audio/pcm;rate=${inputContext.sampleRate}`, data: pcmBase64(chunk.data) } } });
                    };
                    send({ clientContent: { turns: [{ role: "user", parts: [{ text: "Please ask me the interview question now." }] }], turnComplete: true } });
                    handlers.onReady?.();
                    resolve();
                }
                if (message.serverContent?.inputTranscription?.text) handlers.onInput?.(message.serverContent.inputTranscription.text);
                if (message.serverContent?.outputTranscription?.text) handlers.onOutput?.(message.serverContent.outputTranscription.text);
                if (message.serverContent?.interrupted) {
                    for (const node of playing) { try { node.stop(); } catch { /* Already stopped. */ } }
                    playing.clear();
                    nextPlayTime = 0;
                }
                for (const part of message.serverContent?.modelTurn?.parts || []) {
                    if (!part.inlineData?.data || !part.inlineData.mimeType?.startsWith("audio/pcm")) continue;
                    const samples = decodePcm(part.inlineData.data);
                    const buffer = outputContext.createBuffer(1, samples.length, 24000);
                    buffer.copyToChannel(samples, 0);
                    const node = outputContext.createBufferSource();
                    node.buffer = buffer;
                    node.connect(outputContext.destination);
                    node.onended = () => playing.delete(node);
                    playing.add(node);
                    nextPlayTime = Math.max(nextPlayTime, outputContext.currentTime + 0.03);
                    node.start(nextPlayTime);
                    nextPlayTime += buffer.duration;
                }
                if (message.error) handlers.onError?.(message.error.message || "Gemini voice error.");
            };
        });
        return { close, get isOpen() { return ready && !closed; }, sendText(text) {
            if (!ready || closed) return;
            send({ clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true } });
        } };
    } catch (error) {
        close();
        throw error;
    }
}
