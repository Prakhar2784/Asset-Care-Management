const crypto = require('crypto');

const LICENSE_SECRET = process.env.LICENSE_SECRET || "assetcare_commercial_license_secret_key_2026";

const generateLicenseKey = (slug) => {
  const cleanSlug = slug.toLowerCase().trim();
  const hash = crypto
    .createHmac('sha256', LICENSE_SECRET)
    .update(cleanSlug)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
  return `AC-${cleanSlug.toUpperCase()}-${hash}`;
};

const verifyLicenseKey = (key, slug) => {
  if (!key) return false;
  const expected = generateLicenseKey(slug);
  return key.toUpperCase().trim() === expected;
};

module.exports = {
  generateLicenseKey,
  verifyLicenseKey
};
