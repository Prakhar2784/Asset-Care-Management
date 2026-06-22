const express = require("express");
const router = express.Router();

const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} = require("../controllers/vendorController");

const { protect, authorize } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, getVendors)
  .post(protect, authorize("admin"), createVendor);

router
  .route("/:id")
  .get(protect, getVendorById)
  .put(protect, authorize("admin"), updateVendor)
  .delete(protect, authorize("admin"), deleteVendor);

module.exports = router;