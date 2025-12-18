const User = require('../models/User');

// @desc    Get all students
// @route   GET /api/auth/students
// @access  Private (Instructor/Admin)
exports.getStudents = async (req, res) => {
    try {
        // Only fetch students assigned to THIS instructor
        const students = await User.find({
            role: 'student',
            assignedInstructor: req.user.id
        }).select('-password');

        res.json({ success: true, count: students.length, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a student profile (Instructor only)
// @route   PUT /api/auth/student/:id
// @access  Private (Instructor)
exports.updateStudentProfile = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check if student belongs to this instructor
        if (student.assignedInstructor && student.assignedInstructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this student' });
        }

        // Allow instructor to update specific career-related fields
        if (req.body.targetCareer) student.targetCareer = req.body.targetCareer;
        if (req.body.skills) student.skills = req.body.skills;
        if (req.body.interests) student.interests = req.body.interests;

        // Maybe allow fixing basic info if needed
        if (req.body.education) student.education = req.body.education;
        if (req.body.location) student.location = req.body.location;

        const updatedStudent = await student.save();

        res.json({
            success: true,
            data: updatedStudent
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a student (Instructor only)
// @route   DELETE /api/auth/student/:id
// @access  Private (Instructor)
exports.deleteStudent = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check ownership
        if (student.assignedInstructor && student.assignedInstructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this student' });
        }

        await student.deleteOne();
        res.json({ success: true, message: 'Student removed successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
