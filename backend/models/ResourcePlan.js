const mongoose = require('mongoose');

const resourcePlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: true
    },
    duration: {
        type: String, // e.g., "4 weeks"
        required: true
    },
    weeks: [{
        weekNumber: Number,
        title: String,
        resources: [{
            title: String,
            url: String,
            type: {
                type: String,
                enum: ['video', 'article', 'course', 'documentation', 'tool'],
                default: 'article'
            }
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ResourcePlan', resourcePlanSchema);
