const express = require("express");
const router = express.Router();

const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const { protect, authorize } = require("../middleware/authMiddleware");
const { checkDepartmentLimit } = require("../middleware/limitMiddleware");

router
  .route("/")
  .get(protect, getDepartments)
  .post(protect, authorize("admin"), checkDepartmentLimit, createDepartment);

router
  .route("/:id")
  .get(protect, getDepartmentById)
  .put(protect, authorize("admin"), updateDepartment)
  .delete(protect, authorize("admin"), deleteDepartment);

module.exports = router;