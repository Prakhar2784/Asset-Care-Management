const mongoose = require("mongoose");

const assetAssignmentSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    employeePhone: {
      type: String,
      trim: true,
    },
    employeeCode: {
      type: String,
      trim: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
    },
    conditionAtAssign: {
      type: String,
      enum: ["New", "Good", "Average", "Damaged"],
      default: "Good",
    },
    remarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Assigned", "Returned"],
      default: "Assigned",
    },
    assignedBy: {
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

assetAssignmentSchema.index({ tenantId: 1 });

const AssetAssignment = mongoose.model("AssetAssignment", assetAssignmentSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('AssetAssignment', AssetAssignment);