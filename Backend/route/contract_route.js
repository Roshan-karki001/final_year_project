const express = require("express");
const {postNewContract,getContractById,getAllContracts, editContract,deleteContract,searchContract,} = require("../controller/contract_controller");

const router = express.Router();

// Create a new contract
router.post("/", postNewContract);

// Get all contracts
router.get("/", getAllContracts);

// Get a specific contract by ID 
router.get("/:id", getContractById);

// Edit a contract by contract_id
router.put("/:id", editContract);

// Delete a contract by contract_id
router.delete("/:id", deleteContract);

// Search contracts
router.get("/search", searchContract);

module.exports = router;