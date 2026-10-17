
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/ask", async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({
                reply: "Please ask me a question."
            });
        }

        const response = await fetch("http://127.0.0.1:11434/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen2.5:3b",
                messages: [
                    {
                        role: "system",
                        content: "You are a friendly AI voice assistant. Give clear, beginner-friendly answers."
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error("Ollama returned status " + response.status);
        }

        const data = await response.json();

        res.json({
            reply: data.message.content
        });
    } catch (error) {
        console.error("AI error:", error.message);
        res.status(500).json({
            reply: "I could not connect to the local AI model. Please check that Ollama is running."
        });
    }
});

app.listen(PORT, () => {
    console.log(`AI Voice Assistant backend running at http://localhost:${PORT}`);
});
