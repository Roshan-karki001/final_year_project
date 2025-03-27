const express = require('express');
const router = express.Router();
const upload = require('../utils/uploadConfig');
const { authenticateToken } = require('../midware/authMiddleware');
const { 
    getAllContracts,
    getContractById,
    postNewContract,
    editContract,
    deleteContract,
    signContract
} = require('../controller/contract_controller');

// Ensure uploads directory exists
const fs = require('fs');
// Update the signatures directory path
const dir = './uploads/signatures';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Routes
router.post("/", authenticateToken, postNewContract);
router.get("/", authenticateToken, getAllContracts);
router.get("/:searchId", authenticateToken, getContractById);  // Updated parameter name to match controller
router.put("/:id", authenticateToken, editContract);
router.delete("/:id", authenticateToken, deleteContract);
router.post("/:id/sign", authenticateToken, upload.single('signature'), signContract);

module.exports = router;
