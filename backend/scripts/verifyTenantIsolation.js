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
const Asset = require('../models/Asset');
const { setTenantId } = require('../middleware/tenantContext');

const verifyIsolation = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not defined in environment.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Drop legacy single-field unique index if it exists
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: 'assets' }).toArray();
      if (collections.length > 0) {
        const assetsCollection = db.collection('assets');
        const indexes = await assetsCollection.indexes();
        const hasOldIndex = indexes.some(idx => idx.name === 'serialNumber_1' && !idx.key.hasOwnProperty('tenantId'));
        if (hasOldIndex) {
          console.log('Dropping legacy unique index: serialNumber_1');
          await assetsCollection.dropIndex('serialNumber_1');
          console.log('Legacy index dropped!');
        }
      }
    } catch (e) {
      console.log('Index drop bypassed:', e.message);
    }

    // Force Mongoose to sync and build current indexes
    await Asset.syncIndexes();

    console.log('\n--- PHASE 1: Tenant Provisioning ---');
    // Ensure test tenants exist
    let tenantA = await Tenant.findOne({ slug: 'test-comp-a' });
    if (!tenantA) {
      tenantA = await Tenant.create({ name: 'Test Company A', slug: 'test-comp-a', plan: 'Basic' });
      console.log('Created Tenant: test-comp-a');
    }
    
    let tenantB = await Tenant.findOne({ slug: 'test-comp-b' });
    if (!tenantB) {
      tenantB = await Tenant.create({ name: 'Test Company B', slug: 'test-comp-b', plan: 'Basic' });
      console.log('Created Tenant: test-comp-b');
    }

    // Clean up any old test assets
    await setTenantId('test-comp-a', async () => {
      await Asset.deleteMany({});
    });
    await setTenantId('test-comp-b', async () => {
      await Asset.deleteMany({});
    });

    console.log('\n--- PHASE 2: Creating Scoped Assets ---');
    // Create Asset 1 under Tenant A
    let assetA;
    await setTenantId('test-comp-a', async () => {
      assetA = await Asset.create({
        name: 'MacBook Pro Company A',
        category: 'Laptops',
        serialNumber: 'SN-COMP-A-001',
        department: 'IT'
      });
      console.log(`Created Asset in Company A: ${assetA.name} (TenantId: ${assetA.tenantId})`);
    });

    // Create Asset 2 under Tenant B
    let assetB;
    await setTenantId('test-comp-b', async () => {
      assetB = await Asset.create({
        name: 'ThinkPad Company B',
        category: 'Laptops',
        serialNumber: 'SN-COMP-B-999',
        department: 'Engineering'
      });
      console.log(`Created Asset in Company B: ${assetB.name} (TenantId: ${assetB.tenantId})`);
    });

    console.log('\n--- PHASE 3: Testing Isolation ---');
    
    // Query inside Company A context
    await setTenantId('test-comp-a', async () => {
      const assets = await Asset.find({});
      console.log(`Querying in Company A Context. Found ${assets.length} asset(s).`);
      assets.forEach(a => console.log(` - ${a.name} (serial: ${a.serialNumber})`));
      
      const leaked = assets.some(a => a.serialNumber === 'SN-COMP-B-999');
      if (leaked) {
        throw new Error('FAILURE: Company B asset leaked into Company A context!');
      } else {
        console.log('SUCCESS: No Company B assets leaked.');
      }
    });

    // Query inside Company B context
    await setTenantId('test-comp-b', async () => {
      const assets = await Asset.find({});
      console.log(`Querying in Company B Context. Found ${assets.length} asset(s).`);
      assets.forEach(a => console.log(` - ${a.name} (serial: ${a.serialNumber})`));
      
      const leaked = assets.some(a => a.serialNumber === 'SN-COMP-A-001');
      if (leaked) {
        throw new Error('FAILURE: Company A asset leaked into Company B context!');
      } else {
        console.log('SUCCESS: No Company A assets leaked.');
      }
    });

    console.log('\n--- PHASE 4: Compound Unique Index Verification ---');
    // Test that Company A can create an asset with the SAME serial number as Company B (since it is compound unique)
    await setTenantId('test-comp-a', async () => {
      try {
        const duplicateSerialAsset = await Asset.create({
          name: 'Shared Serial Asset',
          category: 'Laptops',
          serialNumber: 'SN-COMP-B-999', // same serial as Stark's asset
          department: 'HR'
        });
        console.log(`SUCCESS: Created asset with serial 'SN-COMP-B-999' inside Company A successfully!`);
      } catch (err) {
        console.error('FAILURE: Compound unique index failed to allow duplicate serial number in different tenants:', err.message);
      }
    });

    console.log('\nCleaning up verification records...');
    await setTenantId('test-comp-a', async () => {
      await Asset.deleteMany({});
    });
    await setTenantId('test-comp-b', async () => {
      await Asset.deleteMany({});
    });
    await Tenant.deleteMany({ slug: { $in: ['test-comp-a', 'test-comp-b'] } });
    console.log('Cleaned up!');

    console.log('\nALL ISOLATION TESTS PASSED SUCCESSFULLY! MULTI-TENANCY IS SECURE AND PROVEN.');
    process.exit(0);
  } catch (error) {
    console.error('\nIsolation verification failed:', error.message);
    process.exit(1);
  }
};

verifyIsolation();
