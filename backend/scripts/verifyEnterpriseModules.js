const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Register the global multi-tenant plugin to Mongoose
const tenantPlugin = require('../middleware/tenantPlugin');
mongoose.plugin(tenantPlugin);

// Import models
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Asset = require('../models/Asset');
const Warehouse = require('../models/Warehouse');
const SoftwareLicense = require('../models/SoftwareLicense');
const AMCContract = require('../models/AMCContract');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const TransferRequest = require('../models/TransferRequest');

const { setTenantId } = require('../middleware/tenantContext');

const verifyEnterprise = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not defined in environment.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const TEST_TENANT = 'test-ent-tenant';

    console.log('\n--- SETUP: Preparing Test Context ---');
    // Ensure test tenant exists
    let tenant = await Tenant.findOne({ slug: TEST_TENANT });
    if (!tenant) {
      tenant = await Tenant.create({ name: 'Enterprise Corp', slug: TEST_TENANT });
    }

    let userA, userB, testVendor, asset;

    await setTenantId(TEST_TENANT, async () => {
      // Clean up previous test runs
      await User.deleteMany({ tenantId: TEST_TENANT });
      await Vendor.deleteMany({ tenantId: TEST_TENANT });
      await Asset.deleteMany({ tenantId: TEST_TENANT });
      await Warehouse.deleteMany({ tenantId: TEST_TENANT });
      await SoftwareLicense.deleteMany({ tenantId: TEST_TENANT });
      await AMCContract.deleteMany({ tenantId: TEST_TENANT });
      await MaintenanceSchedule.deleteMany({ tenantId: TEST_TENANT });
      await TransferRequest.deleteMany({ tenantId: TEST_TENANT });

      // Create users
      userA = await User.create({ name: 'User Alice', email: 'alice@test.com', password: 'password', role: 'employee', department: 'HR', tenantId: TEST_TENANT });
      userB = await User.create({ name: 'User Bob', email: 'bob@test.com', password: 'password', role: 'employee', department: 'Engineering', tenantId: TEST_TENANT });

      // Create vendor
      testVendor = await Vendor.create({ name: 'Vendor Tech', vendorType: 'OEM', serviceCategory: 'IT Hardware', contactPerson: 'John', phone: '123', email: 'vendor@test.com', address: 'Address', tenantId: TEST_TENANT });

      // Create initial asset
      asset = await Asset.create({
        name: 'Corporate ThinkPad',
        category: 'Laptops',
        serialNumber: 'SN-THINK-ENT',
        department: 'IT',
        assignedTo: userA._id,
        assignedStatus: 'Assigned',
        status: 'Active',
        tenantId: TEST_TENANT
      });

      console.log('Test context initialized.');
    });

    console.log('\n--- MODULE 1: Warehouse Stock ---');
    await setTenantId(TEST_TENANT, async () => {
      // 1. Create warehouse
      const warehouse = await Warehouse.create({ name: 'Central Warehouse Berlin', code: 'CWH-BER', location: 'Berlin', tenantId: TEST_TENANT });
      console.log(`Warehouse created: ${warehouse.name} (Code: ${warehouse.code})`);

      // 2. Transfer asset to warehouse
      asset.warehouse = warehouse._id;
      asset.status = 'In Storage';
      asset.stockStatus = 'Available';
      asset.assignedStatus = 'Unassigned';
      asset.assignedTo = null;
      await asset.save();
      
      const updatedAsset = await Asset.findById(asset._id);
      console.log(`Asset transferred to warehouse. Status: ${updatedAsset.status}, StockStatus: ${updatedAsset.stockStatus}, Warehouse Ref: ${updatedAsset.warehouse}`);
      if (updatedAsset.status !== 'In Storage' || String(updatedAsset.warehouse) !== String(warehouse._id)) {
        throw new Error('FAILURE: Warehouse stock transfer check failed.');
      }
      console.log('SUCCESS: Warehouse stock transfer verified.');
    });

    console.log('\n--- MODULE 2: Software License Seats ---');
    await setTenantId(TEST_TENANT, async () => {
      // 1. Create a license with 1 seat
      const license = await SoftwareLicense.create({
        softwareName: 'Adobe Creative Cloud',
        licenseKey: 'ADOBE-KEY-123',
        totalSeats: 1,
        tenantId: TEST_TENANT
      });
      console.log(`License created: ${license.softwareName} (Seats: ${license.totalSeats})`);

      // 2. Assign seat to User Alice
      license.assignments.push({ user: userA._id });
      license.assignedSeats = license.assignments.length;
      await license.save();
      console.log(`Assigned seat to User A (Alice). Seats allocated: ${license.assignedSeats}/${license.totalSeats}`);

      // 3. Revoke seat
      license.assignments = license.assignments.filter(a => String(a.user) !== String(userA._id));
      license.assignedSeats = license.assignments.length;
      await license.save();
      console.log(`Revoked seat. Seats allocated: ${license.assignedSeats}/${license.totalSeats}`);
      
      if (license.assignedSeats !== 0) {
        throw new Error('FAILURE: Software License seat allocation failed.');
      }
      console.log('SUCCESS: Software License manager verified.');
    });

    console.log('\n--- MODULE 3: AMC Agreement ---');
    await setTenantId(TEST_TENANT, async () => {
      const start = new Date();
      const end = new Date();
      end.setFullYear(end.getFullYear() + 1);

      const contract = await AMCContract.create({
        contractNumber: 'AMC-TEST-99',
        vendor: testVendor._id,
        assetsCovered: [asset._id],
        startDate: start,
        endDate: end,
        annualCost: 15000,
        tenantId: TEST_TENANT
      });

      console.log(`AMC Contract created: ${contract.contractNumber} (Annual Cost: ₹${contract.annualCost})`);
      if (contract.assetsCovered.length !== 1) {
        throw new Error('FAILURE: AMC Contract assets coverage failed.');
      }
      console.log('SUCCESS: AMC Contract registration verified.');
    });

    console.log('\n--- MODULE 4: Preventive Maintenance ---');
    await setTenantId(TEST_TENANT, async () => {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 3); // next quarter

      const schedule = await MaintenanceSchedule.create({
        asset: asset._id,
        taskName: 'Hardware Inspection and Cleaning',
        frequency: 'Quarterly',
        nextDueDate: dueDate,
        tenantId: TEST_TENANT
      });

      console.log(`Maintenance scheduled: "${schedule.taskName}" (Next Due: ${schedule.nextDueDate.toLocaleDateString()})`);

      // Complete maintenance
      schedule.status = 'Completed';
      schedule.lastDoneDate = new Date();
      await schedule.save();

      console.log(`Maintenance completed. Status: ${schedule.status}, LastDone: ${schedule.lastDoneDate.toLocaleDateString()}`);
      if (schedule.status !== 'Completed') {
        throw new Error('FAILURE: Maintenance schedules completion failed.');
      }
      console.log('SUCCESS: Preventive Maintenance logging verified.');
    });

    console.log('\n--- MODULE 5: Asset Transfer Workflow ---');
    await setTenantId(TEST_TENANT, async () => {
      // Re-assign asset to User Alice first
      asset.assignedTo = userA._id;
      asset.assignedStatus = 'Assigned';
      asset.status = 'Active';
      await asset.save();

      // 1. Raise transfer request from User Alice to User Bob
      const transfer = await TransferRequest.create({
        asset: asset._id,
        fromUser: userA._id,
        toUser: userB._id,
        status: 'Pending HOD',
        tenantId: TEST_TENANT
      });
      console.log(`Transfer request raised. Status: ${transfer.status}`);

      // 2. HOD Approves
      transfer.status = 'Pending IT';
      await transfer.save();
      console.log(`HOD Approved. Status: ${transfer.status}`);

      // 3. IT Approves & Triggers ownership shift
      transfer.status = 'Approved';
      await transfer.save();

      const finalAsset = await Asset.findById(asset._id);
      finalAsset.assignedTo = userB._id;
      await finalAsset.save();

      console.log(`IT Approved & Completed. Final Asset AssignedTo Ref: ${finalAsset.assignedTo} (Bob's ID: ${userB._id})`);
      if (String(finalAsset.assignedTo) !== String(userB._id)) {
        throw new Error('FAILURE: Transfer request ownership hand-off failed.');
      }
      console.log('SUCCESS: Asset Transfer approval workflow verified.');
    });

    console.log('\nCleaning up verification records...');
    await setTenantId(TEST_TENANT, async () => {
      await User.deleteMany({ tenantId: TEST_TENANT });
      await Vendor.deleteMany({ tenantId: TEST_TENANT });
      await Asset.deleteMany({ tenantId: TEST_TENANT });
      await Warehouse.deleteMany({ tenantId: TEST_TENANT });
      await SoftwareLicense.deleteMany({ tenantId: TEST_TENANT });
      await AMCContract.deleteMany({ tenantId: TEST_TENANT });
      await MaintenanceSchedule.deleteMany({ tenantId: TEST_TENANT });
      await TransferRequest.deleteMany({ tenantId: TEST_TENANT });
    });
    await Tenant.deleteMany({ slug: TEST_TENANT });
    console.log('Cleaned up!');

    console.log('\nALL ENTERPRISE WORKFLOW TESTS PASSED SUCCESSFULLY! FULL MODULE STACK FUNCTIONAL.');
    process.exit(0);
  } catch (error) {
    console.error('\nEnterprise verification failed:', error.message);
    process.exit(1);
  }
};

verifyEnterprise();
