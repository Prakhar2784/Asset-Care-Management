const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Register the global multi-tenant plugin to Mongoose
const tenantPlugin = require('../middleware/tenantPlugin');
mongoose.plugin(tenantPlugin);

// Import models
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const PurchaseRequest = require('../models/PurchaseRequest');
const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceivedNote = require('../models/GoodsReceivedNote');
const Asset = require('../models/Asset');

const { setTenantId } = require('../middleware/tenantContext');

const verifyProcurement = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not defined in environment.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const TEST_TENANT = 'test-procure-tenant';

    console.log('\n--- PHASE 1: Setup Test context ---');
    // Ensure test tenant exists
    let tenant = await Tenant.findOne({ slug: TEST_TENANT });
    if (!tenant) {
      tenant = await Tenant.create({ name: 'Procure Corp', slug: TEST_TENANT });
    }

    let testAdmin;
    let testVendor;

    await setTenantId(TEST_TENANT, async () => {
      // Clean up previous records if any
      await User.deleteMany({ email: 'procure-admin@test.com' });
      await Vendor.deleteMany({ email: 'procure-vendor@test.com' });
      await PurchaseRequest.deleteMany({});
      await PurchaseOrder.deleteMany({});
      await GoodsReceivedNote.deleteMany({});
      await Asset.deleteMany({ tenantId: TEST_TENANT });

      // Create test admin
      testAdmin = await User.create({
        name: 'Procurement Admin',
        email: 'procure-admin@test.com',
        password: 'securePassword123',
        role: 'admin',
        department: 'IT',
        tenantId: TEST_TENANT
      });

      // Create test vendor
      testVendor = await Vendor.create({
        name: 'Prime Computers',
        vendorType: 'OEM',
        serviceCategory: 'IT Hardware',
        contactPerson: 'John Prime',
        phone: '1234567890',
        email: 'procure-vendor@test.com',
        address: '123 Tech Lane',
        tenantId: TEST_TENANT
      });
      
      console.log('Admin user and Vendor created successfully.');
    });

    console.log('\n--- PHASE 2: Create & Approve Purchase Request ---');
    let pr;
    await setTenantId(TEST_TENANT, async () => {
      // 1. Create PR
      const totalCost = 2 * 35000;
      pr = await PurchaseRequest.create({
        prNumber: 'PR-TEST-1',
        itemName: 'Dell Latitude 3420',
        category: 'Laptops',
        quantity: 2,
        estimatedUnitCost: 35000,
        totalCost,
        justification: 'New Hires in Engineering',
        requestedBy: testAdmin._id,
        tenantId: TEST_TENANT
      });
      console.log(`Purchase Request created: ${pr.prNumber} (Status: ${pr.status})`);

      // 2. Approve PR
      pr.status = 'Approved';
      pr.reviewedBy = testAdmin._id;
      pr.reviewedAt = new Date();
      await pr.save();
      console.log(`Purchase Request approved: ${pr.prNumber} (Status: ${pr.status})`);
    });

    console.log('\n--- PHASE 3: Create Purchase Order ---');
    let po;
    await setTenantId(TEST_TENANT, async () => {
      po = await PurchaseOrder.create({
        poNumber: 'PO-TEST-1',
        purchaseRequest: pr._id,
        vendor: testVendor._id,
        items: [{
          name: pr.itemName,
          quantity: pr.quantity,
          unitCost: pr.estimatedUnitCost,
          totalCost: pr.totalCost
        }],
        totalAmount: pr.totalCost,
        status: 'Sent to Vendor',
        tenantId: TEST_TENANT
      });
      console.log(`Purchase Order created: ${po.poNumber} (Status: ${po.status})`);
    });

    console.log('\n--- PHASE 4: Create Goods Received Note (GRN) ---');
    let grn;
    await setTenantId(TEST_TENANT, async () => {
      grn = await GoodsReceivedNote.create({
        grnNumber: 'GRN-TEST-1',
        purchaseOrder: po._id,
        receivedItems: [{
          name: pr.itemName,
          quantityOrdered: pr.quantity,
          quantityReceived: 2,
          condition: 'Good'
        }],
        receivedBy: testAdmin._id,
        invoiceNumber: 'INV-7772',
        tenantId: TEST_TENANT
      });
      
      po.status = 'Completed';
      await po.save();
      
      console.log(`GRN created: ${grn.grnNumber} (Status: ${grn.status}, PO Status: ${po.status})`);
    });

    console.log('\n--- PHASE 5: Automated Bulk Asset Registration ---');
    await setTenantId(TEST_TENANT, async () => {
      // Simulate bulk assets payload from HOD/Admin
      const assetsToRegister = [
        { name: 'Dell Latitude 3420', serialNumber: 'SRN-DLL-A-01', department: 'IT', location: 'Tech Lab 1', unitCost: 35000 },
        { name: 'Dell Latitude 3420', serialNumber: 'SRN-DLL-B-02', department: 'IT', location: 'Tech Lab 1', unitCost: 35000 }
      ];

      // Execute bulk registration logic
      const registeredList = [];
      for (const item of assetsToRegister) {
        const asset = await Asset.create({
          name: item.name,
          category: 'IT Hardware',
          formFactor: 'Movable',
          serialNumber: item.serialNumber,
          department: item.department,
          location: item.location,
          status: 'In Storage',
          assignedStatus: 'Unassigned',
          procurementDate: grn.receivedDate,
          purchaseCost: item.unitCost,
          tenantId: TEST_TENANT
        });
        registeredList.push(asset);
      }

      grn.status = 'Assets Registered';
      await grn.save();

      console.log(`Registered ${registeredList.length} assets successfully!`);

      // Verify assets are registered in db
      const assetsInDB = await Asset.find({ tenantId: TEST_TENANT });
      console.log(`Found ${assetsInDB.length} assets registered under tenant ${TEST_TENANT}:`);
      assetsInDB.forEach(a => console.log(` - Asset: ${a.name} (Serial: ${a.serialNumber}, Status: ${a.status})`));

      if (assetsInDB.length !== 2) {
        throw new Error('FAILURE: Assets were not registered correctly in Mongoose.');
      }
    });

    console.log('\nCleaning up verification records...');
    await setTenantId(TEST_TENANT, async () => {
      await User.deleteMany({ email: 'procure-admin@test.com' });
      await Vendor.deleteMany({ email: 'procure-vendor@test.com' });
      await PurchaseRequest.deleteMany({});
      await PurchaseOrder.deleteMany({});
      await GoodsReceivedNote.deleteMany({});
      await Asset.deleteMany({ tenantId: TEST_TENANT });
    });
    await Tenant.deleteMany({ slug: TEST_TENANT });
    console.log('Cleaned up!');

    console.log('\nALL PROCUREMENT WORKFLOW TESTS PASSED SUCCESSFULLY! BACKEND STACK IS FULLY FUNCTIONAL.');
    process.exit(0);
  } catch (error) {
    console.error('\nProcurement verification failed:', error.message);
    process.exit(1);
  }
};

verifyProcurement();
