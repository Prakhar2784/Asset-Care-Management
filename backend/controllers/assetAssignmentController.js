const mongoose = require("mongoose");
const AssetAssignment = require("../models/AssetAssignment");
const Asset = require("../models/Asset");
const Department = require("../models/Department");
const User = require("../models/User");

const getAssignments = async (req, res) => {
  try {
    const assignments = await AssetAssignment.find({})
      .populate("department", "name code")
      .populate("asset", "assetId name category serialNumber")
      .sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAssignmentsByDepartment = async (req, res) => {
  try {
    const assignments = await AssetAssignment.find({
      department: req.params.departmentId,
      status: "Assigned",
    })
      .populate("department", "name code")
      .populate("asset", "assetId name category serialNumber")
      .sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignAsset = async (req, res) => {
  try {
    const {
      department,
      asset,
      employeeName,
      employeeEmail,
      employeePhone,
      employeeCode,
      assignedDate,
      expectedReturnDate,
      conditionAtAssign,
      remarks,
    } = req.body;

    if (!asset || !employeeName || !employeeEmail) {
      return res.status(400).json({
        message: "Asset, employee name and employee email are required.",
      });
    }

    // Resolve department — accepts an ObjectId string or a plain department name
    let departmentId = null;
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        const doc = await Department.findById(department);
        if (doc) departmentId = doc._id;
      }
      if (!departmentId) {
        const doc = await Department.findOne({ name: { $regex: new RegExp(`^${department}$`, 'i') } });
        if (doc) departmentId = doc._id;
      }
    }

    const assetExists = await Asset.findById(asset);
    if (!assetExists) {
      return res.status(404).json({ message: "Asset not found." });
    }

    if (assetExists.assignedStatus === "Assigned") {
      return res.status(400).json({
        message: "This asset is already assigned.",
      });
    }

    const assignment = await AssetAssignment.create({
      department: departmentId,
      asset,
      employeeName,
      employeeEmail,
      employeePhone,
      employeeCode,
      assignedDate,
      expectedReturnDate,
      conditionAtAssign,
      remarks,
      assignedBy: req.user?._id,
    });

    const assignedUser = await User.findOne({ email: employeeEmail });

    await Asset.findByIdAndUpdate(asset, {
      assignedStatus: "Assigned",
      assignedDepartment: departmentId,
      assignedEmployeeName: employeeName,
      assignedEmployeeEmail: employeeEmail,
      assignedEmployeePhone: employeePhone,
      assignedDate: assignedDate || new Date(),
      assignedTo: assignedUser ? assignedUser._id : null,
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const returnAsset = async (req, res) => {
  try {
    const assignment = await AssetAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    assignment.status = "Returned";
    await assignment.save();

    await Asset.findByIdAndUpdate(assignment.asset, {
      assignedStatus: "Unassigned",
      assignedDepartment: null,
      assignedEmployeeName: "",
      assignedEmployeeEmail: "",
      assignedEmployeePhone: "",
      assignedDate: null,
      assignedTo: null,
    });

    res.status(200).json({ message: "Asset returned successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAssignments,
  getAssignmentsByDepartment,
  assignAsset,
  returnAsset,
};