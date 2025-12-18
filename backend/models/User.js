const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        unique: true
    },
    phone: {
        type: String,
        default: ''
    },
    education: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['student', 'instructor', 'admin'],
        default: 'student'
    },
    // bio: {
    //     type: String,
    //     default: ''
    // },
    // location: {
    //     type: String,
    //     default: ''
    // },
    targetCareer: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },
    interests: {
        type: [String],
        default: []
    },
    skills: {
        type: [String],
        default: []
    },
    assignedInstructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    experience: [{
        role: String,
        company: String,
        period: String,
        description: String
    }],
    learningPlan: {
        trackId: String,
        summary: String,
        personalizationReason: String,
        totalWeeks: Number,
        weeks: [{
            weekNumber: Number,
            title: String,
            goal: String,
            estimatedHours: Number,
            status: { type: String, default: 'locked' }, // locked, in-progress, completed
            skillsGained: [String],
            resumeBullet: String,
            topics: [{
                title: String,
                type: { type: String }, // theory, practical, video
                estimatedHours: Number,
                status: { type: String, default: 'pending' } // pending, in-progress, completed
            }],
            assessment: {
                type: { type: String },
                goal: String,
                unlockCondition: String
            }
        }]
    },
    bookmarks: [{
        resourceId: String,
        title: String,
        type: String,
        link: String
    }],
    activityLogs: [{
        action: String,
        date: { type: Date, default: Date.now }
    }],
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
