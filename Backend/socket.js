const socket = io('http://localhost:5000');

// Inform server when user connects
socket.emit('userConnected', currentUserId);

// Listen for new messages
socket.on('newMessage', (data) => {
    console.log('New message received:', data);
});

// Listen for typing indicators
socket.on('userTyping', (data) => {
    console.log(`User ${data.sender_id} is typing...`);
});

// Emit typing event
socket.emit('typing', {
    sender_id: currentUserId,
    receiver_id: targetUserId
});

// Listen for online/offline status
socket.on('userOnline', (data) => {
    console.log(`User ${data.userId} is online`);
});

socket.on('userOffline', (data) => {
    console.log(`User ${data.userId} went offline`);
});