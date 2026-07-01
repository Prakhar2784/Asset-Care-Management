const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getVendorProfile,
  getPurchaseOrders,
  updatePurchaseOrderStatus,
  getWarrantyClaims,
  updateWarrantyClaimStatus,
  getAssignedTickets,
  updateTicketStatus
} = require('../controllers/vendorPortalController');

// All vendor portal routes require login and the 'vendor' role
router.use(protect);
router.use(authorize('vendor'));

router.get('/profile', getVendorProfile);
router.get('/purchase-orders', getPurchaseOrders);
router.put('/purchase-orders/:id/status', updatePurchaseOrderStatus);
router.get('/warranty-claims', getWarrantyClaims);
router.put('/warranty-claims/:id/status', updateWarrantyClaimStatus);
router.get('/tickets', getAssignedTickets);
router.put('/tickets/:id/status', updateTicketStatus);

module.exports = router;
