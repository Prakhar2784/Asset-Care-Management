const Notification = require('../models/Notification');

const createNotification = async ({ userId, type, title, message, link = null, meta = null }) => {
  try {
    await Notification.create({ user: userId, type, title, message, link, meta });
  } catch (err) {
    console.error('[NotificationService] Failed to create notification:', err.message);
  }
};

module.exports = { createNotification };
