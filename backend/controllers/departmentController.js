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

    // Auto-create/invite HOD user
    try {
      const User = require("../models/User");
      const crypto = require("crypto");
      const { sendInviteEmail } = require("../services/emailService");

      const emailLower = hodEmail.toLowerCase().trim();
      let user = await User.findOne({ email: emailLower });

      if (!user) {
        const placeholder = crypto.randomBytes(32).toString('hex');
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

        user = await User.create({
          name: hodName,
          email: emailLower,
          password: placeholder,
          role: 'hod',
          department: name,
          phone: hodPhone || '',
          passwordResetToken: crypto.createHash('sha256').update(inviteToken).digest('hex'),
          passwordResetExpiry: inviteExpiry,
          isActive: false
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteLink = `${frontendUrl}/reset-password/${inviteToken}?invite=true`;
        await sendInviteEmail(user, inviteLink);
      } else {
        const updateFields = { department: name };
        if (!['admin', 'super_admin', 'hod'].includes(user.role)) {
          updateFields.role = 'hod';
        }
        if (hodPhone && !user.phone) {
          updateFields.phone = hodPhone;
        }
        await User.findByIdAndUpdate(user._id, updateFields);
      }
    } catch (hodErr) {
      console.error("[HOD Activation] Error creating/inviting HOD user:", hodErr.message);
    }

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

    // Auto-create/invite/update HOD user
    try {
      if (updatedDepartment.hodEmail) {
        const User = require("../models/User");
        const crypto = require("crypto");
        const { sendInviteEmail } = require("../services/emailService");

        const emailLower = updatedDepartment.hodEmail.toLowerCase().trim();
        let user = await User.findOne({ email: emailLower });

        if (!user) {
          const placeholder = crypto.randomBytes(32).toString('hex');
          const inviteToken = crypto.randomBytes(32).toString('hex');
          const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

          user = await User.create({
            name: updatedDepartment.hodName,
            email: emailLower,
            password: placeholder,
            role: 'hod',
            department: updatedDepartment.name,
            phone: updatedDepartment.hodPhone || '',
            passwordResetToken: crypto.createHash('sha256').update(inviteToken).digest('hex'),
            passwordResetExpiry: inviteExpiry,
            isActive: false
          });

          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const inviteLink = `${frontendUrl}/reset-password/${inviteToken}?invite=true`;
          await sendInviteEmail(user, inviteLink);
        } else {
          const updateFields = { department: updatedDepartment.name };
          if (!['admin', 'super_admin', 'hod'].includes(user.role)) {
            updateFields.role = 'hod';
          }
          if (updatedDepartment.hodPhone && !user.phone) {
            updateFields.phone = updatedDepartment.hodPhone;
          }
          if (updatedDepartment.hodName && user.name !== updatedDepartment.hodName) {
            updateFields.name = updatedDepartment.hodName;
          }
          await User.findByIdAndUpdate(user._id, updateFields);
        }
      }
    } catch (hodErr) {
      console.error("[HOD Activation] Error updating/inviting HOD user:", hodErr.message);
    }

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