const express = require('express');
const router = express.Router();
const { getCourses, createCourse, getCourse, updateCourse, deleteCourse, startCourse } = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getCourses)
    .post(protect, authorize('instructor', 'admin'), createCourse);

router.route('/:id')
    .get(getCourse)
    .put(protect, authorize('instructor', 'admin'), updateCourse)
    .delete(protect, authorize('instructor', 'admin'), deleteCourse);

router.post('/:id/start', protect, startCourse);

module.exports = router;
