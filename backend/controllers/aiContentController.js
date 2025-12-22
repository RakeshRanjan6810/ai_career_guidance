const { generateWithRetry } = require('../utils/aiService');
const fs = require('fs');
const path = require('path');

exports.generateProjectDescription = async (req, res) => {
    const { title, difficulty, techStack } = req.body;
    const logPath = path.join(__dirname, '../backend_debug.log');
    const log = (msg) => {
        try { fs.appendFileSync(logPath, new Date().toISOString() + ' [AI]: ' + msg + '\n'); } catch (e) { }
    };

    try {
        log(`Generating desc for: ${title}`);

        const prompt = `
        Create a detailed project description for a "${difficulty}" level project titled: "${title}".
        Tech Stack: ${techStack || 'Open to choice'}

        Returns ONLY valid JSON with no markdown formatting:
        {
            "description": "A compelling 2-sentence summary.",
            "features": ["List", "of", "3-5", "key", "features"],
            "learningOutcomes": ["What", "the", "student", "learns"],
            "difficultyReasoning": "Why this is considered ${difficulty}"
        }
        `;

        let aiResponseText = "";

        if (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY) {
            const response = await generateWithRetry(prompt, "Act as a Senior Technical Lead.");
            aiResponseText = response.text();
        } else {
            log("AI Service Unavailable: Missing Key");
            return res.status(503).json({ success: false, message: "AI Service Unavailable. Check API Keys." });
        }

        // Clean up markdown code blocks if any
        const jsonString = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonString);

        log("Generation Success");

        res.json({ success: true, data });

    } catch (error) {
        log("AI Error: " + error.message);
        console.error("AI Project Gen Error:", error);

        // Fallback Mock Data
        const mockData = {
            description: `[MOCK] A robust ${difficulty} level project using ${techStack || 'modern technologies'}.`,
            features: [
                "User Authentication (Login/Register)",
                "CRUD Operations for main entities",
                "Responsive Design",
                "API Integration"
            ],
            learningOutcomes: [
                "Mastery of core concepts",
                "State management implementation",
                "API design patterns"
            ],
            difficultyReasoning: "Standard requirements for this level."
        };

        if (error.message.includes('429') || error.message.includes('503')) {
            log("Returning Mock Data due to Rate Limit/Overload");
            return res.json({ success: true, data: mockData });
        }

        // Even for other errors, fail gracefully with mock data for demo purposes
        log("Returning Mock Data due to General Error");
        return res.json({ success: true, data: mockData });
    }
};

exports.generateCourseDetails = async (req, res) => {
    const { title, difficulty, tags } = req.body;

    try {
        const prompt = `
        Create a compelling course description for a "${difficulty}" level course titled: "${title}".
        Tags/Topics: ${tags || 'General'}

        Returns ONLY valid JSON with no markdown formatting:
        {
            "description": "A comprehensive and engaging course description (approx 3-4 sentences) that outlines what will be covered and why it matters.",
            "prerequisites": "Pre-requisite knowledge needed.",
            "modules": ["List", "of", "5", "suggested", "module", "titles"]
        }
        `;

        let aiResponseText = "";

        if (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY) {
            const response = await generateWithRetry(prompt, "Act as an Expert Curriculum Designer.");
            aiResponseText = response.text();
        } else {
            return res.status(503).json({ success: false, message: "AI Service Unavailable. Check API Keys." });
        }

        const jsonString = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonString);

        res.json({ success: true, data });

    } catch (error) {
        console.error("AI Course Gen Error:", error);
        if (error.message.includes('429')) {
            return res.status(429).json({ success: false, message: "AI Usage Limit Exceeded. Please try again in a few minutes." });
        }
        res.status(500).json({ success: false, message: "AI generation failed." });
    }

};

exports.generateResourcePlan = async (req, res) => {
    const { topic, level, duration } = req.body; // duration e.g. "4 weeks"

    try {
        // Extract number of weeks from duration string or default to 4
        const numWeeks = parseInt(duration) || 4;

        const prompt = `
        TASK: Create a weekly learning resource plan.
        Topic: "${topic}"
        Level: "${level}"
        Duration: ${numWeeks} weeks

        REQUIREMENTS:
        - Break down the topic into ${numWeeks} weekly modules.
        - For EACH week, provide 3-5 high-quality, free learning resources (URLs, titles).
        - Resources can be Video, Article, Documentation, or Tool.
        - Ensure resources match the "${level}" level.

        OUTPUT:
        Return ONLY valid JSON in this structure:
        {
            "topic": "${topic}",
            "level": "${level}",
            "duration": "${duration}",
            "weeks": [
                {
                    "weekNumber": 1,
                    "title": "Week 1: Subtopic Name",
                    "resources": [
                        { "title": "Resource Title", "url": "https://...", "type": "video" }
                    ]
                }
            ]
        }
        `;

        const response = await generateWithRetry(prompt, "Act as an Expert Educational Content Curator.");
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        res.json({ success: true, data });

    } catch (error) {
        console.error("AI Resource Plan Error:", error);

        // Mock Fallback
        const numWeeks = parseInt(duration) || 4;
        const mockData = {
            topic: topic || "General Tech",
            level: level || "Beginner",
            duration: duration || "4 weeks",
            weeks: Array.from({ length: numWeeks }, (_, i) => ({
                weekNumber: i + 1,
                title: `Week ${i + 1}: Foundations of ${topic || 'Tech'}`,
                resources: [
                    { title: "Introduction Crash Course", url: "https://youtube.com", type: "video" },
                    { title: "Official Documentation", url: "https://docs.google.com", type: "documentation" },
                    { title: "Interactive Guide", url: "https://freecodecamp.org", type: "article" }
                ]
            }))
        };

        return res.json({ success: true, data: mockData });
    }
};
