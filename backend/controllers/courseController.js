const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');

// @desc    Get all courses (with optional search)
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
    try {
        const keyword = req.query.keyword
            ? {
                $or: [
                    { title: { $regex: req.query.keyword, $options: 'i' } },
                    { description: { $regex: req.query.keyword, $options: 'i' } },
                    { tags: { $regex: req.query.keyword, $options: 'i' } }
                ]
            }
            : {};

        if (req.query.instructor) {
            keyword.instructor = req.query.instructor;
        }

        const courses = await Course.find({ ...keyword }).populate('instructor', 'name email');

        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
exports.createCourse = async (req, res) => {
    try {
        // Add user to req.body
        req.body.instructor = req.user.id;

        // Check for role
        if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to create courses' });
        }

        const course = await Course.create(req.body);

        res.status(201).json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor', 'name');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private
exports.updateCourse = async (req, res) => {
    try {
        let course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Make sure user is course owner
        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to update course' });
        }

        course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Make sure user is course owner
        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to delete course' });
        }

        await course.deleteOne();

        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Start/Enroll in a course
// @route   POST /api/courses/:id/start
// @access  Private
exports.startCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if already started
        let progress = await UserProgress.findOne({ user: userId, course: courseId });

        if (progress) {
            return res.json({ success: true, message: 'Course already started', data: progress });
        }

        // Create new progress record
        progress = await UserProgress.create({
            user: userId,
            course: courseId,
            status: 'in-progress',
            progress: 0,
            studyHours: 0,
            lastAccessed: Date.now()
        });

        res.status(201).json({ success: true, data: progress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
