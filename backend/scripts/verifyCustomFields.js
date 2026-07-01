// backend/scripts/verifyCustomFields.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config();

// Apply tenant plugin globally
const tenantPlugin = require('../middleware/tenantPlugin');
mongoose.plugin(tenantPlugin);

const CustomField = require('../models/CustomField');
const Asset = require('../models/Asset');
const { setTenantId } = require('../middleware/tenantContext');

const runVerification = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected.');

    // We scope to 'verify_custom_fields' tenant context
    const tenantSlug = 'verify_custom_fields';

    await setTenantId(tenantSlug, async () => {
      console.log('\n--- Cleaning up test records ---');
      await CustomField.deleteMany({});
      await Asset.deleteMany({ name: /Test Asset/ });

      console.log('\n--- Creating Custom Field Configs for "IT Asset" ---');
      const ramField = await CustomField.create({
        category: 'IT Asset',
        name: 'RAM (GB)',
        type: 'Number',
        isRequired: true,
        tenantId: tenantSlug
      });
      console.log(`Created custom field: ${ramField.name} (${ramField.type}), Required: ${ramField.isRequired}`);

      const osField = await CustomField.create({
        category: 'IT Asset',
        name: 'Operating System',
        type: 'Select',
        isRequired: false,
        options: ['Windows 11', 'macOS', 'Linux'],
        tenantId: tenantSlug
      });
      console.log(`Created custom field: ${osField.name} (${osField.type}), Options: ${osField.options.join(', ')}`);

      // Mock request and response to run validation manually or simulate assetController behaviour
      const { createAsset } = require('../controllers/assetController');

      const mockRes = {
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

      console.log('\n--- TEST CASE 1: Missing Required Custom Field (RAM) ---');
      const mockReq1 = {
        tenantId: tenantSlug,
        body: {
          name: 'Test Asset 1',
          category: 'IT Asset',
          serialNumber: 'TEST-SN-001',
          department: 'Engineering',
          customFields: {
            'Operating System': 'Windows 11'
          }
        }
      };

      await createAsset(mockReq1, mockRes);
      if (mockRes.statusCode === 400 && mockRes.data.message.includes('required')) {
        console.log('✅ Passed: Failed correctly with message:', mockRes.data.message);
      } else {
        console.log('❌ Failed: Expected 400 validation error, got:', mockRes.statusCode, mockRes.data);
      }

      console.log('\n--- TEST CASE 2: Invalid Number Type (RAM = "Sixteen") ---');
      const mockReq2 = {
        tenantId: tenantSlug,
        body: {
          name: 'Test Asset 2',
          category: 'IT Asset',
          serialNumber: 'TEST-SN-002',
          department: 'Engineering',
          customFields: {
            'RAM (GB)': 'Sixteen',
            'Operating System': 'Windows 11'
          }
        }
      };

      await createAsset(mockReq2, mockRes);
      if (mockRes.statusCode === 400 && mockRes.data.message.includes('number')) {
        console.log('✅ Passed: Failed correctly with message:', mockRes.data.message);
      } else {
        console.log('❌ Failed: Expected 400 validation error, got:', mockRes.statusCode, mockRes.data);
      }

      console.log('\n--- TEST CASE 3: Invalid Select Option (OS = "FreeBSD") ---');
      const mockReq3 = {
        tenantId: tenantSlug,
        body: {
          name: 'Test Asset 3',
          category: 'IT Asset',
          serialNumber: 'TEST-SN-003',
          department: 'Engineering',
          customFields: {
            'RAM (GB)': '16',
            'Operating System': 'FreeBSD'
          }
        }
      };

      await createAsset(mockReq3, mockRes);
      if (mockRes.statusCode === 400 && mockRes.data.message.includes('must be one of')) {
        console.log('✅ Passed: Failed correctly with message:', mockRes.data.message);
      } else {
        console.log('❌ Failed: Expected 400 validation error, got:', mockRes.statusCode, mockRes.data);
      }

      console.log('\n--- TEST CASE 4: Valid Creation (RAM = 16, OS = "macOS") ---');
      const mockReq4 = {
        tenantId: tenantSlug,
        body: {
          name: 'Test Asset 4',
          category: 'IT Asset',
          serialNumber: 'TEST-SN-004',
          department: 'Engineering',
          customFields: {
            'RAM (GB)': '16',
            'Operating System': 'macOS'
          }
        }
      };

      await createAsset(mockReq4, mockRes);
      if (mockRes.statusCode === 201) {
        console.log('✅ Passed: Created asset successfully!');
        console.log('Saved customFields data:', mockRes.data.customFields);
      } else {
        console.log('❌ Failed: Expected 201 created, got:', mockRes.statusCode, mockRes.data);
      }

      console.log('\n--- Clean up test data ---');
      await CustomField.deleteMany({});
      await Asset.deleteMany({ name: /Test Asset/ });
      console.log('Done.');
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error during verification:', error);
    mongoose.connection.close();
  }
};

runVerification();
