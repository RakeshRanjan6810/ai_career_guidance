const ResourcePlan = require('../models/ResourcePlan');

// @desc    Save a generated resource plan
// @route   POST /api/resources
// @access  Private
exports.saveResourcePlan = async (req, res) => {
    try {
        const { topic, level, duration, weeks } = req.body;

        const plan = await ResourcePlan.create({
            user: req.user.id,
            topic,
            level,
            duration,
            weeks
        });

        res.status(201).json({ success: true, data: plan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get user's saved resource plans
// @route   GET /api/resources
// @access  Private
exports.getSavedResourcePlans = async (req, res) => {
    try {
        const plans = await ResourcePlan.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a saved resource plan
// @route   DELETE /api/resources/:id
// @access  Private
exports.deleteResourcePlan = async (req, res) => {
    try {
        const plan = await ResourcePlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        // Make sure user owns plan
        if (plan.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await plan.deleteOne();

        res.json({ success: true, data: {} });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
