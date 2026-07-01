// backend/controllers/vendorPortalController.js
const { audit } = require('../services/auditService');

// Helper to resolve vendor profile from logged-in user email
const getLoggedVendor = async (req) => {
  const Vendor = req.db.model('Vendor');
  const vendor = await Vendor.findOne({ email: req.user.email, status: 'Active' });
  return vendor;
};

// GET /api/vendor-portal/profile
const getVendorProfile = async (req, res) => {
  try {
    const vendor = await getLoggedVendor(req);
    if (!vendor) {
      return res.status(404).json({ message: 'Active vendor profile not found for this account.' });
    }
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vendor-portal/purchase-orders
const getPurchaseOrders = async (req, res) => {
  try {
    const vendor = await getLoggedVendor(req);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const PurchaseOrder = req.db.model('PurchaseOrder');
    const pos = await PurchaseOrder.find({ 
      vendor: vendor._id,
      status: { $ne: 'Draft' } 
    }).sort({ createdAt: -1 });

    res.status(200).json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/vendor-portal/purchase-orders/:id/status
const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Accepted by Vendor', 'Rejected by Vendor'].includes(status)) {
      return res.status(400).json({ message: 'Invalid PO status update.' });
    }

    const vendor = await getLoggedVendor(req);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const PurchaseOrder = req.db.model('PurchaseOrder');
    const po = await PurchaseOrder.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!po) return res.status(404).json({ message: 'Purchase Order not found or not assigned to you.' });

    const oldStatus = po.status;
    po.status = status;
    await po.save();

    audit({ req, action: 'vendor_po_updated', entity: 'purchase_order', entityId: po._id, entityLabel: po.poNumber, changes: { from: oldStatus, to: status } });

    res.status(200).json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vendor-portal/warranty-claims
const getWarrantyClaims = async (req, res) => {
  try {
    const vendor = await getLoggedVendor(req);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const WarrantyClaim = req.db.model('WarrantyClaim');
    const claims = await WarrantyClaim.find({ vendor: vendor._id })
      .populate('asset', 'name serialNumber department location status')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/vendor-portal/warranty-claims/:id/status
const updateWarrantyClaimStatus = async (req, res) => {
  try {
    const { status, resolutionDetails } = req.body;
    if (!['In Review', 'Resolved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid warranty claim status.' });
    }

    const vendor = await getLoggedVendor(req);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const WarrantyClaim = req.db.model('WarrantyClaim');
    const claim = await WarrantyClaim.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!claim) return res.status(404).json({ message: 'Warranty claim not found or not assigned to you.' });

    const oldStatus = claim.status;
    claim.status = status;
    if (resolutionDetails !== undefined) {
      claim.resolutionDetails = resolutionDetails;
    }
    await claim.save();

    audit({ req, action: 'vendor_claim_updated', entity: 'warranty_claim', entityId: claim._id, entityLabel: claim.claimNumber, changes: { from: oldStatus, to: status } });

    res.status(200).json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vendor-portal/tickets
const getAssignedTickets = async (req, res) => {
  try {
    const vendor = await getLoggedVendor(req);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const Ticket = req.db.model('Ticket');
    const tickets = await Ticket.find({ assignedVendor: vendor._id })
      .populate('asset', 'name serialNumber department location status')
      .populate('raisedBy', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/vendor-portal/tickets/:id/status
const updateTicketStatus = async (req, res) => {
  try {
    const { status, estimatedCost } = req.body;
    if (!['Under Repair', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid ticket status. Vendors can only set Under Repair or Resolved.' });
    }

    const vendor = await getLoggedVendor(req);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const Ticket = req.db.model('Ticket');
    const ticket = await Ticket.findOne({ _id: req.params.id, assignedVendor: vendor._id });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found or not assigned to you.' });

    const oldStatus = ticket.status;
    ticket.status = status;
    if (estimatedCost !== undefined) {
      ticket.estimatedCost = estimatedCost;
    }
    await ticket.save();

    audit({ req, action: 'vendor_ticket_updated', entity: 'ticket', entityId: ticket._id, entityLabel: ticket.ticketId, changes: { from: oldStatus, to: status, estimatedCost } });

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVendorProfile,
  getPurchaseOrders,
  updatePurchaseOrderStatus,
  getWarrantyClaims,
  updateWarrantyClaimStatus,
  getAssignedTickets,
  updateTicketStatus
};
