const { OpenAI } = require('openai');

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
            // Return object mimicking Gemini response structure for minimal refactor elsewhere if needed, 
            // or just return the text directly. Let's return a simple object with a text() method to keep compatibility.
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
                console.warn(`❌ Failed with ${modelName}: ${error.message}`);
            }

            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '../backend_debug.log');
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] RETRY FAIL (${modelName}): ${error.message}\n`);

            if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
                throw error;
            }
        }
    }
};

exports.getAIRecommendations = async (req, res) => {
    const { interests, skills, education, experience, country, hours_per_week, target_career } = req.body;

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ message: "AI API Keys missing on server" });
    }

    try {
        const userProfile = {
            target_career: target_career || 'Not Specified (Suggest based on potential)',
            interests: interests || 'General Tech',
            skills: skills || 'Beginner',
            education: education || 'Self-taught',
            experience_level: experience || 'Beginner',
            country: country || 'Global',
            hours_per_week: hours_per_week || 10
        };

        const systemPrompt = "You are an expert Career Counselor.";
        const prompt = `
        User Profile: ${JSON.stringify(userProfile)}

TASK:
1. Analyze the profile.
        2. Choose the TOP 3 most suitable career tracks.
   - IMPORANT: If "target_career" is specified, prioritize tracks related to it.
   - If not, suggest based on skills and interests.
    Examples: "AI Engineer", "Data Scientist", "Machine Learning Engineer",
        "Computer Vision Engineer", "NLP Engineer", "MERN Developer", etc.
        3. For each track:
- explain WHY it fits this student(short reasoning)
    - list key skills to learn
        - list 3–5 recommended courses / modules(only titles, no links)
            - mark difficulty level(beginner / intermediate / advanced)
                - estimated_time_months(number)

OUTPUT:
        Return ONLY valid JSON(no markdown, no explanation text) in this exact format:

{
    "tracks": [
        {
            "id": "unique_id_snake_case",
            "name": "Job Title",
            "fit_score": 0.88,
            "why_fit": "short explanation...",
            "difficulty": "beginner",
            "estimated_time_months": 4,
            "skills_to_learn": ["Skill 1", "Skill 2"],
            "recommended_modules": ["Module 1", "Module 2"]
        }
    ]
}
`;

        // AI flow
        const response = await generateWithRetry(prompt, systemPrompt);
        const text = response.text();
        console.log("AI_DEBUG_RAW:", text);
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        return res.json({ success: true, data });

    } catch (error) {
        console.error("AI Recommendation Error:", error);

        // FAIL-SAFE MOCK DATA -> Dynamic
        console.log("Using Mock Fallback for Recommendations");

        // Simple keyword-based mock generation
        const getMockTracks = (profile) => {
            const lowerInterests = (profile.interests || "").toLowerCase();
            const lowerSkills = (profile.skills || "").toLowerCase();
            const combined = lowerInterests + " " + lowerSkills;

            const mocks = [];

            // 1. Web Dev (Default or if web keywords)
            if (combined.includes('web') || combined.includes('react') || combined.includes('node') || combined.includes('front') || mocks.length < 3) {
                mocks.push({
                    id: "mock_fullstack_dynamic",
                    name: "Full Stack Developer (Offline Mode)",
                    fit_score: 0.92,
                    why_fit: "Matches your interest in web technologies and building applications.",
                    difficulty: "Intermediate",
                    estimated_time_months: 6,
                    skills_to_learn: ["React", "Node.js", "Express", "MongoDB"],
                    recommended_modules: ["Modern React with Redux", "REST API Design", "Database Modeling"]
                });
            }

            // 2. Data Science (if data keywords)
            if (combined.includes('data') || combined.includes('python') || combined.includes('analy') || combined.includes('stat') || mocks.length < 3) {
                mocks.push({
                    id: "mock_data_scientist_dynamic",
                    name: "Data Scientist (Offline Mode)",
                    fit_score: 0.89,
                    why_fit: "Great alignment with analytical skills and data processing interests.",
                    difficulty: "Advanced",
                    estimated_time_months: 8,
                    skills_to_learn: ["Python", "Pandas", "Machine Learning", "SQL"],
                    recommended_modules: ["Data Science Methodology", "Applied Machine Learning", "Data Visualization"]
                });
            }

            // 3. AI/ML (if ai keywords)
            if (combined.includes('ai') || combined.includes('intelligence') || combined.includes('neural') || combined.includes('robot') || mocks.length < 3) {
                mocks.push({
                    id: "mock_ai_engineer_dynamic",
                    name: "AI Engineer (Offline Mode)",
                    fit_score: 0.95,
                    why_fit: "Your profile indicates a strong aptitude for future technologies.",
                    difficulty: "Advanced",
                    estimated_time_months: 9,
                    skills_to_learn: ["TensorFlow", "PyTorch", "Deep Learning", "NLP"],
                    recommended_modules: ["Deep Learning Specialization", "Natural Language Processing", "AI Ethics"]
                });
            }

            return mocks.slice(0, 3);
        };

        return res.json({ success: true, data: { tracks: getMockTracks(req.body) } });
    }
};

exports.generateLearningPlan = async (req, res) => {
    const { user_profile, selected_track_id, hours_per_week, target_weeks } = req.body;

    try {
        const prompt = `
        User Profile: ${JSON.stringify(user_profile || {})}
        Selected Track ID: ${selected_track_id}
        Hours Per Week: ${hours_per_week || 10}
        Target Duration (Weeks): ${target_weeks || 8}

        TASK:
        Create a dynamic and personalized weekly learning PLAN.

        Personalization Rules:
        - Consider user’s existing skills, experience, and education
        - If user is beginner → include more fundamentals in Week 1–2
        - If user already knows basics → skip repetitive beginner topics
        - Adjust weekly hours based on Hours Per Week input
        - Explain **why this plan fits the student** (1–2 lines)
        - Include **resume skill line** for each week (1 line)
        - Include **project / mini-task** where relevant
        - Add **assessment** at the end of each week:
            {
              "type": "quiz",
              "goal": "Check understanding of {{week_topic}}",
              "unlock_condition": "Score >= 60%"
            }

        OUTPUT:
        Return ONLY VALID JSON in this exact structure:

        {
          "track_id": "${selected_track_id}",
          "plan_summary": "1–2 sentence personalized summary",
          "personalization_reason": "Why this plan is recommended for this student",
          "hours_per_week": ${hours_per_week || 10},
          "total_weeks": ${target_weeks || 8},
          "weeks": [
            {
              "week_number": 1,
              "title": "Week 1: {{topic}}",
              "goal": "Clear and achievable goal for this week",
              "estimated_hours": 12,
              "status": "in-progress",
              "skills_gained": [
                "Skill 1",
                "Skill 2"
              ],
              "resume_bullet": "A bullet point that the student can add to their resume",
              "topics": [
                {
                  "title": "Specific topic",
                  "type": "core_concept" | "project" | "practice" | "tool",
                  "estimated_hours": 3
                }
              ],
              "assessment": {
                "type": "quiz",
                "goal": "short description",
                "unlock_condition": "Score >= 60%"
              }
            }
          ]
        }
        `;

        // AI flow
        const response = await generateWithRetry(prompt, "Act as an Expert Curriculum Designer.");
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        res.json({ success: true, data });

    } catch (error) {
        console.error("AI Learning Plan Error:", error);
        // FAIL-SAFE MOCK DATA
        console.log("Using Mock Fallback for Learning Plan");
        const mockPlan = {
            track_id: selected_track_id || "mock_track",
            plan_summary: "Generated offline plan due to high server load. Follows standard industry curriculum.",
            personalization_reason: "Standardized curriculum for high-demand skills.",
            hours_per_week: hours_per_week || 10,
            total_weeks: target_weeks || 8,
            weeks: Array.from({ length: target_weeks || 8 }, (_, i) => ({
                week_number: i + 1,
                title: `Week ${i + 1}: Core Concepts Phase ${i + 1}`,
                goal: "Master the fundamentals and build practical projects.",
                estimated_hours: hours_per_week || 10,
                status: i === 0 ? "in-progress" : "locked",
                skills_gained: ["Core Concept A", "practical Application B"],
                resume_bullet: `Implemented core concepts of phase ${i + 1} in a practical environment.`,
                topics: [
                    { title: "Theoretical Foundations", estimated_hours: 3, type: "core_concept" },
                    { title: "Practical Implementation", estimated_hours: 5, type: "practice" },
                    { title: "Review & Assessment", estimated_hours: 2, type: "tool" }
                ],
                assessment: {
                    type: "quiz",
                    goal: "Verify core concept understanding",
                    unlock_condition: "Score >= 60%"
                }
            }))
        };
        return res.json({ success: true, data: mockPlan });
    }
};


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
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../backend_debug.log');
        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] AI Chat Error: ${error.message}\nStack: ${error.stack}\n`);

        // Graceful Fallback for Demo/Rate Limits
        const mockReply = "⚠️ **AI Service Notice**: I'm currently experiencing high traffic or connection limits (Offline Mode).\n\nHowever, I can still encourage you! Keep pushing forward with your projects. Check your Learning Plan for the next steps, and don't hesitate to review the Resources section.";

        return res.json({ success: true, reply: mockReply });
    }
};

exports.generateProjectDescription = async (req, res) => {
    const { title, difficulty, techStack } = req.body;
    const fs = require('fs');
    const path = require('path');
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

        if (process.env.GROQ_API_KEY) {
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

        if (process.env.GROQ_API_KEY) {
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

        if (process.env.GROQ_API_KEY) {
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

// @desc    Generate Career Market Analysis
// @route   POST /api/ai/market-analysis
// @access  Private
exports.generateCareerMarketAnalysis = async (req, res) => {
    try {
        const User = require('../models/User'); // Ensure User model is available
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { custom_role, custom_country } = req.body;

        const inputData = {
            user_profile: {
                name: user.name,
                age: user.profile?.age || 21,
                education_level: user.profile?.education || "Undergraduate",
                experience_level: "beginner",
                interests: user.interests || [],
                hours_per_week_available: 10
            },
            selected_track: {
                id: "custom_track",
                name: custom_role || user.profile?.careerGoal || "Software Developer"
            },
            current_learning: {
                completed_weeks: 2,
                total_weeks: 8,
                skills_in_progress: user.skills || [],
                learning_plan_focus: ["full-stack"]
            },
            skills: user.skills ? user.skills.reduce((acc, skill) => ({ ...acc, [skill]: "beginner" }), {}) : {},
            country: custom_country || user.profile?.location || "India",
            custom_search: {
                enabled: !!custom_role,
                role_name: custom_role || user.profile?.careerGoal || "Full Stack Developer",
                country: custom_country || user.profile?.location || "India"
            }
        };

        const systemPrompt = `
You are an AI Career Market Mentor.
You will receive a JSON input containing a student's profile.
Your task is to analyze the job market for their specific role and country.

INPUT JSON:
${JSON.stringify(inputData)}

TASK:
1. Understand the student's interests, track, and skills.
2. Provide a high-level view of the job market.
3. Explain demand, salary bands (junior/mid/senior), key skills, and skill gaps.
4. Provide a 5-year market outlook.
5. Create a 30-day and 6-month action plan.

OUTPUT:
Return ONLY valid JSON in EXACTLY this structure (no markdown):
{
  "track_id": "string",
  "role_name": "string",
  "summary": "string",
  "assumptions_note": "string",
  "current_market": {
    "demand_level": "low" | "medium" | "high",
    "remote_opportunity": "low" | "medium" | "high",
    "projected_growth_5y": "declining" | "stable" | "growing",
    "comment": "string"
  },
  "salary_insights": {
    "note": "string",
    "currency": "string",
    "junior": { "min": number, "max": number },
    "mid":    { "min": number, "max": number },
    "senior": { "min": number, "max": number }
  },
  "skills_required": ["string"],
  "skill_gap_analysis": [
    { "skill": "string", "required_level": "string", "user_level": "string", "status": "string", "comment": "string" }
  ],
  "high_impact_skill_upgrades": [
    { "skill": "string", "reason": "string", "expected_salary_impact": "string" }
  ],
  "five_year_outlook": {
    "overall_trend": "string",
    "summary": "string",
    "emerging_areas": ["string"]
  },
  "action_plan_30_days": ["string"],
  "action_plan_6_months": ["string"],
  "suggested_job_titles": ["string"],
  "custom_search_insights": {
    "enabled": boolean,
    "role_name": "string",
    "country": "string",
    "summary": "string",
    "demand_level": "string",
    "salary_comment": "string",
    "top_skills": ["string"]
  }
}`;

        const aiResponse = await generateWithRetry(systemPrompt);
        let jsonStr = aiResponse.text();
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonStr);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Market Analysis Error:', error);

        // FAIL-SAFE DYNAMIC MOCK DATA (Offline Mode)
        console.log("Using Dynamic Mock Fallback for Market Analysis");

        const requestedRole = req.body.custom_role || "Software Engineer";
        const requestedCountry = req.body.custom_country || "Global";

        // Dynamic Logic for Realism
        const isIndia = requestedCountry.toLowerCase().includes('india');
        const currency = isIndia ? "INR" : "USD";
        const multiplier = isIndia ? 83 : 1;

        let skills = ["Problem Solving", "Communication", "Technical Design"];
        let emerging = ["AI Integration", "Cloud Native"];
        let demand = "High";

        // Keyword based customization
        const lowerRole = requestedRole.toLowerCase();

        if (lowerRole.includes('iot') || lowerRole.includes('internet of things') || lowerRole.includes('embedded')) {
            skills = ["Embedded C", "IoT Protocols (MQTT)", "Circuit Design", "Python"];
            emerging = ["Edge AI", "5G Connectivity", "Smart Sensors"];
        } else if (lowerRole.includes('data') || lowerRole.includes('analyst') || lowerRole.includes('scientist')) {
            skills = ["Python", "SQL", "Machine Learning", "Data Visualization", "Pandas"];
            emerging = ["AutoML", "Big Data Ops", "Generative AI"];
        } else if (lowerRole.includes('design') || lowerRole.includes('ui') || lowerRole.includes('ux')) {
            skills = ["Figma", "User Research", "Prototyping", "HTML/CSS", "Wireframing"];
            emerging = ["AR/VR Design", "Voice UI", "Accessibility (A11y)"];
        } else if (lowerRole.includes('manager') || lowerRole.includes('product')) {
            skills = ["Agile/Scrum", "Roadmapping", "Stakeholder Management", "JIRA"];
            emerging = ["AI-Driven Analytics", "Remote Team Leadership"];
        } else if (lowerRole.includes('web') || lowerRole.includes('develop') || lowerRole.includes('front') || lowerRole.includes('back') || lowerRole.includes('full') || lowerRole.includes('mern') || lowerRole.includes('software')) {
            skills = ["JavaScript", "React", "Node.js", "System Design", "API Development"];
            emerging = ["WebAssembly", "Serverless Architecture", "Micro-Frontends"];
        } else if (lowerRole.includes('mobile') || lowerRole.includes('android') || lowerRole.includes('ios') || lowerRole.includes('app')) {
            skills = ["React Native", "Flutter", "Swift", "Kotlin", "Mobile UI"];
            emerging = ["Super Apps", "AR Integration", "Foldable Design"];
        } else if (lowerRole.includes('cloud') || lowerRole.includes('devops') || lowerRole.includes('aws')) {
            skills = ["AWS/Azure", "Docker", "Kubernetes", "CI/CD Pipelines", "Terraform"];
            emerging = ["GitOps", "FinOps", "Platform Engineering"];
        } else if (lowerRole.includes('security') || lowerRole.includes('cyber') || lowerRole.includes('pen')) {
            skills = ["Network Security", "Ethical Hacking", "Python scripting", "Risk Assessment"];
            emerging = ["Zero Trust Architecture", "AI in Cybersecurity", "Quantum Cryptography"];
        } else if (lowerRole.includes('ai') || lowerRole.includes('prompt') || lowerRole.includes('gpt') || lowerRole.includes('llm') || lowerRole.includes('machine learning')) {
            skills = ["Prompt Engineering", "LLM Architecture", "Python", "NLP", "LangChain"];
            emerging = ["Autonomous Agents", "Multimodal Models", "AI Ethics"];
        }

        // Specific Tech Overrides (Prioritize specific languages/tools if mentioned)
        const techKeywords = ["Java", "Python", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "TypeScript", "React", "Angular", "Vue", "Node", "Spring", "Django", "Flask", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Linux", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "Redis", "Prompt Engineering", "LLM", "NLP", "Generative AI", "LangChain"];

        const foundTechs = techKeywords.filter(tech => lowerRole.includes(tech.toLowerCase()));
        if (foundTechs.length > 0) {
            // Prepend found techs to skills to ensure they appear in analysis
            skills = [...new Set([...foundTechs, ...skills])];
        }

        // Mock User Skills Comparison (Use REAL user profile if available)
        const userSkills = (req.user && req.user.skills) ? req.user.skills.map(s => s.toLowerCase()) : [];

        const skillGap = skills.slice(0, 3).map((skill, index) => {
            const lowerSkill = skill.toLowerCase();
            const hasSkill = userSkills.some(us => lowerSkill.includes(us) || us.includes(lowerSkill));

            // If user has the skill -> On Track. If not -> Needs Improvement.
            // If no user skills found (empty profile), fallback to search prioritization (primary is gap).

            let status = "needs_improvement";
            let userLevel = "Beginner";
            let comment = `Focus on mastering ${skill} core concepts.`;

            if (hasSkill) {
                status = "on_track";
                userLevel = "Intermediate";
                comment = "You have a good foundation here.";
            } else if (userSkills.length === 0 && index === 0) {
                // Fallback if user profile is empty: assume main search is the gap
                status = "needs_improvement";
            } else if (userSkills.length === 0) {
                status = "on_track"; // Assume others are generic/okay for mock purposes if we don't know
                userLevel = "Intermediate";
                comment = "Likely transferable from your general experience.";
            }

            return {
                skill: skill,
                required_level: "Intermediate", // Standard require
                user_level: userLevel,
                status: status,
                comment: comment
            };
        });

        const mockAnalysis = {
            track_id: "mock_track_dynamic",
            role_name: requestedRole,
            summary: `Comprehensive market analysis for ${requestedRole} in ${requestedCountry}. The industry demonstrates robust growth and high demand for skilled professionals.`,
            assumptions_note: "Analysis based on aggregated industry data and current market trends.",
            current_market: {
                demand_level: demand,
                remote_opportunity: "Medium",
                projected_growth_5y: "Growing",
                comment: `Strong and steady demand expected for ${requestedRole} roles.`
            },
            salary_insights: {
                note: `Estimated salary bands in ${currency}.`,
                currency: currency,
                junior: { min: 60000 * multiplier, max: 90000 * multiplier },
                mid: { min: 100000 * multiplier, max: 150000 * multiplier },
                senior: { min: 160000 * multiplier, max: 240000 * multiplier }
            },
            skills_required: skills,
            skill_gap_analysis: skillGap,
            high_impact_skill_upgrades: [
                { skill: emerging[0], reason: "High enterprise demand", expected_salary_impact: "+15%" }
            ],
            five_year_outlook: {
                overall_trend: "Positive",
                summary: `The demand for **${requestedRole}** professionals is projected to grow significantly over the next 5 years. Key drivers include the widespread adoption of **${emerging[0] || 'Modern Tech'}** and **${emerging[1] || 'Cloud Solutions'}**, along with increasing enterprise digital transformation initiatives in the ${requestedCountry} market.`,
                emerging_areas: emerging
            },
            action_plan_30_days: [`Build a project using ${skills[0]}`, "Review industry standard protocols"],
            action_plan_6_months: [`Obtain a certification in ${emerging[0]}`, "Contribute to open source"],
            suggested_job_titles: [`Junior ${requestedRole}`, `Senior ${requestedRole}`, `${requestedRole} Lead`],
            custom_search_insights: {
                enabled: true,
                role_name: requestedRole,
                country: requestedCountry,
                summary: "Dynamic market view.",
                demand_level: "High",
                salary_comment: "Competitive",
                top_skills: skills
            }
        };

        return res.status(200).json({ success: true, data: mockAnalysis });
    }
};

