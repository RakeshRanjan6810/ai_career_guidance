const { generateWithRetry } = require('../utils/aiService');
const User = require('../models/User');

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

// @desc    Generate Career Market Analysis
// @route   POST /api/ai/market-analysis
// @access  Private
exports.generateCareerMarketAnalysis = async (req, res) => {
    try {
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

        let skills = ["Problem Solving", "Communication", "Technical Design"];
        let emerging = ["AI Integration", "Cloud Native"];

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

        const mockData = {
            track_id: "mock_track_dynamic",
            role_name: requestedRole,
            summary: `Market analysis for ${requestedRole} in ${requestedCountry} (Offline Mode).`,
            assumptions_note: "Data based on general industry trends.",
            current_market: {
                demand_level: "high", // Fallback default
                remote_opportunity: "medium",
                projected_growth_5y: "growing",
                comment: "Steady demand observed."
            },
            salary_insights: {
                note: "Estimated ranges.",
                currency: isIndia ? "INR" : "USD",
                junior: { min: 30000, max: 60000 },
                mid: { min: 65000, max: 100000 },
                senior: { min: 105000, max: 180000 }
            },
            skills_required: skills,
            skill_gap_analysis: [],
            high_impact_skill_upgrades: [],
            five_year_outlook: {
                overall_trend: "Positive",
                summary: "Technology is evolving.",
                emerging_areas: emerging
            },
            action_plan_30_days: ["Review core concepts", "Build a small project"],
            action_plan_6_months: ["Master advanced topics", "Contribute to open source"],
            suggested_job_titles: [requestedRole, "Senior " + requestedRole],
            custom_search_insights: {
                enabled: true,
                role_name: requestedRole,
                country: requestedCountry,
                summary: "Mock summary.",
                demand_level: "high",
                salary_comment: "Competitive.",
                top_skills: skills
            }
        };

        res.status(200).json({ success: true, data: mockData });
    }
};
