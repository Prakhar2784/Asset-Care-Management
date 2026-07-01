const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { scanInvoice } = require("../controllers/ocrController");

// POST /api/ocr/invoice — requires auth, accepts base64 image
router.post("/invoice", protect, scanInvoice);

module.exports = router;
