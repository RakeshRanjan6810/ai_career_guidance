const express = require('express');
const router = express.Router();
const { getNotifications, sendNotification, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.post('/', protect, sendNotification);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
