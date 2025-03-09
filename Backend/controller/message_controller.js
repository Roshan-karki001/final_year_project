const { Message } = require('../models/alldatabase');

// Get all messages between two users
const getMessages = async (req, res) => {
    try {
        const { sender_id, receiver_id } = req.params;
        const messages = await Message.find({
            $or: [
                { sender_id, receiver_id },
                { sender_id: receiver_id, receiver_id: sender_id }
            ]
        }).sort({ timestamp: 1 });
        
        res.status(200).json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Send a new message
const sendMessage = async (req, res) => {
    try {
        const { receiver_id, content } = req.body;
        const sender_id = req.user.id; // Assuming you have authentication middleware

        const newMessage = await Message.create({
            sender_id,
            receiver_id,
            content
        });

        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully', 
            data: newMessage 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete a message
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id; // Assuming you have authentication middleware

        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ 
                success: false, 
                message: 'Message not found' 
            });
        }

        // Check if the user is the sender of the message
        if (message.sender_id.toString() !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this message' 
            });
        }

        await Message.findByIdAndDelete(messageId);
        res.status(200).json({ 
            success: true, 
            message: 'Message deleted successfully' 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get recent conversations
const getConversations = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have authentication middleware

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender_id: userId },
                        { receiver_id: userId }
                    ]
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender_id', userId] },
                            '$receiver_id',
                            '$sender_id'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' }
                }
            },
            {
                $lookup: {
                    from: 'signups',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            }
        ]);

        res.status(200).json({ success: true, conversations });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    getMessages,
    sendMessage,
    deleteMessage,
    getConversations
};