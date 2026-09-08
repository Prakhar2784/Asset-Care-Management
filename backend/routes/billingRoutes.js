const express = require('express');
const router = express.Router();
const { 
  calculateCheckout, 
  processCheckout, 
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  getInvoices, 
  cancelSubscription, 
  getSubscriptionHistory, 
  getInvoiceById,
} = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Webhook route (authenticated cryptographically via Razorpay HMAC signature)
router.post('/webhook', handleRazorpayWebhook);

// Protected Admin Billing Routes
router.use(protect);
router.use(authorize('admin', 'super_admin'));

router.post('/checkout/calculate', calculateCheckout);
router.post('/checkout/create-order', createRazorpayOrder);
router.post('/checkout/verify', verifyRazorpayPayment);
router.post('/checkout/process', processCheckout);
router.get('/invoices', getInvoices);
router.post('/cancel', cancelSubscription);
router.get('/history', getSubscriptionHistory);
router.get('/invoices/:id', getInvoiceById);

module.exports = router;