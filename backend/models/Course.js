const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a course title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: {
        type: [String], // e.g., ['dsa', 'algorithm', 'python']
        index: true
    },
    resources: [{
        title: String,
        type: {
            type: String,
            enum: ['video', 'pdf', 'link'],
            default: 'video'
        },
        url: String
    }],
    thumbnail: {
        type: String,
        default: 'https://via.placeholder.com/300'
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for search
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Course', courseSchema);
