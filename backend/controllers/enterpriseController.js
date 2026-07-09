const SoftwareLicense = require('../models/SoftwareLicense');
const AMCContract = require('../models/AMCContract');
const WarrantyClaim = require('../models/WarrantyClaim');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const TransferRequest = require('../models/TransferRequest');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { audit } = require('../services/auditService');

// ==========================================
// 1. Software License Handlers
// ==========================================
const createLicense = async (req, res) => {
  try {
    const { softwareName, publisher, licenseKey, totalSeats, expiryDate, renewalCost } = req.body;
    if (!softwareName || !licenseKey || !totalSeats) {
      return res.status(400).json({ message: 'Software Name, License Key, and Total Seats are required' });
    }

    const license = await SoftwareLicense.create({
      softwareName,
      publisher: publisher || '',
      licenseKey,
      totalSeats: Number(totalSeats),
      expiryDate,
      renewalCost: Number(renewalCost) || 0,
      tenantId: req.tenantId
    });

    audit({ req, action: 'license_created', entity: 'software_license', entityId: license._id, entityLabel: license.softwareName });
    res.status(201).json(license);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLicenses = async (req, res) => {
  try {
    const licenses = await SoftwareLicense.find({}).populate('assignments.user', 'name email department');
    res.status(200).json(licenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignLicenseSeat = async (req, res) => {
  try {
    const { userId } = req.body;
    const license = await SoftwareLicense.findById(req.params.id);
    if (!license) return res.status(404).json({ message: 'License not found' });

    if (license.assignedSeats >= license.totalSeats) {
      return res.status(400).json({ message: 'No available license seats remaining.' });
    }

    const userExists = await User.findById(userId);
    if (!userExists) return res.status(404).json({ message: 'User not found' });

    // Prevent duplicate seat allocations to the same user
    const alreadyAssigned = license.assignments.some(a => String(a.user) === String(userId));
    if (alreadyAssigned) {
      return res.status(400).json({ message: 'License seat already allocated to this user.' });
    }

    license.assignments.push({ user: userId });
    license.assignedSeats = license.assignments.length;
    await license.save();

    audit({ req, action: 'license_seat_assigned', entity: 'software_license', entityId: license._id, entityLabel: license.softwareName, changes: { user: userExists.name } });
    res.status(200).json(license);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const revokeLicenseSeat = async (req, res) => {
  try {
    const { userId } = req.body;
    const license = await SoftwareLicense.findById(req.params.id);
    if (!license) return res.status(404).json({ message: 'License not found' });

    const originalLength = license.assignments.length;
    license.assignments = license.assignments.filter(a => String(a.user) !== String(userId));

    if (license.assignments.length === originalLength) {
      return res.status(400).json({ message: 'License seat was not assigned to this user.' });
    }

    license.assignedSeats = license.assignments.length;
    await license.save();

    audit({ req, action: 'license_seat_revoked', entity: 'software_license', entityId: license._id, entityLabel: license.softwareName });
    res.status(200).json(license);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. AMC & Warranty Claims Handlers
// ==========================================
const createAMCContract = async (req, res) => {
  try {
    const { contractNumber, vendor, assetsCovered, startDate, endDate, annualCost } = req.body;
    if (!contractNumber || !vendor || !startDate || !endDate) {
      return res.status(400).json({ message: 'Contract Number, Vendor, Start Date, and End Date are required' });
    }

    const contract = await AMCContract.create({
      contractNumber,
      vendor,
      assetsCovered: assetsCovered || [],
      startDate,
      endDate,
      annualCost: Number(annualCost) || 0,
      tenantId: req.tenantId
    });

    // Update covered assets to bind their AMC terms
    if (assetsCovered && assetsCovered.length > 0) {
      await Asset.updateMany(
        { _id: { $in: assetsCovered } },
        { $set: { amcStart: startDate, amcEnd: endDate } }
      );
    }

    audit({ req, action: 'amc_contract_created', entity: 'amc_contract', entityId: contract._id, entityLabel: contract.contractNumber });
    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAMCContracts = async (req, res) => {
  try {
    const contracts = await AMCContract.find({})
      .populate('assetsCovered', 'name serialNumber category');
    res.status(200).json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createWarrantyClaim = async (req, res) => {
  try {
    const { assetId, vendor, issueDescription } = req.body;
    if (!assetId || !vendor || !issueDescription) {
      return res.status(400).json({ message: 'Asset, Vendor, and Issue Description are required' });
    }

    // Generate unique claimNumber
    const lastClaim = await WarrantyClaim.findOne({}).sort({ createdAt: -1 });
    let nextNum = 3001;
    if (lastClaim && lastClaim.claimNumber) {
      const lastNum = parseInt(lastClaim.claimNumber.replace('CLM-', ''), 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const claimNumber = `CLM-${nextNum}`;

    const claim = await WarrantyClaim.create({
      claimNumber,
      asset: assetId,
      vendor,
      issueDescription,
      tenantId: req.tenantId
    });

    // Mark asset status as Under Repair during claim filing
    await Asset.findByIdAndUpdate(assetId, { status: 'Under Repair' });

    audit({ req, action: 'warranty_claim_filed', entity: 'warranty_claim', entityId: claim._id, entityLabel: claim.claimNumber });
    res.status(201).json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWarrantyClaims = async (req, res) => {
  try {
    const claims = await WarrantyClaim.find({})
      .populate('asset', 'name serialNumber category')
      .sort({ createdAt: -1 });
    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveWarrantyClaim = async (req, res) => {
  try {
    const { status, resolutionDetails } = req.body;
    if (!status || !['Resolved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid resolution status (Resolved/Rejected) is required' });
    }

    const claim = await WarrantyClaim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Warranty Claim not found' });

    claim.status = status;
    claim.resolutionDetails = resolutionDetails || '';
    await claim.save();

    // If resolved, return asset status to Active/In Storage. If rejected, keep status or flag as Scrap
    const finalAssetStatus = status === 'Resolved' ? 'In Storage' : 'Active';
    await Asset.findByIdAndUpdate(claim.asset, { status: finalAssetStatus });

    audit({ req, action: `warranty_claim_${status.toLowerCase()}`, entity: 'warranty_claim', entityId: claim._id, entityLabel: claim.claimNumber });
    res.status(200).json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. Preventive Maintenance Handlers
// ==========================================
const createMaintenanceSchedule = async (req, res) => {
  try {
    const { assetId, taskName, frequency, nextDueDate, assignedEngineerId } = req.body;
    if (!assetId || !taskName || !nextDueDate) {
      return res.status(400).json({ message: 'Asset, Task Name, and Next Due Date are required' });
    }

    const schedule = await MaintenanceSchedule.create({
      asset: assetId,
      taskName,
      frequency: frequency || 'Quarterly',
      nextDueDate,
      assignedEngineer: assignedEngineerId || null,
      tenantId: req.tenantId
    });

    audit({ req, action: 'maintenance_scheduled', entity: 'maintenance_schedule', entityId: schedule._id, entityLabel: schedule.taskName });
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMaintenanceSchedules = async (req, res) => {
  try {
    const schedules = await MaintenanceSchedule.find({})
      .populate('asset', 'name serialNumber category status')
      .populate('assignedEngineer', 'name email');
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeMaintenance = async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Maintenance Schedule not found' });

    // Mark completed
    schedule.status = 'Completed';
    schedule.lastDoneDate = new Date();

    // Calculate next due date dynamically based on frequency
    const monthsToAdd = {
      'Monthly': 1,
      'Quarterly': 3,
      'Semi-Annually': 6,
      'Annually': 12
    }[schedule.frequency] || 3;

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + monthsToAdd);

    // Create a new future schedule automatically
    const newSchedule = await MaintenanceSchedule.create({
      asset: schedule.asset,
      taskName: schedule.taskName,
      frequency: schedule.frequency,
      nextDueDate: nextDate,
      assignedEngineer: schedule.assignedEngineer,
      tenantId: req.tenantId
    });

    await schedule.save();

    audit({ req, action: 'maintenance_completed', entity: 'maintenance_schedule', entityId: schedule._id, entityLabel: schedule.taskName });
    res.status(200).json({ completed: schedule, nextScheduled: newSchedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 5. Asset Transfer Workflow Handlers
// ==========================================
const createTransferRequest = async (req, res) => {
  try {
    const { assetId, toUserId } = req.body;
    if (!assetId || !toUserId) return res.status(400).json({ message: 'Asset and Target User are required' });

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const fromUserId = asset.assignedTo;
    if (!fromUserId) {
      return res.status(400).json({ message: 'Asset is not currently assigned to any employee.' });
    }

    const transfer = await TransferRequest.create({
      asset: assetId,
      fromUser: fromUserId,
      toUser: toUserId,
      status: 'Pending HOD',
      tenantId: req.tenantId
    });

    audit({ req, action: 'transfer_request_raised', entity: 'transfer_request', entityId: transfer._id, entityLabel: asset.name });
    res.status(201).json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransferRequests = async (req, res) => {
  try {
    const transfers = await TransferRequest.find({})
      .populate('asset', 'name serialNumber category')
      .populate('fromUser', 'name email department')
      .populate('toUser', 'name email department');
    res.status(200).json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveTransferByHOD = async (req, res) => {
  try {
    const { approve, remarks } = req.body;
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer Request not found' });

    if (transfer.status !== 'Pending HOD') {
      return res.status(400).json({ message: 'Request is not in HOD review state' });
    }

    transfer.status = approve ? 'Pending IT' : 'Rejected';
    transfer.managerRemarks = remarks || '';
    await transfer.save();

    audit({ req, action: `transfer_hod_${approve ? 'approved' : 'rejected'}`, entity: 'transfer_request', entityId: transfer._id });
    res.status(200).json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveTransferByIT = async (req, res) => {
  try {
    const { approve, remarks } = req.body;
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer Request not found' });

    if (transfer.status !== 'Pending IT') {
      return res.status(400).json({ message: 'Request is not in IT review state' });
    }

    if (approve) {
      // Complete ownership hand-off
      const asset = await Asset.findById(transfer.asset);
      const targetUser = await User.findById(transfer.toUser);
      
      asset.assignedTo = targetUser._id;
      asset.assignedEmployeeName = targetUser.name;
      asset.assignedEmployeeEmail = targetUser.email;
      asset.assignedEmployeePhone = targetUser.phone || '';
      asset.assignedDate = new Date();
      asset.assignedStatus = 'Assigned';
      asset.status = 'Active';
      await asset.save();
      
      transfer.status = 'Approved';
    } else {
      transfer.status = 'Rejected';
    }

    transfer.itRemarks = remarks || '';
    await transfer.save();

    audit({ req, action: `transfer_it_${approve ? 'approved' : 'rejected'}`, entity: 'transfer_request', entityId: transfer._id });
    res.status(200).json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  // Licenses
  createLicense, getLicenses, assignLicenseSeat, revokeLicenseSeat,
  // AMC & Warranty
  createAMCContract, getAMCContracts, createWarrantyClaim, getWarrantyClaims, resolveWarrantyClaim,
  // Maintenance
  createMaintenanceSchedule, getMaintenanceSchedules, completeMaintenance,
  // Transfers
  createTransferRequest, getTransferRequests, approveTransferByHOD, approveTransferByIT
};
