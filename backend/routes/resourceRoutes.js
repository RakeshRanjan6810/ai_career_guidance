const express = require('express');
const router = express.Router();
const { saveResourcePlan, getSavedResourcePlans, deleteResourcePlan } = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, saveResourcePlan);
router.get('/', protect, getSavedResourcePlans);
router.delete('/:id', protect, deleteResourcePlan);

module.exports = router;
