const express = require('express');
const router = express.Router();
const { 
    getMessages, 
    sendMessage, 
    deleteMessage, 
    getConversations,
    handleSocketEvents 
} = require('../controller/message_controller');
const { authenticateToken } = require('../midware/authMiddleware');

module.exports = (io) => {
    // Set up socket event handlers
    io.on('connection', (socket) => {
        console.log('User connected to socket:', socket.id);
        handleSocketEvents(io, socket);
    });

    // Apply authentication middleware
    router.use(authenticateToken);

    // Routes
    router.get('/conversations', getConversations);
    router.get('/:sender_id/:receiver_id', getMessages);
    router.post('/', (req, res) => sendMessage(req, res, io));
    router.delete('/:messageId', deleteMessage);

    return router;
};