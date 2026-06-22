const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    vendorType: {
      type: String,
      required: true,
      enum: ["OEM", "Dealer", "Service Provider", "AMC Vendor", "Warranty Provider", "Other"],
    },

    serviceCategory: {
      type: String,
      required: true,
      enum: [
        "IT Hardware",
        "Software",
        "Electrical",
        "Electronics",
        "Networking",
        "CCTV & Security",
        "Furniture",
        "Vehicle",
        "Building Maintenance",
        "Other",
      ],
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    supportEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },

    supportPhone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: String,
    state: String,
    pincode: String,

    gstNumber: {
      type: String,
      trim: true,
    },

    panNumber: {
      type: String,
      trim: true,
    },

    serviceCoverage: {
      type: String,
      enum: ["On-site", "Remote", "Pickup & Drop", "Hybrid"],
      default: "On-site",
    },

    slaResponseTime: {
      type: String,
      enum: ["2 Hours", "4 Hours", "8 Hours", "24 Hours", "48 Hours", "Best Effort"],
      default: "24 Hours",
    },

    escalationName: String,
    escalationPhone: String,
    escalationEmail: String,

    contractStartDate: Date,
    contractEndDate: Date,

    paymentTerms: {
      type: String,
      enum: ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "As per contract"],
      default: "30 Days",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Blacklisted"],
      default: "Active",
    },

    remarks: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);