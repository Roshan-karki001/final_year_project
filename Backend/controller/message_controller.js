// controllers/message_controller.js
const { Message, Signup } = require("../models/alldatabase");
const mongoose = require("mongoose");
let activeUsers = new Map();

const getMessages = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: sender_id, receiverId: receiver_id },
        { senderId: receiver_id, receiverId: sender_id },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("senderId", "F_name L_name")
      .populate("receiverId", "F_name L_name");

    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const sendMessage = async (req, res, io) => {
  try {
    const { receiver_id, content } = req.body;
    const sender_id = req.user.id;
    const newMessage = await Message.create({
      senderId: sender_id,
      receiverId: receiver_id,
      content,
      timestamp: new Date(),
    });
    await newMessage.populate("senderId", "F_name L_name");
    await newMessage.populate("receiverId", "F_name L_name");
    const receiverSocket = [...activeUsers.entries()].find(([_, userId]) => userId === receiver_id)?.[0];
    if (receiverSocket) io.to(receiverSocket).emit("newMessage", { message: newMessage, sender_id, receiver_id });
    io.emit("stopTyping", { sender_id });
    res.status(201).json({ success: true, message: "Message sent successfully", data: newMessage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const handleSocketEvents = (io, socket) => {
  socket.on("userConnected", (userId) => {
    activeUsers.set(socket.id, userId);
    io.emit("userOnline", { userId });
  });
  socket.on("typing", ({ sender_id, receiver_id }) => {
    const receiverSocket = [...activeUsers.entries()].find(([_, userId]) => userId === receiver_id)?.[0];
    if (receiverSocket) io.to(receiverSocket).emit("userTyping", { sender_id });
  });
  socket.on("stopTyping", ({ sender_id, receiver_id }) => {
    const receiverSocket = [...activeUsers.entries()].find(([_, userId]) => userId === receiver_id)?.[0];
    if (receiverSocket) io.to(receiverSocket).emit("userStoppedTyping", { sender_id });
  });
  socket.on("disconnect", () => {
    const userId = activeUsers.get(socket.id);
    if (userId) {
      activeUsers.delete(socket.id);
      io.emit("userOffline", { userId });
    }
  });
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    if (message.senderId.toString() !== userId)
      return res.status(403).json({ success: false, message: "Not authorized to delete this message" });
    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    // Fix: Add 'new' keyword when creating ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Get all users except current user
    const allUsers = await Signup.find({ _id: { $ne: userId } });
    
    // Get conversations with messages
    const conversations = await Promise.all(allUsers.map(async (user) => {
      const messages = await Message.find({
        $or: [
          { senderId: userId, receiverId: user._id },
          { senderId: user._id, receiverId: userId }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(1);

      return {
        userId: user._id,
        name: `${user.F_name} ${user.L_name}`,
        lastMessage: messages[0]?.content || null,
        timestamp: messages[0]?.timestamp || null,
        hasMessages: messages.length > 0
      };
    }));

    const sortedConversations = conversations.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.status(200).json({
      success: true,
      conversations: sortedConversations
    });
  } catch (err) {
    console.error('Conversation Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getMessages, sendMessage, deleteMessage, getConversations, handleSocketEvents };
