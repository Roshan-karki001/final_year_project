const { Message, Signup } = require('../models/alldatabase');

// Track active users
let activeUsers = new Map(); // stores socket.id -> user_id mapping

const getMessages = async (req, res) => {
    try {
        const { sender_id, receiver_id } = req.params;
        const messages = await Message.find({
            $or: [
                { sender_id, receiver_id },
                { sender_id: receiver_id, receiver_id: sender_id }
            ]
        })
        .sort({ timestamp: 1 })
        .populate('sender_id', 'F_name L_name')
        .populate('receiver_id', 'F_name L_name');

        res.status(200).json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const sendMessage = async (req, res, io) => {
    try {
        const { receiver_id, content } = req.body;
        const sender_id = req.user.id;

        // Create new message
        const newMessage = await Message.create({
            sender_id,
            receiver_id,
            content,
            timestamp: new Date()
        });

        // Populate user details
        await newMessage.populate('sender_id', 'F_name L_name');
        await newMessage.populate('receiver_id', 'F_name L_name');

        // Get receiver's socket if they're online
        const receiverSocket = Array.from(activeUsers.entries())
            .find(([_, userId]) => userId === receiver_id)?.[0];

        if (receiverSocket) {
            io.to(receiverSocket).emit('newMessage', {
                message: newMessage,
                sender_id,
                receiver_id
            });
        }

        // Emit typing stopped
        io.emit('stopTyping', { sender_id });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: newMessage
        });
    } catch (err) {
        console.log('Socket error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Socket event handlers
const handleSocketEvents = (io, socket) => {
    // User connects
    socket.on('userConnected', (userId) => {
        activeUsers.set(socket.id, userId);
        io.emit('userOnline', { userId });
    });

    // User typing
    socket.on('typing', ({ sender_id, receiver_id }) => {
        const receiverSocket = Array.from(activeUsers.entries())
            .find(([_, userId]) => userId === receiver_id)?.[0];
        
        if (receiverSocket) {
            io.to(receiverSocket).emit('userTyping', { sender_id });
        }
    });

    // User stops typing
    socket.on('stopTyping', ({ sender_id, receiver_id }) => {
        const receiverSocket = Array.from(activeUsers.entries())
            .find(([_, userId]) => userId === receiver_id)?.[0];
        
        if (receiverSocket) {
            io.to(receiverSocket).emit('userStoppedTyping', { sender_id });
        }
    });

    // User disconnects
    socket.on('disconnect', () => {
        const userId = activeUsers.get(socket.id);
        if (userId) {
            activeUsers.delete(socket.id);
            io.emit('userOffline', { userId });
        }
    });
};

const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

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

const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

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
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender_id', userId] },
                            '$receiver_id',
                            '$sender_id'
                        ]
                    }
                }
            }
        ]);

        const conversationPartnerIds = conversations.map(conv => conv._id);
        res.status(200).json({ 
            success: true, 
            conversationPartners: conversationPartnerIds 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    getMessages,
    sendMessage,
    deleteMessage,
    getConversations,
    handleSocketEvents
};
