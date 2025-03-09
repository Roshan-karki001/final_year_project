const express = require("express");
const {
    getProject,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    searchProjects
} = require("../controller/project_controller");

const router = express.Router();

// Search route should come first to prevent conflicts
router.get("/search", searchProjects);

router.get("/", getProject);
router.post("/", createProject); // Now correctly expects `user_id` in the request body
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

module.exports = router;
