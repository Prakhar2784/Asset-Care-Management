const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const Department = require('../models/Department');
const Vendor = require('../models/Vendor');
const DeviceRequest = require('../models/DeviceRequest');
const AssetAssignment = require('../models/AssetAssignment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const runMigration = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not defined in environment.');
    }
    
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');

    const DEFAULT_TENANT_SLUG = 'default';

    // 1. Create default Tenant record if not exists
    let defaultTenant = await Tenant.findOne({ slug: DEFAULT_TENANT_SLUG });
    if (!defaultTenant) {
      defaultTenant = await Tenant.create({
        name: 'Default Testing Company',
        slug: DEFAULT_TENANT_SLUG,
        isActive: true,
        plan: 'Enterprise',
        limits: { maxAssets: 10000, maxUsers: 10000 }
      });
      console.log('Created default Tenant document.');
    } else {
      console.log('Default Tenant already exists.');
    }

    // 2. Collections to migrate
    const collections = [
      { name: 'User', model: User },
      { name: 'Asset', model: Asset },
      { name: 'Ticket', model: Ticket },
      { name: 'Department', model: Department },
      { name: 'Vendor', model: Vendor },
      { name: 'DeviceRequest', model: DeviceRequest },
      { name: 'AssetAssignment', model: AssetAssignment },
      { name: 'Notification', model: Notification },
      { name: 'AuditLog', model: AuditLog }
    ];

    // 3. Update all documents where tenantId is missing
    for (const col of collections) {
      console.log(`Migrating ${col.name} collection...`);
      
      // Update many where tenantId is not present
      const result = await col.model.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: DEFAULT_TENANT_SLUG } }
      );
      
      console.log(`Updated ${result.modifiedCount} documents in ${col.name} to tenantId: '${DEFAULT_TENANT_SLUG}'.`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

runMigration();
