const { Contract, Project } = require("../models/alldatabase");

const getAllContracts = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'client') {
      query.client_id = req.user.id;
    } else if (req.user.role === 'engineer') {
      query.engineer_id = req.user.id;
    }

    const contracts = await Contract.find(query)
      .populate('client_id', 'F_name L_name')
      .populate('engineer_id', 'F_name L_name')
      .populate('project_id', 'title project_number project_id'); // Added project_number and project_id
    res.status(200).json({ success: true, contracts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const postNewContract = async (req, res) => {
  try {
    // First, verify the project exists and get its details
    const project = await Project.findOne({ 
      project_id: req.body.project_id,
      client_id: req.user.role === 'client' ? req.user.id : req.body.client_id 
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or you don't have access to it" 
      });
    }

    const contractData = {
      ...req.body,
      project_id: project._id, // Use the MongoDB _id of the project
      client_id: req.user.role === 'client' ? req.user.id : req.body.client_id,
      engineer_id: req.user.role === 'engineer' ? req.user.id : req.body.engineer_id,
      status: 'pending',
      // Copy project details to contract
      title: project.title,
      landarea: project.landarea,
      building_type: project.building_type,
      budget: project.budget,
      timeline: project.timeline
    };

    const newContract = await Contract.create(contractData);
    
    // Populate the response with project details
    const populatedContract = await Contract.findById(newContract._id)
      .populate('project_id', 'project_number project_id title')
      .populate('client_id', 'F_name L_name')
      .populate('engineer_id', 'F_name L_name');

    res.status(201).json({ 
      success: true, 
      message: "New contract created", 
      contract: populatedContract 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getContractById = async (req, res) => {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      $or: [
        { client_id: req.user.id },
        { engineer_id: req.user.id }
      ]
    }).populate('client_id engineer_id project_id');

    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found or access denied" });
    }
    res.status(200).json({ success: true, contract });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const editContract = async (req, res) => {
  try {
    // Check if user has permission to edit this contract
    const contract = await Contract.findOne({
      _id: req.params.id,
      $or: [
        { client_id: req.user.id },
        { engineer_id: req.user.id }
      ]
    });

    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found or access denied" });
    }

    const updatedContract = await Contract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('client_id engineer_id project_id');

    res.status(200).json({ success: true, message: "Contract updated", updatedContract });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteContract = async (req, res) => {
  try {
    const deletedContract = await Contract.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { client_id: req.user.id },
        { engineer_id: req.user.id }
      ]
    });

    if (!deletedContract) {
      return res.status(404).json({ success: false, message: "Contract not found or access denied" });
    }
    res.status(200).json({ success: true, message: "Contract deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const searchContract = async (req, res) => {
  try {
    const query = {
      $or: [
        { client_id: req.user.id },
        { engineer_id: req.user.id }
      ]
    };

    // Add additional search filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.project_id) query.project_id = req.query.project_id;
    if (req.query.title) query.title = new RegExp(req.query.title, "i");
    
    const contracts = await Contract.find(query)
      .populate('client_id', 'F_name L_name')
      .populate('engineer_id', 'F_name L_name')
      .populate('project_id', 'title');

    if (contracts.length === 0) {
      return res.status(404).json({ success: false, message: "No contracts found" });
    }
    res.status(200).json({ success: true, contracts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAllContracts,
  getContractById,
  postNewContract,
  editContract,
  deleteContract,
  searchContract
};