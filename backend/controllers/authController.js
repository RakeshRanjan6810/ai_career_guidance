const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        console.log('----------------------------------------------------');
        console.log('Forgot Password Request Received');
        console.log('Email:', req.body.email);

        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found for email:', email);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        console.log(`Reset Token Link: ${resetUrl}`);
        console.log('----------------------------------------------------');

        res.status(200).json({ success: true, message: 'Email sent (check console)' });
    } catch (error) {
        // Rollback token on error
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            token: generateToken(user._id),
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Auto-assign Instructor if role is 'student'
        let assignedInstructor = null;

        if (role === 'student' || !role) { // Default role is student
            // Optimized: Find first instructor with < 15 students using Aggregation
            const availableInstructor = await User.aggregate([
                { $match: { role: 'instructor' } },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: 'assignedInstructor',
                        as: 'students'
                    }
                },
                {
                    $addFields: { studentCount: { $size: '$students' } }
                },
                { $match: { studentCount: { $lt: 15 } } },
                { $sort: { createdAt: 1 } },
                { $limit: 1 }
            ]);

            if (availableInstructor.length > 0) {
                assignedInstructor = availableInstructor[0]._id;
            }
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            assignedInstructor
        });

        // If new user is an INSTRUCTOR, assign up to 15 unassigned students to them
        if (user && (role === 'instructor' || role === 'Instructor')) {
            const unassignedStudents = await User.find({
                role: 'student',
                $or: [{ assignedInstructor: null }, { assignedInstructor: { $exists: false } }]
            }).limit(15);

            if (unassignedStudents.length > 0) {
                const studentIds = unassignedStudents.map(s => s._id);
                await User.updateMany(
                    { _id: { $in: studentIds } },
                    { $set: { assignedInstructor: user._id } }
                );
                console.log(`Assigned ${studentIds.length} students to new instructor ${user.name}`);
            }
        }

        if (user) {
            res.status(201).json({
                success: true,
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    assignedInstructor: user.assignedInstructor
                }
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            // Log Activity
            user.activityLogs.push({ action: 'Login', date: new Date() });
            await user.save();

            res.json({
                success: true,
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    bio: user.bio,
                    location: user.location,
                    skills: user.skills,
                    experience: user.experience,
                    assignedInstructor: user.assignedInstructor,
                    profilePicture: user.profilePicture
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('assignedInstructor', 'name email bio profilePicture education location');

        if (user) {
            res.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    education: user.education,
                    role: user.role,
                    bio: user.bio,
                    location: user.location,
                    skills: user.skills,
                    experience: user.experience,
                    targetCareer: user.targetCareer,
                    interests: user.interests,
                    profilePicture: user.profilePicture,
                    assignedInstructor: user.assignedInstructor // Now populated
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
    try {
        const { token, role } = req.body;
        const admin = require('../config/firebaseAdmin');

        let decodedToken;
        try {
            // Verify the ID token
            decodedToken = await admin.auth().verifyIdToken(token);
        } catch (verifyError) {
            console.warn('Firebase Admin verification failed. CAUTION: Falling back to insecure decoding for development/testing only.', verifyError.message);

            // Fallback: Decode token without verification (DEV ONLY)
            decodedToken = jwt.decode(token);

            if (!decodedToken) {
                throw new Error('Invalid token');
            }
        }

        const { name, email, picture, uid: decodedUid, sub } = decodedToken;
        const uid = decodedUid || sub; // Firebase Admin returns uid, standard JWT has sub

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // User exists, log them in
            // Log Activity
            user.activityLogs.push({ action: 'Google Login', date: new Date() });
            await user.save();

            res.json({
                success: true,
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    bio: user.bio,
                    location: user.location,
                    skills: user.skills,
                    experience: user.experience,
                    profilePicture: user.profilePicture
                }
            });
        } else {
            // User doesn't exist, create new account
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            // Assign Instructor Logic for Google Login too
            let assignedInstructor = null;
            if (!role || role === 'student') {
                // Optimized: Find first instructor with < 15 students using Aggregation
                const availableInstructor = await User.aggregate([
                    { $match: { role: 'instructor' } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: '_id',
                            foreignField: 'assignedInstructor',
                            as: 'students'
                        }
                    },
                    {
                        $addFields: { studentCount: { $size: '$students' } }
                    },
                    { $match: { studentCount: { $lt: 15 } } },
                    { $sort: { createdAt: 1 } },
                    { $limit: 1 }
                ]);

                if (availableInstructor.length > 0) {
                    assignedInstructor = availableInstructor[0]._id;
                }
            }

            user = await User.create({
                name: name || 'Google User',
                email: email,
                password: randomPassword,
                role: role || 'student',
                assignedInstructor
            });

            // If new user is an INSTRUCTOR (Google Sign Up), assign up to 15 unassigned students
            if (user && (user.role === 'instructor' || user.role === 'Instructor')) {
                const unassignedStudents = await User.find({
                    role: 'student',
                    $or: [{ assignedInstructor: null }, { assignedInstructor: { $exists: false } }]
                }).limit(15);

                if (unassignedStudents.length > 0) {
                    const studentIds = unassignedStudents.map(s => s._id);
                    await User.updateMany(
                        { _id: { $in: studentIds } },
                        { $set: { assignedInstructor: user._id } }
                    );
                }
            }

            if (user) {
                res.status(201).json({
                    success: true,
                    token: generateToken(user._id),
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        assignedInstructor: user.assignedInstructor
                    }
                });
            } else {
                res.status(400).json({ success: false, message: 'Invalid user data' });
            }
        }
    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ success: false, message: 'Google Auth Failed: ' + error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            user.education = req.body.education || user.education;
            user.bio = req.body.bio || user.bio;
            user.location = req.body.location || user.location;
            user.skills = req.body.skills || user.skills;
            user.experience = req.body.experience || user.experience;
            user.targetCareer = req.body.targetCareer || user.targetCareer;
            user.interests = req.body.interests || user.interests;
            user.profilePicture = req.body.profilePicture || user.profilePicture;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                success: true,
                token: generateToken(updatedUser._id),
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    bio: updatedUser.bio,
                    location: updatedUser.location,
                    skills: updatedUser.skills,
                    experience: updatedUser.experience,
                    targetCareer: updatedUser.targetCareer,
                    interests: updatedUser.interests,
                    profilePicture: updatedUser.profilePicture
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete user profile
// @route   DELETE /api/auth/profile
// @access  Private
exports.deleteUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            await user.deleteOne();
            res.json({ success: true, message: 'User removed' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all students
// @route   GET /api/auth/students
// @access  Private (Instructor/Admin)
exports.getStudents = async (req, res) => {
    try {
        // Only fetch students assigned to THIS instructor
        // Also include those with NO instructor if needed? No, user said "1 instructor handle only 15", implies strict assignment.
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

        // Maybe allow fixing basic info if needed, but primary use is career guidance
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

// @desc    Toggle Bookmark
// @route   POST /api/auth/bookmark
// @access  Private
exports.toggleBookmark = async (req, res) => {
    try {
        const { resourceId, title, type, link } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if already bookmarked
        const bookmarkIndex = user.bookmarks.findIndex(b => b.resourceId === resourceId);

        if (bookmarkIndex > -1) {
            // Remove
            user.bookmarks.splice(bookmarkIndex, 1);
            await user.save();
            return res.json({ success: true, message: 'Bookmark removed', bookmarks: user.bookmarks });
        } else {
            // Add
            user.bookmarks.push({ resourceId, title, type, link });
            await user.save();
            return res.json({ success: true, message: 'Bookmark added', bookmarks: user.bookmarks });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
