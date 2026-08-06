const { generateLicenseKey } = require('../services/licenseService');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node scripts/generateLicense.js <company_slug>");
  process.exit(1);
}

const slug = args[0];
const key = generateLicenseKey(slug);
console.log("\n==================================================");
console.log(`Generated Commercial License Key for: "${slug}"`);
console.log("==================================================");
console.log(`Key:  ${key}`);
console.log("==================================================\n");
