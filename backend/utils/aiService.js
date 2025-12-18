const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize AI Client (xAI)
const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

const MODELS_TO_TRY = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];

const generateWithRetry = async (prompt, systemInstruction = "You are a helpful AI assistant.") => {
    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`Trying AI Model: ${modelName}...`);
            console.log("Using API Key:", process.env.GROQ_API_KEY ? "Present" : "Missing");
            console.log("Model requested:", modelName);

            const completion = await openai.chat.completions.create({
                model: modelName,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ]
            });

            console.log(`✅ Success with ${modelName} `);
            const content = completion.choices[0].message.content;
            return {
                text: () => content
            };

        } catch (error) {
            // Check for specific xAI "No Credits" error or Rate Limit
            if (error.status === 403 || error.status === 402 || (error.message && error.message.includes("credits"))) {
                console.warn(`⚠️  xAI Model Skipped (${modelName}): Insufficient Info/Credits without stopping server.`);
                console.warn(`   -> ${error.message}`);
            } else {
                console.warn(` Failed with ${modelName}: ${error.message}`);
            }

            const logPath = path.join(__dirname, '../backend_debug.log');
            try {
                fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] RETRY FAIL (${modelName}): ${error.message}\n`);
            } catch (err) {
                console.error("Failed to write to log file:", err);
            }

            if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
                throw error;
            }
        }
    }
};

module.exports = { generateWithRetry };
