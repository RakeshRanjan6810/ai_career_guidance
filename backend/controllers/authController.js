const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const generateToken = require('../utils/generateToken');
const formatUser = require('../utils/formatUser');

// --- Helper Functions ---

// 1. Find Available Instructor (with < 15 students)
const findAvailableInstructor = async () => {
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
        { $addFields: { studentCount: { $size: '$students' } } },
        { $match: { studentCount: { $lt: 15 } } },
        { $sort: { createdAt: 1 } },
        { $limit: 1 }
    ]);
    return availableInstructor.length > 0 ? availableInstructor[0]._id : null;
};

// 2. Assign unassigned students to new Instructor
const assignStudentsToNewInstructor = async (instructorId, instructorName) => {
    const unassignedStudents = await User.find({
        role: 'student',
        $or: [{ assignedInstructor: null }, { assignedInstructor: { $exists: false } }]
    }).limit(15);

    if (unassignedStudents.length > 0) {
        const studentIds = unassignedStudents.map(s => s._id);
        await User.updateMany(
            { _id: { $in: studentIds } },
            { $set: { assignedInstructor: instructorId } }
        );
        console.log(`Assigned ${studentIds.length} students to new instructor ${instructorName}`);
    }
};

// --- End Helpers ---

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        console.log('--');
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
            assignedInstructor = await findAvailableInstructor();
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
            await assignStudentsToNewInstructor(user._id, user.name);
        }

        if (user) {
            res.status(201).json({
                success: true,
                token: generateToken(user._id),
                user: formatUser(user)
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
                user: formatUser(user)
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
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
                user: formatUser(user)
            });
        } else {
            // User doesn't exist, create new account
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            // Assign Instructor Logic for Google Login too
            let assignedInstructor = null;
            if (!role || role === 'student') {
                assignedInstructor = await findAvailableInstructor();
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
                await assignStudentsToNewInstructor(user._id, user.name);
            }

            if (user) {
                res.status(201).json({
                    success: true,
                    token: generateToken(user._id),
                    user: formatUser(user)
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
