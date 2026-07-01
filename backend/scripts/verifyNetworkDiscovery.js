// backend/scripts/verifyNetworkDiscovery.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Apply tenant plugin globally
const tenantPlugin = require('../middleware/tenantPlugin');
mongoose.plugin(tenantPlugin);

const User = require('../models/User');
const Asset = require('../models/Asset');
const NetworkScan = require('../models/NetworkScan');
const DiscoveredDevice = require('../models/DiscoveredDevice');
const { setTenantId } = require('../middleware/tenantContext');

const createMockRes = () => {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
};

const verifyNetworkDiscovery = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database!');

    const tenantSlug = 'verify_network_discovery';

    await setTenantId(tenantSlug, async () => {
      console.log('\n--- STEP 1: Cleaning up old test records ---');
      await User.deleteMany({});
      await Asset.deleteMany({});
      await NetworkScan.deleteMany({});
      await DiscoveredDevice.deleteMany({});
      console.log('Cleaned users, assets, scans, and discovered devices.');

      console.log('\n--- STEP 2: Provisioning Test Admin User ---');
      const adminUser = await User.create({
        name: 'Test Network Admin',
        email: 'netadmin@kbtest.com',
        password: 'password123',
        role: 'admin',
        department: 'IT',
        tenantId: tenantSlug
      });
      console.log(`Created Admin User: ${adminUser.name} (${adminUser.role})`);

      const {
        triggerScan,
        getScans,
        getScanDevices,
        importDevices,
        ignoreDevices
      } = require('../controllers/networkController');

      console.log('\n--- STEP 3: Triggering Subnet Scanner Simulator ---');
      const reqScan = {
        tenantId: tenantSlug,
        user: adminUser,
        body: { subnet: '192.168.20.0/24' }
      };
      const resScan = createMockRes();
      await triggerScan(reqScan, resScan);

      if (resScan.statusCode !== 201) {
        throw new Error(`Failed to trigger subnet scan. Code: ${resScan.statusCode}`);
      }
      const scan = resScan.data.data;
      const devices = resScan.data.devices;
      console.log(`✅ Success: Triggered scan on ${scan.subnet}. Found ${scan.devicesFound} devices.`);
      if (devices.length === 0) {
        throw new Error('FAILURE: No devices discovered during scan.');
      }

      console.log('\n--- STEP 4: Querying Scan Ledger & Devices list ---');
      const reqGetScans = { tenantId: tenantSlug, user: adminUser };
      const resGetScans = createMockRes();
      await getScans(reqGetScans, resGetScans);
      if (resGetScans.data.data.length === 0) {
        throw new Error('FAILURE: Scans ledger empty.');
      }
      console.log('✅ Success: Successfully fetched scan list.');

      const reqGetDevices = { tenantId: tenantSlug, user: adminUser, params: { id: scan._id } };
      const resGetDevices = createMockRes();
      await getScanDevices(reqGetDevices, resGetDevices);
      if (resGetDevices.data.data.length !== devices.length) {
        throw new Error('FAILURE: Discovered devices count mismatch.');
      }
      console.log(`✅ Success: Fetched ${resGetDevices.data.data.length} discovered devices details.`);

      console.log('\n--- STEP 5: Testing Initial Bulk Asset Import ---');
      // Import first 2 devices
      const deviceToImport1 = devices[0];
      const deviceToImport2 = devices[1];

      const reqImport = {
        tenantId: tenantSlug,
        user: adminUser,
        body: {
          deviceIds: [deviceToImport1._id, deviceToImport2._id],
          category: 'Network Devices',
          location: 'HQ Server Room B',
          department: 'IT'
        }
      };
      const resImport = createMockRes();
      await importDevices(reqImport, resImport);

      if (resImport.statusCode !== 200) {
        throw new Error(`Failed to import devices. Code: ${resImport.statusCode}`);
      }
      const stats = resImport.data.stats;
      console.log(`Import status message: "${resImport.data.message}"`);
      if (stats.importedCount !== 2 || stats.updatedCount !== 0) {
        throw new Error(`FAILURE: Expected 2 imports and 0 updates, got: ${JSON.stringify(stats)}`);
      }

      // Assert assets exist in registry
      const asset1 = await Asset.findOne({ serialNumber: deviceToImport1.macAddress });
      const asset2 = await Asset.findOne({ serialNumber: deviceToImport2.macAddress });
      if (!asset1 || !asset2) {
        throw new Error('FAILURE: Assets were not created in the database.');
      }
      console.log(`✅ Success: Imported Asset 1: "${asset1.name}" (MAC: ${asset1.serialNumber})`);
      console.log(`✅ Success: Imported Asset 2: "${asset2.name}" (MAC: ${asset2.serialNumber})`);

      // Verify specs mapped to customFields
      console.log('Asset 1 Custom Fields specs:', JSON.stringify(asset1.customFields));
      if (asset1.customFields['MAC Address'] !== deviceToImport1.macAddress || !asset1.customFields['CPU']) {
        throw new Error('FAILURE: Custom fields specs mapping failed or incomplete.');
      }
      console.log('✅ Success: Custom fields specifications mapped correctly.');

      // Fetch a fresh copy from the database to ensure Mongoose detects the status change
      const freshDevice = await DiscoveredDevice.findById(deviceToImport1._id);
      freshDevice.ram = 32; // Upgrade RAM to 32
      freshDevice.status = 'Discovered'; // Reset status to import again
      await freshDevice.save();

      const reqReImport = {
        tenantId: tenantSlug,
        user: adminUser,
        body: {
          deviceIds: [deviceToImport1._id],
          category: 'Network Devices',
          location: 'HQ Server Room B',
          department: 'IT'
        }
      };
      const resReImport = createMockRes();
      await importDevices(reqReImport, resReImport);

      if (resReImport.statusCode !== 200) {
        throw new Error(`Failed to re-import. Code: ${resReImport.statusCode}`);
      }
      const reStats = resReImport.data.stats;
      console.log(`Re-import stats: ${JSON.stringify(reStats)}`);
      if (reStats.updatedCount !== 1 || reStats.importedCount !== 0) {
        throw new Error('FAILURE: Re-import should update the existing asset, not create a new one.');
      }

      const updatedAsset = await Asset.findOne({ serialNumber: deviceToImport1.macAddress });
      console.log(`Updated Asset Specs: RAM = ${updatedAsset.customFields['RAM']}`);
      if (updatedAsset.customFields['RAM'] !== '32 GB') {
        throw new Error(`FAILURE: RAM was not updated to 32 GB, got: ${updatedAsset.customFields['RAM']}`);
      }
      console.log('✅ Success: Re-import updated asset specs instead of duplicate collision.');

      console.log('\n--- STEP 7: Testing Ignore Devices ---');
      if (devices.length > 2) {
        const deviceToIgnore = devices[2];
        const reqIgnore = {
          tenantId: tenantSlug,
          user: adminUser,
          body: { deviceIds: [deviceToIgnore._id] }
        };
        const resIgnore = createMockRes();
        await ignoreDevices(reqIgnore, resIgnore);

        const ignoredDevice = await DiscoveredDevice.findById(deviceToIgnore._id);
        console.log(`Ignored device status: "${ignoredDevice.status}"`);
        if (ignoredDevice.status !== 'Ignored') {
          throw new Error('FAILURE: Device status was not set to Ignored.');
        }
        console.log('✅ Success: Successfully ignored discovered device.');
      } else {
        console.log('Skipping ignore test (not enough mock devices discovered).');
      }

      console.log('\n--- Cleaning up test records ---');
      await User.deleteMany({});
      await Asset.deleteMany({});
      await NetworkScan.deleteMany({});
      await DiscoveredDevice.deleteMany({});
      console.log('Cleaned up!');
    });

    console.log('\nALL NETWORK DISCOVERY VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

verifyNetworkDiscovery();
