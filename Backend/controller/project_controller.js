const { Project } = require("../models/alldatabase");

// Get all projects
const getProject = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).json({ success: true, projects });
    } catch (err) {
        console.error("Error fetching projects:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get a project by ID
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }
        res.status(200).json({ success: true, project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create a new project
const createProject = async (req, res) => {
    try {
        const { user_id, title, landarea, building_type, budget, timeline } = req.body;
        
        if (!user_id) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const newProject = await Project.create({
            user_id,
            title,
            landarea,
            building_type,
            budget,
            timeline
        });

        res.status(201).json({ success: true, message: "New project added", project: newProject });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


// Update a project
const updateProject = async (req, res) => {
    try {
        const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!updatedProject) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }
        res.status(200).json({ success: true, message: "Project updated", project: updatedProject });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete a project
const deleteProject = async (req, res) => {
    try {
        const deletedProject = await Project.findByIdAndDelete(req.params.id);
        if (!deletedProject) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }
        res.status(200).json({ success: true, message: "Project deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Search projects
const searchProjects = async (req, res) => {
    try {
        const { title, building_type, status } = req.query;
        const query = {};

        if (title) query.title = { $regex: title, $options: "i" };
        if (building_type) query.building_type = building_type;
        if (status) query.status = status;

        const projects = await Project.find(query);
        if (!projects.length) {
            return res.status(404).json({ success: false, message: "No projects found" });
        }
        res.status(200).json({ success: true, projects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error searching projects" });
    }
};

module.exports = { getProject, getProjectById, createProject, updateProject, deleteProject, searchProjects };
