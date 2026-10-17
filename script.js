
const startButton = document.getElementById("startButton");
const clearButton = document.getElementById("clearButton");
const statusText = document.getElementById("status");
const chatBox = document.getElementById("chatBox");

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;
let isListening = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true;
        statusText.textContent = "Listening... Speak now!";
        startButton.textContent = "🎤 Listening...";
    };

    recognition.onresult = async (event) => {
        const userMessage = event.results[0][0].transcript;

        addMessage("You", userMessage, "user-message");
        statusText.textContent = "Thinking...";

        await askAI(userMessage);
    };

    recognition.onerror = (event) => {
        statusText.textContent =
            event.error === "not-allowed"
                ? "Please allow microphone access."
                : "Microphone error: " + event.error;

        resetButton();
    };

    recognition.onend = () => {
        isListening = false;
        resetButton();
    };
} else {
    statusText.textContent =
        "Speech recognition is not supported. Please use Chrome.";
    startButton.disabled = true;
}

startButton.addEventListener("click", () => {
    if (!recognition) return;

    if (!isListening) {
        window.speechSynthesis.cancel();

        try {
            recognition.start();
        } catch (error) {
            statusText.textContent = "Please try again.";
        }
    }
});

clearButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();

    chatBox.innerHTML = `
        <div class="message assistant-message">
            <div class="message-label">🤖 Assistant</div>
            <p>Hello! I am your AI Voice Assistant. Ask me something!</p>
        </div>
    `;

    statusText.textContent = "Ready to listen";
});

async function askAI(message) {
    try {
        const response = await fetch("http://localhost:3000/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.reply || "Could not get an AI response.");
        }

        addMessage("Assistant", data.reply, "assistant-message");
        speak(data.reply);
        statusText.textContent = "Ready to listen";
    } catch (error) {
        console.error("AI request failed:", error);

        const errorMessage =
            "I could not connect to the AI. Please check that the backend and Ollama are running.";

        addMessage("Assistant", errorMessage, "assistant-message");
        statusText.textContent = "Connection problem";
    }
}

function addMessage(sender, message, className) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${className}`;

    const label = document.createElement("div");
    label.className = "message-label";
    label.textContent = sender === "You" ? "🧑 You" : "🤖 Assistant";

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    messageDiv.appendChild(label);
    messageDiv.appendChild(paragraph);
    chatBox.appendChild(messageDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function speak(text) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;

    window.speechSynthesis.speak(utterance);
}

function resetButton() {
    isListening = false;
    startButton.textContent = "🎤 Start Listening";
}
