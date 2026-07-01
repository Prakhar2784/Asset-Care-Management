const express = require('express');
const router = express.Router();
const {
  getCustomFields,
  createCustomField,
  deleteCustomField
} = require('../controllers/customFieldController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('admin', 'hod', 'super_admin'), getCustomFields)
  .post(protect, authorize('admin', 'super_admin'), createCustomField);

router.route('/:id')
  .delete(protect, authorize('admin', 'super_admin'), deleteCustomField);

module.exports = router;
