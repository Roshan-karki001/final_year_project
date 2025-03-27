const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

let activeUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('userConnected', (userId) => {
        activeUsers.set(socket.id, userId);
        io.emit('userOnline', { userId });
    });

    socket.on('sendMessage', async (data) => {
        const receiverSocket = [...activeUsers.entries()].find(([_, userId]) => userId === data.receiver_id)?.[0];
        if (receiverSocket) {
            io.to(receiverSocket).emit('newMessage', data);
        }
    });

    socket.on('typing', (data) => {
        const receiverSocket = [...activeUsers.entries()].find(([_, userId]) => userId === data.receiver_id)?.[0];
        if (receiverSocket) {
            io.to(receiverSocket).emit('userTyping', { sender_id: data.sender_id });
        }
    });

    socket.on('disconnect', () => {
        const userId = activeUsers.get(socket.id);
        if (userId) {
            activeUsers.delete(socket.id);
            io.emit('userOffline', { userId });
        }
    });
});

module.exports = io;