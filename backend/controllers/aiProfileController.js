const { generateWithRetry } = require('../utils/aiService');

exports.analyzeResume = async (req, res) => {
    try {
        let resumeContent = req.body.resumeText;
        const targetRole = req.body.targetRole;

        // If file uploaded, parse PDF
        if (req.file) {
            let pdfParse = require('pdf-parse');
            // Handle ESM/CommonJS mismatch if necessary
            if (typeof pdfParse !== 'function' && pdfParse.default) {
                pdfParse = pdfParse.default;
            }

            if (typeof pdfParse === 'function') {
                const data = await pdfParse(req.file.buffer);
                resumeContent = data.text;
            } else {
                console.error("PDF-Parse library import failed:", pdfParse);
                throw new Error("Failed to initialize PDF parser.");
            }
        }

        if (!resumeContent || resumeContent.trim().length < 50) {
            return res.status(400).json({ success: false, message: "Resume content is too short or missing." });
        }

        console.log("Resume Text Length:", resumeContent.length);

        const prompt = `
        TASK: Analyze the following RESUME content for the role of: "${targetRole}".
        RESUME CONTENT:
        "${resumeContent.substring(0, 5000)}"

        OUTPUT:
        Return ONLY valid JSON in this format:
        {
          "score": 85,
          "summary": "Strong candidate for...",
          "strengths": ["List item 1", "List item 2"],
          "weaknesses": ["List item 1", "List item 2"],
          "improvements": ["Specific actionable tip 1", "Specific actionable tip 2"],
          "missing_keywords": ["React", "AWS"]
        }
        `;

        // AI flow
        const response = await generateWithRetry(prompt, "You are an Expert Technical Recruiter.");
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        res.json({ success: true, data });

    } catch (error) {
        console.error("AI Resume Error:", error);

        // Fallback Mock Data
        const mockData = {
            score: 75,
            summary: "Decent profile (Fallback Analysis - AI Service Unavailable). Recommendation: Add more improved descriptions.",
            strengths: ["Clean Layout", "Education Listed"],
            weaknesses: ["Lack of specific metrics", "Generic summary"],
            improvements: ["Add a section on Cloud Skills", "Quantify your achievements"],
            missing_keywords: ["Docker", "Kubernetes", "CI/CD"],
            isMock: true
        };

        // Always return mock data for now to prevent UI locking
        return res.json({ success: true, data: mockData });
    }
};

exports.generatePortfolioSummary = async (req, res) => {
    try {
        const { projects, skills, careerGoal } = req.body;

        const projectsJson = JSON.stringify(projects || []);
        const skillsJson = JSON.stringify(skills || []);

        const prompt = `
        INPUT:
        Projects: ${projectsJson}
        Skills: ${skillsJson}
        Career Goal: "${careerGoal || 'Software Engineer'}"

        TASK:
        Write a strong student portfolio summary (3–5 sentences) showing:
        - What this student can do
        - Their practical project experience
        - Motivation toward this career track

        OUTPUT:
        Return ONLY plain text. No JSON.
        `;

        let aiResponseText = "";

        if (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY) {
            const response = await generateWithRetry(prompt, "Act as an expert career portfolio writer.");
            aiResponseText = response.text();
            res.json({ success: true, data: aiResponseText.trim() });
        } else {
            // Fallback Mock
            const mockSummary = "Aspiring Software Engineer with a strong foundation in React and Node.js. Passionate about building scalable applications, demonstrated through hands-on projects like a full-stack e-commerce platform. Eager to leverage technical skills and problem-solving abilities to contribute to innovative software solutions.";
            return res.json({ success: true, data: mockSummary });
        }

    } catch (error) {
        console.error("AI Portfolio Error:", error);

        const mockSummary = "Aspiring Software Engineer with a strong foundation in React and Node.js. Passionate about building scalable applications, demonstrated through hands-on projects like a full-stack e-commerce platform. Eager to leverage technical skills and problem-solving abilities to contribute to innovative software solutions.";
        return res.json({ success: true, data: mockSummary });
    }
};
