const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    hodName: {
      type: String,
      required: true,
      trim: true,
    },
    hodEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    hodPhone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
    },
    approvalRequired: {
      type: Boolean,
      default: true,
    },
    approvalLevel: {
      type: String,
      enum: ["HOD Only", "HOD + Admin", "HOD + Finance", "Admin Only"],
      default: "HOD Only",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tenantId: {
      type: String,
      required: true,
      default: 'default',
    },
  },
  { timestamps: true }
);

departmentSchema.index({ tenantId: 1 });
departmentSchema.index({ code: 1, tenantId: 1 }, { unique: true });

const Department = mongoose.model("Department", departmentSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('Department', Department);