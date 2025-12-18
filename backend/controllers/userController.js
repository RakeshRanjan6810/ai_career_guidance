const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const formatUser = require('../utils/formatUser');

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('assignedInstructor', 'name email bio profilePicture education location');

        if (user) {
            res.json({
                success: true,
                user: formatUser(user)
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const cloudinary = require('../utils/cloudinary');

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

            // Handle Profile Picture Upload
            if (req.body.profilePicture && req.body.profilePicture.startsWith('data:image')) {
                try {
                    const uploadResponse = await cloudinary.uploader.upload(req.body.profilePicture, {
                        folder: 'ai_career_coach/profiles',
                        public_id: `user_${user._id}`,
                        overwrite: true,
                        transformation: [{ width: 500, height: 500, crop: 'limit' }]
                    });
                    user.profilePicture = uploadResponse.secure_url;
                } catch (uploadError) {
                    console.error("Cloudinary Upload Error:", uploadError);
                    // Don't fail the whole request, just keep old image or failing silently? 
                    // Better to warn but maybe user.profilePicture remains unchanged if upload fails.
                }
            } else if (req.body.profilePicture) {
                // If it's just a URL (not base64), or empty, update it directly
                user.profilePicture = req.body.profilePicture;
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                success: true,
                token: generateToken(updatedUser._id),
                user: formatUser(updatedUser)
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
