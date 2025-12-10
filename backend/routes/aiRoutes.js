const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const { getAIRecommendations, chatWithAI, generateProjectDescription, generateCourseDetails, generateLearningPlan, analyzeResume, generatePortfolioSummary, generateResourcePlan, generateCareerMarketAnalysis } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/test', (req, res) => res.send('AI Routes Working'));
router.post('/recommendations', protect, getAIRecommendations);
router.post('/plan', protect, generateLearningPlan);
router.post('/chat', protect, chatWithAI);
router.post('/project-desc', protect, generateProjectDescription);
router.post('/course-desc', protect, generateCourseDetails);


router.post('/resource-plan', protect, generateResourcePlan);
router.post('/market-analysis', protect, generateCareerMarketAnalysis);

router.post('/resume-review', protect, upload.single('resume'), analyzeResume);
router.post('/portfolio-summary', protect, generatePortfolioSummary);

module.exports = router;
