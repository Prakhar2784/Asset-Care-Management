const Department = require("../models/Department");

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}).sort({ createdAt: -1 });
    const User = require("../models/User");

    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await User.countDocuments({
          department: { $regex: new RegExp(`^${dept.name}$`, "i") },
          isActive: true,
        });
        return {
          ...dept.toObject(),
          employeeCount,
        };
      })
    );

    res.status(200).json(departmentsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const User = require("../models/User");
    const employeeCount = await User.countDocuments({
      department: { $regex: new RegExp(`^${department.name}$`, "i") },
      isActive: true,
    });

    res.status(200).json({
      ...department.toObject(),
      employeeCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      hodName,
      hodEmail,
      hodPhone,
      location,
      floor,
      status,
      description,
    } = req.body;

    if (!name || !code || !hodName || !hodEmail) {
      return res.status(400).json({
        message: "Department name, code, HOD name and HOD email are required.",
      });
    }

    const exists = await Department.findOne({ code: code.toUpperCase() });

    if (exists) {
      return res.status(400).json({
        message: "Department code already exists.",
      });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      hodName,
      hodEmail,
      hodPhone,
      location,
      floor,
      status: status || "Active",
      description,
      createdBy: req.user?._id,
    });

    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();

      const codeExists = await Department.findOne({
        code: req.body.code,
        _id: { $ne: req.params.id },
      });

      if (codeExists) {
        return res.status(400).json({
          message: "Department code already exists.",
        });
      }
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedDepartment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    await department.deleteOne();

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};