const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  // Warehousing
  createWarehouse, getWarehouses, transferAssetToWarehouse,
  // Licenses
  createLicense, getLicenses, assignLicenseSeat, revokeLicenseSeat,
  // AMC & Warranty
  createAMCContract, getAMCContracts, createWarrantyClaim, getWarrantyClaims, resolveWarrantyClaim,
  // Maintenance
  createMaintenanceSchedule, getMaintenanceSchedules, completeMaintenance,
  // Transfers
  createTransferRequest, getTransferRequests, approveTransferByHOD, approveTransferByIT
} = require('../controllers/enterpriseController');

// All enterprise endpoints require authentication
router.use(protect);

// 1. Warehouse routes
router.post('/warehouses', authorize('admin'), createWarehouse);
router.get('/warehouses', getWarehouses);
router.post('/warehouses/transfer', authorize('admin'), transferAssetToWarehouse);

// 2. Software License routes
router.post('/licenses', authorize('admin'), createLicense);
router.get('/licenses', getLicenses);
router.put('/licenses/:id/assign', authorize('admin'), assignLicenseSeat);
router.put('/licenses/:id/revoke', authorize('admin'), revokeLicenseSeat);

// 3. AMC & Warranty routes
router.post('/amc', authorize('admin'), createAMCContract);
router.get('/amc', getAMCContracts);
router.post('/warranty/claims', createWarrantyClaim);
router.get('/warranty/claims', getWarrantyClaims);
router.put('/warranty/claims/:id/resolve', authorize('admin'), resolveWarrantyClaim);

// 4. Preventive Maintenance routes
router.post('/maintenance', authorize('admin'), createMaintenanceSchedule);
router.get('/maintenance', getMaintenanceSchedules);
router.put('/maintenance/:id/complete', authorize('admin'), completeMaintenance);

// 5. Transfer Workflow routes
router.post('/transfers', createTransferRequest);
router.get('/transfers', getTransferRequests);
router.put('/transfers/:id/hod', authorize('admin', 'hod'), approveTransferByHOD);
router.put('/transfers/:id/it', authorize('admin'), approveTransferByIT);

module.exports = router;
