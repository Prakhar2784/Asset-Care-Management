/**
 * backend/scripts/backfillOnboardingDone.js
 *
 * One-time script: marks onboardingDone = true for every existing user.
 * Needed because the onboarding wizard gate (AdminRoute) redirects admins
 * whose onboardingDone is false — without this backfill, every pre-existing
 * admin account would suddenly get forced into the wizard on next login.
 * New signups still start with onboardingDone: false (schema default).
 *
 * Run with: node backend/scripts/backfillOnboardingDone.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI not found in .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  const User = require('../models/User');
  const result = await User.updateMany(
    { onboardingDone: { $ne: true } },
    { $set: { onboardingDone: true } }
  ).setOptions({ bypassTenantFilter: true });
  console.log(`Backfilled onboardingDone=true for ${result.modifiedCount} existing user(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
