const express = require("express");
const router = express.Router();

const {
  getAssignments,
  getAssignmentsByDepartment,
  assignAsset,
  returnAsset,
} = require("../controllers/assetAssignmentController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, getAssignments);

router.get("/department/:departmentId", protect, getAssignmentsByDepartment);

router.post("/", protect, authorize("admin"), assignAsset);

router.put("/return/:id", protect, authorize("admin"), returnAsset);

module.exports = router;