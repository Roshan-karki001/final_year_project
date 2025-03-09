const express = require('express');
const {
    getMessages,
    sendMessage,
    deleteMessage,
    getConversations
} = require('../controller/message_controller');
const { authenticateToken } = require('../middleware/auth'); // Assuming you have auth middleware

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all conversations of the logged-in user
router.get('/conversations', getConversations);

// Get messages between two users
router.get('/:sender_id/:receiver_id', getMessages);

// Send a new message
router.post('/send', sendMessage);

// Delete a message
router.delete('/:messageId', deleteMessage);

module.exports = router;