const PurchaseRequest = require('../models/PurchaseRequest');
const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceivedNote = require('../models/GoodsReceivedNote');
const Asset = require('../models/Asset');
const Vendor = require('../models/Vendor');
const Department = require('../models/Department');
const { audit } = require('../services/auditService');

// ==========================================
// 1. Purchase Request (PR) Handlers
// ==========================================

// Create a new Purchase Request
const createPR = async (req, res) => {
  try {
    const { itemName, category, quantity, estimatedUnitCost, justification } = req.body;
    
    if (!itemName || !category || !quantity || !estimatedUnitCost || !justification) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const totalCost = Number(quantity) * Number(estimatedUnitCost);

    // Generate incremental prNumber scoped to tenant
    const lastPR = await PurchaseRequest.findOne({}).sort({ createdAt: -1 });
    let nextNum = 1001;
    if (lastPR && lastPR.prNumber) {
      const lastNum = parseInt(lastPR.prNumber.replace('PR-', ''), 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const prNumber = `PR-${nextNum}`;

    const pr = await PurchaseRequest.create({
      prNumber,
      itemName,
      category,
      quantity,
      estimatedUnitCost,
      totalCost,
      justification,
      requestedBy: req.user._id,
      tenantId: req.tenantId
    });

    audit({ req, action: 'pr_created', entity: 'purchase_request', entityId: pr._id, entityLabel: pr.prNumber });

    res.status(201).json(pr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Purchase Requests
const getPRs = async (req, res) => {
  try {
    // Populate requestedBy user details
    const prs = await PurchaseRequest.find({})
      .populate('requestedBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(prs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Review (Approve/Reject) a Purchase Request
const reviewPR = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (Approved/Rejected) is required' });
    }

    const pr = await PurchaseRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ message: 'Purchase Request not found' });

    if (pr.status !== 'Pending Approval') {
      return res.status(400).json({ message: 'Purchase Request has already been reviewed' });
    }

    pr.status = status;
    pr.remarks = remarks || '';
    pr.reviewedBy = req.user._id;
    pr.reviewedAt = new Date();
    await pr.save();

    audit({ req, action: `pr_${status.toLowerCase()}`, entity: 'purchase_request', entityId: pr._id, entityLabel: pr.prNumber, changes: { status, remarks } });

    res.status(200).json(pr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. Purchase Order (PO) Handlers
// ==========================================

// Create a new Purchase Order from an Approved PR
const createPO = async (req, res) => {
  try {
    const { purchaseRequestId, vendorId, items, terms, expectedDeliveryDate } = req.body;

    if (!vendorId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Vendor and items are required' });
    }

    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    // Validate and calculate item costs
    let totalAmount = 0;
    const formattedItems = items.map(item => {
      const quantity = Number(item.quantity) || 1;
      const unitCost = Number(item.unitCost) || 0;
      const totalCost = quantity * unitCost;
      totalAmount += totalCost;
      return {
        name: item.name,
        quantity,
        unitCost,
        totalCost
      };
    });

    // Generate PO Number
    const lastPO = await PurchaseOrder.findOne({}).sort({ createdAt: -1 });
    let nextNum = 5001;
    if (lastPO && lastPO.poNumber) {
      const lastNum = parseInt(lastPO.poNumber.replace('PO-', ''), 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const poNumber = `PO-${nextNum}`;

    const po = await PurchaseOrder.create({
      poNumber,
      purchaseRequest: purchaseRequestId || null,
      vendor: vendorId,
      items: formattedItems,
      totalAmount,
      terms: terms || '',
      expectedDeliveryDate,
      tenantId: req.tenantId
    });

    // If linked to a PR, update its status
    if (purchaseRequestId) {
      await PurchaseRequest.findByIdAndUpdate(purchaseRequestId, { status: 'PO Created' });
    }

    audit({ req, action: 'po_created', entity: 'purchase_order', entityId: po._id, entityLabel: po.poNumber });

    res.status(201).json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Purchase Orders
const getPOs = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({})
      .populate('vendor', 'name contactPerson phone email')
      .populate('purchaseRequest', 'prNumber itemName requestedBy')
      .sort({ createdAt: -1 });
    res.status(200).json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get PO Details by ID
const getPOById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('vendor', 'name contactPerson phone email address gstNumber')
      .populate('purchaseRequest');
    if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
    res.status(200).json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update PO Status or Payment Status
const updatePOStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'Purchase Order not found' });

    if (status) po.status = status;
    if (paymentStatus) po.paymentStatus = paymentStatus;
    
    await po.save();

    audit({ req, action: 'po_status_updated', entity: 'purchase_order', entityId: po._id, entityLabel: po.poNumber, changes: { status, paymentStatus } });

    res.status(200).json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. Goods Received Note (GRN) Handlers
// ==========================================

// Create a new Goods Received Note (includes invoice upload)
const createGRN = async (req, res) => {
  try {
    const { purchaseOrderId, invoiceNumber, receivedItems } = req.body;

    if (!purchaseOrderId || !receivedItems) {
      return res.status(400).json({ message: 'Purchase Order ID and received items list are required' });
    }

    const po = await PurchaseOrder.findById(purchaseOrderId);
    if (!po) return res.status(404).json({ message: 'Purchase Order not found' });

    // Parse items from request
    const parsedItems = typeof receivedItems === 'string' ? JSON.parse(receivedItems) : receivedItems;

    // Generate GRN Number
    const lastGRN = await GoodsReceivedNote.findOne({}).sort({ createdAt: -1 });
    let nextNum = 8001;
    if (lastGRN && lastGRN.grnNumber) {
      const lastNum = parseInt(lastGRN.grnNumber.replace('GRN-', ''), 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const grnNumber = `GRN-${nextNum}`;

    // Get invoice file URL if uploaded (tenant-scoped)
    const invoiceFileUrl = req.file ? `/uploads/${req.tenantId || 'default'}/invoices/${req.file.filename}` : null;

    const grn = await GoodsReceivedNote.create({
      grnNumber,
      purchaseOrder: purchaseOrderId,
      receivedItems: parsedItems,
      invoiceNumber: invoiceNumber || '',
      invoiceFileUrl,
      receivedBy: req.user._id,
      tenantId: req.tenantId
    });

    // Determine new PO status based on items count received vs ordered
    let allReceived = true;
    po.items.forEach(orderedItem => {
      const receivedItem = parsedItems.find(item => item.name === orderedItem.name);
      if (!receivedItem || receivedItem.quantityReceived < orderedItem.quantity) {
        allReceived = false;
      }
    });

    po.status = allReceived ? 'Completed' : 'Partially Received';
    await po.save();

    audit({ req, action: 'grn_created', entity: 'goods_received_note', entityId: grn._id, entityLabel: grn.grnNumber });

    res.status(201).json(grn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Goods Received Notes
const getGRNs = async (req, res) => {
  try {
    const grns = await GoodsReceivedNote.find({})
      .populate('purchaseOrder', 'poNumber vendor totalAmount')
      .populate('receivedBy', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(grns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// finalise GRN and bulk register items as Assets
const registerAssetsFromGRN = async (req, res) => {
  try {
    const { assets } = req.body; // Array of { name, serialNumber, department, location, unitCost }

    if (!assets || assets.length === 0) {
      return res.status(400).json({ message: 'Assets list is required for registration' });
    }

    const grn = await GoodsReceivedNote.findById(req.params.id).populate('purchaseOrder');
    if (!grn) return res.status(404).json({ message: 'Goods Received Note not found' });

    if (grn.status === 'Assets Registered') {
      return res.status(400).json({ message: 'Assets for this shipment have already been registered' });
    }

    // Retrieve default HOD user to link to Department if department assignment exists
    const createdAssets = [];
    for (const item of assets) {
      // Find category from PO items or fallback
      const poItem = grn.purchaseOrder.items.find(i => i.name === item.name);
      
      const asset = await Asset.create({
        name: item.name,
        category: grn.purchaseOrder.purchaseRequest ? 'IT Hardware' : 'Equipment', // fallback resolve
        formFactor: 'Movable',
        serialNumber: item.serialNumber,
        department: item.department || 'IT',
        location: item.location || 'Warehouse Storage',
        status: 'In Storage',
        assignedStatus: 'Unassigned',
        procurementDate: grn.receivedDate,
        purchaseCost: item.unitCost || poItem?.unitCost || 0,
        tenantId: req.tenantId
      });
      createdAssets.push(asset);
    }

    // Finalize GRN status
    grn.status = 'Assets Registered';
    await grn.save();

    audit({ req, action: 'grn_assets_registered', entity: 'goods_received_note', entityId: grn._id, entityLabel: grn.grnNumber, changes: { assetCount: createdAssets.length } });

    res.status(200).json({
      message: `${createdAssets.length} assets registered successfully!`,
      assets: createdAssets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPR, getPRs, reviewPR,
  createPO, getPOs, getPOById, updatePOStatus,
  createGRN, getGRNs, registerAssetsFromGRN
};
