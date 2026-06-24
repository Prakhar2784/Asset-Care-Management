const cron = require('node-cron');
const Asset = require('../models/Asset');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendWarrantyExpiryEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { audit } = require('../services/auditService');

const checkWarrantyExpiry = async () => {
  try {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const in7  = new Date(now.getTime() +  7 * 24 * 60 * 60 * 1000);

    // Find assets expiring within 30 days
    const expiringAssets = await Asset.find({
      warrantyEnd: { $gte: now, $lte: in30 },
      status: { $ne: 'Scrap' }
    });

    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true }, 'name email _id');

    for (const asset of expiringAssets) {
      const daysLeft = Math.ceil((new Date(asset.warrantyEnd) - now) / (1000 * 60 * 60 * 24));

      let alertField = null;
      if (daysLeft <= 7 && !asset.warrantyAlertSent7) alertField = 'warrantyAlertSent7';
      else if (daysLeft <= 15 && !asset.warrantyAlertSent15) alertField = 'warrantyAlertSent15';
      else if (daysLeft <= 30 && !asset.warrantyAlertSent30) alertField = 'warrantyAlertSent30';

      if (!alertField) continue;

      // Mark alert as sent
      asset[alertField] = true;
      await asset.save({ validateBeforeSave: false });

      // Notify all admins
      for (const admin of admins) {
        sendWarrantyExpiryEmail(admin.email, asset, daysLeft).catch(() => {});
        createNotification({
          userId: admin._id,
          type: 'warranty_expiry',
          title: 'Warranty Expiring Soon',
          message: `${asset.name} (${asset.serialNumber}) warranty expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
          link: '/admin/assets',
          meta: { assetId: asset._id, daysLeft }
        });
      }

      audit({
        req: null,
        action: 'warranty_alert_sent',
        entity: 'asset',
        entityId: asset._id,
        entityLabel: asset.name,
        changes: { daysLeft, alertField }
      });
    }

    console.log(`[WarrantyScheduler] Checked ${expiringAssets.length} expiring assets.`);
  } catch (err) {
    console.error('[WarrantyScheduler] Error:', err.message);
  }
};

// Purge audit logs older than 365 days — runs on the 1st of every month
const purgeOldAuditLogs = async () => {
  try {
    const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoff } });
    console.log(`[AuditRetention] Purged ${result.deletedCount} audit log(s) older than 1 year.`);
  } catch (err) {
    console.error('[AuditRetention] Error:', err.message);
  }
};

const startWarrantyScheduler = () => {
  // Run daily at 8:00 AM IST
  cron.schedule('0 8 * * *', checkWarrantyExpiry, { timezone: 'Asia/Kolkata' });
  // Purge old audit logs on the 1st of every month at 2:00 AM IST
  cron.schedule('0 2 1 * *', purgeOldAuditLogs, { timezone: 'Asia/Kolkata' });
  console.log('[Scheduler] Warranty checker (daily 8AM) + Audit retention (monthly 1st) started.');
};

module.exports = { startWarrantyScheduler, checkWarrantyExpiry };
