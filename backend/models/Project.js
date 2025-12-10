const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    image: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: ''
    },
    difficulty: {
        type: String,
        enum: ['Basic', 'Intermediate', 'High'],
        default: 'Basic'
    },
    type: {
        type: String,
        enum: ['submission', 'assignment'], // 'submission' = student work, 'assignment' = instructor idea
        default: 'submission'
    },
    aiDescription: {
        type: String, // AI enhanced description
        default: ''
    },
    status: {
        type: String,
        enum: ['assigned', 'started', 'in-progress', 'completed'],
        default: 'assigned'
    },
    startedAt: { type: Date },
    completedAt: { type: Date },

    problemStatement: { type: String, default: '' },
    keySkills: { type: [String], default: [] },
    deliverables: { type: [String], default: [] },
    evaluationCriteria: { type: [String], default: [] },
    estimatedDuration: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
