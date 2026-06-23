const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
