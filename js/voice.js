/* ============================================================
   voice.js
   
   ============================================================ */

document.addEventListener("DOMContentLoaded", initVoiceInput);

function initVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const input = document.getElementById("smart-input");
    const status = document.getElementById("smart-input-status");
    if (!input || !SpeechRecognition) return; // silently skip on unsupported browsers

    // Insert the mic button right after the existing Auto-fill button
    const autoFillBtn = document.getElementById("smart-input-btn");
    const micButton = document.createElement("button");
    micButton.type = "button";
    micButton.className = "btn secondary-btn";
    micButton.id = "voice-input-btn";
    micButton.textContent = "🎤 Speak";
    autoFillBtn.insertAdjacentElement("afterend", micButton);

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    let isListening = false;

    micButton.addEventListener("click", () => {
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    recognition.onstart = () => {
        isListening = true;
        micButton.textContent = "🔴 Listening…";
        if (status) status.textContent = "Listening — say something like \"Rahul paid 1200 for dinner split between all 4\"";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        if (status) status.textContent = `Heard: "${transcript}"`;
        autoFillBtn.click(); // reuse the existing Auto-fill parsing flow
    };

    recognition.onerror = (event) => {
        if (status) status.textContent = `Voice input didn't catch that (${event.error}) — try again or type it.`;
    };

    recognition.onend = () => {
        isListening = false;
        micButton.textContent = "🎤 Speak";
    };
}
