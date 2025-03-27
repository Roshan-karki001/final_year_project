const { Contract, Project, Signup } = require("../models/alldatabase");
const mongoose = require("mongoose");
const { getAllClient, getAllUsers, getAllEngineers } = require("./authcontroller");

// Get all contracts
const getAllContracts = async (req, res) => {
    try {
        console.log("Fetching contracts for user:", req.user.id);
        const contracts = await Contract.find({ userId: req.user.id })
            .populate("projectId userId engineerId");
        
        return res.status(200).json({
            success: true,
            message: "Contracts retrieved successfully",
            contracts
        });
    } catch (error) {
        console.error("Error fetching contracts:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Failed to retrieve contracts",
            details: error.message 
        });
    }
};


const getContractById = async (req, res) => {
    try {
        const { searchId } = req.params;
        
        if (!searchId) {
            return res.status(400).json({
                success: false,
                message: "Contract ID is required"
            });
        }

        const contract = await Contract.findById(searchId)
            .populate('userId', 'F_name L_name G_mail Phonenumber')
            .populate('engineerId', 'F_name L_name G_mail Phonenumber')
            .populate('projectId');

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }

        res.status(200).json({
            success: true,
            contract
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching contract",
            error: error.message
        });
    }
};



 // Adjust the path to your models

// Create a new contract
const postNewContract = async (req, res) => {
    try {
        // Log the entire incoming request body
        console.log("Request Body:", req.body);
        const { projectId, engineerId, termsConditions} = req.body;

        // Check for existing active contract
        const existingContract = await Contract.findOne({
            userId: req.user.id,
            engineerId: engineerId,
            status: { $ne: "done" }
        });

        if (existingContract) {
            return res.status(400).json({ 
                success: false, 
                message: "You already have an active contract with this engineer. Please complete the existing contract first." 
            });
        }

        console.log("Received Contract Request:", { projectId, engineerId, user: req.user });

        // Find the project based on projectId to verify if it exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }
        console.log("Project Found:", project);

        // Check if the user is the client of this project
        if (project.userId.toString() !== req.user.id) {
            console.log(project.userId.toString(), req.user.id);
            console.log("Project userId:", project.userId.toString(), "User id:", req.user.id);
            return res.status(403).json({ success: false, message: "Only the client can create a contract for this project" });
        }

        // Check if the engineer exists
        const engineer = await Signup.findById(engineerId);
        if (!engineer) {
            return res.status(404).json({ success: false, message: "Engineer not found" });
        }

        // Create the contract
        const newContract = new Contract({
            projectId,
            userId: req.user.id,  // Client ID
            engineerId,
            title: project.title,
            landArea:project.landArea,  // Use the landArea from the request
            buildingType:project.buildingType,  // Use the buildingType from the request
            budget: project.budget,
            timeline: project.timeline,
            termsConditions,
            status: "pending",  // Default status when a contract is created
        });

        // Save the contract to the database
        await newContract.save();

        return res.status(201).json({ success: true, message: "Contract created successfully", contract: newContract });

    } catch (error) {
        console.error("Contract creation error:", error);
        return res.status(500).json({ success: false, error: "Failed to create contract", details: error.message });
    }
};



// Edit a contract
const editContract = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ error: "Contract not found" });

        // Check if contract is already signed
        if (contract.clientSignature || contract.engineerSignature) {
            return res.status(403).json({ 
                error: "Cannot edit contract after signing has begun" 
            });
        }

        // Check if user is either the client or the engineer of the contract
        if (contract.userId.toString() !== req.user.id && 
            contract.engineerId.toString() !== req.user.id) {
            return res.status(403).json({ 
                error: "Only the client or engineer involved can edit this contract" 
            });
        }

        Object.assign(contract, req.body);
        await contract.save();
        res.status(200).json({
            success: true,
            message: "Contract updated successfully",
            contract
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message || "Failed to update contract" 
        });
    }
};

// Delete a contract
const deleteContract = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ error: "Contract not found" });

        // Check if user is authorized
        if (contract.userId.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false,
                message: "Only the contract creator can delete this contract" 
            });
        }

        // Check if contract is in pending status and not done
        if (contract.status === "done") {
            return res.status(403).json({ 
                success: false,
                message: "Completed contracts cannot be deleted" 
            });
        }

        if (contract.status !== "pending") {
            return res.status(403).json({ 
                success: false,
                message: "Only pending contracts can be deleted" 
            });
        }

        await contract.deleteOne();
        res.status(200).json({ 
            success: true,
            message: "Contract deleted successfully" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message || "Failed to delete contract" 
        });
    }
};

// Search contracts
const searchContract = async (req, res) => {
    try {
        const { query } = req.query;
        const searchCriteria = {
            $or: [
                { title: { $regex: query, $options: "i" } },
                { status: { $regex: query, $options: "i" } },
                { buildingType: { $regex: query, $options: "i" } }
            ]
        };
        const contracts = await Contract.find(searchCriteria);
        res.status(200).json(contracts);
    } catch (error) {
        res.status(500).json({ error: error.message || "Search failed" });
    }
};

// Sign a contract
const signContract = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ error: "Contract not found" });

        if (!req.file) return res.status(400).json({ error: "Signature file required" });

        if (req.user.role === "client") {
            contract.clientSignature = req.file.path;
        } else if (req.user.role === "engineer") {
            contract.engineerSignature = req.file.path;
        } else {
            return res.status(403).json({ error: "Unauthorized role" });
        }

        if (contract.clientSignature && contract.engineerSignature) {
            contract.status = "signed";
        }

        await contract.save();
        res.status(200).json({ message: "Contract signed successfully", contract });
    } catch (error) {
        res.status(500).json({ error: error.message || "Failed to sign contract" });
    }
};

module.exports = { 
    getAllContracts, 
    getContractById, 
    postNewContract, 
    editContract, 
    deleteContract, 
    searchContract, 
    signContract ,
    getAllClient,
    getAllUsers,
    getAllEngineers,
};
