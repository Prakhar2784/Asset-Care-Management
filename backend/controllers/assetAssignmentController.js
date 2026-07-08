const mongoose = require("mongoose");
const AssetAssignment = require("../models/AssetAssignment");
const Asset = require("../models/Asset");
const Department = require("../models/Department");
const User = require("../models/User");

const getAssignments = async (req, res) => {
  try {
    // HOD: scope to their department's assets and employees only
    let baseFilter = {};
    if (req.user.role === 'hod' && req.user.department) {
      const [deptAssets, deptUsers] = await Promise.all([
        Asset.find({ department: req.user.department, isDeleted: { $ne: true } }).select('_id'),
        User.find({ department: req.user.department }).select('email'),
      ]);
      const deptAssetIds = deptAssets.map(a => a._id);
      const deptEmails = deptUsers.map(u => u.email.toLowerCase());
      baseFilter = {
        $or: [
          { asset: { $in: deptAssetIds } },
          { employeeEmail: { $in: deptEmails } },
        ],
      };
    }

    const assignments = await AssetAssignment.find(baseFilter)
      .populate("department", "name code")
      .populate("asset", "assetId name category serialNumber assignedDepartment")
      .sort({ createdAt: -1 });

    // Collect all departments for lookup
    const allDepts = await Department.find({}).select('name code');
    const deptByName = {};
    allDepts.forEach(d => { deptByName[d.name.toLowerCase()] = d; });
    const deptById = {};
    allDepts.forEach(d => { deptById[d._id.toString()] = d; });

    // Collect unique employee emails from assignments missing a department
    const missingEmails = assignments
      .filter(a => !a.department)
      .map(a => a.employeeEmail)
      .filter(Boolean);

    // Look up users by email to get their department string
    const users = missingEmails.length > 0
      ? await User.find({ email: { $in: missingEmails } }).select('email department')
      : [];
    const userDeptByEmail = {};
    users.forEach(u => { if (u.department) userDeptByEmail[u.email.toLowerCase()] = u.department; });

    const result = assignments.map(a => {
      const obj = a.toObject();
      if (obj.department) return obj; // already resolved

      // Try asset's assignedDepartment (ObjectId)
      if (a.asset?.assignedDepartment) {
        const dept = deptById[a.asset.assignedDepartment.toString()];
        if (dept) { obj.department = dept; return obj; }
      }

      // Try employee's department string (case-insensitive name match)
      const empDeptStr = userDeptByEmail[a.employeeEmail?.toLowerCase()];
      if (empDeptStr) {
        const dept = deptByName[empDeptStr.toLowerCase()];
        if (dept) { obj.department = dept; return obj; }
        // fallback: synthesise a plain object so frontend shows the string
        obj.department = { name: empDeptStr, code: '' };
      }

      return obj;
    });

    res.status(200).json(result);
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
        // Try exact name match, then partial match
        let doc = await Department.findOne({ name: { $regex: new RegExp(`^${department}$`, 'i') } });
        if (!doc) doc = await Department.findOne({ name: { $regex: new RegExp(department, 'i') } });
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