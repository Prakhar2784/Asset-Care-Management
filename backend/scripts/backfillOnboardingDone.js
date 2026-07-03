/**
 * backend/scripts/backfillOnboardingDone.js
 *
 * One-time script: marks onboardingDone = true for every existing user, in the
 * control-plane DB (assetcare) AND in every per-tenant isolated DB
 * (assetcare_<slug>). Needed because the onboarding wizard gate (AdminRoute)
 * redirects admins whose onboardingDone is false — without this backfill,
 * every pre-existing admin account would suddenly get forced into the wizard
 * on next login. New signups still start with onboardingDone: false.
 *
 * Run with: node backend/scripts/backfillOnboardingDone.js [--skip-tenant <slug>]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI not found in .env');
  process.exit(1);
}

const skipIdx = process.argv.indexOf('--skip-tenant');
const skipSlug = skipIdx !== -1 ? process.argv[skipIdx + 1] : null;

async function run() {
  const conn = await mongoose.connect(MONGO_URI);
  const admin = conn.connection.db.admin();
  const { databases } = await admin.listDatabases();
  for (const d of databases.filter(x => x.name === 'assetcare' || x.name.startsWith('assetcare_'))) {
    if (skipSlug && d.name === `assetcare_${skipSlug}`) {
      console.log(`Skipping ${d.name} (--skip-tenant)`);
      continue;
    }
    const db = conn.connection.useDb(d.name);
    const result = await db.collection('users').updateMany(
      { onboardingDone: { $ne: true } },
      { $set: { onboardingDone: true } }
    );
    console.log(`${d.name}: backfilled onboardingDone=true for ${result.modifiedCount} user(s).`);
  }
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
