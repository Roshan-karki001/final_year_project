const { Project, Signup } = require("../models/alldatabase");

// Get all projects for authenticated user
const getAllProjects = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication failed: No user data found" 
            });
        }

        const projects = await Project.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            projects 
        });
    } catch (err) {
        console.error("Error fetching projects:", err);
        res.status(500).json({ 
            success: false, 
            error: err.message
        });
    }
};


const createProject = async (req, res) => {
    try {
        const { title, landArea, buildingType, budget, timeline } = req.body;
    
        // Ensure userId is present
        if (!req.user || !req.user.id) {
          return res.status(401).json({ success: false, message: "Unauthorized: User ID is missing" });
        }
    
        // Create the new project
        const newProject = new Project({
          userId: req.user.id,
          title,
          landArea,
          buildingType,
          budget,
          timeline,
          status: "pending", // Default status
        });
    
        await newProject.save();
    
        res.status(201).json({
          success: true,
          message: "New project added successfully",
          project: newProject,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
};


// Search projects by title or user name
const searchByTitleOrUser = async (req, res) => {
    try {
        const { title, userName } = req.query;
        
        // Debug log
        console.log('Search parameters:', { title, userName });

        let query = {};
        if (title) {
            // Make search case-insensitive and match partial titles
            query.title = { $regex: new RegExp(title, 'i') };
        }

        const projects = await Project.find(query)
            .populate({
                path: 'userId',
                model: 'Signup',
                select: 'F_name L_name G_mail'
            })
            .sort({ createdAt: -1 });

        console.log('Found projects:', projects); // Debug log

        if (userName && projects.length > 0) {
            const filteredProjects = projects.filter(project => {
                const fullName = `${project.userId.F_name} ${project.userId.L_name}`.toLowerCase();
                return fullName.includes(userName.toLowerCase());
            });
            
            return res.status(200).json({
                success: true,
                count: filteredProjects.length,
                projects: filteredProjects
            });
        }

        res.status(200).json({
            success: true,
            count: projects.length,
            projects: projects
        });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Update project (Only project owner can update)
const updateProject = async (req, res) => {
    try {
        const { title, landArea, buildingType, budget, timeline } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // Compare user IDs
        if (project.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You can only update your own project"
            });
        }

        // Parse landArea if it's provided
        let parsedLandArea = project.landArea; // Keep existing value as default
        if (landArea) {
            // Extract numeric value from string (e.g., "900 sqft" → 900)
            const numericValue = parseFloat(landArea.toString().replace(/[^\d.-]/g, ''));
            if (isNaN(numericValue)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid landArea: Must contain a valid number"
                });
            }
            parsedLandArea = numericValue;
        }

        // Update project fields
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            {
                title: title || project.title,
                landArea: parsedLandArea,
                buildingType: buildingType || project.buildingType,
                budget: budget || project.budget,
                timeline: timeline || project.timeline
            },
            { new: true }
        ).populate('userId', 'F_name L_name G_mail');

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project: updatedProject
        });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete project (Only project owner can delete)
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // Debug logs to check values
        console.log('Project userId:', project.userId);
        console.log('User id from token:', req.user.id);

        // Compare using req.user.id instead of req.user.userId
        if (project.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You can only delete your own project"
            });
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    getAllProjects,
    createProject,
    searchByTitleOrUser,
    updateProject,
    deleteProject
};
