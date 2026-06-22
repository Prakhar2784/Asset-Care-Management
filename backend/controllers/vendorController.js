const Vendor = require("../models/Vendor");

const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({}).sort({ createdAt: -1 });
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createVendor = async (req, res) => {
  try {
    const {
      name,
      vendorType,
      serviceCategory,
      contactPerson,
      phone,
      alternatePhone,
      email,
      address,
      city,
      state,
      pincode,
      gstNumber,
      panNumber,
      serviceCoverage,
      slaResponseTime,
      escalationName,
      escalationPhone,
      escalationEmail,
      supportEmail,
      supportPhone,
      contractStartDate,
      contractEndDate,
      paymentTerms,
      remarks,
      status,
    } = req.body;

    if (!name || !vendorType || !serviceCategory || !contactPerson || !phone || !email || !address) {
      return res.status(400).json({
        message:
          "Vendor name, vendor type, service category, contact person, phone, email and address are required.",
      });
    }

    const vendorExists = await Vendor.findOne({ email });

    if (vendorExists) {
      return res.status(400).json({ message: "Vendor with this email already exists." });
    }

    const vendor = await Vendor.create({
      name,
      vendorType,
      serviceCategory,
      contactPerson,
      phone,
      alternatePhone,
      email,
      address,
      city,
      state,
      pincode,
      gstNumber,
      panNumber,
      serviceCoverage,
      slaResponseTime,
      escalationName,
      escalationPhone,
      escalationEmail,
      supportEmail,
      supportPhone,
      contractStartDate,
      contractEndDate,
      paymentTerms,
      remarks,
      status: status || "Active",
      createdBy: req.user?._id,
    });

    res.status(201).json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedVendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    await vendor.deleteOne();

    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
};