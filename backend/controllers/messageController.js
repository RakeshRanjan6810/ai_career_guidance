const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user._id;

        const message = await Message.create({
            sender: senderId,
            recipient: recipientId,
            content
        });

        // Optional: Send socket notification here if implemented

        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get conversation with specific user
// @route   GET /api/messages/:userId
// @access  Private
exports.getConversation = async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'name profilePicture')
            .populate('recipient', 'name profilePicture');

        res.json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get recent conversations (Inbox)
// @route   GET /api/messages/inbox
// @access  Private
exports.getInbox = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find recent messages where user is sender or recipient
        // distinct recipients/senders. 
        // Simple approach: Find distinct conversation partners
        // This is complex in Mongo without aggregation.
        // For now, simpler: user wants chat with MENTOR. So usually just 1 conversation.
        // But let's build generic using aggregation.

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { recipient: userId }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", userId] },
                            "$recipient",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'partner'
                }
            },
            {
                $unwind: '$partner'
            },
            {
                $project: {
                    partnerId: '$_id',
                    partnerName: '$partner.name',
                    partnerAvatar: '$partner.profilePicture',
                    lastMessage: '$lastMessage.content',
                    timestamp: '$lastMessage.createdAt',
                    read: '$lastMessage.read'
                }
            }
        ]);

        res.json({ success: true, data: conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
