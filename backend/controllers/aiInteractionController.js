const { generateWithRetry } = require('../utils/aiService');
const fs = require('fs');
const path = require('path');

exports.chatWithAI = async (req, res) => {
    const { message, context } = req.body;
    console.log("AI Chat Request:", { message, context });

    try {
        // Advanced Mentor Persona Prompt
        const systemPrompt = `
        You are "Kai", an expert AI Career Mentor for software engineers.
        
        YOUR PERSONALITY:
        - Encouraging, empathetic, but realistic.
        - You prioritize practical, "learn-by-doing" advice over theory.
        - You are concise. You don't write huge walls of text unless asked.
        `;

        const prompt = `
        STUDENT CONTEXT:
        ${JSON.stringify(context || {}, null, 2)}
        
        CURRENT CONVERSATION:
        Student: "${message}"
        
        TASK:
        Respond to the student. If they are asking for code, give a short snippet. 
        If they are asking for career advice, give actionable steps.
        Refer to their specific track/goals if visible in context.
        `;

        // AI flow
        const response = await generateWithRetry(prompt, systemPrompt);
        console.log("AI Chat Response:", response.text());
        return res.json({ success: true, reply: response.text() });

    } catch (error) {
        console.error("AI Chat Error:", error);

        // Log to file for debugging
        const logPath = path.join(__dirname, '../backend_debug.log');
        try {
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] AI Chat Error: ${error.message}\nStack: ${error.stack}\n`);
        } catch (err) {
            console.error("Failed to write to log file during chat error:", err);
        }

        // Graceful Fallback for Demo/Rate Limits
        const mockReply = "⚠️ **AI Service Notice**: I'm currently experiencing high traffic or connection limits (Offline Mode).\n\nHowever, I can still encourage you! Keep pushing forward with your projects. Check your Learning Plan for the next steps, and don't hesitate to review the Resources section.";

        return res.json({ success: true, reply: mockReply });
    }
};
