const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require("./config/database");
const authRoutes = require('./route/auth');
const projectRoutes = require("./route/project_route");
const reviewRoutes = require("./route/review_route");
const contractRoutes = require("./route/contract_route");
const messageRoutes = require('./route/message_route');

dotenv.config();
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.io with HTTP server
const io = socketIo(server);

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/contracts", contractRoutes);
app.use('/api/messages', messageRoutes(io));

// Serve static files from the "uploads" directory
app.use('/uploads', express.static('uploads'));

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('typing', (data) => {
        console.log(`${data.username} is typing...`);
        socket.broadcast.emit('typing', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
