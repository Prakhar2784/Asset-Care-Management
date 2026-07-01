/**
 * backend/scripts/createSuperAdmin.js
 * 
 * One-time script to create the platform super admin account.
 * Run with: node backend/scripts/createSuperAdmin.js
 * 
 * This user has role 'super_admin' and can access /super-admin/console
 * to manage all tenant companies on the platform.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI not found in .env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'super_admin' },
  department: String,
  tenantId: String,
  isActive: Boolean,
}, { timestamps: true });

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('\nConnected to MongoDB control plane.\n');

  const User = mongoose.model('User', userSchema);
  const bcrypt = require('bcryptjs');

  // ─── Customize these values ─────────────────────────────────────────
  const SUPER_ADMIN_EMAIL    = 'superadmin@assetcarepro.com';
  const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2025!';
  const SUPER_ADMIN_NAME     = 'Platform Owner';
  // ────────────────────────────────────────────────────────────────────

  const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });
  if (existing) {
    console.log(`⚠️  Super Admin already exists: ${SUPER_ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, salt);

  const superAdmin = await User.create({
    name: SUPER_ADMIN_NAME,
    email: SUPER_ADMIN_EMAIL,
    password: hashedPassword,
    role: 'super_admin',
    department: 'Platform Administration',
    tenantId: 'default',
    isActive: true,
  });

  console.log('✅  Super Admin created successfully!');
  console.log('   Name  :', superAdmin.name);
  console.log('   Email :', superAdmin.email);
  console.log('   Role  :', superAdmin.role);
  console.log('\n   Login at /login then navigate to /super-admin/console\n');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Script error:', err.message);
  process.exit(1);
});
