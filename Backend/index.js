const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require('http');
const socketIo = require('socket.io');
const multer = require("multer");
const path = require("path");
const connectDB = require("./config/database");
const authRoutes = require('./route/auth');
const projectRoutes = require("./route/project_route");
const reviewRoutes = require("./route/review_route");
const contractRoutes = require("./route/contract_route");
const messageRoutes = require('./route/message_route');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure multer for profile image uploads
const uploadDir = path.join(__dirname, "uploads");
require('fs').mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Make upload available for routes
app.locals.upload = upload;

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
app.use('/uploads', express.static(uploadDir));

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


