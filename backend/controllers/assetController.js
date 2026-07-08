const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const MaintenanceLog = require('../models/MaintenanceLog');
const AssetAssignment = require('../models/AssetAssignment');
const AuditLog = require('../models/AuditLog');
const TransferRequest = require('../models/TransferRequest');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const CustomField = require('../models/CustomField');
const ServiceCenter = require('../models/ServiceCenter');
const { audit } = require('../services/auditService');

const syncServiceCenter = async (req, asset) => {
  if (!asset.servicePartnerName || !asset.servicePartnerName.trim()) return;

  const tenantId = req.tenantId || 'default';
  const name = asset.servicePartnerName.trim();

  try {
    let sc = await ServiceCenter.findOne({ name, tenantId });

    if (!sc) {
      sc = await ServiceCenter.create({
        name,
        contactPerson: asset.servicePartnerContact || null,
        phone: asset.supportPhone || null,
        email: asset.supportEmail || null,
        address: asset.purchaseFromAddress || null,
        categories: asset.category ? [asset.category] : [],
        brands: asset.vendor ? [asset.vendor] : [],
        status: 'Active',
        notes: 'Automatically created from asset registration',
        tenantId
      });
      console.log(`[SERVICE CENTER SYNC] Created new service center: ${name}`);
    } else {
      let updated = false;
      if (asset.servicePartnerContact && sc.contactPerson !== asset.servicePartnerContact) {
        sc.contactPerson = asset.servicePartnerContact;
        updated = true;
      }
      if (asset.supportPhone && sc.phone !== asset.supportPhone) {
        sc.phone = asset.supportPhone;
        updated = true;
      }
      if (asset.supportEmail && sc.email !== asset.supportEmail) {
        sc.email = asset.supportEmail;
        updated = true;
      }
      if (asset.category && !sc.categories.includes(asset.category)) {
        sc.categories.push(asset.category);
        updated = true;
      }
      if (asset.vendor && !sc.brands.includes(asset.vendor)) {
        sc.brands.push(asset.vendor);
        updated = true;
      }
      if (updated) {
        await sc.save();
        console.log(`[SERVICE CENTER SYNC] Updated service center: ${name}`);
      }
    }
  } catch (err) {
    console.error('[SERVICE CENTER SYNC ERROR]:', err.message);
  }
};

const autoLogMaintenanceIfNeeded = async (req, asset, oldStatus) => {
  if (asset.status === 'Under Repair' && oldStatus !== 'Under Repair') {
    const existing = await MaintenanceLog.findOne({
      asset: asset._id,
      status: { $in: ['Scheduled', 'In Progress'] }
    });

    if (!existing) {
      await MaintenanceLog.create({
        asset: asset._id,
        type: 'Corrective',
        description: 'Automatically logged: Asset marked as Under Repair in registry.',
        vendor: asset.servicePartnerName || '',
        technicianName: asset.servicePartnerContact || '',
        technicianContact: asset.supportPhone || '',
        status: 'In Progress',
        serviceDate: new Date(),
        loggedBy: req.user?._id || null,
        tenantId: req.tenantId || 'default'
      });
      console.log(`[AUTO MAINTENANCE LOG] Created In Progress log for asset ${asset.name}`);
    }
  }
};

const validateCustomFieldsHelper = async (category, customFieldsInput = {}) => {
  const configs = await CustomField.find({ category });
  const errors = [];

  for (const config of configs) {
    const value = customFieldsInput[config.name];

    // Check if required
    if (config.isRequired && (value === undefined || value === null || value === '')) {
      errors.push(`Custom field '${config.name}' is required.`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      // Check type
      if (config.type === 'Number') {
        if (isNaN(Number(value))) {
          errors.push(`Custom field '${config.name}' must be a valid number.`);
        }
      } else if (config.type === 'Date') {
        if (isNaN(Date.parse(value))) {
          errors.push(`Custom field '${config.name}' must be a valid date.`);
        }
      } else if (config.type === 'Select') {
        if (config.options && config.options.length > 0 && !config.options.includes(value)) {
          errors.push(`Custom field '${config.name}' value must be one of: ${config.options.join(', ')}.`);
        }
      }
    }
  }

  return errors;
};

// @route   POST /api/assets
// @access  Admin
const createAsset = async (req, res) => {
  try {
    const { category, customFields } = req.body;
    const validationErrors = await validateCustomFieldsHelper(category, customFields);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: validationErrors.join(' ') });
    }

    const asset = await Asset.create(req.body);
    await syncServiceCenter(req, asset);
    await autoLogMaintenanceIfNeeded(req, asset, 'Active');
    audit({ req, action: 'asset_created', entity: 'asset', entityId: asset._id, entityLabel: asset.name });
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   GET /api/assets
// @access  Admin / HOD
const getAssets = async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true } };
    if (req.user.role === 'hod' && req.user.department) {
      filter.department = req.user.department;
    }
    const assets = await Asset.find(filter)
      .populate('assignedTo', 'name email department')
      .sort({ createdAt: -1 });
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/assets/:id
// @access  Admin / HOD
const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('assignedTo', 'name email department');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.status(200).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/assets/:id
// @access  Admin
const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    // Validate custom fields if category or customFields are supplied
    const category = req.body.category || asset.category;
    const customFields = req.body.customFields !== undefined ? req.body.customFields : asset.customFields;

    if (req.body.customFields !== undefined || req.body.category !== undefined) {
      const validationErrors = await validateCustomFieldsHelper(category, customFields);
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: validationErrors.join(' ') });
      }
    }

    const oldStatus = asset.status;
    const updated = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    await syncServiceCenter(req, updated);
    await autoLogMaintenanceIfNeeded(req, updated, oldStatus);
    audit({ req, action: 'asset_updated', entity: 'asset', entityId: asset._id, entityLabel: asset.name, changes: req.body });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   DELETE /api/assets/:id  — soft delete
// @access  Admin
const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    asset.isDeleted = true;
    asset.deletedAt = new Date();
    await asset.save({ validateBeforeSave: false });

    audit({ req, action: 'asset_deleted', entity: 'asset', entityId: asset._id, entityLabel: asset.name });
    res.status(200).json({ message: 'Asset moved to trash successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/assets/:id/restore
// @access  Admin
const restoreAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    asset.isDeleted = false;
    asset.deletedAt = null;
    await asset.save({ validateBeforeSave: false });

    audit({ req, action: 'asset_restored', entity: 'asset', entityId: asset._id, entityLabel: asset.name });
    res.status(200).json({ message: 'Asset restored successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/assets/trash
// @access  Admin
const getDeletedAssets = async (req, res) => {
  try {
    const filter = { isDeleted: true };
    if (req.user.role === 'hod' && req.user.department) {
      filter.department = req.user.department;
    }
    const assets = await Asset.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ deletedAt: -1 });
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/assets/all-active
// @access  Any logged-in user (for ticket raising)
const getActiveAssets = async (req, res) => {
  try {
    const filter = { status: { $nin: ['Scrap', 'Decommissioned'] }, isDeleted: { $ne: true } };
    if (req.user.role === 'hod' && req.user.department) {
      filter.department = req.user.department;
    }
    const assets = await Asset.find(filter)
      .select('name serialNumber category department location status')
      .sort({ name: 1 });
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/assets/myassets
// @access  Employee (logged-in user)
const getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.find({
      $or: [
        { assignedTo: req.user._id },
        { assignedEmployeeEmail: req.user.email }
      ]
    }).populate('assignedTo', 'name email department');
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/assets/bulk-import
// @access  Admin
// Body: { rows: [ { name, serialNumber, category, department, location, vendor, purchaseCost, procurementDate, warrantyEnd, status } ] }
const bulkImportAssets = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No rows provided for import.' });
    }
    if (rows.length > 1000) {
      return res.status(400).json({ message: 'Maximum 1000 rows per import batch.' });
    }

    // Load custom fields for validation and mapping
    const customFieldsByCat = {};
    const configs = await CustomField.find({});
    configs.forEach(c => {
      if (!customFieldsByCat[c.category]) customFieldsByCat[c.category] = [];
      customFieldsByCat[c.category].push(c);
    });

    const REQUIRED = ['name', 'serialNumber', 'department'];
    const errors = [];
    const valid = [];
    const seen = new Set();

    const VALID_STATUSES = ['Active', 'In Transit', 'Under Repair', 'Decommissioned', 'In Storage', 'Scrap'];

    rows.forEach((row, i) => {
      const rowNum = i + 1;
      const missing = REQUIRED.filter(f => !row[f]?.toString().trim());
      if (missing.length > 0) {
        errors.push({ row: rowNum, issue: `Missing required fields: ${missing.join(', ')}` });
        return;
      }
      const serial = row.serialNumber.toString().trim();
      if (seen.has(serial)) {
        errors.push({ row: rowNum, issue: `Duplicate serial number in this batch: ${serial}` });
        return;
      }
      seen.add(serial);

      const category = row.category?.toString().trim();
      const catConfigs = customFieldsByCat[category] || [];
      const customFields = {};
      let hasCustomFieldErrors = false;

      for (const config of catConfigs) {
        const val = row[config.name];
        
        // Required check
        if (config.isRequired && (val === undefined || val === null || val.toString().trim() === '')) {
          errors.push({ row: rowNum, issue: `Missing required custom field: ${config.name}` });
          hasCustomFieldErrors = true;
          break;
        }

        if (val !== undefined && val !== null && val.toString().trim() !== '') {
          const stringVal = val.toString().trim();
          
          // Type checks
          if (config.type === 'Number' && isNaN(Number(stringVal))) {
            errors.push({ row: rowNum, issue: `Custom field '${config.name}' must be a valid number (got '${stringVal}').` });
            hasCustomFieldErrors = true;
            break;
          }
          if (config.type === 'Date' && isNaN(Date.parse(stringVal))) {
            errors.push({ row: rowNum, issue: `Custom field '${config.name}' must be a valid YYYY-MM-DD date (got '${stringVal}').` });
            hasCustomFieldErrors = true;
            break;
          }
          if (config.type === 'Select' && config.options?.length > 0 && !config.options.includes(stringVal)) {
            errors.push({ row: rowNum, issue: `Custom field '${config.name}' must be one of: ${config.options.join(', ')} (got '${stringVal}').` });
            hasCustomFieldErrors = true;
            break;
          }

          customFields[config.name] = stringVal;
        }
      }

      if (hasCustomFieldErrors) return;

      valid.push({
        name: row.name?.toString().trim(),
        serialNumber: serial,
        category: category,
        department: row.department?.toString().trim(),
        location: row.location?.toString().trim() || '',
        vendor: row.vendor?.toString().trim() || '',
        modelNumber: row.modelNumber?.toString().trim() || '',
        purchaseCost: row.purchaseCost ? Number(row.purchaseCost) : undefined,
        procurementDate: row.procurementDate ? new Date(row.procurementDate) : undefined,
        warrantyEnd: row.warrantyEnd ? new Date(row.warrantyEnd) : undefined,
        status: VALID_STATUSES.includes(row.status?.toString().trim()) ? row.status.toString().trim() : 'Active',
        formFactor: row.formFactor || 'Movable',
        customFields,
        tenantId: req.tenantId || 'default',
      });
    });

    if (valid.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import.', errors });
    }

    // Check for existing serial numbers in DB (within this tenant)
    const existingSerials = await Asset.find({ serialNumber: { $in: valid.map(r => r.serialNumber) }, isDeleted: { $ne: true } }).select('serialNumber');
    const existingSet = new Set(existingSerials.map(a => a.serialNumber));
    const dupeErrors = [];
    const toInsert = valid.filter(r => {
      if (existingSet.has(r.serialNumber)) {
        dupeErrors.push({ row: '?', issue: `Serial "${r.serialNumber}" already exists in the registry.` });
        return false;
      }
      return true;
    });

    const allErrors = [...errors, ...dupeErrors];

    if (toInsert.length === 0) {
      return res.status(400).json({ message: 'All rows were duplicates or invalid.', errors: allErrors });
    }

    const inserted = await Asset.insertMany(toInsert, { ordered: false });

    audit({
      req,
      action: 'bulk_import',
      entity: 'asset',
      entityId: null,
      entityLabel: `${inserted.length} assets`,
      changes: { imported: inserted.length, errors: allErrors.length },
    });

    res.status(201).json({
      message: `Successfully imported ${inserted.length} asset(s).`,
      imported: inserted.length,
      skipped: allErrors.length,
      errors: allErrors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/assets/:id/timeline
// @access  Admin
const getAssetTimeline = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('assignedTo', 'name email');
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });

    const assetId = asset._id;

    const [tickets, assignments, auditLogs, transfers, maintenance] = await Promise.all([
      Ticket.find({ asset: assetId }).populate('raisedBy', 'name').populate('approvedBy', 'name').sort({ createdAt: -1 }),
      AssetAssignment.find({ asset: assetId }).populate('assignedTo', 'name email department').sort({ createdAt: -1 }),
      AuditLog.find({ entityId: String(assetId) }).sort({ createdAt: -1 }),
      TransferRequest.find({ asset: assetId }).populate('requestedBy', 'name').sort({ createdAt: -1 }),
      MaintenanceSchedule.find({ asset: assetId }).sort({ createdAt: -1 }),
    ]);

    const events = [];

    // Registration event
    events.push({ type: 'asset_created', date: asset.createdAt, title: 'Asset Registered', description: `${asset.name} (${asset.serialNumber}) was registered in the system.`, icon: 'create', color: '#4ade80' });

    tickets.forEach(t => {
      events.push({ type: 'ticket', date: t.createdAt, title: `Ticket Raised — ${t.ticketId}`, description: `${t.issue} · Priority: ${t.priority} · Status: ${t.status}`, icon: 'ticket', color: t.status === 'Resolved' ? '#4ade80' : t.priority === 'High' || t.priority === 'Critical' ? '#f87171' : '#f59e0b', link: '/tickets', meta: { ticketId: t.ticketId, priority: t.priority, status: t.status, cost: t.estimatedCost } });
    });

    assignments.forEach(a => {
      events.push({ type: 'assignment', date: a.createdAt, title: `Assigned to ${a.assignedTo?.name || 'User'}`, description: `Assigned to ${a.assignedTo?.email || '—'} (${a.assignedTo?.department || '—'})`, icon: 'assign', color: '#60a5fa', meta: { userName: a.assignedTo?.name } });
    });

    transfers.forEach(t => {
      events.push({ type: 'transfer', date: t.createdAt, title: `Transfer — ${t.status}`, description: `Requested by ${t.requestedBy?.name || '—'} · ${t.fromDepartment || '?'} → ${t.toDepartment || '?'}`, icon: 'transfer', color: '#a78bfa', meta: { status: t.status } });
    });

    maintenance.forEach(m => {
      events.push({ type: 'maintenance', date: m.createdAt, title: `Maintenance: ${m.taskName}`, description: `Status: ${m.status} · Type: ${m.maintenanceType || '—'}`, icon: 'maintenance', color: '#f59e0b', meta: { status: m.status } });
    });

    auditLogs.filter(l => !['ticket'].includes(l.action)).forEach(l => {
      events.push({ type: 'audit', date: l.createdAt, title: l.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), description: `By ${l.actorName || 'System'} (${l.actorRole || '—'})`, icon: 'audit', color: '#64748b', meta: l.changes });
    });

    // Sort all events newest-first
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ asset, events, counts: { tickets: tickets.length, assignments: assignments.length, transfers: transfers.length, maintenance: maintenance.length } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/assets/:id/documents
// @access  Admin / HOD (Register Assets / Edit Assets)
const uploadAssetDocuments = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    // docTypes[] arrives in the same order as the documents[] files
    const docTypes = [].concat(req.body.docTypes || []);
    const newDocs = req.files.map((f, i) => ({
      docType: docTypes[i] || 'invoice',
      originalName: f.originalname,
      fileName: f.filename,
      url: `/uploads/asset-documents/${f.filename}`,
    }));

    asset.documents.push(...newDocs);
    await asset.save();

    res.status(200).json(asset.documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/assets/:id/documents/:docId
// @access  Admin / HOD (Edit / Delete Assets)
const deleteAssetDocument = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });

    asset.documents = asset.documents.filter(d => d._id.toString() !== req.params.docId);
    await asset.save();

    res.status(200).json(asset.documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAsset, getAssets, getAssetById, updateAsset, deleteAsset, restoreAsset, getDeletedAssets, getMyAssets, getActiveAssets, bulkImportAssets, getAssetTimeline, uploadAssetDocuments, deleteAssetDocument };
