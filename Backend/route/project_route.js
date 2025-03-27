const express = require("express");
const router = express.Router();
const { authenticateToken, checkRole } = require("../midware/authMiddleware");
const {
    getAllProjects,
    getwholeroject,
    createProject,
    searchByTitleOrUser,
    updateProject,
    deleteProject,
    getDoneProjects,
    getProjectById,
    getProgressProjects,
    getActiveProjects,
    searchProjectsForEngineers,
    applyForProject,
    acceptApplication,
} = require("../controller/project_controller");


// Get all projects for authenticated user
// Move the engineer search route to the top of the routes (before other specific routes)
router.get('/engineer-search', authenticateToken, checkRole("engineer"), searchProjectsForEngineers);
router.get('/completed', authenticateToken, getDoneProjects);
router.get('/progress', authenticateToken, getProgressProjects);
router.get('/active', authenticateToken, getActiveProjects);
router.get('/search', authenticateToken, searchByTitleOrUser);
router.get('/all', getwholeroject);

// Create, update, delete routes
router.post('/create', authenticateToken, checkRole("client"), createProject);
router.put('/update/:id', authenticateToken, checkRole("client"), updateProject);
router.delete('/delete/:id', authenticateToken, checkRole("client"), deleteProject);

// Application routes
router.post('/:id/apply', authenticateToken, applyForProject);
router.post('/accept-application', authenticateToken, acceptApplication);

// Parameter routes should be last
router.get('/:id', authenticateToken, getProjectById);
router.get('/', authenticateToken, getAllProjects);

module.exports = router;
