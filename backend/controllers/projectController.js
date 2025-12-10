const Project = require('../models/Project');

// @desc    Get all projects (supports query by type)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const { type, assignedTo } = req.query;
        let query = {};

        if (assignedTo === 'me') {
            // Fetch assignments assigned TO the current user
            query = { assignedTo: req.user.id };
        } else if (type === 'assignment') {
            // Fetch projects created by instructors (assignments)
            query = { type: 'assignment' };
        } else {
            // Fetch projects for the logged in user (portfolio)
            // Should we show assignments here? No, 'portfolio' is user's work.
            query = { user: req.user.id, type: { $ne: 'assignment' } };
        }

        // Allow fetching all if needed or specific filtering
        const projects = await Project.find(query).populate('user', 'name role').populate('assignedTo', 'name');
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const fs = require('fs');
const path = require('path');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    const logPath = path.join(__dirname, '../backend_debug.log');
    const log = (msg) => fs.appendFileSync(logPath, new Date().toISOString() + ': ' + msg + '\n');

    log("Create Project Request Received");
    log("Body: " + JSON.stringify(req.body));
    log("User: " + JSON.stringify(req.user));

    const { title, description, tags, image, link, difficulty, type, aiDescription, assignedTo } = req.body;

    try {
        const newProject = new Project({
            user: req.user.id,
            title,
            description,
            tags,
            image,
            link,
            difficulty,
            type,
            aiDescription,
            assignedTo: assignedTo || null
        });

        const project = await newProject.save();
        log("Project Saved Successfully: " + project._id);

        res.json(project);
    } catch (err) {
        log("Create Project Error: " + err.message);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
    const { title, description, tags, image, link } = req.body;

    // Build project object
    const projectFields = {};
    if (title) projectFields.title = title;
    if (description) projectFields.description = description;
    if (tags) projectFields.tags = tags;
    if (image) projectFields.image = image;
    if (link) projectFields.link = link;

    try {
        let project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Make sure user owns project
        if (project.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: projectFields },
            { new: true }
        );

        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Make sure user owns project
        if (project.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Project.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Project removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const Notification = require('../models/Notification');

// @desc    Update project status (Started, In-Progress, Completed)
// @route   PUT /api/projects/:id/status
// @access  Private
const updateProjectStatus = async (req, res) => {
    const { status } = req.body; // 'started', 'in-progress', 'completed'

    try {
        let project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Ensure the current user is the ASSIGNEE (the student doing the work)
        // or the creator (if they are updating their own self-assigned work)
        // Note: assignedTo might be null in old implementation, but we set it now.
        // Fallback: if assignedTo is set, check it. If not, check user.
        const isAssignee = project.assignedTo && project.assignedTo.toString() === req.user.id;
        const isCreator = project.user.toString() === req.user.id;

        if (!isAssignee && !isCreator) {
            return res.status(401).json({ msg: 'Not authorized to update status of this project' });
        }

        project.status = status;

        if (status === 'started' && !project.startedAt) {
            project.startedAt = Date.now();
        }
        if (status === 'completed') {
            project.completedAt = Date.now();
        }

        await project.save();

        // NOTIFICATION LOGIC
        // Notify the creator (Teacher) if the current user (Student) is NOT the creator
        if (!isCreator && project.user) {
            const senderName = req.user.name || 'Student';
            let message = '';

            if (status === 'started') message = `${senderName} has started the project "${project.title}".`;
            if (status === 'in-progress') message = `${senderName} is actively working on "${project.title}".`;
            if (status === 'completed') message = `${senderName} has COMPLETED the project "${project.title}"!`;

            if (message) {
                await Notification.create({
                    recipient: project.user, // The teacher/creator
                    sender: req.user.id,
                    message: message,
                    subject: `Project Update: ${project.title}`,
                    type: status === 'completed' ? 'success' : 'info'
                });
            }
        }

        res.json(project);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus
};
