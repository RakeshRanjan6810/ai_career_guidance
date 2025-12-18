const User = require('../models/User');
const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');

// @desc    Get Student Dashboard Data
// @route   GET /api/dashboard
// @access  Private
// @desc    Get Student Dashboard Data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate('assignedInstructor');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 1. Calculate Weekly Progress & Study Hours
        const progressDocs = await UserProgress.find({ user: userId });
        let totalProgress = 0;
        let totalStudyHours = 0;

        progressDocs.forEach(doc => {
            totalProgress += doc.progress;
            totalStudyHours += doc.studyHours;
        });

        const weeklyProgress = progressDocs.length > 0 ? Math.round(totalProgress / progressDocs.length) : 0;

        // 2. Skills Acquired
        const skillsAcquired = user.skills.length;

        // 3. Peer Rank
        let peerRank = '';
        if (user.assignedInstructor) {
            const peers = await User.find({ assignedInstructor: user.assignedInstructor._id }).select('skills');
            // Ranking logic: simplest is count of skills
            const rankedPeers = peers.map(p => ({ id: p._id, skillCount: p.skills.length }))
                .sort((a, b) => b.skillCount - a.skillCount);

            const myRankIndex = rankedPeers.findIndex(p => p.id.toString() === userId.toString());
            peerRank = `#${myRankIndex + 1}`;
        }

        // 4. Recent Activity
        const recentActivity = user.activityLogs
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        // 5. Skill Gap Analysis & Radar Data
        const commonTechSkills = ['React', 'Node.js', 'Python', 'Data Structures', 'Git', 'API Design'];
        const userSkillsLower = user.skills.map(s => s.toLowerCase());
        const skillGap = commonTechSkills.filter(skill => !userSkillsLower.includes(skill.toLowerCase()));

        // Radar Logic: Synthetic Mapping
        const radarCategories = [
            { subject: 'Technical', skills: ['react', 'node', 'python', 'java', 'sql'] },
            { subject: 'Communication', skills: ['writing', 'speaking', 'presentation'] },
            { subject: 'Leadership', skills: ['management', 'mentoring', 'agile'] },
            { subject: 'Problem Solving', skills: ['algorithms', 'patterns', 'debugging'] },
            { subject: 'Creativity', skills: ['design', 'ui/ux', 'art'] }
        ];

        const skillRadarData = radarCategories.map(cat => {
            // Count how many keywords from this category satisfy a "match" in user skills (fuzzy match)
            // For now, simple: if user has any skill containing key chars
            // Base score: 30. +20 for each match. capped at 120.
            let score = 40;
            cat.skills.forEach(k => {
                if (userSkillsLower.some(us => us.includes(k))) score += 20;
            });
            if (score > 120) score = 120;

            return {
                subject: cat.subject,
                A: score,     // Current
                B: 100,       // Target (fixed baseline)
                fullMark: 150
            };
        });

        // 6. Continue Learning (Get most recently accessed active course)
        let continueLearning = null;
        if (progressDocs.length > 0) {
            const lastActive = progressDocs.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))[0];
            const courseDetails = await Course.findById(lastActive.course);
            if (courseDetails) {
                continueLearning = {
                    title: courseDetails.title,
                    progress: lastActive.progress,
                    id: courseDetails._id
                };
            }
        }

        // 7. Study Group
        let studyGroup = [];
        if (user.assignedInstructor) {
            studyGroup = await User.find({
                assignedInstructor: user.assignedInstructor._id,
                _id: { $ne: userId } // Exclude self
            }).select('name email role');
        }

        res.json({
            success: true,
            data: {
                metrics: {
                    weeklyProgress,
                    studyHours: Math.round(totalStudyHours), // Round to integer
                    skillsAcquired,
                    peerRank
                },
                recentActivity,
                skillGap: skillGap.slice(0, 5), // Top 5 missing skills
                skillRadarData, // New field
                continueLearning,
                studyGroup,
                assignedMentor: user.assignedInstructor // Added: Mentor Info
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get User Learning Plan
exports.getLearningPlan = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('learningPlan');
        if (!user || !user.learningPlan || !user.learningPlan.weeks || user.learningPlan.weeks.length === 0) {
            return res.json({ success: false, message: 'No plan found' });
        }
        res.json({ success: true, data: user.learningPlan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Save User Learning Plan
exports.saveLearningPlan = async (req, res) => {
    try {
        const { plan_summary, personalization_reason, weeks, track_id, total_weeks } = req.body;

        // Map incoming AI format to Schema format (if slightly different)
        // AI: weeks: [{ week_number, title, goal, estimated_hours, topics: [{title, type, estimated_hours}] }]
        // Schema: camelCase preferred usually, but we defined schema to match mostly.

        const mappedWeeks = weeks.map(w => ({
            weekNumber: w.week_number,
            title: w.title,
            goal: w.goal,
            estimatedHours: w.estimated_hours,
            status: w.week_number === 1 ? 'in-progress' : 'locked',
            skillsGained: w.skills_gained || [],
            resumeBullet: w.resume_bullet || '',
            topics: w.topics.map(t => ({
                title: t.title,
                type: t.type,
                estimatedHours: t.estimated_hours,
                status: 'pending'
            })),
            assessment: w.assessment ? {
                type: w.assessment.type,
                goal: w.assessment.goal,
                unlockCondition: w.assessment.unlock_condition
            } : null
        }));

        const update = {
            learningPlan: {
                trackId: track_id,
                summary: plan_summary,
                personalizationReason: personalization_reason,
                totalWeeks: total_weeks,
                weeks: mappedWeeks
            }
        };

        const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
        res.json({ success: true, data: user.learningPlan });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update Topic Status
exports.updateTopicStatus = async (req, res) => {
    try {
        const { weekNumber, topicIndex, status } = req.body; // weekNumber 1-based, topicIndex 0-based
        console.log(`UpdateTopicStatus Request: Week ${weekNumber}, Topic ${topicIndex}, Status ${status}`);

        const user = await User.findById(req.user._id);

        if (!user.learningPlan || !user.learningPlan.weeks) {
            console.log('No learning plan found for user');
            return res.status(404).json({ success: false, message: 'No plan found' });
        }

        const week = user.learningPlan.weeks.find(w => w.weekNumber === parseInt(weekNumber));
        if (!week) {
            console.log(`Week ${weekNumber} not found in plan`);
            return res.status(404).json({ message: 'Week not found' });
        }

        console.log(`Found week: ${week.title}`);

        if (week.topics[topicIndex]) {
            week.topics[topicIndex].status = status;

            // Check if all topics completed -> complete week
            const allCompleted = week.topics.every(t => t.status === 'completed');
            if (allCompleted) {
                week.status = 'completed';
                // Unlock next week
                const nextWeek = user.learningPlan.weeks.find(w => w.weekNumber === parseInt(weekNumber) + 1);
                if (nextWeek) nextWeek.status = 'in-progress';
            } else if (status === 'in-progress' && week.status !== 'in-progress') {
                week.status = 'in-progress';
            }
        }

        await user.save();
        res.json({ success: true, data: user.learningPlan });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete User Learning Plan
exports.deleteLearningPlan = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Reset learning plan
        user.learningPlan = undefined;

        await user.save();

        res.json({ success: true, message: 'Learning Plan deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
