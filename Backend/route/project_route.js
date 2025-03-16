const express = require("express");
const router = express.Router();
const { authenticateToken, checkRole } = require("../midware/authMiddleware");
const {
    getAllProjects,
    createProject,
    searchByTitleOrUser,
    updateProject,
    deleteProject
} = require("../controller/project_controller");

// Get all projects for authenticated user
router.get("/", authenticateToken, getAllProjects);

// Create a new project (Only clients can create projects)
router.post("/create", authenticateToken, checkRole("client"), createProject);

// Search projects by title or user name
router.get("/search", authenticateToken, searchByTitleOrUser);  // Remove /projects from the URL

// Update a project (Only the owner of the project can update)
router.put("/update/:id", authenticateToken, checkRole("client"), updateProject);

// Delete a project (Only the owner of the project can delete)
router.delete("/delete/:id", authenticateToken, checkRole("client"), deleteProject);

module.exports = router;
