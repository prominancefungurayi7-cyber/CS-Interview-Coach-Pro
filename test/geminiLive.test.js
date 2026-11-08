import test from "node:test";
import assert from "node:assert/strict";
import { createGeminiLiveCall, mergeSpeech } from "../geminiLive.js";

test("partial speech updates extend a transcript without repeating earlier words", () => {
    assert.equal(mergeSpeech("hello", "hello how are you"), "hello how are you");
    assert.equal(mergeSpeech("hello how", "how are you"), "hello how are you");
    assert.equal(mergeSpeech("hello how are you", "how are"), "hello how are you");
});

test("voice client sends Gemini setup, PCM microphone audio, and typed turns", async () => {
    const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    const oldWindow = globalThis.window;
    const oldWebSocket = globalThis.WebSocket;
    const oldAudioContext = globalThis.AudioContext;
    const oldWorklet = globalThis.AudioWorkletNode;
    let socket, capture;
    let stopped = false;
    class FakeSocket {
        static OPEN = 1;
        static CLOSING = 2;
        readyState = 1;
        sent = [];
        constructor(url) { this.url = url; socket = this; queueMicrotask(() => this.onopen()); }
        send(data) {
            const message = JSON.parse(data);
            this.sent.push(message);
            if (message.setup) queueMicrotask(() => this.onmessage({ data: new Blob([JSON.stringify({ setupComplete: {} })]) }));
        }
        close() { this.readyState = 3; }
    }
    class FakeContext {
        sampleRate = 16000;
        destination = {};
        audioWorklet = { addModule: async path => assert.equal(path, "/audio-worklet.js") };
        resume = async () => {};
        close = async () => {};
        createMediaStreamSource = () => ({ connect() {}, disconnect() {} });
    }
    class FakeWorklet {
        port = {};
        constructor() { capture = this; }
        connect() {}
        disconnect() {}
    }
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: {
        getUserMedia: async () => ({ getTracks: () => [{ stop: () => { stopped = true; } }] })
    } } });
    globalThis.window = { AudioContext: FakeContext, AudioWorkletNode: FakeWorklet, WebSocket: FakeSocket };
    globalThis.AudioContext = FakeContext;
    globalThis.AudioWorkletNode = FakeWorklet;
    globalThis.WebSocket = FakeSocket;
    try {
        let ready = false;
        let spokenText = "";
        const call = await createGeminiLiveCall({ token: "temporary-token", model: "gemini-3.8-live", voice: "Kore", instructions: "Ask an array question." },
            { onReady: () => { ready = true; }, onOutput: text => { spokenText = text; } });
        assert.equal(ready, true);
        assert.equal(call.isOpen, true);
        assert.match(socket.url, /BidiGenerateContentConstrained\?access_token=temporary-token/);
        assert.equal(socket.sent[0].setup.model, "models/gemini-3.8-live");
        assert.deepEqual(socket.sent[0].setup.generationConfig.responseModalities, ["AUDIO"]);
        assert.match(socket.sent[1].clientContent.turns[0].parts[0].text, /interview question/);
        capture.port.onmessage({ data: new Float32Array([0, 1, -1]) });
        assert.equal(socket.sent[2].realtimeInput.audio.mimeType, "audio/pcm;rate=16000");
        assert.deepEqual([...Buffer.from(socket.sent[2].realtimeInput.audio.data, "base64")], [0, 0, 255, 127, 0, 128]);
        call.sendText("I need a hint");
        assert.equal(socket.sent[3].clientContent.turns[0].parts[0].text, "I need a hint");
        await socket.onmessage({ data: new Blob([JSON.stringify({ serverContent: { outputTranscription: { text: "Here is a hint." } } })]) });
        assert.equal(spokenText, "Here is a hint.");
        call.close();
        assert.equal(stopped, true);
        assert.equal(call.isOpen, false);
    } finally {
        if (oldNavigator) Object.defineProperty(globalThis, "navigator", oldNavigator); else delete globalThis.navigator;
        if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
        if (oldWebSocket === undefined) delete globalThis.WebSocket; else globalThis.WebSocket = oldWebSocket;
        if (oldAudioContext === undefined) delete globalThis.AudioContext; else globalThis.AudioContext = oldAudioContext;
        if (oldWorklet === undefined) delete globalThis.AudioWorkletNode; else globalThis.AudioWorkletNode = oldWorklet;
    }
});
