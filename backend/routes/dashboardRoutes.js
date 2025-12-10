const express = require('express');
const router = express.Router();
const { getDashboardData, getLearningPlan, saveLearningPlan, deleteLearningPlan, updateTopicStatus } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDashboardData);

// Learning Plan Routes
router.get('/plan', protect, getLearningPlan);
router.post('/plan', protect, saveLearningPlan);
router.delete('/plan', protect, deleteLearningPlan);
router.put('/plan/topic', protect, updateTopicStatus);

module.exports = router;
