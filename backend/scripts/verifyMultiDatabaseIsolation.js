const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Register the global multi-tenant plugin to Mongoose
const tenantPlugin = require('../middleware/tenantPlugin');
mongoose.plugin(tenantPlugin);

const Tenant = require('../models/Tenant');
const Asset = require('../models/Asset');
const { setTenantId } = require('../middleware/tenantContext');

const verifyMultiDatabaseIsolation = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not defined in environment.');
    }

    console.log('Connecting to control plane database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to control plane!');

    console.log('\n--- STEP 1: Creating Scoped Tenants ---');
    // Ensure test tenants exist
    let tenantX = await Tenant.findOne({ slug: 'test-db-x' });
    if (!tenantX) {
      tenantX = await Tenant.create({ name: 'Tenant X Corp', slug: 'test-db-x', plan: 'Basic' });
      console.log('Created Tenant: test-db-x');
    }
    
    let tenantY = await Tenant.findOne({ slug: 'test-db-y' });
    if (!tenantY) {
      tenantY = await Tenant.create({ name: 'Tenant Y Corp', slug: 'test-db-y', plan: 'Basic' });
      console.log('Created Tenant: test-db-y');
    }

    // Clean up old assets
    await setTenantId('test-db-x', async () => {
      await Asset.deleteMany({});
    });
    await setTenantId('test-db-y', async () => {
      await Asset.deleteMany({});
    });

    console.log('\n--- STEP 2: Creating Assets in Isolated DB Connections ---');
    await setTenantId('test-db-x', async () => {
      const asset = await Asset.create({
        name: 'Database X Asset',
        category: 'Laptops',
        serialNumber: 'SRN-DBX-777',
        department: 'IT'
      });
      console.log(`Created Asset: ${asset.name} inside database: assetcare_${asset.tenantId}`);
    });

    await setTenantId('test-db-y', async () => {
      const asset = await Asset.create({
        name: 'Database Y Asset',
        category: 'Laptops',
        serialNumber: 'SRN-DBY-888',
        department: 'HR'
      });
      console.log(`Created Asset: ${asset.name} inside database: assetcare_${asset.tenantId}`);
    });

    console.log('\n--- STEP 3: Verifying Dynamic Scoping ---');
    await setTenantId('test-db-x', async () => {
      const assets = await Asset.find({});
      console.log(`Querying DB X context: found ${assets.length} assets.`);
      if (assets.some(a => a.serialNumber === 'SRN-DBY-888')) {
        throw new Error('FAILURE: Leaked DB Y asset into DB X!');
      }
      console.log('SUCCESS: DB X is fully isolated.');
    });

    await setTenantId('test-db-y', async () => {
      const assets = await Asset.find({});
      console.log(`Querying DB Y context: found ${assets.length} assets.`);
      if (assets.some(a => a.serialNumber === 'SRN-DBX-777')) {
        throw new Error('FAILURE: Leaked DB X asset into DB Y!');
      }
      console.log('SUCCESS: DB Y is fully isolated.');
    });

    console.log('\nCleaning up verification records...');
    await setTenantId('test-db-x', async () => {
      await Asset.deleteMany({});
    });
    await setTenantId('test-db-y', async () => {
      await Asset.deleteMany({});
    });
    await Tenant.deleteMany({ slug: { $in: ['test-db-x', 'test-db-y'] } });
    console.log('Cleaned up!');

    console.log('\nALL MULTI-DATABASE ISOLATION VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\nMulti-database verification failed:', error.message);
    process.exit(1);
  }
};

verifyMultiDatabaseIsolation();
