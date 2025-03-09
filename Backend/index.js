const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database"); // Database connection
const authRoutes = require("./route/auth"); // Authentication routes
const projectRoutes = require("./route/project_route"); // Project routes
const reviewRoutes = require("./route/review_route"); // Review routes

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/projects", projectRoutes);


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
