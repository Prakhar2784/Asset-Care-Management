const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  // PR
  createPR, getPRs, reviewPR,
  // PO
  createPO, getPOs, getPOById, updatePOStatus,
  // GRN
  createGRN, getGRNs, registerAssetsFromGRN
} = require('../controllers/procurementController');

// All procurement routes require authentication
router.use(protect);

// Purchase Requests
router.post('/requests', createPR);
router.get('/requests', getPRs);
router.put('/requests/:id/review', authorize('admin', 'hod'), reviewPR);

// Purchase Orders
router.post('/orders', authorize('admin'), createPO);
router.get('/orders', getPOs);
router.get('/orders/:id', getPOById);
router.put('/orders/:id/status', authorize('admin'), updatePOStatus);

// Goods Received Notes & Invoices
// Multit-part form upload for the invoice file key 'invoice'
router.post('/grns', authorize('admin'), upload.single('invoice'), createGRN);
router.get('/grns', getGRNs);
router.post('/grns/:id/register-assets', authorize('admin'), registerAssetsFromGRN);

module.exports = router;
